package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.ERentalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO Hồ Sơ Pháp Lý 1-Click (Violation Dossier) dành cho Admin
 * chuyển giao cơ quan Công an và bảo hiểm (Sprint 4 - Duy Quân).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationDossierResponse {

    private String dossierCode;
    private Instant generatedAt;
    private String legalNotice;

    // 1. Thông tin đơn thuê & Vi phạm
    private Long rentalId;
    private ERentalStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer overdueHours;
    private BigDecimal penaltyFee;
    private BigDecimal pricePerDay;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private Boolean isBlacklistedTriggered;

    // 2. Thông tin khách thuê vi phạm
    private RenterInfo renter;

    // 3. Thông tin xe bị chiếm dụng
    private CarInfo car;

    // 4. Thông tin chủ xe hợp pháp (bị hại)
    private OwnerInfo owner;

    // 5. Bằng chứng cọc 30% VietQR & Hợp đồng điện tử
    private DepositPaymentInfo depositPayment;
    private ElectronicContractInfo contract;

    // 6. Biên bản bàn giao nhận xe lúc ban đầu
    private CheckInInspectionInfo checkInInspection;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RenterInfo {
        private Long renterId;
        private String fullName;
        private String phone;
        private String email;
        private String idCardNumber;
        private String idCardFrontUrl;
        private String idCardBackUrl;
        private String licenseNumber;
        private String licenseFullName;
        private String licenseFrontUrl;
        private String licenseBackUrl;
        private String address;
        private String userStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarInfo {
        private Long carId;
        private String plateNumber;
        private String brand;
        private String model;
        private Integer year;
        private String color;
        private Integer seats;
        private String chassisNumber;
        private String address;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnerInfo {
        private Long ownerId;
        private String fullName;
        private String phone;
        private String email;
        private String idCardNumber;
        private String idCardFrontUrl;
        private String idCardBackUrl;
        private String bankName;
        private String bankAccountNumber;
        private String address;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepositPaymentInfo {
        private Long paymentId;
        private BigDecimal amount;
        private String paymentMethod;
        private String status;
        private String transactionCode;
        private String qrCodeUrl;
        private Instant paidAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ElectronicContractInfo {
        private String contractCode;
        private String termsAndConditions;
        private String criminalLiabilityNotice;
        private Instant signedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckInInspectionInfo {
        private Long inspectionId;
        private Integer odoMeter;
        private Integer fuelLevel;
        private String notes;
        private List<String> images;
        private Instant checkedInAt;
        private String performedByName;
    }
}
