package com.driveshare.modules.rental;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.enums.ERole;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.common.service.CloudinaryService;
import com.driveshare.modules.car.adapter.out.persistence.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.modules.payment.adapter.out.persistence.Payment;
import com.driveshare.modules.payment.repository.PaymentRepository;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalDispute;
import com.driveshare.modules.rental.repository.RentalDisputeRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.RentalDisputeServiceImpl;
import com.driveshare.modules.user.adapter.out.persistence.Role;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RentalDisputeServiceTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private RentalDisputeRepository rentalDisputeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private RentalDisputeServiceImpl rentalDisputeService;

    private final Long renterId = 100L;
    private final Long otherUserId = 999L;
    private final Long ownerId = 200L;
    private final Long adminId = 1L;
    private final Long carId = 5L;
    private final Long rentalId = 10L;
    private final Long disputeId = 50L;

    private Rental rental;
    private Car car;
    private User renter;
    private Payment payment;

    @BeforeEach
    void setUp() {
        car = Car.builder()
                .carId(carId)
                .ownerId(ownerId)
                .brand("VinFast")
                .model("VF8")
                .plateNumber("51K-999.88")
                .build();

        renter = User.builder()
                .userId(renterId)
                .username("renter01")
                .fullName("Nguyen Van Renter")
                .phone("0988776655")
                .build();

        rental = Rental.builder()
                .rentalId(rentalId)
                .carId(carId)
                .renterId(renterId)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .totalDays(2)
                .pricePerDay(new BigDecimal("1000000"))
                .totalPrice(new BigDecimal("2000000"))
                .depositAmount(new BigDecimal("600000"))
                .status(ERentalStatus.CONFIRMED)
                .build();

        payment = Payment.builder()
                .paymentId(101L)
                .rentalId(rentalId)
                .amount(new BigDecimal("600000"))
                .status(EPaymentStatus.SUCCESS)
                .build();

        com.driveshare.modules.user.adapter.out.persistence.Role adminRole = com.driveshare.modules.user.adapter.out.persistence.Role.builder()
                .roleId(1L)
                .roleName(com.driveshare.common.enums.ERole.ROLE_ADMIN)
                .build();
        User adminUser = User.builder()
                .userId(adminId)
                .username("admin01")
                .fullName("System Administrator")
                .roles(java.util.Set.of(adminRole))
                .build();
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
    }

    // =========================================================================
    // 1. Kiểm thử Báo sự cố không nhận xe (reportNoShow)
    // =========================================================================

    @Test
    @DisplayName("Ca 1: Khách thuê hợp lệ báo sự cố -> Thành công, chuyển rental sang DISPUTED")
    void reportNoShow_Success() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(rentalDisputeRepository.existsByRentalIdAndStatus(rentalId, EDisputeStatus.PENDING)).thenReturn(false);
        when(cloudinaryService.uploadMedia(any(), any())).thenReturn("https://cloudinary.com/proof1.jpg");

        RentalDispute savedDispute = RentalDispute.builder()
                .id(disputeId)
                .rentalId(rentalId)
                .reporterId(renterId)
                .reason("Chủ xe tắt máy, đứng đợi 30 phút không thấy ai tới")
                .proofUrls("https://cloudinary.com/proof1.jpg")
                .status(EDisputeStatus.PENDING)
                .refundAmount(BigDecimal.ZERO)
                .penaltyAmount(BigDecimal.ZERO)
                .build();

        when(rentalDisputeRepository.save(any(RentalDispute.class))).thenReturn(savedDispute);
        when(userRepository.findById(renterId)).thenReturn(Optional.of(renter));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        MockMultipartFile file = new MockMultipartFile(
                "evidenceFiles", "proof.jpg", "image/jpeg", "image_bytes".getBytes()
        );

        RentalDisputeResponse response = rentalDisputeService.reportNoShow(
                rentalId,
                "Chủ xe tắt máy, đứng đợi 30 phút không thấy ai tới",
                List.of(file),
                renterId
        );

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(disputeId);
        assertThat(response.getStatus()).isEqualTo(EDisputeStatus.PENDING);
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.DISPUTED);
        verify(rentalRepository).save(rental);
        verify(rentalDisputeRepository).save(any(RentalDispute.class));
    }

    @Test
    @DisplayName("Ca 2: Người khác không thuộc booking gửi khiếu nại -> Ném lỗi 403 DISPUTE_ACCESS_DENIED")
    void reportNoShow_NotRentalOwner_ThrowsException() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));

        assertThatThrownBy(() -> rentalDisputeService.reportNoShow(
                rentalId,
                "Lý do khiếu nại dài hơn 10 ký tự...",
                null,
                otherUserId
        )).isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DISPUTE_ACCESS_DENIED);

        verify(rentalRepository, never()).save(any());
        verify(rentalDisputeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ca 3: Booking không tồn tại -> Ném lỗi 404 RENTAL_NOT_FOUND")
    void reportNoShow_RentalNotFound_ThrowsException() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rentalDisputeService.reportNoShow(
                rentalId,
                "Lý do khiếu nại dài hơn 10 ký tự...",
                null,
                renterId
        )).isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RENTAL_NOT_FOUND);
    }

    @Test
    @DisplayName("Ca 4: Booking sai trạng thái (PENDING / COMPLETED) -> Ném lỗi 400 RENTAL_NOT_ELIGIBLE_FOR_DISPUTE")
    void reportNoShow_InvalidRentalStatus_ThrowsException() {
        rental.setStatus(ERentalStatus.PENDING);
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));

        assertThatThrownBy(() -> rentalDisputeService.reportNoShow(
                rentalId,
                "Lý do khiếu nại dài hơn 10 ký tự...",
                null,
                renterId
        )).isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RENTAL_NOT_ELIGIBLE_FOR_DISPUTE);
    }

    @Test
    @DisplayName("Ca 5: Booking đã có khiếu nại đang PENDING -> Ném lỗi 409 DISPUTE_ALREADY_EXISTS")
    void reportNoShow_AlreadyDisputed_ThrowsException() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(rentalDisputeRepository.existsByRentalIdAndStatus(rentalId, EDisputeStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> rentalDisputeService.reportNoShow(
                rentalId,
                "Lý do khiếu nại dài hơn 10 ký tự...",
                null,
                renterId
        )).isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DISPUTE_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("Ca 6: Lý do khiếu nại quá ngắn dưới 10 ký tự -> Ném lỗi 400 INVALID_REQUEST")
    void reportNoShow_ReasonTooShort_ThrowsException() {
        assertThatThrownBy(() -> rentalDisputeService.reportNoShow(
                rentalId,
                "Quá ngắn",
                null,
                renterId
        )).isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REQUEST);
    }

    // =========================================================================
    // 2. Kiểm thử Admin giải quyết khiếu nại (resolveDispute)
    // =========================================================================

    @Test
    @DisplayName("Ca 7: Admin resolve hợp lệ action REFUND_RENTER -> Hoàn 100% cọc, phạt chủ xe, rental sang CANCELLED_BY_HOST")
    void resolveDispute_RefundRenter_Success() {
        RentalDispute dispute = RentalDispute.builder()
                .id(disputeId)
                .rentalId(rentalId)
                .reporterId(renterId)
                .reason("Chủ xe bùng kèo")
                .status(EDisputeStatus.PENDING)
                .build();

        when(rentalDisputeRepository.findByIdForUpdate(disputeId)).thenReturn(Optional.of(dispute));
        when(rentalDisputeRepository.findById(disputeId)).thenReturn(Optional.of(dispute));
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(paymentRepository.findByRentalId(rentalId)).thenReturn(Optional.of(payment));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalDisputeRepository.save(any(RentalDispute.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Xác nhận clip tại hiện trường, chủ xe không liên lạc được.")
                .penaltyAmount(new BigDecimal("600000"))
                .build();

        RentalDisputeResponse response = rentalDisputeService.resolveDispute(disputeId, request, adminId);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(EDisputeStatus.RESOLVED_REFUND);
        assertThat(response.getRefundAmount()).isEqualByComparingTo("600000");
        assertThat(response.getPenaltyAmount()).isEqualByComparingTo("600000");
        assertThat(response.getResolvedBy()).isEqualTo(adminId);
        assertThat(response.getResolverName()).isEqualTo("System Administrator");
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.CANCELLED_BY_HOST);
        assertThat(payment.getStatus()).isEqualTo(EPaymentStatus.CANCELLED);

        verify(rentalRepository).save(rental);
        verify(paymentRepository).save(payment);
        verify(rentalDisputeRepository).save(dispute);
    }

    @Test
    @DisplayName("Ca 7b: Edge Case 1 - Người không có quyền Admin/Staff giải quyết khiếu nại -> Ném 403 UNAUTHORIZED")
    void resolveDispute_NonAdmin_ThrowsUnauthorized() {
        com.driveshare.modules.user.adapter.out.persistence.Role customerRole = com.driveshare.modules.user.adapter.out.persistence.Role.builder()
                .roleId(2L)
                .roleName(com.driveshare.common.enums.ERole.ROLE_RENTER)
                .build();
        User customerUser = User.builder()
                .userId(otherUserId)
                .username("customer01")
                .fullName("Customer No Admin")
                .roles(java.util.Set.of(customerRole))
                .build();
        when(userRepository.findById(otherUserId)).thenReturn(Optional.of(customerUser));

        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Khách thường thử giải quyết khiếu nại")
                .build();

        assertThatThrownBy(() -> rentalDisputeService.resolveDispute(disputeId, request, otherUserId))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED);

        verify(rentalDisputeRepository, never()).findByIdForUpdate(any());
        verify(rentalRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ca 7c: Caller chưa đăng nhập (adminId == null) giải quyết khiếu nại -> Ném 401 UNAUTHENTICATED")
    void resolveDispute_Unauthenticated_ThrowsUnauthenticated() {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Chưa đăng nhập")
                .build();

        assertThatThrownBy(() -> rentalDisputeService.resolveDispute(disputeId, request, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHENTICATED);
    }

    @Test
    @DisplayName("Ca 8: Admin resolve hợp lệ action REJECT -> Dispute bị từ chối, rental về CONFIRMED")
    void resolveDispute_Reject_Success() {
        RentalDispute dispute = RentalDispute.builder()
                .id(disputeId)
                .rentalId(rentalId)
                .reporterId(renterId)
                .reason("Khiếu nại sai sự thật")
                .status(EDisputeStatus.PENDING)
                .build();

        when(rentalDisputeRepository.findByIdForUpdate(disputeId)).thenReturn(Optional.of(dispute));
        when(rentalDisputeRepository.findById(disputeId)).thenReturn(Optional.of(dispute));
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalDisputeRepository.save(any(RentalDispute.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REJECT")
                .adminNote("Chủ xe đã cung cấp định vị GPS tại điểm hẹn đúng giờ.")
                .build();

        RentalDisputeResponse response = rentalDisputeService.resolveDispute(disputeId, request, adminId);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(EDisputeStatus.REJECTED);
        assertThat(response.getResolvedBy()).isEqualTo(adminId);
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.CONFIRMED);
        verify(rentalRepository).save(rental);
        verify(rentalDisputeRepository).save(dispute);
    }

    @Test
    @DisplayName("Ca 9: Edge Case 2 - Admin resolve cùng 1 dispute đã xử lý -> Ném 400 DISPUTE_ALREADY_RESOLVED (chống hoàn tiền 2 lần)")
    void resolveDispute_AlreadyResolved_ThrowsException() {
        RentalDispute resolvedDispute = RentalDispute.builder()
                .id(disputeId)
                .rentalId(rentalId)
                .reporterId(renterId)
                .status(EDisputeStatus.RESOLVED_REFUND)
                .build();

        when(rentalDisputeRepository.findByIdForUpdate(disputeId)).thenReturn(Optional.of(resolvedDispute));
        when(rentalDisputeRepository.findById(disputeId)).thenReturn(Optional.of(resolvedDispute));

        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Cố tình resolve lại lần nữa")
                .build();

        assertThatThrownBy(() -> rentalDisputeService.resolveDispute(disputeId, request, adminId))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DISPUTE_ALREADY_RESOLVED);

        verify(rentalRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ca 10: Admin resolve với action không hợp lệ -> Ném 400 DISPUTE_INVALID_ACTION")
    void resolveDispute_InvalidAction_ThrowsException() {
        RentalDispute dispute = RentalDispute.builder()
                .id(disputeId)
                .rentalId(rentalId)
                .status(EDisputeStatus.PENDING)
                .build();

        when(rentalDisputeRepository.findByIdForUpdate(disputeId)).thenReturn(Optional.of(dispute));
        when(rentalDisputeRepository.findById(disputeId)).thenReturn(Optional.of(dispute));
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));

        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("INVALID_ACTION")
                .build();

        assertThatThrownBy(() -> rentalDisputeService.resolveDispute(disputeId, request, adminId))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DISPUTE_INVALID_ACTION);
    }

    @Test
    @DisplayName("Ca 11: Dispute không tồn tại -> Ném 404 DISPUTE_NOT_FOUND")
    void resolveDispute_NotFound_ThrowsException() {
        when(rentalDisputeRepository.findById(disputeId)).thenReturn(Optional.empty());

        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .build();

        assertThatThrownBy(() -> rentalDisputeService.resolveDispute(disputeId, request, adminId))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DISPUTE_NOT_FOUND);
    }

    @Test
    @DisplayName("Ca 12: Người lạ không thuộc đơn thuê xem dispute -> Ném lỗi 403 UNAUTHORIZED")
    void getDisputeByRentalId_UnauthorizedUser_ThrowsException() {
        RentalDispute dispute = RentalDispute.builder()
                .id(disputeId)
                .rentalId(rentalId)
                .reporterId(renterId)
                .build();

        when(rentalDisputeRepository.findByRentalIdOrderByCreatedAtDesc(rentalId)).thenReturn(List.of(dispute));
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        User strangeUser = User.builder()
                .userId(otherUserId)
                .roles(Set.of(Role.builder().roleName(ERole.ROLE_RENTER).build()))
                .build();
        when(userRepository.findById(otherUserId)).thenReturn(Optional.of(strangeUser));

        assertThatThrownBy(() -> rentalDisputeService.getDisputeByRentalId(rentalId, otherUserId))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED);
    }
}
