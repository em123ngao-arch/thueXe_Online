package com.driveshare.modules.admin;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EDocumentType;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.admin.dto.request.AdminCarFilterRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarDocumentRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarRequest;
import com.driveshare.modules.admin.dto.response.AdminCarDetailResponse;
import com.driveshare.modules.admin.dto.response.AdminCarItemResponse;
import com.driveshare.modules.admin.dto.response.CarDocumentResponse;
import com.driveshare.modules.admin.entity.AuditLog;
import com.driveshare.modules.admin.repository.AuditLogRepository;
import com.driveshare.modules.admin.service.impl.AdminCarServiceImpl;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.entity.CarDocument;
import com.driveshare.modules.car.entity.CarImage;
import com.driveshare.modules.car.repository.CarDocumentRepository;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SuppressWarnings({"unchecked", "null"})
@ExtendWith(MockitoExtension.class)
class AdminCarServiceTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private CarDocumentRepository carDocumentRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AdminCarServiceImpl adminCarService;

    private User sampleOwner;
    private Car sampleCar;
    private CarDocument sampleDoc;

    @BeforeEach
    void setUp() {
        sampleOwner = User.builder()
                .userId(1L)
                .username("hung_toyota")
                .email("owner.hung@gmail.com")
                .fullName("Nguyễn Văn Hùng")
                .phone("0901234567")
                .build();

        sampleDoc = CarDocument.builder()
                .documentId(10L)
                .documentType(EDocumentType.REGISTRATION)
                .documentUrl("https://example.com/cavet.jpg")
                .verificationStatus(EVerificationStatus.PENDING)
                .build();

        CarImage sampleImage = CarImage.builder()
                .imageId(20L)
                .imageUrl("https://example.com/car.jpg")
                .isThumbnail(true)
                .build();

        sampleCar = Car.builder()
                .carId(100L)
                .owner(sampleOwner)
                .brand("Toyota")
                .model("Corolla Cross")
                .year(2024)
                .plateNumber("51L-456.78")
                .seats(5)
                .transmission(ETransmission.AUTOMATIC)
                .fuelType(EFuelType.GASOLINE)
                .color("Trắng")
                .address("32 Song Hành, TP Thủ Đức")
                .pricePerDay(new BigDecimal("950000.00"))
                .status(ECarStatus.PENDING_REVIEW)
                .images(new ArrayList<>(List.of(sampleImage)))
                .documents(new ArrayList<>(List.of(sampleDoc)))
                .build();
        sampleCar.setCreatedAt(Instant.now());
        sampleDoc.setCar(sampleCar);
        sampleImage.setCar(sampleCar);
    }

    @Test
    @DisplayName("Admin Get Cars - Success: Returns paginated car list with thumbnails")
    void testGetCars_Success() {
        AdminCarFilterRequest request = AdminCarFilterRequest.builder()
                .page(1)
                .limit(10)
                .status("pending_review")
                .build();

        when(carRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleCar)));

        PageResponse<AdminCarItemResponse> response = adminCarService.getCars(request);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        AdminCarItemResponse item = response.getItems().get(0);
        assertEquals("51L-456.78", item.getLicensePlate());
        assertEquals("Toyota", item.getBrand());
        assertEquals(ECarStatus.PENDING_REVIEW, item.getStatus());
        assertEquals("https://example.com/car.jpg", item.getThumbnailUrl());
        assertEquals("Nguyễn Văn Hùng", item.getOwnerName());
    }

    @Test
    @DisplayName("Admin Get Car By ID - Success: Returns full detail with images and documents")
    void testGetCarById_Success() {
        when(carRepository.findById(100L)).thenReturn(Optional.of(sampleCar));

        AdminCarDetailResponse response = adminCarService.getCarById(100L);

        assertNotNull(response);
        assertEquals(100L, response.getCarId());
        assertEquals("51L-456.78", response.getLicensePlate());
        assertEquals(1, response.getImages().size());
        assertEquals(1, response.getDocuments().size());
        assertEquals("owner.hung@gmail.com", response.getOwnerEmail());
    }

    @Test
    @DisplayName("Admin Get Car By ID - Throws exception when car not found")
    void testGetCarById_NotFound_ThrowsException() {
        when(carRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> adminCarService.getCarById(999L));
        assertEquals(ErrorCode.CAR_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Admin Approve Car - Success: Car status becomes ACTIVE and audit log recorded")
    void testApproveCar_Success() {
        when(carRepository.findById(100L)).thenReturn(Optional.of(sampleCar));
        when(carRepository.save(any(Car.class))).thenReturn(sampleCar);

        AdminCarDetailResponse response = adminCarService.approveCar(100L, 6L, "admin_tin");

        assertNotNull(response);
        assertEquals(ECarStatus.ACTIVE, sampleCar.getStatus());
        assertEquals(6L, sampleCar.getApprovedBy());
        assertNotNull(sampleCar.getApprovedAt());
        assertNull(sampleCar.getRejectionReason());

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Reject Car - Success: Car status becomes REJECTED with reason recorded")
    void testRejectCar_Success() {
        when(carRepository.findById(100L)).thenReturn(Optional.of(sampleCar));
        when(carRepository.save(any(Car.class))).thenReturn(sampleCar);

        ApproveCarRequest request = ApproveCarRequest.builder()
                .status("rejected")
                .rejectionReason("Ảnh chụp cavet xe không trùng biển số")
                .build();

        AdminCarDetailResponse response = adminCarService.rejectCar(100L, request, 6L, "admin_tin");

        assertNotNull(response);
        assertEquals(ECarStatus.REJECTED, sampleCar.getStatus());
        assertEquals("Ảnh chụp cavet xe không trùng biển số", sampleCar.getRejectionReason());
        assertEquals(6L, sampleCar.getApprovedBy());
        assertNotNull(sampleCar.getApprovedAt());

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Reject Car - Throws exception when rejection reason is missing")
    void testRejectCar_MissingReason_ThrowsException() {
        when(carRepository.findById(100L)).thenReturn(Optional.of(sampleCar));

        ApproveCarRequest request = ApproveCarRequest.builder()
                .status("rejected")
                .rejectionReason("")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                adminCarService.rejectCar(100L, request, 6L, "admin_tin"));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Admin Approve Car Document - Success: Document verification status becomes VERIFIED")
    void testApproveCarDocument_Success() {
        when(carDocumentRepository.findByDocumentIdAndCar_CarId(10L, 100L)).thenReturn(Optional.of(sampleDoc));
        when(carDocumentRepository.save(any(CarDocument.class))).thenReturn(sampleDoc);

        ApproveCarDocumentRequest request = ApproveCarDocumentRequest.builder()
                .verificationStatus("verified")
                .build();

        CarDocumentResponse response = adminCarService.approveCarDocument(100L, 10L, request, 6L, "admin_tin");

        assertNotNull(response);
        assertEquals(EVerificationStatus.VERIFIED, sampleDoc.getVerificationStatus());
        assertEquals(6L, sampleDoc.getVerifiedBy());
        assertNotNull(sampleDoc.getVerifiedAt());

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Reject Car Document - Success: Document status becomes REJECTED with reason")
    void testRejectCarDocument_Success() {
        when(carDocumentRepository.findByDocumentIdAndCar_CarId(10L, 100L)).thenReturn(Optional.of(sampleDoc));
        when(carDocumentRepository.save(any(CarDocument.class))).thenReturn(sampleDoc);

        ApproveCarDocumentRequest request = ApproveCarDocumentRequest.builder()
                .verificationStatus("rejected")
                .rejectionReason("Sổ đăng kiểm đã hết hạn")
                .build();

        CarDocumentResponse response = adminCarService.approveCarDocument(100L, 10L, request, 6L, "admin_tin");

        assertNotNull(response);
        assertEquals(EVerificationStatus.REJECTED, sampleDoc.getVerificationStatus());
        assertEquals("Sổ đăng kiểm đã hết hạn", sampleDoc.getRejectionReason());

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Approve Car Document - Throws exception when document not found")
    void testApproveCarDocument_NotFound_ThrowsException() {
        when(carDocumentRepository.findByDocumentIdAndCar_CarId(999L, 100L)).thenReturn(Optional.empty());

        ApproveCarDocumentRequest request = ApproveCarDocumentRequest.builder()
                .verificationStatus("verified")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                adminCarService.approveCarDocument(100L, 999L, request, 6L, "admin_tin"));

        assertEquals(ErrorCode.DOCUMENT_NOT_FOUND, ex.getErrorCode());
    }
}
