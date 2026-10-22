package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.enums.EInspectionType;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.CheckInRequest;
import com.driveshare.modules.rental.dto.CheckOutRequest;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalInspection;
import com.driveshare.modules.rental.repository.RentalInspectionRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.RentalInspectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalInspectionServiceImpl implements RentalInspectionService {

    private final RentalRepository rentalRepository;
    private final RentalInspectionRepository rentalInspectionRepository;
    private final CarRepository carRepository;

    @Override
    @Transactional
    public RentalInspectionResponse checkIn(Long rentalId, Long ownerId, CheckInRequest request) {
        log.info("Chủ xe ownerId={} tiến hành check-in đơn rentalId={}", ownerId, rentalId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        // Kiểm tra quyền: Chỉ chủ xe sở hữu xe trong đơn mới được check-in
        if (!car.getOwnerId().equals(ownerId)) {
            log.warn("User ownerId={} không có quyền check-in đơn rentalId={} của xe carId={} (owner: {})",
                    ownerId, rentalId, car.getCarId(), car.getOwnerId());
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        // Chuyến đi phải ở trạng thái CONFIRMED (đã đặt cọc)
        if (rental.getStatus() != ERentalStatus.CONFIRMED) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể check-in (cần CONFIRMED)", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_CANNOT_BE_STARTED);
        }

        // Đã check-in chưa? Không được check-in 2 lần
        if (rentalInspectionRepository.existsByRentalIdAndInspectionType(rentalId, EInspectionType.CHECK_IN)) {
            log.warn("Đơn rentalId={} đã có biên bản CHECK_IN trước đó", rentalId);
            throw new AppException(ErrorCode.INSPECTION_ALREADY_EXISTS);
        }

        RentalInspection inspection = RentalInspection.builder()
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_IN)
                .odoMeter(request.odoMeter())
                .fuelLevel(request.fuelLevel())
                .images(request.images())
                .notes(request.notes())
                .extraFee(BigDecimal.ZERO)
                .performedBy(ownerId)
                .createdAt(Instant.now())
                .build();

        RentalInspection saved = rentalInspectionRepository.save(inspection);

        // Chuyển trạng thái đơn sang IN_PROGRESS
        rental.setStatus(ERentalStatus.IN_PROGRESS);
        rental.setUpdatedAt(Instant.now());
        rentalRepository.save(rental);

        log.info("Check-in thành công đơn rentalId={}, inspectionId={}", rentalId, saved.getInspectionId());
        return RentalInspectionResponse.from(saved);
    }

    @Override
    @Transactional
    public RentalInspectionResponse checkOut(Long rentalId, Long ownerId, CheckOutRequest request) {
        log.info("Chủ xe ownerId={} tiến hành check-out đơn rentalId={}", ownerId, rentalId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        // Kiểm tra quyền: Chỉ chủ xe sở hữu xe trong đơn mới được check-out
        if (!car.getOwnerId().equals(ownerId)) {
            log.warn("User ownerId={} không có quyền check-out đơn rentalId={} của xe carId={} (owner: {})",
                    ownerId, rentalId, car.getCarId(), car.getOwnerId());
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        // Chuyến đi phải ở trạng thái IN_PROGRESS
        if (rental.getStatus() != ERentalStatus.IN_PROGRESS) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể check-out (cần IN_PROGRESS)", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_CANNOT_BE_COMPLETED);
        }

        // Đã check-out chưa? Không được check-out 2 lần
        if (rentalInspectionRepository.existsByRentalIdAndInspectionType(rentalId, EInspectionType.CHECK_OUT)) {
            log.warn("Đơn rentalId={} đã có biên bản CHECK_OUT trước đó", rentalId);
            throw new AppException(ErrorCode.INSPECTION_ALREADY_EXISTS);
        }

        RentalInspection inspection = RentalInspection.builder()
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_OUT)
                .odoMeter(request.odoMeter())
                .fuelLevel(request.fuelLevel())
                .images(request.images())
                .notes(request.notes())
                .extraFee(request.extraFee() != null ? request.extraFee() : BigDecimal.ZERO)
                .extraFeeReason(request.extraFeeReason())
                .performedBy(ownerId)
                .createdAt(Instant.now())
                .build();

        RentalInspection saved = rentalInspectionRepository.save(inspection);

        // Chuyển trạng thái đơn sang COMPLETED
        rental.setStatus(ERentalStatus.COMPLETED);
        rental.setUpdatedAt(Instant.now());
        rentalRepository.save(rental);

        log.info("Check-out thành công đơn rentalId={}, inspectionId={}", rentalId, saved.getInspectionId());
        return RentalInspectionResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalInspectionResponse> getInspections(Long rentalId, Long userId) {
        log.info("Lấy danh sách biên bản kiểm tra cho đơn rentalId={}, userId={}", rentalId, userId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        // Kiểm tra quyền: Phải là chủ xe hoặc khách thuê của chuyến đi này
        if (!car.getOwnerId().equals(userId) && !rental.getRenterId().equals(userId)) {
            log.warn("User userId={} không có quyền xem biên bản của rentalId={}", userId, rentalId);
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<RentalInspection> inspections = rentalInspectionRepository.findByRentalIdOrderByCreatedAtAsc(rentalId);
        return inspections.stream()
                .map(RentalInspectionResponse::from)
                .toList();
    }
}
