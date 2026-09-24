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
}
