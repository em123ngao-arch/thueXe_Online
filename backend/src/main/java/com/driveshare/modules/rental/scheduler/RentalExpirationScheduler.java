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
    private final com.driveshare.modules.user.repository.UserRepository userRepository;

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

    /**
     * Sprint 4: Quét định kỳ các đơn IN_PROGRESS quá hạn kết thúc hợp đồng (endDate < hôm nay)
     * mà khách chưa làm thủ tục check-out trả xe.
     * Tự động chuyển sang OVERDUE và tính phí phạt trễ hạn.
     */
    @Scheduled(cron = "${app.rental.overdue-cron:0 0 * * * *}")
    @Transactional
    public void autoDetectOverdueRentals() {
        java.time.LocalDate today = java.time.LocalDate.now();
        List<Rental> overdueList = rentalRepository.findOverdueRentals(ERentalStatus.IN_PROGRESS, today);

        if (!overdueList.isEmpty()) {
            for (Rental rental : overdueList) {
                rental.setStatus(ERentalStatus.OVERDUE);
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(rental.getEndDate(), today);
                if (daysOverdue <= 0) daysOverdue = 1;
                int hoursOverdue = (int) (daysOverdue * 24);
                rental.setOverdueHours(hoursOverdue);

                // Phí phạt = Đơn giá ngày * 1.5 * số ngày trễ
                java.math.BigDecimal dailyPrice = rental.getPricePerDay() != null ? rental.getPricePerDay() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal penalty = dailyPrice.multiply(java.math.BigDecimal.valueOf(1.5)).multiply(java.math.BigDecimal.valueOf(daysOverdue));
                rental.setPenaltyFee(penalty);

                // Sprint 4 (Duy Quân): Tự động kích hoạt Blacklist nếu trễ trên 24 giờ
                if (hoursOverdue >= 24 && !Boolean.TRUE.equals(rental.getIsBlacklistedTriggered())) {
                    rental.setIsBlacklistedTriggered(true);
                    userRepository.findById(rental.getRenterId()).ifPresent(user -> {
                        user.setStatus(com.driveshare.common.enums.EUserStatus.BLOCKED);
                        userRepository.save(user);
                        log.warn("BLACKLIST: Khách hàng userId={} bị đưa vào danh sách đen (BLOCKED) do chiếm dụng xe quá hạn {} giờ (đơn #{})",
                                user.getUserId(), hoursOverdue, rental.getRentalId());
                    });
                }

                rental.setRejectReason("Đã quá thời hạn kết thúc chuyến đi (" + rental.getEndDate() + ") nhưng khách hàng chưa hoàn tất thủ tục bàn giao trả xe. Phí phạt tích lũy: " + penalty + " đ.");
                log.warn("CẢNH BÁO VI PHẠM: Đơn thuê rentalId={} của xe carId={} đã quá hạn trả xe (Hạn: {}). Chuyển sang OVERDUE, phạt: {} đ",
                        rental.getRentalId(), rental.getCarId(), rental.getEndDate(), penalty);
            }
            rentalRepository.saveAll(overdueList);
            log.info("Sprint 4: Đã tự động chuyển {} đơn thuê quá hạn sang OVERDUE và tính phí phạt", overdueList.size());
        }

        // Quét thêm các đơn đang ở OVERDUE mà chưa kích hoạt Blacklist nếu đã chạm ngưỡng 24h
        List<Rental> existingOverdue = rentalRepository.findByStatusOrderByCreatedAtDesc(ERentalStatus.OVERDUE);
        for (Rental rental : existingOverdue) {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(rental.getEndDate(), today);
            if (daysOverdue <= 0) daysOverdue = 1;
            int hoursOverdue = (int) (daysOverdue * 24);
            rental.setOverdueHours(hoursOverdue);

            java.math.BigDecimal dailyPrice = rental.getPricePerDay() != null ? rental.getPricePerDay() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal penalty = dailyPrice.multiply(java.math.BigDecimal.valueOf(1.5)).multiply(java.math.BigDecimal.valueOf(daysOverdue));
            rental.setPenaltyFee(penalty);

            if (hoursOverdue >= 24 && !Boolean.TRUE.equals(rental.getIsBlacklistedTriggered())) {
                rental.setIsBlacklistedTriggered(true);
                userRepository.findById(rental.getRenterId()).ifPresent(user -> {
                    user.setStatus(com.driveshare.common.enums.EUserStatus.BLOCKED);
                    userRepository.save(user);
                    log.warn("BLACKLIST: Khách hàng userId={} bị đưa vào danh sách đen (BLOCKED) do chiếm dụng xe quá hạn {} giờ (đơn #{})",
                            user.getUserId(), hoursOverdue, rental.getRentalId());
                });
            }
        }
        if (!existingOverdue.isEmpty()) {
            rentalRepository.saveAll(existingOverdue);
        }
    }
}
