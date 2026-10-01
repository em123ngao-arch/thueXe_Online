package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.RentalService;
import com.driveshare.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalServiceImpl implements RentalService {

    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;
    private final com.driveshare.modules.user.repository.RenterProfileRepository renterProfileRepository;

    private static final int MAX_PENDING_RENTALS = 3;
    private static final BigDecimal DEPOSIT_PERCENTAGE = BigDecimal.valueOf(0.30);

    @Override
    @Transactional
    public RentalResponse createRentalRequest(CreateRentalRequest request) {
        Long renterId = getCurrentUserId();

        // 1. CRP-42: Kiểm tra số lượng đơn chờ duyệt (PENDING) hiện tại của khách thuê (tối đa 3 đơn PENDING)
        long pendingCount = rentalRepository.countByRenterIdAndStatus(renterId, ERentalStatus.PENDING);
        if (pendingCount >= MAX_PENDING_RENTALS) {
            log.warn("User {} đã có {} đơn PENDING, vượt giới hạn tối đa {}", renterId, pendingCount, MAX_PENDING_RENTALS);
            throw new AppException(ErrorCode.MAX_PENDING_RENTALS_EXCEEDED);
        }

        // 2. Validate ngày thuê
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        if (startDate == null || endDate == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Ngày bắt đầu và ngày kết thúc không được để trống");
        }

        boolean isHourly = request.getNote() != null && request.getNote().contains("[Thuê theo giờ");
        LocalDate minStartDate = isHourly ? LocalDate.now() : LocalDate.now().plusDays(1);
        if (startDate.isBefore(minStartDate)) {
            throw new AppException(ErrorCode.INVALID_RENTAL_DATES,
                    isHourly ? "Ngày nhận xe không được ở trong quá khứ" : "Ngày nhận xe thuê theo ngày tối thiểu phải từ ngày mai trở đi (cách 1 ngày)");
        }

        if (endDate.isBefore(startDate)) {
            throw new AppException(ErrorCode.INVALID_RENTAL_DATES, "Ngày kết thúc thuê phải sau hoặc bằng ngày bắt đầu thuê");
        }

        // 3. Giai đoạn 1: Điều kiện tiên quyết kiểm tra hồ sơ khách thuê (eKYC / GPLX)
        if (renterProfileRepository != null) {
            renterProfileRepository.findById(renterId).ifPresent(profile -> {
                if (profile.getLicenseVerificationStatus() == com.driveshare.common.enums.EVerificationStatus.REJECTED
                        || profile.getVerificationStatus() == com.driveshare.common.enums.EVerificationStatus.REJECTED) {
                    throw new AppException(ErrorCode.UNAUTHORIZED, "Hồ sơ GPLX/CCCD của bạn đã bị từ chối. Vui lòng cập nhật lại trước khi thuê xe");
                }
            });
        }

        // 4. Kiểm tra xe tồn tại và đang ACTIVE
        Car car = carRepository.findByCarIdAndDeletedAtIsNull(request.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        if (car.getStatus() != ECarStatus.ACTIVE) {
            log.warn("Xe carId={} không ở trạng thái ACTIVE (hiện tại: {})", car.getCarId(), car.getStatus());
            throw new AppException(ErrorCode.CAR_NOT_FOUND, "Xe hiện không sẵn sàng cho thuê");
        }

        if (car.getOwnerId().equals(renterId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Bạn không thể tự thuê xe của chính mình");
        }

        // 5. Giai đoạn 1 & CRP-38: Kiểm tra xe có bị trùng lịch với đơn đang WAITING_PAYMENT, APPROVED, CONFIRMED, IN_PROGRESS không
        boolean hasConflict = rentalRepository.hasDateConflict(
                car.getCarId(),
                startDate,
                endDate,
                List.of(
                        ERentalStatus.WAITING_PAYMENT,
                        ERentalStatus.APPROVED,
                        ERentalStatus.CONFIRMED,
                        ERentalStatus.IN_PROGRESS
                )
        );
        if (hasConflict) {
            log.warn("Xe carId={} đã có lịch giữ chỗ/thuê giao nhau trong khoảng {} -> {}", car.getCarId(), startDate, endDate);
            throw new AppException(ErrorCode.CAR_ALREADY_RENTED, "Xe đã có người giữ chỗ hoặc đang được thuê trong khoảng thời gian này");
        }

        // 5.5. CRP-NEW: Kiểm tra user này có sẵn đơn PENDING/PENDING_APPROVAL cho cùng xe trong cùng khoảng ngày không
        boolean hasDuplicateRequest = rentalRepository.hasActiveOrPendingRentalForUserAndCar(
                car.getCarId(),
                renterId,
                startDate,
                endDate,
                List.of(ERentalStatus.PENDING, ERentalStatus.PENDING_APPROVAL)
        );
        if (hasDuplicateRequest) {
            log.warn("User renterId={} đã có đơn PENDING/PENDING_APPROVAL trùng ngày [{} -> {}] cho xe carId={}", renterId, startDate, endDate, car.getCarId());
            throw new AppException(ErrorCode.DUPLICATE_RENTAL_REQUEST);
        }

        // 6. Tính toán số ngày và tiền thuê (hỗ trợ cả thuê ngày và thuê theo giờ 4h - 8h)
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        int totalDays = (int) Math.max(1, daysBetween);

        BigDecimal pricePerDay = car.getPricePerDay();
        BigDecimal totalPrice;

        // Nếu có ghi chú thuê theo giờ (4h - 8h)
        String noteStr = request.getNote() != null ? request.getNote() : "";
        if (noteStr.contains("Thuê theo giờ") || noteStr.contains("thuê theo giờ")) {
            int hours = 4;
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)\\s*(?:giờ|h)").matcher(noteStr);
            if (m.find()) {
                hours = Integer.parseInt(m.group(1));
            }
            hours = Math.max(4, Math.min(8, hours)); // Ràng buộc tối thiểu 4h - tối đa 8h
            BigDecimal hourlyRate = pricePerDay.divide(BigDecimal.valueOf(10), 2, java.math.RoundingMode.HALF_UP);
            totalPrice = hourlyRate.multiply(BigDecimal.valueOf(hours));
        } else {
            totalPrice = pricePerDay.multiply(BigDecimal.valueOf(totalDays));
        }
        BigDecimal depositAmount = totalPrice.multiply(DEPOSIT_PERCENTAGE);

        // 7. CRP-41: Tạo mới đơn thuê ở trạng thái PENDING
        Rental rental = Rental.builder()
                .carId(car.getCarId())
                .renterId(renterId)
                .startDate(startDate)
                .endDate(endDate)
                .totalDays(totalDays)
                .pricePerDay(pricePerDay)
                .totalPrice(totalPrice)
                .depositAmount(depositAmount)
                .status(ERentalStatus.PENDING)
                .note(request.getNote())
                .build();

        Rental savedRental = rentalRepository.save(rental);
        log.info("Tạo yêu cầu thuê xe thành công: rentalId={}, carId={}, renterId={}, totalDays={}, totalPrice={}, status={}",
                savedRental.getRentalId(), car.getCarId(), renterId, totalDays, totalPrice, savedRental.getStatus());

        return RentalResponse.from(savedRental);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
}
