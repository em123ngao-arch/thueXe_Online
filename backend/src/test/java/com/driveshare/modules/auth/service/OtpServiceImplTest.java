package com.driveshare.modules.auth.service;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.auth.dto.OtpSendRequest;
import com.driveshare.modules.auth.dto.OtpSendResponse;
import com.driveshare.modules.auth.dto.OtpVerifyRequest;
import com.driveshare.modules.auth.dto.OtpVerifyResponse;
import com.driveshare.modules.auth.entity.EmailOtp;
import com.driveshare.modules.auth.repository.EmailOtpRepository;
import com.driveshare.modules.auth.service.impl.OtpServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceImplTest {

    @Mock
    private EmailOtpRepository emailOtpRepository;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private OtpServiceImpl otpService;

    private static final String TEST_EMAIL = "dongocphat007@gmail.com";
    private static final String PURPOSE = "GENERAL";
    private static final String RAW_OTP = "123456";

    @Test
    @DisplayName("1. Gửi OTP thành công: sinh mã 6 số, trả về masked format 123*** và TTL 120s")
    void sendOtp_Success_GeneratesMaskedFormatAndSaves() {
        when(emailOtpRepository.save(any(EmailOtp.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OtpSendRequest request = OtpSendRequest.builder()
                .email(TEST_EMAIL)
                .purpose(PURPOSE)
                .build();

        OtpSendResponse response = otpService.sendOtp(request);

        assertNotNull(response);
        assertEquals(TEST_EMAIL, response.getEmail());
        assertEquals(120, response.getTtlSeconds());
        assertNotNull(response.getMaskedOtp());
        assertTrue(response.getMaskedOtp().matches("^[0-9]{3}\\*\\*\\*$"), 
                "Masked OTP phải có dạng 3 số đầu kèm *** (vd: 123***)");

        ArgumentCaptor<EmailOtp> captor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(emailOtpRepository).save(captor.capture());
        EmailOtp saved = captor.getValue();
        assertEquals(TEST_EMAIL, saved.getEmail());
        assertEquals(0, saved.getAttempts());
        assertFalse(saved.isUsed());
        assertNotNull(saved.getExpiresAt());
    }

    @Test
    @DisplayName("2. Xác thực thành công: mã đúng -> trả về verified = true và đánh dấu used")
    void verifyOtp_CorrectCode_Success() {
        String hash = AuthService.sha256(RAW_OTP);
        EmailOtp otp = EmailOtp.builder()
                .email(TEST_EMAIL)
                .purpose(PURPOSE)
                .otpHash(hash)
                .attempts(0)
                .used(false)
                .expiresAt(Instant.now().plusSeconds(120))
                .build();

        when(emailOtpRepository.findTopByEmailAndPurposeOrderByIdDesc(TEST_EMAIL, PURPOSE))
                .thenReturn(Optional.of(otp));

        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .email(TEST_EMAIL)
                .otp(RAW_OTP)
                .purpose(PURPOSE)
                .build();

        OtpVerifyResponse response = otpService.verifyOtp(request);

        assertTrue(response.isVerified());
        assertTrue(otp.isUsed(), "Mã OTP phải được cập nhật used = true");
        verify(emailOtpRepository).save(otp);
    }

    @Test
    @DisplayName("3. Xác thực thất bại: mã sai -> ném OTP_INVALID và tăng số lần thử")
    void verifyOtp_WrongCode_ThrowsOtpInvalidAndIncrementsAttempts() {
        String hash = AuthService.sha256(RAW_OTP);
        EmailOtp otp = EmailOtp.builder()
                .email(TEST_EMAIL)
                .purpose(PURPOSE)
                .otpHash(hash)
                .attempts(0)
                .used(false)
                .expiresAt(Instant.now().plusSeconds(120))
                .build();

        when(emailOtpRepository.findTopByEmailAndPurposeOrderByIdDesc(TEST_EMAIL, PURPOSE))
                .thenReturn(Optional.of(otp));

        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .email(TEST_EMAIL)
                .otp("654321") // Mã sai
                .purpose(PURPOSE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> otpService.verifyOtp(request));
        assertEquals(ErrorCode.OTP_INVALID, ex.getErrorCode());
        assertEquals(1, otp.getAttempts(), "Số lần thử sai phải tăng lên 1");
        verify(emailOtpRepository).save(otp);
    }

    @Test
    @DisplayName("4. Xác thực thất bại: mã hết hạn (quá TTL 120s) -> ném OTP_EXPIRED")
    void verifyOtp_ExpiredCode_ThrowsOtpExpired() {
        String hash = AuthService.sha256(RAW_OTP);
        EmailOtp otp = EmailOtp.builder()
                .email(TEST_EMAIL)
                .purpose(PURPOSE)
                .otpHash(hash)
                .attempts(0)
                .used(false)
                .expiresAt(Instant.now().minusSeconds(10)) // Quá hạn 10s
                .build();

        when(emailOtpRepository.findTopByEmailAndPurposeOrderByIdDesc(TEST_EMAIL, PURPOSE))
                .thenReturn(Optional.of(otp));

        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .email(TEST_EMAIL)
                .otp(RAW_OTP)
                .purpose(PURPOSE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> otpService.verifyOtp(request));
        assertEquals(ErrorCode.OTP_EXPIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("5. Chống Brute-force: Khóa mã nếu đã nhập sai quá 3 lần -> ném RATE_LIMITED")
    void verifyOtp_MaxAttemptsExceeded_ThrowsRateLimited() {
        String hash = AuthService.sha256(RAW_OTP);
        EmailOtp otp = EmailOtp.builder()
                .email(TEST_EMAIL)
                .purpose(PURPOSE)
                .otpHash(hash)
                .attempts(3) // Đã sai 3 lần
                .used(false)
                .expiresAt(Instant.now().plusSeconds(120))
                .build();

        when(emailOtpRepository.findTopByEmailAndPurposeOrderByIdDesc(TEST_EMAIL, PURPOSE))
                .thenReturn(Optional.of(otp));

        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .email(TEST_EMAIL)
                .otp(RAW_OTP)
                .purpose(PURPOSE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> otpService.verifyOtp(request));
        assertEquals(ErrorCode.RATE_LIMITED, ex.getErrorCode());
    }

    @Test
    @DisplayName("6. Chống Brute-force: Nhập sai lần thứ 3 liên tiếp -> khóa mã ngay lập tức")
    void verifyOtp_ThirdConsecutiveFailure_LocksAndThrowsRateLimited() {
        String hash = AuthService.sha256(RAW_OTP);
        EmailOtp otp = EmailOtp.builder()
                .email(TEST_EMAIL)
                .purpose(PURPOSE)
                .otpHash(hash)
                .attempts(2) // Đã từng sai 2 lần
                .used(false)
                .expiresAt(Instant.now().plusSeconds(120))
                .build();

        when(emailOtpRepository.findTopByEmailAndPurposeOrderByIdDesc(TEST_EMAIL, PURPOSE))
                .thenReturn(Optional.of(otp));

        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .email(TEST_EMAIL)
                .otp("999999") // Sai lần 3
                .purpose(PURPOSE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> otpService.verifyOtp(request));
        assertEquals(ErrorCode.RATE_LIMITED, ex.getErrorCode());
        assertEquals(3, otp.getAttempts(), "Attempts phải đạt ngưỡng khóa là 3");
        verify(emailOtpRepository).save(otp);
    }
}

