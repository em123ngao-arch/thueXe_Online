package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.RentalQueryService;
import com.driveshare.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalQueryServiceImpl implements RentalQueryService {

    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RentalSummaryResponse> getMyRentals() {
        Long currentUserId = getCurrentUserId();
        log.info("Lấy danh sách đơn thuê của khách hàng renterId={}", currentUserId);

        List<Rental> rentals = rentalRepository.findByRenterIdOrderByCreatedAtDesc(currentUserId);
        return rentals.stream()
                .map(RentalSummaryResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public RentalSummaryResponse cancelMyRental(Long rentalId) {
        Long currentUserId = getCurrentUserId();
        log.info("Khách hàng renterId={} yêu cầu hủy đơn rentalId={}", currentUserId, rentalId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        // Kiểm tra quyền sở hữu đơn
        if (!rental.getRenterId().equals(currentUserId)) {
            log.warn("User {} cố gắng hủy đơn rentalId={} của user {}", currentUserId, rentalId, rental.getRenterId());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Chỉ được hủy khi đơn đang ở trạng thái PENDING
        if (rental.getStatus() != ERentalStatus.PENDING) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể hủy", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_CANNOT_BE_CANCELLED);
        }

        rental.setStatus(ERentalStatus.CANCELLED);
        rental = rentalRepository.save(rental);
        log.info("Đã hủy thành công đơn rentalId={} bởi khách hàng renterId={}", rentalId, currentUserId);

        return RentalSummaryResponse.fromEntity(rental);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalSummaryResponse> getOwnerIncomingRentals(ERentalStatus status) {
        Long ownerId = getCurrentUserId();
        log.info("Chủ xe ownerId={} xem danh sách yêu cầu thuê, status filter: {}", ownerId, status);

        List<Car> myCars = carRepository.findByOwnerIdAndDeletedAtIsNull(ownerId);
        if (myCars.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> carIds = myCars.stream()
                .map(Car::getCarId)
                .toList();

        List<Rental> rentals;
        if (status != null) {
            rentals = rentalRepository.findByCarIdInAndStatusOrderByCreatedAtDesc(carIds, status);
        } else {
            rentals = rentalRepository.findByCarIdInOrderByCreatedAtDesc(carIds);
        }

        return rentals.stream()
                .map(RentalSummaryResponse::fromEntity)
                .toList();
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
