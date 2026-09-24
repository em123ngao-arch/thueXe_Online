package com.driveshare.modules.payment;

import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.payment.dto.request.CreatePaymentRequest;
import com.driveshare.modules.payment.dto.response.OwnerEarningsResponse;
import com.driveshare.modules.payment.dto.response.PaymentResponse;
import com.driveshare.modules.payment.entity.Payment;
import com.driveshare.modules.payment.repository.PaymentRepository;
import com.driveshare.modules.payment.service.impl.PaymentServiceImpl;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Rental sampleRental;
    private Car sampleCar;
    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        sampleCar = Car.builder()
                .carId(1L)
                .ownerId(2L)
                .brand("VinFast")
                .model("VF8")
                .plateNumber("51K-999.88")
                .pricePerDay(new BigDecimal("1200000"))
                .build();

        sampleRental = Rental.builder()
                .rentalId(10L)
                .carId(1L)
                .renterId(4L)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .totalDays(2)
                .pricePerDay(new BigDecimal("1200000"))
                .totalPrice(new BigDecimal("2400000"))
                .depositAmount(new BigDecimal("720000")) // 30%
                .status(ERentalStatus.APPROVED)
                .build();

        samplePayment = Payment.builder()
                .paymentId(100L)
                .rentalId(10L)
                .amount(new BigDecimal("720000"))
                .paymentType("DEPOSIT")
                .paymentMethod(EPaymentMethod.VIETQR)
                .status(EPaymentStatus.PENDING)
                .transactionCode("DSPAY10_123456")
                .qrCodeUrl("https://img.vietqr.io/image/MB-090123456789-compact2.png")
                .build();
    }

    // =========================================================================
    // CRP-51: Renter Pay for Approved Booking
    // =========================================================================

    @Test
    @DisplayName("CRP-51: Tạo giao dịch thanh toán đặt cọc 30% thành công khi đơn đã APPROVED")
    void createDepositPayment_Success() {
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));
        when(paymentRepository.findByRentalId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setPaymentId(100L);
            return p;
        });
        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(sampleCar));

        PaymentResponse response = paymentService.createDepositPayment(10L, null, 4L);

        assertNotNull(response);
        assertEquals(100L, response.getPaymentId());
        assertEquals(10L, response.getRentalId());
        assertEquals(new BigDecimal("720000"), response.getDepositAmount());
        assertEquals(EPaymentStatus.PENDING, response.getStatus());
        assertNotNull(response.getQrCodeUrl());
        assertTrue(response.getQrCodeUrl().contains("img.vietqr.io"));

        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    @DisplayName("CRP-51: Ném lỗi RENTAL_NOT_APPROVED khi đơn chưa được duyệt (status=PENDING)")
    void createDepositPayment_RentalNotApproved_ThrowsException() {
        sampleRental.setStatus(ERentalStatus.PENDING);
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));

        AppException exception = assertThrows(AppException.class, () ->
                paymentService.createDepositPayment(10L, null, 4L));

        assertEquals(ErrorCode.RENTAL_NOT_APPROVED, exception.getErrorCode());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("CRP-51: Ném lỗi RENTAL_NOT_FOUND khi đơn thuê không tồn tại")
    void createDepositPayment_RentalNotFound_ThrowsException() {
        when(rentalRepository.findById(999L)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () ->
                paymentService.createDepositPayment(999L, null, 4L));

        assertEquals(ErrorCode.RENTAL_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("CRP-51: Ném lỗi UNAUTHORIZED khi người dùng khác cố thanh toán đơn thuê")
    void createDepositPayment_OtherUser_ThrowsUnauthorized() {
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));

        AppException exception = assertThrows(AppException.class, () ->
                paymentService.createDepositPayment(10L, null, 99L));

        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
    }

    @Test
    @DisplayName("CRP-51: Trả về giao dịch PENDING hiện tại nếu đã được tạo trước đó")
    void createDepositPayment_ExistingPending_ReturnsExisting() {
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));
        when(paymentRepository.findByRentalId(10L)).thenReturn(Optional.of(samplePayment));
        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(sampleCar));

        PaymentResponse response = paymentService.createDepositPayment(10L, null, 4L);

        assertNotNull(response);
        assertEquals(100L, response.getPaymentId());
        assertEquals(EPaymentStatus.PENDING, response.getStatus());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("CRP-51: Ném lỗi PAYMENT_ALREADY_COMPLETED khi giao dịch đã hoàn tất trước đó")
    void createDepositPayment_AlreadyCompleted_ThrowsException() {
        samplePayment.setStatus(EPaymentStatus.SUCCESS);
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));
        when(paymentRepository.findByRentalId(10L)).thenReturn(Optional.of(samplePayment));

        AppException exception = assertThrows(AppException.class, () ->
                paymentService.createDepositPayment(10L, null, 4L));

        assertEquals(ErrorCode.PAYMENT_ALREADY_COMPLETED, exception.getErrorCode());
    }

    // =========================================================================
    // CRP-52 & CRP-53: Handle Payment Result States & Booking Lifecycle
    // =========================================================================

    @Test
    @DisplayName("CRP-52 & CRP-53: Xác nhận cọc thành công -> Payment sang SUCCESS và Rental sang CONFIRMED")
    void confirmPayment_Success() {
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(sampleCar));

        PaymentResponse response = paymentService.confirmPayment(100L, 4L);

        assertNotNull(response);
        assertEquals(EPaymentStatus.SUCCESS, response.getStatus());
        assertEquals(EPaymentStatus.SUCCESS, response.getPaymentStatus());
        assertEquals(ERentalStatus.CONFIRMED, response.getRentalStatus());
        assertNotNull(response.getPaidAt());

        // Kiểm tra đơn thuê đã được chuyển sang CONFIRMED
        assertEquals(ERentalStatus.CONFIRMED, sampleRental.getStatus());
        verify(rentalRepository).save(sampleRental);
        verify(paymentRepository).save(samplePayment);
    }

    @Test
    @DisplayName("CRP-52: Đánh dấu thất bại -> Payment chuyển sang FAILED")
    void failPayment_Success() {
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));

        PaymentResponse response = paymentService.failPayment(100L, 4L, "Giao dịch bị từ chối");

        assertNotNull(response);
        assertEquals(EPaymentStatus.FAILED, response.getStatus());
        verify(paymentRepository).save(samplePayment);
    }

    @Test
    @DisplayName("CRP-52: Hủy thanh toán -> Payment chuyển sang CANCELLED")
    void cancelPayment_Success() {
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));

        PaymentResponse response = paymentService.cancelPayment(100L, 4L, "Khách hủy");

        assertNotNull(response);
        assertEquals(EPaymentStatus.CANCELLED, response.getStatus());
        verify(paymentRepository).save(samplePayment);
    }

    // =========================================================================
    // CRP-54: Owner View Earnings and Payment History
    // =========================================================================

    @Test
    @DisplayName("CRP-54: Chủ xe xem thống kê tổng doanh thu và danh sách giao dịch")
    void getOwnerEarnings_Success() {
        Long ownerId = 2L;
        when(carRepository.findByOwnerIdAndDeletedAtIsNull(eq(ownerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleCar)));
        when(rentalRepository.findByCarIdInOrderByCreatedAtDesc(List.of(1L)))
                .thenReturn(List.of(sampleRental));

        when(paymentRepository.sumEarningsByRentalIds(List.of(10L), EPaymentStatus.SUCCESS))
                .thenReturn(new BigDecimal("1500000"));
        when(paymentRepository.sumEarningsByRentalIds(List.of(10L), EPaymentStatus.PENDING))
                .thenReturn(new BigDecimal("720000"));

        samplePayment.setStatus(EPaymentStatus.SUCCESS);
        samplePayment.setPaidAt(Instant.now());
        when(paymentRepository.findByRentalIdInOrderByCreatedAtDesc(List.of(10L)))
                .thenReturn(List.of(samplePayment));

        User sampleRenter = User.builder()
                .userId(4L)
                .fullName("Lê Hoàng Nam")
                .phone("0988 776 655")
                .email("renter.nam@gmail.com")
                .build();
        when(userRepository.findAllById(List.of(4L))).thenReturn(List.of(sampleRenter));

        OwnerEarningsResponse earnings = paymentService.getOwnerEarnings(ownerId);

        assertNotNull(earnings);
        assertEquals(ownerId, earnings.getOwnerId());
        assertEquals(new BigDecimal("1500000"), earnings.getTotalEarnings());
        assertEquals(new BigDecimal("720000"), earnings.getPendingEarnings());
        assertEquals(1, earnings.getTotalTransactions());
        assertFalse(earnings.getTransactions().isEmpty());
        assertEquals("VinFast", earnings.getTransactions().get(0).getCarBrand());
        assertEquals("Lê Hoàng Nam", earnings.getTransactions().get(0).getRenterName());
    }
}
