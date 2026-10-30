package com.driveshare.concurrency;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.adapter.out.persistence.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.OwnerRentalServiceImpl;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Concurrency Test Suite: Kiểm thử đồng thời chống Overbooking (Trùng lịch xe)
 * Giả lập 50 threads gửi yêu cầu khóa lịch/duyệt đơn giữ chỗ cho cùng 1 xe tại cùng 1 khoảng thời gian.
 * Chứng minh cơ chế Two-Phase Locking & Soft Lock (hasDateConflict guard) ngăn chặn tuyệt đối đặt trùng xe.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConcurrencyBookingOverlapTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @InjectMocks
    private OwnerRentalServiceImpl ownerRentalService;

    private static final Long OWNER_ID = 200L;
    private static final Long CAR_ID = 1L;

    @BeforeEach
    void setUpSecurity() {
        CustomUserDetails userDetails = new CustomUserDetails(
                OWNER_ID, "owner_test", "owner@test.com", "pass",
                com.driveshare.common.enums.EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Concurrency Test: 50 requests đồng thời duyệt giữ chỗ xe trùng ngày -> Duy nhất 1 đơn thành công (0% Overbooking)")
    void testConcurrentApprove_PreventsOverbooking() throws InterruptedException {
        int threadCount = 50;
        LocalDate startDate = LocalDate.of(2026, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 11, 3);

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .brand("VinFast")
                .model("VF8")
                .build();

        AtomicBoolean isCarLockedInDb = new AtomicBoolean(false);
        ReentrantLock carRowLock = new ReentrantLock();

        when(carRepository.findCarForUpdate(CAR_ID)).thenAnswer(invocation -> {
            carRowLock.lock();
            return Optional.of(car);
        });
        when(carRepository.findById(CAR_ID)).thenReturn(Optional.of(car));

        // 50 rentals khác nhau từ 50 khách cùng gửi yêu cầu thuê xe trong cùng khung ngày
        ConcurrentHashMap<Long, Rental> rentalDatabase = new ConcurrentHashMap<>();
        for (long i = 1; i <= threadCount; i++) {
            rentalDatabase.put(i, Rental.builder()
                    .rentalId(i)
                    .carId(CAR_ID)
                    .renterId(1000L + i)
                    .startDate(startDate)
                    .endDate(endDate)
                    .totalPrice(new BigDecimal("2400000"))
                    .depositAmount(new BigDecimal("720000"))
                    .status(ERentalStatus.PENDING)
                    .car(car)
                    .build());
        }

        when(rentalRepository.findById(any())).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0);
            return Optional.ofNullable(rentalDatabase.get(id));
        });

        // Mô phỏng hasDateConflict(): Khi có lock trên hàng Car, các thread sau sẽ thấy cờ đã bị khóa
        when(rentalRepository.hasDateConflict(eq(CAR_ID), eq(startDate), eq(endDate), any())).thenAnswer(invocation -> {
            return isCarLockedInDb.get();
        });

        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> {
            Rental r = invocation.getArgument(0);
            try {
                if (r.getStatus() == ERentalStatus.WAITING_PAYMENT) {
                    isCarLockedInDb.set(true);
                }
                rentalDatabase.put(r.getRentalId(), r);
                return r;
            } finally {
                if (carRowLock.isHeldByCurrentThread()) {
                    carRowLock.unlock();
                }
            }
        });

        when(rentalRepository.findCompetingRentals(any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictRejectedCount = new AtomicInteger(0);
        ConcurrentLinkedQueue<String> errorLogs = new ConcurrentLinkedQueue<>();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        for (long i = 1; i <= threadCount; i++) {
            final long currentRentalId = i;
            executor.submit(() -> {
                SecurityContextHolder.getContext().setAuthentication(auth);
                readyLatch.countDown();
                try {
                    startGate.await();
                    RentalSummaryResponse res = ownerRentalService.approveRental(currentRentalId);
                    if (res != null && res.getStatus() == ERentalStatus.WAITING_PAYMENT) {
                        successCount.incrementAndGet();
                    } else {
                        errorLogs.add("Rental " + currentRentalId + " returned null or status " + (res != null ? res.getStatus() : "null"));
                    }
                } catch (AppException e) {
                    if (e.getErrorCode() == ErrorCode.CAR_ALREADY_RENTED) {
                        conflictRejectedCount.incrementAndGet();
                    } else {
                        errorLogs.add("AppException on " + currentRentalId + ": " + e.getErrorCode() + " - " + e.getMessage());
                    }
                } catch (Throwable ex) {
                    errorLogs.add("Exception on " + currentRentalId + ": " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
                } finally {
                    if (carRowLock.isHeldByCurrentThread()) {
                        carRowLock.unlock();
                    }
                    doneLatch.countDown();
                    SecurityContextHolder.clearContext();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startGate.countDown(); // Bắn 50 requests đồng thời
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Kiểm tra tính toàn vẹn:
        assertThat(errorLogs).as("Errors during concurrent approve").isEmpty();
        // 1. Duy nhất 1 đơn thuê chốt Soft Lock thành công
        assertThat(successCount.get()).isEqualTo(1);
        // 2. 49 đơn cạnh tranh còn lại bị chặn bởi CAR_ALREADY_RENTED
        assertThat(conflictRejectedCount.get()).isEqualTo(threadCount - 1);
        // 3. Xe được đánh dấu đã có lịch giữ chỗ trong DB
        assertThat(isCarLockedInDb.get()).isTrue();
    }
}
