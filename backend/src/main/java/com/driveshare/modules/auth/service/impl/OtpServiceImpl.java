package com.driveshare.modules.auth.service.impl;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.auth.dto.OtpSendRequest;
import com.driveshare.modules.auth.dto.OtpSendResponse;
import com.driveshare.modules.auth.dto.OtpVerifyRequest;
import com.driveshare.modules.auth.dto.OtpVerifyResponse;
import com.driveshare.modules.auth.adapter.out.persistence.EmailOtpJpaEntity;
import com.driveshare.modules.auth.repository.EmailOtpRepository;
import com.driveshare.modules.auth.service.AuthService;
import com.driveshare.modules.auth.service.OtpService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    /** Thời hạn hiệu lực của mã OTP: 300 giây (5 phút) */
    public static final long TTL_SECONDS = 300;
    
    /** Chống brute-force: Tối đa 3 lần nhập sai liên tiếp */
    public static final int MAX_FAILED_ATTEMPTS = 3;

    /** Giãn cách giữa các lần yêu cầu gửi OTP (cooldown): 30 giây */
    public static final long COOLDOWN_SECONDS = 30;

    private final EmailOtpRepository emailOtpRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:dongocphat007@gmail.com}")
    private String fromEmail;

    @Override
    @Transactional
    public OtpSendResponse sendOtp(OtpSendRequest request) {
        String cleanEmail = normalize(request.getEmail());
        String purpose = request.getPurpose() != null && !request.getPurpose().isBlank()
                ? request.getPurpose().trim().toUpperCase()
                : "GENERAL";

        if (isInCooldown(cleanEmail, purpose)) {
            throw new AppException(ErrorCode.OTP_COOLDOWN, "Vui lòng đợi 30 giây trước khi yêu cầu gửi lại mã OTP mới.");
        }

        // 1. Sinh mã OTP 6 chữ số ngẫu nhiên an toàn bằng SecureRandom (000000 -> 999999)
        int rawNumber = secureRandom.nextInt(1_000_000);
        String rawOtp = String.format("%06d", rawNumber);
        String hash = AuthService.sha256(rawOtp);

        // 2. Lưu trữ mã OTP trong database với TTL 300 giây
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(TTL_SECONDS);

        EmailOtpJpaEntity emailOtp = EmailOtpJpaEntity.builder()
                .email(cleanEmail)
                .purpose(purpose)
                .otpHash(hash)
                .attempts(0)
                .used(false)
                .createdAt(now)
                .expiresAt(expiresAt)
                .cooldownUntil(now.plusSeconds(COOLDOWN_SECONDS))
                .build();

        emailOtpRepository.save(emailOtp);

        // 3. Masked format: 3 chữ số đầu + *** (ví dụ: 123***)
        String maskedOtp = rawOtp.substring(0, 3) + "***";

        // 4. In mã ra log console ở môi trường dev/demo
        log.info("=================================================================");
        log.info("🔐 [DRIVESHARE OTP SERVICE] Email: {} | Purpose: {}", cleanEmail, purpose);
        log.info("👉 Mã OTP nguyên bản: [{}] | Masked Format: [{}] | TTL: {}s", rawOtp, maskedOtp, TTL_SECONDS);
        log.info("=================================================================");

        // 5. Gửi thư thực tế qua Gmail SMTP
        dispatchEmail(cleanEmail, rawOtp, "Mã xác thực OTP DriveShare", "Xác thực OTP",
                "Mã OTP của bạn có hiệu lực trong vòng 300 giây (5 phút). Tuyệt đối không chia sẻ mã cho bất kỳ ai.");

        return OtpSendResponse.builder()
                .email(cleanEmail)
                .maskedOtp(maskedOtp)
                .ttlSeconds(TTL_SECONDS)
                .message("Mã OTP đã được gửi thành công. Vui lòng kiểm tra hộp thư hoặc console dev.")
                .build();
    }

    @Override
    @Transactional(noRollbackFor = AppException.class)
    public OtpVerifyResponse verifyOtp(OtpVerifyRequest request) {
        String cleanEmail = normalize(request.getEmail());
        String purpose = request.getPurpose() != null && !request.getPurpose().isBlank()
                ? request.getPurpose().trim().toUpperCase()
                : "GENERAL";

        boolean ok = verify(cleanEmail, purpose, request.getOtp());
        return OtpVerifyResponse.builder()
                .verified(ok)
                .email(cleanEmail)
                .message("Xác thực mã OTP thành công.")
                .build();
    }

    @Override
    @Transactional
    public void issueAndSend(String email, String purpose, String subject, String title, String description) {
        String cleanEmail = normalize(email);
        if (isInCooldown(cleanEmail, purpose)) {
            throw new AppException(ErrorCode.OTP_COOLDOWN, "Vui lòng đợi 30 giây trước khi yêu cầu mã mới.");
        }

        int rawNumber = secureRandom.nextInt(1_000_000);
        String rawOtp = String.format("%06d", rawNumber);
        String hash = AuthService.sha256(rawOtp);

        Instant now = Instant.now();
        EmailOtpJpaEntity emailOtp = EmailOtpJpaEntity.builder()
                .email(cleanEmail)
                .purpose(purpose)
                .otpHash(hash)
                .attempts(0)
                .used(false)
                .createdAt(now)
                .expiresAt(now.plusSeconds(TTL_SECONDS))
                .cooldownUntil(now.plusSeconds(COOLDOWN_SECONDS))
                .build();

        emailOtpRepository.save(emailOtp);

        log.info("=================================================================");
        log.info("🔐 [DRIVESHARE OTP INTERNAL] Email: {} | Purpose: {} | Code: [{}]", cleanEmail, purpose, rawOtp);
        log.info("=================================================================");

        dispatchEmail(cleanEmail, rawOtp, subject, title, description);
    }

    @Override
    @Transactional(noRollbackFor = AppException.class)
    public boolean verify(String email, String purpose, String rawOtp) {
        String cleanEmail = normalize(email);
        String inputHash = AuthService.sha256(rawOtp != null ? rawOtp.trim() : "");
        EmailOtpJpaEntity otp = emailOtpRepository.findTopByEmailAndPurposeAndOtpHashAndUsedFalseOrderByIdDesc(cleanEmail, purpose, inputHash)
                .orElseGet(() -> emailOtpRepository.findTopByEmailAndPurposeOrderByIdDesc(cleanEmail, purpose)
                        .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED, "Mã OTP không tồn tại hoặc đã hết hạn.")));

        if (otp.isUsed()) {
            throw new AppException(ErrorCode.OTP_EXPIRED, "Mã OTP này đã được sử dụng. Vui lòng yêu cầu mã mới.");
        }

        // Kiểm tra thời hạn hết hạn TTL (300 giây)
        if (otp.getExpiresAt() == null || otp.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.OTP_EXPIRED, "Mã OTP đã hết hạn (quá 300 giây). Vui lòng yêu cầu mã mới.");
        }

        // Chống Brute-force: Khóa mã nếu đã nhập sai quá 3 lần
        if (otp.getAttempts() >= MAX_FAILED_ATTEMPTS) {
            throw new AppException(ErrorCode.RATE_LIMITED,
                    "Mã OTP đã bị khóa do nhập sai quá " + MAX_FAILED_ATTEMPTS + " lần liên tiếp. Vui lòng lấy mã mới.");
        }

        if (!otp.getOtpHash().equals(inputHash)) {
            otp.setAttempts(otp.getAttempts() + 1);
            emailOtpRepository.save(otp);

            int remaining = MAX_FAILED_ATTEMPTS - otp.getAttempts();
            if (remaining <= 0) {
                throw new AppException(ErrorCode.RATE_LIMITED,
                        "Bạn đã nhập sai mã OTP quá 3 lần. Mã OTP này đã bị khóa vĩnh viễn!");
            }
            throw new AppException(ErrorCode.OTP_INVALID,
                    "Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
        }

        otp.setUsed(true);
        emailOtpRepository.save(otp);
        log.info("✅ [OTP VERIFIED] Xác thực thành công cho email: {} | purpose: {}", cleanEmail, purpose);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInCooldown(String email, String purpose) {
        String cleanEmail = normalize(email);
        return emailOtpRepository.findTopByEmailAndPurposeOrderByIdDesc(cleanEmail, purpose)
                .map(otp -> otp.getCooldownUntil() != null && otp.getCooldownUntil().isAfter(Instant.now()))
                .orElse(false);
    }

    private void dispatchEmail(String toEmail, String rawOtp, String subject, String title, String description) {
        if (mailSender == null) {
            log.info("ℹ️ JavaMailSender chưa được kích hoạt, mã OTP hiển thị tại console.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "DriveShare Platform");
            helper.setTo(toEmail);
            helper.setSubject(subject);

            String html = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #059669; margin: 0; font-size: 26px;">🚗 DriveShare</h2>
                        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Nền tảng chia sẻ & cho thuê xe tự lái</p>
                    </div>
                    <div style="background: #f8fafc; border-radius: 8px; padding: 24px; text-align: center;">
                        <h3 style="color: #0f172a; margin-top: 0;">%s</h3>
                        <p style="color: #475569; font-size: 14px; line-height: 1.5;">%s</p>
                        <div style="margin: 20px 0;">
                            <span style="display: inline-block; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #059669; background: #ecfdf5; padding: 12px 28px; border-radius: 8px; border: 2px dashed #059669;">
                                %s
                            </span>
                        </div>
                        <p style="color: #ef4444; font-size: 13px; font-weight: 600;">⚠️ Mã có hiệu lực trong vòng 300 giây (5 phút).</p>
                        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Khóa mã nếu nhập sai quá 3 lần liên tiếp. Tuyệt đối không cung cấp mã cho người khác.</p>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">© 2026 DriveShare. Mọi quyền được bảo lưu.</p>
                </div>
                """.formatted(title, description, rawOtp);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("📧 [MAIL SENT] Đã gửi mã OTP thực tế tới hộp thư Gmail: {}", toEmail);
        } catch (Exception e) {
            log.warn("⚠️ Gửi mail qua SMTP thất bại: {}. Mã OTP dự phòng: [{}]", e.getMessage(), rawOtp);
        }
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}

