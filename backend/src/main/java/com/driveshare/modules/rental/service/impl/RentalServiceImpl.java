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

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalServiceImpl implements RentalService {

    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;

    private static final int MAX_PENDING_RENTALS = 3;
    private static final BigDecimal DEPOSIT_PERCENTAGE = BigDecimal.valueOf(0.30);

    @Override
    @Transactional
    public RentalResponse createRentalRequest(CreateRentalRequest request) {
        Long renterId = getCurrentUserId();

        // 1. CRP-42: Kiểm tra số lượng đơn PENDING hiện tại của khách thuê
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

        if (startDate.isBefore(LocalDate.now())) {
            throw new AppException(ErrorCode.INVALID_RENTAL_DATES, "Ngày bắt đầu thuê không được ở trong quá khứ");
        }

        if (endDate.isBefore(startDate)) {
            throw new AppException(ErrorCode.INVALID_RENTAL_DATES, "Ngày kết thúc thuê phải sau hoặc bằng ngày bắt đầu thuê");
        }

        // 3. Kiểm tra xe tồn tại và đang ACTIVE
        Car car = carRepository.findByCarIdAndDeletedAtIsNull(request.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        if (car.getStatus() != ECarStatus.ACTIVE) {
            log.warn("Xe carId={} không ở trạng thái ACTIVE (hiện tại: {})", car.getCarId(), car.getStatus());
            throw new AppException(ErrorCode.CAR_NOT_FOUND, "Xe hiện không sẵn sàng cho thuê");
        }

        if (car.getOwnerId().equals(renterId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Bạn không thể tự thuê xe của chính mình");
        }

        // 4. Tính toán số ngày và tiền thuê (tối thiểu 1 ngày)
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        int totalDays = (int) Math.max(1, daysBetween);

        BigDecimal pricePerDay = car.getPricePerDay();
        BigDecimal totalPrice = pricePerDay.multiply(BigDecimal.valueOf(totalDays));
        BigDecimal depositAmount = totalPrice.multiply(DEPOSIT_PERCENTAGE);

        // 5. Tạo mới đơn thuê ở trạng thái PENDING
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
        log.info("Tạo yêu cầu thuê xe thành công: rentalId={}, carId={}, renterId={}, totalDays={}, totalPrice={}",
                savedRental.getRentalId(), car.getCarId(), renterId, totalDays, totalPrice);

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
