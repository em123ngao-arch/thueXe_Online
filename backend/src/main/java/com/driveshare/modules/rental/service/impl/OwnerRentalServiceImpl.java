package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.RejectRentalRequest;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.OwnerRentalService;
import com.driveshare.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OwnerRentalServiceImpl implements OwnerRentalService {

    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;

    private static final long SOFT_LOCK_MINUTES = 45;

    @Override
    @Transactional
    public RentalSummaryResponse approveRental(Long rentalId) {
        Long ownerId = getCurrentUserId();
        log.info("Chủ xe ownerId={} tiến hành duyệt yêu cầu thuê rentalId={}", ownerId, rentalId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        // Kiểm tra quyền sở hữu xe
        if (!car.getOwnerId().equals(ownerId)) {
            log.warn("Chủ xe ownerId={} không có quyền duyệt rentalId={} thuộc xe carId={} (owner: {})",
                    ownerId, rentalId, car.getCarId(), car.getOwnerId());
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        // Chỉ được duyệt đơn đang ở trạng thái PENDING hoặc PENDING_APPROVAL
        if (rental.getStatus() != ERentalStatus.PENDING && rental.getStatus() != ERentalStatus.PENDING_APPROVAL) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể duyệt", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_ALREADY_PROCESSED);
        }

        // Race-condition guard: Kiểm tra xe có đang bị khóa (Soft Lock hoặc Hard Lock) bởi đơn khác trùng khung giờ không
        boolean hasConflict = rentalRepository.hasDateConflict(
                rental.getCarId(),
                rental.getStartDate(),
                rental.getEndDate(),
                List.of(ERentalStatus.WAITING_PAYMENT, ERentalStatus.APPROVED, ERentalStatus.CONFIRMED, ERentalStatus.IN_PROGRESS)
        );
        if (hasConflict) {
            log.warn("Xe carId={} đã có cuốc giữ chỗ hoặc xác nhận trong khoảng {} -> {}",
                    rental.getCarId(), rental.getStartDate(), rental.getEndDate());
            throw new AppException(ErrorCode.CAR_ALREADY_RENTED);
        }

        // 1. Kích hoạt Soft Lock 45 phút cho đơn được chọn (Giai đoạn 3 v2.0.0 & CRP-47)
        rental.setStatus(ERentalStatus.WAITING_PAYMENT);
        rental.setPaymentExpiresAt(Instant.now().plus(SOFT_LOCK_MINUTES, ChronoUnit.MINUTES));
        rental.setRejectReason(null);
        rental = rentalRepository.save(rental);

        // 2. Chuyển tất cả các đơn trùng lịch khác của xe sang trạng thái ON_HOLD (CRP-49 & Giai đoạn 3)
        List<Rental> competingRentals = rentalRepository.findCompetingRentals(
                rental.getCarId(),
                rental.getStartDate(),
                rental.getEndDate(),
                rental.getRentalId(),
                List.of(ERentalStatus.PENDING_APPROVAL, ERentalStatus.PENDING)
        );

        if (!competingRentals.isEmpty()) {
            for (Rental competing : competingRentals) {
                competing.setStatus(ERentalStatus.ON_HOLD);
                competing.setRejectReason("Chủ xe đang ưu tiên thanh toán giữ chỗ 45 phút cho một lượt đặt trước.");
            }
            rentalRepository.saveAll(competingRentals);
            log.info("Đã chuyển {} đơn trùng lịch của carId={} sang ON_HOLD", competingRentals.size(), rental.getCarId());
        }

        log.info("Duyệt thành công đơn rentalId={} sang WAITING_PAYMENT, hạn thanh toán: {}", rentalId, rental.getPaymentExpiresAt());
        return RentalSummaryResponse.fromEntity(rental);
    }

    @Override
    @Transactional
    public RentalSummaryResponse rejectRental(Long rentalId, RejectRentalRequest request) {
        Long ownerId = getCurrentUserId();
        log.info("Chủ xe ownerId={} từ chối yêu cầu thuê rentalId={}", ownerId, rentalId);

        if (request == null || !StringUtils.hasText(request.getReason())) {
            throw new AppException(ErrorCode.REJECT_REASON_REQUIRED);
        }

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        // Kiểm tra quyền sở hữu xe
        if (!car.getOwnerId().equals(ownerId)) {
            log.warn("Chủ xe ownerId={} không có quyền từ chối rentalId={} thuộc xe carId={} (owner: {})",
                    ownerId, rentalId, car.getCarId(), car.getOwnerId());
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        // Không được từ chối đơn đã xác nhận hoặc đã hoàn tất
        if (rental.getStatus() == ERentalStatus.CONFIRMED ||
            rental.getStatus() == ERentalStatus.IN_PROGRESS ||
            rental.getStatus() == ERentalStatus.COMPLETED ||
            rental.getStatus() == ERentalStatus.REJECTED ||
            rental.getStatus() == ERentalStatus.EXPIRED ||
            rental.getStatus() == ERentalStatus.WITHDRAWN_BY_GUEST) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể từ chối", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_ALREADY_PROCESSED);
        }

        ERentalStatus previousStatus = rental.getStatus();
        rental.setStatus(ERentalStatus.REJECTED);
        rental.setRejectReason(request.getReason().trim());
        rental = rentalRepository.save(rental);

        // Nếu chủ xe từ chối đơn đang WAITING_PAYMENT -> Giải phóng Soft Lock, mở lại các đơn ON_HOLD sang PENDING_APPROVAL
        if (previousStatus == ERentalStatus.WAITING_PAYMENT) {
            List<Rental> onHoldRentals = rentalRepository.findCompetingRentals(
                    rental.getCarId(),
                    rental.getStartDate(),
                    rental.getEndDate(),
                    rental.getRentalId(),
                    List.of(ERentalStatus.ON_HOLD)
            );
            if (!onHoldRentals.isEmpty()) {
                for (Rental onHold : onHoldRentals) {
                    onHold.setStatus(ERentalStatus.PENDING_APPROVAL);
                    onHold.setRejectReason(null);
                }
                rentalRepository.saveAll(onHoldRentals);
                log.info("Giải phóng Soft Lock: Đã mở lại {} đơn ON_HOLD sang PENDING_APPROVAL cho carId={}",
                        onHoldRentals.size(), rental.getCarId());
            }
        }

        log.info("Đã từ chối đơn rentalId={}, lý do: {}", rentalId, request.getReason());
        return RentalSummaryResponse.fromEntity(rental);
    }

    @Override
    @Transactional
    public RentalSummaryResponse startRental(Long rentalId) {
        Long ownerId = getCurrentUserId();
        log.info("Chủ xe ownerId={} tiến hành bắt đầu chuyến đi rentalId={}", ownerId, rentalId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        if (!car.getOwnerId().equals(ownerId)) {
            log.warn("Chủ xe ownerId={} không có quyền thao tác trên rentalId={} (owner: {})",
                    ownerId, rentalId, car.getOwnerId());
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        if (rental.getStatus() != ERentalStatus.CONFIRMED) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể bắt đầu chuyến đi", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_CANNOT_BE_STARTED);
        }

        rental.setStatus(ERentalStatus.IN_PROGRESS);
        rental.setUpdatedAt(Instant.now());
        rental = rentalRepository.save(rental);

        log.info("Bắt đầu chuyến đi thành công cho rentalId={}", rentalId);
        return RentalSummaryResponse.fromEntity(rental);
    }

    @Override
    @Transactional
    public RentalSummaryResponse completeRental(Long rentalId) {
        Long ownerId = getCurrentUserId();
        log.info("Chủ xe ownerId={} tiến hành hoàn tất chuyến đi rentalId={}", ownerId, rentalId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        if (!car.getOwnerId().equals(ownerId)) {
            log.warn("Chủ xe ownerId={} không có quyền thao tác trên rentalId={} (owner: {})",
                    ownerId, rentalId, car.getOwnerId());
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        if (rental.getStatus() != ERentalStatus.IN_PROGRESS) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể hoàn tất", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_CANNOT_BE_COMPLETED);
        }

        rental.setStatus(ERentalStatus.COMPLETED);
        rental.setUpdatedAt(Instant.now());
        rental = rentalRepository.save(rental);

        log.info("Hoàn tất chuyến đi thành công cho rentalId={}", rentalId);
        return RentalSummaryResponse.fromEntity(rental);
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
