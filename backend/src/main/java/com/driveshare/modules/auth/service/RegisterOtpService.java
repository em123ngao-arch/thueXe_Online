package com.driveshare.modules.auth.service;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OTP đăng ký kiểu "xác thực trước, tạo tài khoản sau":
 * gửi OTP tới email chưa có tài khoản -> nhập đúng OTP -> nhận "vé" ký số (gắn với email, dùng 1 lần)
 * -> gửi kèm vé khi đăng ký để tài khoản được tạo với email đã xác thực.
 */
@Service
@RequiredArgsConstructor
public class RegisterOtpService {
    /** Purpose riêng, không đụng tới OTP của luồng cũ (REGISTER) hay quên mật khẩu. */
    public static final String PURPOSE_REGISTER_PRE = "REGISTER_PRE";
    static final long TICKET_TTL_SECONDS = 15 * 60;

    private final OtpService otpService;
    private final UserRepository userRepository;

    @Value("${driveshare.jwt.secret:}")
    private String secret;

    /** Vé đã dùng -> thời điểm hết hạn (để không dùng lại được). */
    private final Map<String, Long> usedTickets = new ConcurrentHashMap<>();

    @Transactional
    public void sendOtp(String rawEmail) {
        String email = normalize(rawEmail);
        if (userRepository.existsByEmail(email)) throw new AppException(ErrorCode.EMAIL_EXISTED);
        otpService.issueAndSend(email, PURPOSE_REGISTER_PRE,
                "[DriveShare] Mã OTP xác thực email đăng ký",
                "Xác thực email đăng ký",
                "Nhập mã dưới đây vào trang đăng ký để xác thực email và hoàn tất tạo tài khoản.");
    }

    /** Kiểm tra OTP, đúng thì trả vé đăng ký. */
    @Transactional(noRollbackFor = AppException.class)
    public String verifyOtp(String rawEmail, String otp) {
        String email = normalize(rawEmail);
        otpService.verify(email, PURPOSE_REGISTER_PRE, otp);
        long exp = Instant.now().getEpochSecond() + TICKET_TTL_SECONDS;
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString((email + "|" + exp).getBytes(StandardCharsets.UTF_8));
        return payload + "." + sign(payload);
    }

    /** Dùng vé (1 lần). true nếu hợp lệ và đúng email; ném OTP_EXPIRED nếu vé sai/hết hạn/đã dùng. */
    public boolean redeem(String ticket, String rawEmail) {
        if (ticket == null || ticket.isBlank()) return false;
        String[] parts = ticket.trim().split("\\.");
        if (parts.length != 2 || !MessageDigest.isEqual(
                sign(parts[0]).getBytes(StandardCharsets.UTF_8), parts[1].getBytes(StandardCharsets.UTF_8))) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        String[] data;
        try {
            data = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8).split("\\|");
        } catch (IllegalArgumentException e) { throw new AppException(ErrorCode.OTP_EXPIRED); }
        long now = Instant.now().getEpochSecond();
        if (data.length != 2 || !data[0].equals(normalize(rawEmail)) || Long.parseLong(data[1]) < now) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        usedTickets.entrySet().removeIf(e -> e.getValue() < now);
        if (usedTickets.putIfAbsent(parts[1], Long.parseLong(data[1])) != null) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        return true;
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(("register-ticket|" + secret).getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            StringBuilder sb = new StringBuilder();
            for (byte b : mac.doFinal(payload.getBytes(StandardCharsets.UTF_8))) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
