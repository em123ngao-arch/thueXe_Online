package com.driveshare.modules.admin.service.impl;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.admin.dto.request.AdminCarFilterRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarDocumentRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarRequest;
import com.driveshare.modules.admin.dto.response.AdminCarDetailResponse;
import com.driveshare.modules.admin.dto.response.AdminCarItemResponse;
import com.driveshare.modules.admin.dto.response.CarDocumentResponse;
import com.driveshare.modules.admin.dto.response.CarImageResponse;
import com.driveshare.modules.admin.entity.AuditLog;
import com.driveshare.modules.admin.repository.AuditLogRepository;
import com.driveshare.modules.admin.service.AdminCarService;
import com.driveshare.modules.admin.specification.CarSpecification;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.entity.CarDocument;
import com.driveshare.modules.car.entity.CarImage;
import com.driveshare.modules.car.repository.CarDocumentRepository;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdminCarServiceImpl implements AdminCarService {

    private final CarRepository carRepository;
    private final CarDocumentRepository carDocumentRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminCarItemResponse> getCars(AdminCarFilterRequest request) {
        int pageIndex = Math.max(0, request.getPage() - 1);
        int pageSize = request.getLimit() > 0 ? request.getLimit() : 10;

        String sortProperty = "createdAt";
        if ("price".equalsIgnoreCase(request.getSortBy()) || "basePricePerDay".equalsIgnoreCase(request.getSortBy())) {
            sortProperty = "basePricePerDay";
        } else if ("year".equalsIgnoreCase(request.getSortBy())) {
            sortProperty = "year";
        } else if ("brand".equalsIgnoreCase(request.getSortBy())) {
            sortProperty = "brand";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(request.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(direction, sortProperty));

        Specification<Car> spec = CarSpecification.filterCars(request.getSearch(), request.getStatus());
        Page<Car> carPage = carRepository.findAll(spec, pageable);

        return PageResponse.from(carPage.map(this::mapToAdminCarItemResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminCarDetailResponse getCarById(Long carId) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));
        return mapToAdminCarDetailResponse(car);
    }

    @Override
    @Transactional
    public AdminCarDetailResponse approveCar(Long carId, Long actorId, String actorUsername) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        car.setStatus(ECarStatus.ACTIVE);
        car.setApprovedBy(actorId);
        car.setApprovedAt(Instant.now());
        car.setRejectionReason(null);
        carRepository.save(car);

        AuditLog auditLog = AuditLog.builder()
                .action("APPROVE_CAR")
                .actorId(actorId)
                .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                .targetType("CAR")
                .targetId(carId)
                .details("Phê duyệt xe " + car.getBrand() + " " + car.getModel() + " (" + car.getLicensePlate() + ") thành công. Xe đã chuyển sang ACTIVE.")
                .createdAt(Instant.now())
                .build();
        auditLogRepository.save(auditLog);

        log.info("🚗 [AUDIT] Admin '{}' approved car #{} ({}), status set to ACTIVE",
                actorUsername, carId, car.getLicensePlate());
        if (car.getOwner() != null) {
            log.info("📧 [NOTIFICATION] Sent car approval notice to owner: {} ({})",
                    car.getOwner().getFullName(), car.getOwner().getEmail());
        }

        return mapToAdminCarDetailResponse(car);
    }

    @Override
    @Transactional
    public AdminCarDetailResponse rejectCar(Long carId, ApproveCarRequest request, Long actorId, String actorUsername) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        String reason = request != null ? request.getRejectionReason() : null;
        if (reason == null || reason.trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Lý do từ chối xe không được để trống");
        }

        car.setStatus(ECarStatus.REJECTED);
        car.setRejectionReason(reason.trim());
        car.setApprovedBy(actorId);
        car.setApprovedAt(Instant.now());
        carRepository.save(car);

        AuditLog auditLog = AuditLog.builder()
                .action("REJECT_CAR")
                .actorId(actorId)
                .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                .targetType("CAR")
                .targetId(carId)
                .details("Từ chối xe " + car.getBrand() + " " + car.getModel() + " (" + car.getLicensePlate() + "). Lý do: " + reason.trim())
                .createdAt(Instant.now())
                .build();
        auditLogRepository.save(auditLog);

        log.warn("⚠️ [AUDIT] Admin '{}' rejected car #{} ({}). Reason: {}",
                actorUsername, carId, car.getLicensePlate(), reason.trim());
        if (car.getOwner() != null) {
            log.info("📧 [NOTIFICATION] Sent car rejection notice to owner: {} ({}) with reason: '{}'",
                    car.getOwner().getFullName(), car.getOwner().getEmail(), reason.trim());
        }

        return mapToAdminCarDetailResponse(car);
    }

    @Override
    @Transactional
    public CarDocumentResponse approveCarDocument(Long carId, Long documentId, ApproveCarDocumentRequest request, Long actorId, String actorUsername) {
        CarDocument document = carDocumentRepository.findByDocumentIdAndCar_CarId(documentId, carId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND, "Không tìm thấy giấy tờ tương ứng với xe này"));

        String targetStatus = request.getVerificationStatus() != null ? request.getVerificationStatus().trim().toLowerCase() : "";

        if ("verified".equals(targetStatus)) {
            document.setVerificationStatus(EVerificationStatus.VERIFIED);
            document.setVerifiedAt(Instant.now());
            document.setVerifiedBy(actorId);
            document.setRejectionReason(null);

            AuditLog auditLog = AuditLog.builder()
                    .action("APPROVE_CAR_DOCUMENT")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("CAR_DOCUMENT")
                    .targetId(documentId)
                    .details("Phê duyệt giấy tờ loại " + document.getDocumentType() + " cho xe #" + carId + " thành công.")
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.info("📄 [AUDIT] Admin '{}' verified car document #{} for car #{}", actorUsername, documentId, carId);

        } else if ("rejected".equals(targetStatus)) {
            String reason = request.getRejectionReason();
            if (reason == null || reason.trim().isEmpty()) {
                throw new AppException(ErrorCode.VALIDATION_FAILED, "Lý do từ chối giấy tờ không được để trống");
            }

            document.setVerificationStatus(EVerificationStatus.REJECTED);
            document.setVerifiedAt(Instant.now());
            document.setVerifiedBy(actorId);
            document.setRejectionReason(reason.trim());

            AuditLog auditLog = AuditLog.builder()
                    .action("REJECT_CAR_DOCUMENT")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("CAR_DOCUMENT")
                    .targetId(documentId)
                    .details("Từ chối giấy tờ loại " + document.getDocumentType() + " cho xe #" + carId + ". Lý do: " + reason.trim())
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.warn("⚠️ [AUDIT] Admin '{}' rejected car document #{} for car #{}. Reason: {}", actorUsername, documentId, carId, reason.trim());

        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Trạng thái xác minh không hợp lệ. Chỉ chấp nhận 'verified' hoặc 'rejected'");
        }

        carDocumentRepository.save(document);
        return mapToCarDocumentResponse(document);
    }

    private AdminCarItemResponse mapToAdminCarItemResponse(Car car) {
        String thumbnailUrl = null;
        if (car.getImages() != null && !car.getImages().isEmpty()) {
            thumbnailUrl = car.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsThumbnail()))
                    .map(CarImage::getImageUrl)
                    .findFirst()
                    .orElse(car.getImages().get(0).getImageUrl());
        }

        User owner = car.getOwner();
        return AdminCarItemResponse.builder()
                .carId(car.getCarId())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .licensePlate(car.getLicensePlate())
                .seats(car.getSeats())
                .transmission(car.getTransmission())
                .fuelType(car.getFuelType())
                .color(car.getColor())
                .basePricePerDay(car.getBasePricePerDay())
                .pickupAddress(car.getPickupAddress())
                .thumbnailUrl(thumbnailUrl)
                .status(car.getStatus())
                .rejectionReason(car.getRejectionReason())
                .ownerId(owner != null ? owner.getUserId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerPhone(owner != null ? owner.getPhone() : null)
                .ownerAvatar(owner != null ? owner.getAvatarUrl() : null)
                .createdAt(car.getCreatedAt())
                .build();
    }

    private AdminCarDetailResponse mapToAdminCarDetailResponse(Car car) {
        User owner = car.getOwner();

        List<CarImageResponse> imageResponses = car.getImages() != null
                ? car.getImages().stream().map(this::mapToCarImageResponse).collect(Collectors.toList())
                : Collections.emptyList();

        List<CarDocumentResponse> documentResponses = car.getDocuments() != null
                ? car.getDocuments().stream().map(this::mapToCarDocumentResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return AdminCarDetailResponse.builder()
                .carId(car.getCarId())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .licensePlate(car.getLicensePlate())
                .seats(car.getSeats())
                .transmission(car.getTransmission())
                .fuelType(car.getFuelType())
                .color(car.getColor())
                .description(car.getDescription())
                .pickupAddress(car.getPickupAddress())
                .latitude(car.getLatitude())
                .longitude(car.getLongitude())
                .basePricePerDay(car.getBasePricePerDay())
                .status(car.getStatus())
                .rejectionReason(car.getRejectionReason())
                .approvedBy(car.getApprovedBy())
                .approvedAt(car.getApprovedAt())
                .createdAt(car.getCreatedAt())
                .ownerId(owner != null ? owner.getUserId() : null)
                .ownerUsername(owner != null ? owner.getUsername() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .ownerPhone(owner != null ? owner.getPhone() : null)
                .ownerAvatar(owner != null ? owner.getAvatarUrl() : null)
                .images(imageResponses)
                .documents(documentResponses)
                .build();
    }

    private CarImageResponse mapToCarImageResponse(CarImage image) {
        return CarImageResponse.builder()
                .imageId(image.getImageId())
                .imageUrl(image.getImageUrl())
                .isThumbnail(image.getIsThumbnail())
                .createdAt(image.getCreatedAt())
                .build();
    }

    private CarDocumentResponse mapToCarDocumentResponse(CarDocument doc) {
        return CarDocumentResponse.builder()
                .documentId(doc.getDocumentId())
                .documentType(doc.getDocumentType())
                .documentUrl(doc.getDocumentUrl())
                .verificationStatus(doc.getVerificationStatus())
                .rejectionReason(doc.getRejectionReason())
                .verifiedBy(doc.getVerifiedBy())
                .verifiedAt(doc.getVerifiedAt())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
