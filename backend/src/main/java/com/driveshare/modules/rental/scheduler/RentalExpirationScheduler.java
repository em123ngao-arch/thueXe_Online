package com.driveshare.modules.rental.scheduler;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * CRP-43: Quét định kỳ các đơn PENDING tạo quá 60 phút không được chủ xe xử lý
 * để tự động chuyển sang trạng thái EXPIRED.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RentalExpirationScheduler {

    private final RentalRepository rentalRepository;

    private static final long EXPIRATION_MINUTES = 60;

    @Scheduled(cron = "${app.rental.expire-cron:0 */5 * * * *}")
    @Transactional
    public void autoExpirePendingRentals() {
        Instant threshold = Instant.now().minus(EXPIRATION_MINUTES, ChronoUnit.MINUTES);
        List<Rental> expiredList = rentalRepository.findExpiredPendingRentals(ERentalStatus.PENDING, threshold);

        if (!expiredList.isEmpty()) {
            for (Rental rental : expiredList) {
                rental.setStatus(ERentalStatus.EXPIRED);
                rental.setRejectReason("Yêu cầu thuê tự động hết hạn do không được phản hồi sau 60 phút");
            }
            rentalRepository.saveAll(expiredList);
            log.info("CRP-43: Đã tự động chuyển {} đơn PENDING quá hạn sang EXPIRED", expiredList.size());
        }
    }

    /**
     * Giai đoạn 3 & 4 (mục 11.4 của đặc tả v2.0.0):
     * Quét các đơn WAITING_PAYMENT đã quá hạn paymentExpiresAt (45 phút) nhưng khách chưa cọc.
     * Chuyển sang EXPIRED (giải phóng Soft Lock), và mở lại các đơn ON_HOLD trùng lịch sang PENDING_APPROVAL.
     */
    @Scheduled(cron = "${app.rental.expire-softlock-cron:0 * * * * *}")
    @Transactional
    public void autoExpireWaitingPaymentSoftLocks() {
        Instant now = Instant.now();
        List<Rental> expiredList = rentalRepository.findExpiredWaitingPaymentRentals(ERentalStatus.WAITING_PAYMENT, now);

        if (!expiredList.isEmpty()) {
            for (Rental rental : expiredList) {
                rental.setStatus(ERentalStatus.EXPIRED);
                rental.setRejectReason("Đã quá thời hạn 45 phút giữ chỗ nhưng khách hàng không hoàn tất đặt cọc");

                // Mở lại các đơn ON_HOLD trùng lịch
                List<Rental> onHoldRentals = rentalRepository.findCompetingRentals(
                        rental.getCarId(),
                        rental.getStartDate(),
                        rental.getEndDate(),
                        rental.getRentalId(),
                        List.of(ERentalStatus.ON_HOLD)
                );
                for (Rental onHold : onHoldRentals) {
                    onHold.setStatus(ERentalStatus.PENDING_APPROVAL);
                    onHold.setRejectReason(null);
                }
                if (!onHoldRentals.isEmpty()) {
                    rentalRepository.saveAll(onHoldRentals);
                }
            }
            rentalRepository.saveAll(expiredList);
            log.info("Giai đoạn 3: Đã giải phóng Soft Lock cho {} đơn WAITING_PAYMENT quá hạn và phục hồi các đơn ON_HOLD", expiredList.size());
        }
    }
}
