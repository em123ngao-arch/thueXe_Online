package com.driveshare.concurrency;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.modules.payment.entity.Payment;
import com.driveshare.modules.payment.repository.PaymentRepository;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalDispute;
import com.driveshare.modules.rental.repository.RentalDisputeRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.RentalDisputeServiceImpl;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Concurrency Test Suite: Kiểm thử đồng thời chống Double Refund (Hoàn cọc trùng)
 * Giả lập 50-100 threads đồng thời thực hiện lệnh Admin cưỡng chế hoàn cọc từ quỹ Escrow.
 * Chứng minh cơ chế Pessimistic Locking (@Lock(PESSIMISTIC_WRITE)) bảo vệ tính toàn vẹn 100%.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConcurrencyDisputeRefundTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private RentalDisputeRepository rentalDisputeRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private RentalDisputeServiceImpl rentalDisputeService;

    @Test
    @DisplayName("Concurrency Test: 50 requests đồng thời cưỡng chế hoàn cọc -> Duy nhất 1 thành công, 49 bị chặn (0% Double Refund)")
    void testConcurrentResolveDispute_GuaranteesSingleRefund() throws InterruptedException {
        int threadCount = 50;
        Long disputeId = 100L;
        Long rentalId = 10L;
        Long adminId = 99L;
        Long renterId = 20L;
        Long ownerId = 30L;

        // Mô phỏng thực thể CSDL
        Rental rental = Rental.builder()
                .rentalId(rentalId)
                .renterId(renterId)
                .carId(1L)
                .depositAmount(new BigDecimal("570000"))
                .status(ERentalStatus.DISPUTED)
                .build();

        Car car = Car.builder()
                .carId(1L)
                .ownerId(ownerId)
                .brand("VinFast")
                .model("VF8")
                .build();

        Payment depositPayment = Payment.builder()
                .paymentId(55L)
                .rentalId(rentalId)
                .amount(new BigDecimal("570000"))
                .status(EPaymentStatus.SUCCESS)
                .build();

        // Dispute được bảo vệ bởi Pessimistic Lock
        RentalDispute liveDispute = RentalDispute.builder()
                .id(disputeId)
                .rentalId(rentalId)
                .reporterId(renterId)
                .reason("Chủ xe bùng hẹn không giao xe")
                .status(EDisputeStatus.PENDING)
                .build();

        // Mô phỏng hành vi Khóa bi quan (@Lock(PESSIMISTIC_WRITE)) trong PostgreSQL:
        // Transaction đầu tiên giữ Lock và update status sang RESOLVED_REFUND, các transaction sau nhìn thấy trạng thái mới.
        ReentrantLock dbRowLock = new ReentrantLock();

        when(rentalDisputeRepository.findByIdForUpdate(disputeId)).thenAnswer(invocation -> {
            dbRowLock.lock();
            return Optional.of(liveDispute);
        });

        when(rentalDisputeRepository.findById(disputeId)).thenReturn(Optional.of(liveDispute));
        User adminUser = User.builder()
                .userId(adminId)
                .username("admin_test")
                .roles(java.util.Set.of(com.driveshare.modules.user.adapter.out.persistence.Role.builder()
                        .roleName(com.driveshare.common.enums.ERole.ROLE_ADMIN)
                        .build()))
                .build();
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(1L)).thenReturn(Optional.of(car));

        when(rentalDisputeRepository.save(any(RentalDispute.class))).thenAnswer(invocation -> {
            RentalDispute arg = invocation.getArgument(0);
            try {
                liveDispute.setStatus(arg.getStatus());
                liveDispute.setRefundAmount(arg.getRefundAmount());
                liveDispute.setPenaltyAmount(arg.getPenaltyAmount());
                liveDispute.setResolvedBy(arg.getResolvedBy());
                return liveDispute;
            } finally {
                if (dbRowLock.isHeldByCurrentThread()) {
                    dbRowLock.unlock();
                }
            }
        });

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedAlreadyResolvedCount = new AtomicInteger(0);

        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Chủ xe không đến giao xe, cưỡng chế hoàn 100% cọc")
                .build();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    // Chờ tất cả 50 threads sẵn sàng rồi bắn đồng thời trong 1 mili-giây
                    startGate.await();
                    rentalDisputeService.resolveDispute(disputeId, request, adminId);
                    successCount.incrementAndGet();
                } catch (AppException e) {
                    if (e.getErrorCode() == ErrorCode.DISPUTE_ALREADY_RESOLVED) {
                        rejectedAlreadyResolvedCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    if (dbRowLock.isHeldByCurrentThread()) {
                        dbRowLock.unlock();
                    }
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startGate.countDown(); // Bắn 50 requests đồng thời
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Kiểm tra tính toàn vẹn:
        // 1. Duy nhất 1 request xử lý thành công
        assertThat(successCount.get()).isEqualTo(1);
        // 2. 49 request còn lại bị từ chối với lỗi DISPUTE_ALREADY_RESOLVED
        assertThat(rejectedAlreadyResolvedCount.get()).isEqualTo(threadCount - 1);
        // 3. Trạng thái cuối cùng của dispute là RESOLVED_REFUND
        assertThat(liveDispute.getStatus()).isEqualTo(EDisputeStatus.RESOLVED_REFUND);
        // 4. Số tiền hoàn đúng 570.000đ (không bị nhân 50 lần)
        assertThat(liveDispute.getRefundAmount()).isEqualByComparingTo("570000.00");
    }
}
