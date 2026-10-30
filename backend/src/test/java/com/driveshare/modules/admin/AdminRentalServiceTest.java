package com.driveshare.modules.admin;

import com.driveshare.common.enums.EDocumentType;
import com.driveshare.common.enums.EInspectionType;
import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.admin.dto.response.OverdueRentalResponse;
import com.driveshare.modules.admin.dto.response.ViolationDossierResponse;
import com.driveshare.modules.admin.service.impl.AdminRentalServiceImpl;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.payment.entity.Payment;
import com.driveshare.modules.payment.repository.PaymentRepository;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalInspection;
import com.driveshare.modules.rental.repository.RentalInspectionRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.user.adapter.out.persistence.OwnerProfile;
import com.driveshare.modules.user.adapter.out.persistence.RenterProfile;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRentalServiceTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RenterProfileRepository renterProfileRepository;

    @Mock
    private OwnerProfileRepository ownerProfileRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RentalInspectionRepository rentalInspectionRepository;

    @InjectMocks
    private AdminRentalServiceImpl adminRentalService;

    private Rental sampleRental;
    private Car sampleCar;
    private User sampleRenter;
    private RenterProfile sampleRenterProfile;
    private User sampleOwner;
    private OwnerProfile sampleOwnerProfile;
    private Payment samplePayment;
    private RentalInspection sampleCheckIn;

    @BeforeEach
    void setUp() {
        sampleCar = Car.builder()
                .carId(10L)
                .ownerId(20L)
                .brand("VinFast")
                .model("VF8")
                .plateNumber("51K-999.88")
                .year(2023)
                .color("Đỏ")
                .seats(5)
                .pricePerDay(BigDecimal.valueOf(1_200_000))
                .address("Hồ Chí Minh")
                .build();

        sampleRenter = User.builder()
                .userId(100L)
                .username("renter_01")
                .fullName("Nguyễn Văn A")
                .phone("0901234567")
                .email("renter01@example.com")
                .idCardNumber("079201009999")
                .status(EUserStatus.ACTIVE)
                .address("Quận 1, TP.HCM")
                .build();

        sampleRenterProfile = RenterProfile.builder()
                .userId(100L)
                .licenseNumber("B2-998877")
                .licenseFullName("NGUYEN VAN A")
                .licenseFrontUrl("https://img.driveshare.vn/gplx_front.jpg")
                .licenseBackUrl("https://img.driveshare.vn/gplx_back.jpg")
                .idCardFrontUrl("https://img.driveshare.vn/cccd_front.jpg")
                .idCardBackUrl("https://img.driveshare.vn/cccd_back.jpg")
                .verificationStatus(EVerificationStatus.VERIFIED)
                .build();

        sampleOwner = User.builder()
                .userId(20L)
                .username("owner_01")
                .fullName("Trần Thị Chủ Xe")
                .phone("0988776655")
                .email("owner01@example.com")
                .idCardNumber("079201008888")
                .status(EUserStatus.ACTIVE)
                .address("TP. Thủ Đức, TP.HCM")
                .build();

        sampleOwnerProfile = OwnerProfile.builder()
                .userId(20L)
                .bankName("Vietcombank")
                .bankAccountNumber("99887766554433")
                .idCardFrontUrl("https://img.driveshare.vn/owner_cccd_front.jpg")
                .idCardBackUrl("https://img.driveshare.vn/owner_cccd_back.jpg")
                .verificationStatus(EVerificationStatus.VERIFIED)
                .build();

        sampleRental = Rental.builder()
                .rentalId(1L)
                .carId(10L)
                .renterId(100L)
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().minusDays(2))
                .totalDays(3)
                .pricePerDay(BigDecimal.valueOf(1_200_000))
                .totalPrice(BigDecimal.valueOf(3_600_000))
                .depositAmount(BigDecimal.valueOf(1_080_000))
                .status(ERentalStatus.OVERDUE)
                .overdueHours(48)
                .penaltyFee(BigDecimal.valueOf(3_600_000))
                .isBlacklistedTriggered(true)
                .build();

        samplePayment = Payment.builder()
                .paymentId(50L)
                .rentalId(1L)
                .amount(BigDecimal.valueOf(1_080_000))
                .paymentMethod(EPaymentMethod.VIETQR)
                .status(EPaymentStatus.SUCCESS)
                .transactionCode("VQR-TX-998811")
                .qrCodeUrl("https://vietqr.net/qr-code-sample.png")
                .paidAt(Instant.now().minusSeconds(86400 * 5))
                .build();

        sampleCheckIn = RentalInspection.builder()
                .inspectionId(30L)
                .rentalId(1L)
                .inspectionType(EInspectionType.CHECK_IN)
                .odoMeter(15200)
                .fuelLevel(90)
                .notes("Xe sạch, không trầy xước, đầy đủ giấy tờ")
                .images("https://img.driveshare.vn/checkin1.jpg,https://img.driveshare.vn/checkin2.jpg")
                .performedBy(20L)
                .performer(sampleOwner)
                .createdAt(Instant.now().minusSeconds(86400 * 5))
                .build();
    }

    @Test
    @DisplayName("Admin lấy danh sách đơn quá hạn -> Trả về đầy đủ thông tin xe, khách, số giờ trễ và tiền phạt")
    void getOverdueRentals_Success() {
        when(rentalRepository.findByStatusOrderByCreatedAtDesc(ERentalStatus.OVERDUE))
                .thenReturn(List.of(sampleRental));
        when(carRepository.findById(10L)).thenReturn(Optional.of(sampleCar));
        when(userRepository.findById(100L)).thenReturn(Optional.of(sampleRenter));
        when(userRepository.findById(20L)).thenReturn(Optional.of(sampleOwner));

        List<OverdueRentalResponse> result = adminRentalService.getOverdueRentals();

        assertThat(result).hasSize(1);
        OverdueRentalResponse item = result.get(0);
        assertThat(item.getRentalId()).isEqualTo(1L);
        assertThat(item.getCarPlate()).isEqualTo("51K-999.88");
        assertThat(item.getCarName()).isEqualTo("VinFast VF8");
        assertThat(item.getRenterName()).isEqualTo("Nguyễn Văn A");
        assertThat(item.getRenterPhone()).isEqualTo("0901234567");
        assertThat(item.getRenterIdCard()).isEqualTo("079201009999");
        assertThat(item.getOwnerName()).isEqualTo("Trần Thị Chủ Xe");
        assertThat(item.getOverdueHours()).isEqualTo(48);
        assertThat(item.getPenaltyFee()).isEqualByComparingTo(BigDecimal.valueOf(3_600_000));
        assertThat(item.getStatus()).isEqualTo(ERentalStatus.OVERDUE);
        assertThat(item.getIsBlacklistedTriggered()).isTrue();
    }

    @Test
    @DisplayName("TC-Q02: Admin gọi GET /api/v1/admin/rentals/1/dossier -> Trả về đầy đủ CCCD, GPLX, Hợp đồng, Cọc")
    void getViolationDossier_Success_TC_Q02() {
        when(rentalRepository.findById(1L)).thenReturn(Optional.of(sampleRental));
        when(carRepository.findById(10L)).thenReturn(Optional.of(sampleCar));
        when(userRepository.findById(100L)).thenReturn(Optional.of(sampleRenter));
        when(renterProfileRepository.findById(100L)).thenReturn(Optional.of(sampleRenterProfile));
        when(userRepository.findById(20L)).thenReturn(Optional.of(sampleOwner));
        when(ownerProfileRepository.findById(20L)).thenReturn(Optional.of(sampleOwnerProfile));
        when(paymentRepository.findByRentalId(1L)).thenReturn(Optional.of(samplePayment));
        when(rentalInspectionRepository.findByRentalIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(sampleCheckIn));

        ViolationDossierResponse dossier = adminRentalService.getViolationDossier(1L);

        assertThat(dossier).isNotNull();
        assertThat(dossier.getDossierCode()).isEqualTo("HSPL-RENTAL-1");
        assertThat(dossier.getLegalNotice()).contains("Điều 175 Bộ luật Hình sự");

        // 1. Kiểm tra thông tin khách thuê vi phạm (CCCD + GPLX)
        assertThat(dossier.getRenter()).isNotNull();
        assertThat(dossier.getRenter().getFullName()).isEqualTo("Nguyễn Văn A");
        assertThat(dossier.getRenter().getIdCardNumber()).isEqualTo("079201009999");
        assertThat(dossier.getRenter().getIdCardFrontUrl()).isEqualTo("https://img.driveshare.vn/cccd_front.jpg");
        assertThat(dossier.getRenter().getIdCardBackUrl()).isEqualTo("https://img.driveshare.vn/cccd_back.jpg");
        assertThat(dossier.getRenter().getLicenseNumber()).isEqualTo("B2-998877");
        assertThat(dossier.getRenter().getLicenseFrontUrl()).isEqualTo("https://img.driveshare.vn/gplx_front.jpg");
        assertThat(dossier.getRenter().getLicenseBackUrl()).isEqualTo("https://img.driveshare.vn/gplx_back.jpg");

        // 2. Kiểm tra thông tin xe & chủ xe
        assertThat(dossier.getCar()).isNotNull();
        assertThat(dossier.getCar().getPlateNumber()).isEqualTo("51K-999.88");
        assertThat(dossier.getCar().getBrand()).isEqualTo("VinFast");
        assertThat(dossier.getCar().getChassisNumber()).contains("51K99988");

        assertThat(dossier.getOwner()).isNotNull();
        assertThat(dossier.getOwner().getFullName()).isEqualTo("Trần Thị Chủ Xe");
        assertThat(dossier.getOwner().getBankName()).isEqualTo("Vietcombank");
        assertThat(dossier.getOwner().getBankAccountNumber()).isEqualTo("99887766554433");

        // 3. Kiểm tra bằng chứng cọc VietQR 30%
        assertThat(dossier.getDepositPayment()).isNotNull();
        assertThat(dossier.getDepositPayment().getAmount()).isEqualByComparingTo(BigDecimal.valueOf(1_080_000));
        assertThat(dossier.getDepositPayment().getPaymentMethod()).isEqualTo("VIETQR");
        assertThat(dossier.getDepositPayment().getTransactionCode()).isEqualTo("VQR-TX-998811");
        assertThat(dossier.getDepositPayment().getStatus()).isEqualTo("SUCCESS");

        // 4. Kiểm tra hợp đồng điện tử & cảnh báo Điều 175 BLHS
        assertThat(dossier.getContract()).isNotNull();
        assertThat(dossier.getContract().getContractCode()).contains("HDDT-1");
        assertThat(dossier.getContract().getCriminalLiabilityNotice()).contains("Điều 175 Bộ luật Hình sự");

        // 5. Kiểm tra biên bản bàn giao nhận xe (Check-in ODO + Ảnh)
        assertThat(dossier.getCheckInInspection()).isNotNull();
        assertThat(dossier.getCheckInInspection().getOdoMeter()).isEqualTo(15200);
        assertThat(dossier.getCheckInInspection().getImages()).containsExactly(
                "https://img.driveshare.vn/checkin1.jpg",
                "https://img.driveshare.vn/checkin2.jpg"
        );
        assertThat(dossier.getCheckInInspection().getPerformedByName()).isEqualTo("Trần Thị Chủ Xe");
    }

    @Test
    @DisplayName("Admin gọi xuất dossier cho đơn không tồn tại -> Báo lỗi RENTAL_NOT_FOUND")
    void getViolationDossier_RentalNotFound_ThrowsAppException() {
        when(rentalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminRentalService.getViolationDossier(999L))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.RENTAL_NOT_FOUND));
    }
}
