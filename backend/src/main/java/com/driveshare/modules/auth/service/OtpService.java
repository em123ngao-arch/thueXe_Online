package com.driveshare.modules.auth.service;

import com.driveshare.modules.auth.dto.OtpSendRequest;
import com.driveshare.modules.auth.dto.OtpSendResponse;
import com.driveshare.modules.auth.dto.OtpVerifyRequest;
import com.driveshare.modules.auth.dto.OtpVerifyResponse;

/**
 * Phân hệ dịch vụ quản lý và xác thực mã OTP độc lập.
 */
public interface OtpService {

    /**
     * Sinh và gửi mã OTP 6 số qua console và email thật.
     * @param request Chứa email và purpose
     * @return OtpSendResponse chứa mã masked (vd: 123***) và TTL (120s)
     */
    OtpSendResponse sendOtp(OtpSendRequest request);

    /**
     * Xác thực mã OTP người dùng gửi lên.
     * @param request Chứa email, mã 6 số và purpose
     * @return OtpVerifyResponse kết quả xác thực
     */
    OtpVerifyResponse verifyOtp(OtpVerifyRequest request);

    /**
     * Sinh và gửi mã OTP phục vụ các module nghiệp vụ nội bộ (Đăng ký, Quên mật khẩu).
     */
    void issueAndSend(String email, String purpose, String subject, String title, String description);

    /**
     * Kiểm tra mã OTP trực tiếp, trả về true nếu hợp lệ; ném AppException nếu sai/hết hạn/quá số lần.
     */
    boolean verify(String email, String purpose, String rawOtp);

    /**
     * Kiểm tra xem email có đang trong thời gian giãn cách (cooldown) không.
     */
    boolean isInCooldown(String email, String purpose);
}
