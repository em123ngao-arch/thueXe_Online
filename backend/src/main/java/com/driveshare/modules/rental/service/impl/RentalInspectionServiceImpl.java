package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.common.enums.EInspectionStatus;
import com.driveshare.common.enums.EInspectionType;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.CheckInRequest;
import com.driveshare.modules.rental.dto.CheckOutRequest;
import com.driveshare.modules.rental.dto.ConfirmInspectionRequest;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalDispute;
import com.driveshare.modules.rental.entity.RentalInspection;
import com.driveshare.modules.rental.repository.RentalDisputeRepository;
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
    private final RentalDisputeRepository rentalDisputeRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.driveshare.modules.notification.service.NotificationService notificationService;

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
                .status(EInspectionStatus.PENDING_RENTER_CONFIRMATION)
                .odoMeter(request.odoMeter())
                .fuelLevel(request.fuelLevel())
                .images(request.images())
                .notes(request.notes())
                .extraFee(BigDecimal.ZERO)
                .performedBy(ownerId)
                .createdAt(Instant.now())
                .build();

        RentalInspection saved = rentalInspectionRepository.save(inspection);

        // Sprint Final: Cơ chế đồng thuận 2 chiều - Đơn chưa chuyển IN_PROGRESS ngay mà chờ Khách duyệt
        rental.setUpdatedAt(Instant.now());
        rentalRepository.save(rental);

        log.info("Lập biên bản Check-in thành công đơn rentalId={}, inspectionId={}, chờ khách xác nhận",
                rentalId, saved.getInspectionId());
        if (notificationService != null) {
            try {
                notificationService.sendNotification(
                        rental.getRenterId(),
                        "Biên bản bàn giao nhận xe (Check-in)",
                        "Chủ xe đã lập biên bản bàn giao cho đơn #" + rentalId + ". Vui lòng kiểm tra và ký nhận xe.",
                        "INSPECTION_CHECK_IN",
                        rentalId
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo check-in: {}", e.getMessage());
            }
        }
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

        // Chuyến đi phải ở trạng thái IN_PROGRESS hoặc OVERDUE
        if (rental.getStatus() != ERentalStatus.IN_PROGRESS && rental.getStatus() != ERentalStatus.OVERDUE) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể check-out (cần IN_PROGRESS hoặc OVERDUE)",
                    rentalId, rental.getStatus());
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
                .status(EInspectionStatus.PENDING_RENTER_CONFIRMATION)
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

        // Sprint Final: Cơ chế đồng thuận 2 chiều - Đơn chưa chuyển COMPLETED ngay mà chờ Khách duyệt
        rental.setUpdatedAt(Instant.now());
        rentalRepository.save(rental);

        log.info("Lập biên bản Check-out thành công đơn rentalId={}, inspectionId={}, chờ khách xác nhận",
                rentalId, saved.getInspectionId());
        if (notificationService != null) {
            try {
                notificationService.sendNotification(
                        rental.getRenterId(),
                        "Biên bản trả xe hoàn tất chuyến đi (Check-out)",
                        "Chủ xe đã lập biên bản trả xe cho đơn #" + rentalId + ". Vui lòng kiểm tra và ký nhận hoàn tất.",
                        "INSPECTION_CHECK_OUT",
                        rentalId
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo check-out: {}", e.getMessage());
            }
        }
        return RentalInspectionResponse.from(saved);
    }

    @Override
    @Transactional
    public RentalInspectionResponse confirmInspection(Long rentalId, Long inspectionId, Long customerId, ConfirmInspectionRequest request) {
        log.info("Khách thuê customerId={} xác nhận biên bản inspectionId={} cho đơn rentalId={}, agreed={}",
                customerId, inspectionId, rentalId, request.agreed());

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        // 1. Kiểm tra quyền: Chỉ chính khách thuê của đơn này mới được xác nhận
        if (!rental.getRenterId().equals(customerId)) {
            log.warn("User customerId={} không phải khách thuê của đơn rentalId={} (renter: {})",
                    customerId, rentalId, rental.getRenterId());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 2. Kiểm tra biên bản tồn tại và thuộc đúng đơn thuê
        RentalInspection inspection = rentalInspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new AppException(ErrorCode.INSPECTION_NOT_FOUND));

        if (!inspection.getRentalId().equals(rentalId)) {
            log.warn("Biên bản inspectionId={} không thuộc về đơn rentalId={}", inspectionId, rentalId);
            throw new AppException(ErrorCode.RENTAL_NOT_FOUND);
        }

        // 3. Kiểm tra biên bản phải đang ở trạng thái PENDING_RENTER_CONFIRMATION
        if (inspection.getStatus() != EInspectionStatus.PENDING_RENTER_CONFIRMATION) {
            log.warn("Biên bản inspectionId={} đã ở trạng thái {} không thể xác nhận lại",
                    inspectionId, inspection.getStatus());
            throw new AppException(ErrorCode.INSPECTION_ALREADY_PROCESSED);
        }

        if (Boolean.TRUE.equals(request.agreed())) {
            // Khách đồng ý ký nhận biên bản
            inspection.setStatus(EInspectionStatus.CONFIRMED);
            rentalInspectionRepository.save(inspection);

            if (inspection.getInspectionType() == EInspectionType.CHECK_IN) {
                // Đơn chính thức chuyển sang IN_PROGRESS
                rental.setStatus(ERentalStatus.IN_PROGRESS);
            } else if (inspection.getInspectionType() == EInspectionType.CHECK_OUT) {
                // Đơn chính thức chuyển sang COMPLETED
                rental.setStatus(ERentalStatus.COMPLETED);
                if (rental.getActualReturnTime() == null) {
                    rental.setActualReturnTime(Instant.now());
                }
            }
            rental.setUpdatedAt(Instant.now());
            rentalRepository.save(rental);

            log.info("Khách thuê customerId={} đã xác nhận đồng ý biên bản {} đơn #{}. Trạng thái đơn đổi sang {}",
                    customerId, inspection.getInspectionType(), rentalId, rental.getStatus());
        } else {
            // Khách từ chối và khiếu nại sai lệch
            inspection.setStatus(EInspectionStatus.DISPUTED);
            rentalInspectionRepository.save(inspection);

            rental.setStatus(ERentalStatus.DISPUTED);
            rental.setUpdatedAt(Instant.now());
            rentalRepository.save(rental);

            String reason = request.disputeReason();
            if (reason == null || reason.trim().isEmpty()) {
                reason = "Khách thuê khiếu nại sai lệch hiện trạng trong biên bản bàn giao (" + inspection.getInspectionType() + ")";
            }

            RentalDispute dispute = RentalDispute.builder()
                    .rentalId(rentalId)
                    .reporterId(customerId)
                    .reason(reason)
                    .proofUrls(request.proofUrls())
                    .status(EDisputeStatus.PENDING)
                    .refundAmount(BigDecimal.ZERO)
                    .penaltyAmount(BigDecimal.ZERO)
                    .build();

            rentalDisputeRepository.save(dispute);

            log.info("Khách thuê customerId={} khiếu nại sai lệch biên bản {} đơn #{}. Đã tạo dispute và chuyển đơn sang DISPUTED",
                    customerId, inspection.getInspectionType(), rentalId);
        }

        if (notificationService != null) {
            try {
                Car carObj = carRepository.findById(rental.getCarId()).orElse(null);
                if (carObj != null) {
                    if (Boolean.TRUE.equals(request.agreed())) {
                        notificationService.sendNotification(
                                carObj.getOwnerId(),
                                "Khách đã ký nhận bàn giao xe",
                                "Khách hàng đã đồng ý ký nhận biên bản " + (inspection.getInspectionType() == com.driveshare.common.enums.EInspectionType.CHECK_IN ? "nhận xe" : "trả xe") + " đơn #" + rentalId + ".",
                                "INSPECTION_CONFIRMED",
                                rentalId
                        );
                    } else {
                        notificationService.sendNotification(
                                carObj.getOwnerId(),
                                "Khách khiếu nại bàn giao xe",
                                "Khách hàng khiếu nại sai lệch biên bản đơn #" + rentalId + ". Lý do: " + request.disputeReason(),
                                "INSPECTION_DISPUTED",
                                rentalId
                        );
                    }
                }
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo xác nhận biên bản: {}", e.getMessage());
            }
        }
        return RentalInspectionResponse.from(inspection);
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
