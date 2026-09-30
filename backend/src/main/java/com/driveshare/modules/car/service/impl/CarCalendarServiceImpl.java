package com.driveshare.modules.car.service.impl;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.dto.request.CalendarBlockCreateRequest;
import com.driveshare.modules.car.dto.response.CalendarBlockResponse;
import com.driveshare.modules.car.dto.response.CarCalendarItemResponse;
import com.driveshare.modules.car.dto.response.CarCalendarOverviewResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.entity.CarCalendarBlock;
import com.driveshare.modules.car.repository.CarCalendarBlockRepository;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.CarCalendarService;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarCalendarServiceImpl implements CarCalendarService {

    private final CarRepository carRepository;
    private final CarCalendarBlockRepository carCalendarBlockRepository;
    private final RentalRepository rentalRepository;

    private static final List<ERentalStatus> ACTIVE_RENTAL_STATUSES = List.of(
            ERentalStatus.APPROVED,
            ERentalStatus.WAITING_PAYMENT,
            ERentalStatus.CONFIRMED,
            ERentalStatus.IN_PROGRESS
    );

    @Override
    @Transactional(readOnly = true)
    public CarCalendarOverviewResponse getCarCalendar(Long carId, LocalDate fromDate) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        LocalDate effectiveFromDate = (fromDate != null) ? fromDate : LocalDate.now();

        // 1. Lấy danh sách đơn thuê đang hoạt động từ fromDate
        List<Rental> rentals = rentalRepository.findActiveRentalsForCar(carId, ACTIVE_RENTAL_STATUSES, effectiveFromDate);

        // 2. Lấy danh sách ngày chủ xe tự chặn bận từ fromDate
        List<CarCalendarBlock> blocks = carCalendarBlockRepository
                .findByCarIdAndEndDateGreaterThanEqualAndDeletedAtIsNullOrderByStartDateAsc(carId, effectiveFromDate);

        List<CarCalendarItemResponse> items = new ArrayList<>();
        Set<LocalDate> unavailableDatesSet = new TreeSet<>();

        for (Rental r : rentals) {
            String renterName = "Khách thuê";
            if (r.getRenter() != null) {
                if (r.getRenter().getFullName() != null && !r.getRenter().getFullName().isBlank()) {
                    renterName = r.getRenter().getFullName();
                } else if (r.getRenter().getUsername() != null) {
                    renterName = r.getRenter().getUsername();
                }
            }

            items.add(CarCalendarItemResponse.builder()
                    .type("RENTAL")
                    .referenceId(r.getRentalId())
                    .startDate(r.getStartDate())
                    .endDate(r.getEndDate())
                    .title("Đơn #" + r.getRentalId() + " (" + renterName + ")")
                    .status(r.getStatus() != null ? r.getStatus().name() : "")
                    .note(r.getNote())
                    .build());

            LocalDate cur = r.getStartDate();
            while (!cur.isAfter(r.getEndDate())) {
                unavailableDatesSet.add(cur);
                cur = cur.plusDays(1);
            }
        }

        for (CarCalendarBlock b : blocks) {
            items.add(CarCalendarItemResponse.builder()
                    .type("OWNER_BLOCK")
                    .referenceId(b.getBlockId())
                    .startDate(b.getStartDate())
                    .endDate(b.getEndDate())
                    .title("Chủ xe chặn lịch")
                    .status("BLOCKED")
                    .note(b.getReason())
                    .build());

            LocalDate cur = b.getStartDate();
            while (!cur.isAfter(b.getEndDate())) {
                unavailableDatesSet.add(cur);
                cur = cur.plusDays(1);
            }
        }

        return CarCalendarOverviewResponse.builder()
                .carId(car.getCarId())
                .brand(car.getBrand())
                .model(car.getModel())
                .plateNumber(car.getPlateNumber())
                .items(items)
                .unavailableDates(new ArrayList<>(unavailableDatesSet))
                .build();
    }

    @Override
    @Transactional
    public CalendarBlockResponse addCalendarBlock(Long carId, CalendarBlockCreateRequest request) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        if (endDate.isBefore(startDate)) {
            throw new AppException(ErrorCode.INVALID_RENTAL_DATES, "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }

        if (startDate.isBefore(LocalDate.now())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể chặn lịch cho khoảng thời gian trong quá khứ");
        }

        // Kiểm tra xem khoảng thời gian này đã có đơn thuê của khách chưa
        boolean hasRentalConflict = rentalRepository.hasDateConflict(carId, startDate, endDate, ACTIVE_RENTAL_STATUSES);
        if (hasRentalConflict) {
            throw new AppException(ErrorCode.CALENDAR_BLOCK_CONFLICT,
                    "Không thể chặn lịch vì xe đã có đơn thuê đang hoạt động hoặc đã được phê duyệt trong khoảng thời gian này");
        }

        // Kiểm tra xem đã có lịch chặn nào khác giao thoa chưa
        boolean hasBlockConflict = carCalendarBlockRepository.hasDateConflict(carId, startDate, endDate);
        if (hasBlockConflict) {
            throw new AppException(ErrorCode.CALENDAR_BLOCK_CONFLICT,
                    "Khoảng thời gian này đã được bạn chặn lịch trước đó");
        }

        CarCalendarBlock block = CarCalendarBlock.builder()
                .carId(car.getCarId())
                .startDate(startDate)
                .endDate(endDate)
                .reason(request.getReason() != null && !request.getReason().isBlank()
                        ? request.getReason().trim()
                        : "Chủ xe bận / Bảo dưỡng")
                .build();
        block.setCreatedBy(currentUserId);

        CarCalendarBlock saved = carCalendarBlockRepository.save(block);
        log.info("Owner {} đã chặn lịch xe carId={} từ {} đến {}: reason='{}'",
                currentUserId, carId, startDate, endDate, saved.getReason());

        return CalendarBlockResponse.builder()
                .blockId(saved.getBlockId())
                .carId(saved.getCarId())
                .startDate(saved.getStartDate())
                .endDate(saved.getEndDate())
                .reason(saved.getReason())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteCalendarBlock(Long carId, Long blockId) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        CarCalendarBlock block = carCalendarBlockRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new AppException(ErrorCode.CALENDAR_BLOCK_NOT_FOUND));

        if (!block.getCarId().equals(car.getCarId())) {
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED, "Lịch chặn này không thuộc về chiếc xe được chỉ định");
        }

        block.setDeletedAt(Instant.now());
        block.setDeletedBy(currentUserId);
        carCalendarBlockRepository.save(block);

        log.info("Owner {} đã mở khóa / hủy chặn lịch blockId={} cho xe carId={}", currentUserId, blockId, carId);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getUserId();
    }

    private Car getCarAndVerifyOwnership(Long carId, Long currentUserId) {
        Car car = carRepository.findByCarIdAndDeletedAtIsNull(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        if (!car.getOwnerId().equals(currentUserId)) {
            log.warn("User {} cố thao tác lịch xe carId={} không thuộc quyền sở hữu", currentUserId, carId);
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        return car;
    }
}
