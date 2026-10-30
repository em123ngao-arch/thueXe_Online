package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.common.service.CloudinaryService;
import com.driveshare.modules.car.adapter.out.persistence.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.notification.adapter.out.persistence.Notification;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.modules.payment.entity.Payment;
import com.driveshare.modules.payment.repository.PaymentRepository;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalDispute;
import com.driveshare.modules.rental.repository.RentalDisputeRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.RentalDisputeService;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalDisputeServiceImpl implements RentalDisputeService {

    private final RentalRepository rentalRepository;
    private final RentalDisputeRepository rentalDisputeRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public RentalDisputeResponse reportNoShow(
            Long rentalId,
            String reason,
            List<MultipartFile> evidenceFiles,
            Long currentUserId
    ) {
        log.info("Khách hàng userId={} gửi khiếu nại không nhận xe cho rentalId={}", currentUserId, rentalId);

        if (reason == null || reason.trim().length() < 10) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Vui lòng mô tả chi tiết lý do khiếu nại (tối thiểu 10 ký tự)");
        }

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        if (!rental.getRenterId().equals(currentUserId)) {
            throw new AppException(ErrorCode.DISPUTE_ACCESS_DENIED);
        }

        // Đơn thuê phải ở trạng thái hợp lệ để khiếu nại bàn giao xe (CONFIRMED hoặc IN_PROGRESS)
        if (rental.getStatus() != ERentalStatus.CONFIRMED && rental.getStatus() != ERentalStatus.IN_PROGRESS) {
            throw new AppException(
                    ErrorCode.RENTAL_NOT_ELIGIBLE_FOR_DISPUTE,
                    "Chỉ có thể khiếu nại sự cố không nhận xe khi đơn thuê đã được chốt cọc (CONFIRMED) và chưa hoàn thành"
            );
        }

        // Chống gửi khiếu nại trùng lặp
        if (rentalDisputeRepository.existsByRentalIdAndStatus(rentalId, EDisputeStatus.PENDING)) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_EXISTS);
        }

        // Upload bằng chứng (ảnh / video clip)
        List<String> uploadedUrls = new ArrayList<>();
        if (evidenceFiles != null && !evidenceFiles.isEmpty()) {
            for (MultipartFile file : evidenceFiles) {
                if (file != null && !file.isEmpty()) {
                    String url = cloudinaryService.uploadMedia(file, "disputes/" + rentalId);
                    uploadedUrls.add(url);
                }
            }
        }

        // Chuyển trạng thái đơn thuê sang DISPUTED (đóng băng cọc)
        rental.setStatus(ERentalStatus.DISPUTED);
        rentalRepository.save(rental);

        // Lưu bản ghi RentalDispute
        RentalDispute dispute = RentalDispute.builder()
                .rentalId(rentalId)
                .reporterId(currentUserId)
                .reason(reason.trim())
                .proofUrls(String.join(";", uploadedUrls))
                .status(EDisputeStatus.PENDING)
                .refundAmount(BigDecimal.ZERO)
                .penaltyAmount(BigDecimal.ZERO)
                .build();

        RentalDispute savedDispute = rentalDisputeRepository.save(dispute);

        // Gửi thông báo cho Chủ xe và Khách thuê
        try {
            Car car = carRepository.findById(rental.getCarId()).orElse(null);
            Long ownerId = (car != null) ? car.getOwnerId() : null;

            // Thông báo cho khách
            notificationRepository.save(Notification.builder()
                    .userId(currentUserId)
                    .title("Khiếu nại không nhận xe #" + rentalId + " đã được ghi nhận")
                    .content("DriveShare đã tiếp nhận phản ánh của bạn về đơn thuê #" + rentalId + ". Hệ thống đã đóng băng tiền cọc và chuyển Admin xử lý.")
                    .type("DISPUTE_SUBMITTED")
                    .referenceId(rentalId)
                    .isRead(false)
                    .createdAt(Instant.now())
                    .build());

            // Thông báo cho chủ xe
            if (ownerId != null) {
                notificationRepository.save(Notification.builder()
                        .userId(ownerId)
                        .title("Đơn thuê #" + rentalId + " bị khiếu nại không giao xe")
                        .content("Khách hàng đã gửi khiếu nại không nhận được xe cho đơn #" + rentalId + ". Tiền cọc đang tạm giữ để đối soát.")
                        .type("DISPUTE_ALERT")
                        .referenceId(rentalId)
                        .isRead(false)
                        .createdAt(Instant.now())
                        .build());
            }
        } catch (Exception ex) {
            log.warn("Lỗi gửi thông báo khiếu nại: {}", ex.getMessage());
        }

        return mapToResponse(savedDispute);
    }

    @Override
    @Transactional
    public RentalDisputeResponse resolveDispute(
            Long disputeId,
            ResolveDisputeRequest request,
            Long adminId
    ) {
        log.info("Admin userId={} giải quyết khiếu nại disputeId={} với action={}", adminId, disputeId, request.getAction());

        if (adminId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Kiểm tra quyền Admin/Staff của người thực hiện giải quyết tranh chấp
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean hasAdminRole = admin.getRoles() != null && admin.getRoles().stream()
                .anyMatch(r -> r.getRoleName() != null && (
                        "ROLE_ADMIN".equalsIgnoreCase(r.getRoleName().name()) ||
                        "ADMIN".equalsIgnoreCase(r.getRoleName().name()) ||
                        "ROLE_STAFF".equalsIgnoreCase(r.getRoleName().name()) ||
                        "STAFF".equalsIgnoreCase(r.getRoleName().name())
                ));
        if (!hasAdminRole) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (request.getAction() == null || request.getAction().isBlank()) {
            throw new AppException(ErrorCode.DISPUTE_INVALID_ACTION);
        }

        // Khóa bi quan (PESSIMISTIC_WRITE) để ngăn chặn tranh chấp giải quyết đồng thời gây hoàn cọc 2 lần
        RentalDispute dispute = rentalDisputeRepository.findByIdForUpdate(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        // Kiểm tra dispute đã được xử lý trước đó chưa (bảo vệ idempotent chống xử lý tài chính 2 lần)
        if (dispute.getStatus() != EDisputeStatus.PENDING) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_RESOLVED);
        }

        Rental rental = rentalRepository.findById(dispute.getRentalId())
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        String action = request.getAction().trim().toUpperCase();

        if ("REFUND_RENTER".equals(action)) {
            // 1. Chuyển trạng thái đơn thuê thành CANCELLED_BY_HOST
            rental.setStatus(ERentalStatus.CANCELLED_BY_HOST);
            rental.setRejectReason("Đã hủy và tạo lệnh hoàn 100% tiền cọc (chờ xử lý) cho khách do chủ xe vi phạm giao xe (Khiếu nại #" + dispute.getId() + ")");
            rentalRepository.save(rental);

            // 2. Lấy số tiền cọc thực tế từ giao dịch thanh toán
            Payment depositPayment = paymentRepository.findByRentalId(rental.getRentalId()).orElse(null);
            BigDecimal depositAmount = (depositPayment != null && depositPayment.getAmount() != null)
                    ? depositPayment.getAmount()
                    : (rental.getDepositAmount() != null ? rental.getDepositAmount() : BigDecimal.ZERO);

            if (depositPayment != null) {
                log.info("Cập nhật trạng thái giao dịch paymentId={} sang CANCELLED và ghi nhận hoàn cọc {} VNĐ",
                        depositPayment.getPaymentId(), depositAmount);
                depositPayment.setStatus(EPaymentStatus.CANCELLED);
                paymentRepository.save(depositPayment);
            }

            // 3. Ghi nhận công nợ phạt chủ xe
            BigDecimal penaltyAmount = (request.getPenaltyAmount() != null && request.getPenaltyAmount().compareTo(BigDecimal.ZERO) > 0)
                    ? request.getPenaltyAmount()
                    : depositAmount;

            // 4. Cập nhật bản ghi Dispute
            dispute.setStatus(EDisputeStatus.RESOLVED_REFUND);
            dispute.setRefundAmount(depositAmount);
            dispute.setPenaltyAmount(penaltyAmount);
            dispute.setAdminNote(request.getAdminNote());
            dispute.setResolvedBy(adminId);
            dispute.setResolvedAt(Instant.now());
            RentalDispute savedDispute = rentalDisputeRepository.save(dispute);

            // 5. Gửi thông báo hoàn tiền (chờ xử lý) & phạt công nợ
            sendResolveNotifications(rental, savedDispute, true);

            return mapToResponse(savedDispute);

        } else if ("REJECT".equals(action)) {
            // Bác bỏ khiếu nại (bằng chứng không đủ hoặc chủ xe đã giao xe đúng hẹn)
            dispute.setStatus(EDisputeStatus.REJECTED);
            dispute.setAdminNote(request.getAdminNote());
            dispute.setResolvedBy(adminId);
            dispute.setResolvedAt(Instant.now());
            RentalDispute savedDispute = rentalDisputeRepository.save(dispute);

            // Đưa đơn thuê trở lại CONFIRMED
            rental.setStatus(ERentalStatus.CONFIRMED);
            rentalRepository.save(rental);

            sendResolveNotifications(rental, savedDispute, false);

            return mapToResponse(savedDispute);

        } else {
            throw new AppException(ErrorCode.DISPUTE_INVALID_ACTION, "Hành động chỉ có thể là REFUND_RENTER hoặc REJECT");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public RentalDisputeResponse getDisputeByRentalId(Long rentalId, Long currentUserId) {
        List<RentalDispute> disputes = rentalDisputeRepository.findByRentalIdOrderByCreatedAtDesc(rentalId);
        if (disputes.isEmpty()) {
            throw new AppException(ErrorCode.DISPUTE_NOT_FOUND);
        }

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId()).orElse(null);
        Long ownerId = (car != null) ? car.getOwnerId() : null;

        // Chỉ khách thuê, chủ xe hoặc admin được xem
        if (!rental.getRenterId().equals(currentUserId) && (ownerId == null || !ownerId.equals(currentUserId))) {
            User user = userRepository.findById(currentUserId).orElse(null);
            boolean isAdmin = user != null && user.getRoles() != null && user.getRoles().stream()
                    .anyMatch(r -> r.getRoleName() != null && (
                            "ROLE_ADMIN".equalsIgnoreCase(r.getRoleName().name()) ||
                            "ADMIN".equalsIgnoreCase(r.getRoleName().name()) ||
                            "ROLE_STAFF".equalsIgnoreCase(r.getRoleName().name()) ||
                            "STAFF".equalsIgnoreCase(r.getRoleName().name())
                    ));
            if (!isAdmin) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        return mapToResponse(disputes.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalDisputeResponse> getAllDisputes(EDisputeStatus status) {
        List<RentalDispute> disputes;
        if (status != null) {
            disputes = rentalDisputeRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            disputes = rentalDisputeRepository.findAllByOrderByCreatedAtDesc();
        }
        return disputes.stream().map(this::mapToResponse).toList();
    }

    private void sendResolveNotifications(Rental rental, RentalDispute dispute, boolean isRefund) {
        try {
            Car car = carRepository.findById(rental.getCarId()).orElse(null);
            Long ownerId = (car != null) ? car.getOwnerId() : null;

            if (isRefund) {
                // Cho khách: Thông báo rõ ràng trạng thái hoàn tiền đang chờ ngân hàng/kế toán đối soát xử lý, không nói dối là đã chuyển tiền thành công
                notificationRepository.save(Notification.builder()
                        .userId(rental.getRenterId())
                        .title("Khiếu nại được chấp thuận - Đang xử lý hoàn cọc 100%")
                        .content("DriveShare đã chấp thuận khiếu nại cho đơn #" + rental.getRentalId() + ". Yêu cầu hoàn 100% tiền cọc (" + dispute.getRefundAmount() + " VNĐ) đã được phê duyệt và đang chờ xử lý hoàn tiền qua tài khoản ngân hàng của bạn trong vòng 1-3 ngày làm việc.")
                        .type("DISPUTE_REFUND_PENDING")
                        .referenceId(rental.getRentalId())
                        .isRead(false)
                        .createdAt(Instant.now())
                        .build());

                // Cho chủ xe: Ghi nhận công nợ phạt rõ ràng
                if (ownerId != null) {
                    notificationRepository.save(Notification.builder()
                            .userId(ownerId)
                            .title("Thông báo xử phạt sự cố không giao xe #" + rental.getRentalId())
                            .content("Admin đã giải quyết khiếu nại: Đơn thuê bị hủy do vi phạm giao xe. Bạn bị ghi nhận công nợ mức phạt: " + dispute.getPenaltyAmount() + " VNĐ. Khoản phạt này sẽ được khấu trừ vào các kỳ thanh toán tiếp theo.")
                            .type("DISPUTE_PENALTY")
                            .referenceId(rental.getRentalId())
                            .isRead(false)
                            .createdAt(Instant.now())
                            .build());
                }
            } else {
                // Cho khách
                notificationRepository.save(Notification.builder()
                        .userId(rental.getRenterId())
                        .title("Khiếu nại không nhận xe bị từ chối")
                        .content("Khiếu nại cho đơn thuê #" + rental.getRentalId() + " đã bị Admin từ chối. Lý do: " + dispute.getAdminNote())
                        .type("DISPUTE_REJECTED")
                        .referenceId(rental.getRentalId())
                        .isRead(false)
                        .createdAt(Instant.now())
                        .build());
            }
        } catch (Exception ex) {
            log.warn("Lỗi gửi thông báo giải quyết khiếu nại: {}", ex.getMessage());
        }
    }

    private RentalDisputeResponse mapToResponse(RentalDispute dispute) {
        String reporterName = "Khách #" + dispute.getReporterId();
        String reporterPhone = "N/A";
        User reporter = userRepository.findById(dispute.getReporterId()).orElse(null);
        if (reporter != null) {
            reporterName = (reporter.getFullName() != null && !reporter.getFullName().isBlank())
                    ? reporter.getFullName()
                    : reporter.getUsername();
            reporterPhone = reporter.getPhone() != null ? reporter.getPhone() : "N/A";
        }

        String resolverName = null;
        if (dispute.getResolvedBy() != null) {
            User resolver = userRepository.findById(dispute.getResolvedBy()).orElse(null);
            if (resolver != null) {
                resolverName = (resolver.getFullName() != null && !resolver.getFullName().isBlank())
                        ? resolver.getFullName()
                        : resolver.getUsername();
            } else {
                resolverName = "Admin #" + dispute.getResolvedBy();
            }
        }

        List<String> proofList = new ArrayList<>();
        if (dispute.getProofUrls() != null && !dispute.getProofUrls().isBlank()) {
            proofList = Arrays.stream(dispute.getProofUrls().split(";"))
                    .filter(s -> !s.isBlank())
                    .toList();
        }

        return RentalDisputeResponse.builder()
                .id(dispute.getId())
                .rentalId(dispute.getRentalId())
                .reporterId(dispute.getReporterId())
                .reporterName(reporterName)
                .reporterPhone(reporterPhone)
                .reason(dispute.getReason())
                .proofUrls(proofList)
                .status(dispute.getStatus())
                .refundAmount(dispute.getRefundAmount())
                .penaltyAmount(dispute.getPenaltyAmount())
                .adminNote(dispute.getAdminNote())
                .resolvedBy(dispute.getResolvedBy())
                .resolverName(resolverName)
                .createdAt(dispute.getCreatedAt())
                .resolvedAt(dispute.getResolvedAt())
                .build();
    }
}
