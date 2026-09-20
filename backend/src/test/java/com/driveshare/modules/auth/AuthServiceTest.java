package com.driveshare.modules.auth;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.auth.dto.ChangeEmailRequest;
import com.driveshare.modules.auth.dto.ChangePasswordRequest;
import com.driveshare.modules.auth.entity.EmailChangeToken;
import com.driveshare.modules.auth.repository.AuthSessionRepository;
import com.driveshare.modules.auth.repository.EmailChangeTokenRepository;
import com.driveshare.modules.auth.repository.PasswordResetTokenRepository;
import com.driveshare.modules.auth.service.AuthService;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.RoleRepository;
import com.driveshare.modules.user.repository.UserRepository;
import com.driveshare.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private OwnerProfileRepository ownerProfileRepository;
    @Mock
    private RenterProfileRepository renterProfileRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider tokenProvider;
    @Mock
    private AuthSessionRepository sessionRepository;
    @Mock
    private PasswordResetTokenRepository resetTokenRepository;
    @Mock
    private EmailChangeTokenRepository emailChangeTokenRepository;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                roleRepository,
                ownerProfileRepository,
                renterProfileRepository,
                passwordEncoder,
                tokenProvider,
                sessionRepository,
                resetTokenRepository,
                emailChangeTokenRepository
        );
    }

    @Test
    @DisplayName("BR-06-2: Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu cũ")
    void changePassword_WhenNewPasswordMatchesOld_ShouldThrowAppException() {
        Long userId = 1L;
        User user = User.builder()
                .userId(userId)
                .passwordHash("hashedOldPassword")
                .tokenVersion(1L)
                .build();

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .oldPassword("OldPass@123")
                .newPassword("OldPass@123")
                .confirmPassword("OldPass@123")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPass@123", "hashedOldPassword")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> authService.changePassword(userId, request));
        assertEquals(ErrorCode.NEW_PASSWORD_SAME_AS_OLD, ex.getErrorCode());
        assertEquals("Mật khẩu mới không được trùng mật khẩu cũ", ex.getErrorCode().getMessage());
        verify(userRepository, never()).save(any());
        verify(sessionRepository, never()).revokeAllByUserId(any());
    }

    @Test
    @DisplayName("BR-06: Đổi mật khẩu thành công -> cập nhật hash, tăng token version, thu hồi session")
    void changePassword_Success() {
        Long userId = 1L;
        User user = User.builder()
                .userId(userId)
                .passwordHash("hashedOldPassword")
                .tokenVersion(1L)
                .build();

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .oldPassword("OldPass@123")
                .newPassword("NewPass@456")
                .confirmPassword("NewPass@456")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPass@123", "hashedOldPassword")).thenReturn(true);
        when(passwordEncoder.matches("NewPass@456", "hashedOldPassword")).thenReturn(false);
        when(passwordEncoder.encode("NewPass@456")).thenReturn("hashedNewPassword");

        authService.changePassword(userId, request);

        assertEquals("hashedNewPassword", user.getPasswordHash());
        assertEquals(2L, user.getTokenVersion());
        verify(userRepository).save(user);
        verify(sessionRepository).revokeAllByUserId(userId);
    }

    @Test
    @DisplayName("BR-07-3: Yêu cầu đổi email trả lỗi EMAIL_EXISTED khi email mới đã có trong hệ thống")
    void requestChangeEmail_WhenEmailAlreadyExisted_ShouldThrowAppException() {
        Long userId = 1L;
        User user = User.builder().userId(userId).email("old@example.com").build();
        ChangeEmailRequest request = ChangeEmailRequest.builder().newEmail("existed@example.com").build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("existed@example.com")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> authService.requestChangeEmail(userId, request));
        assertEquals(ErrorCode.EMAIL_EXISTED, ex.getErrorCode());
        verify(emailChangeTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("BR-07-1/4: Yêu cầu đổi email thành công -> sinh token hạn 15 phút")
    void requestChangeEmail_Success() {
        Long userId = 1L;
        User user = User.builder().userId(userId).email("old@example.com").build();
        ChangeEmailRequest request = ChangeEmailRequest.builder().newEmail("new@example.com").build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);

        authService.requestChangeEmail(userId, request);

        ArgumentCaptor<EmailChangeToken> tokenCaptor = ArgumentCaptor.forClass(EmailChangeToken.class);
        verify(emailChangeTokenRepository).save(tokenCaptor.capture());

        EmailChangeToken savedToken = tokenCaptor.getValue();
        assertEquals(userId, savedToken.getUserId());
        assertEquals("new@example.com", savedToken.getNewEmail());
        assertNotNull(savedToken.getTokenHash());
        assertTrue(savedToken.getExpiresAt().isAfter(Instant.now()));
    }

    @Test
    @DisplayName("BR-07-2: Xác nhận đổi email thành công -> cập nhật email mới và vô hiệu hóa session cũ")
    void confirmChangeEmail_Success() {
        String rawToken = "sample-token-12345";
        String tokenHash = AuthService.sha256(rawToken);

        EmailChangeToken token = EmailChangeToken.builder()
                .id(10L)
                .userId(1L)
                .newEmail("confirmed@example.com")
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plusSeconds(900))
                .build();

        User user = User.builder()
                .userId(1L)
                .email("old@example.com")
                .tokenVersion(1L)
                .build();

        when(emailChangeTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));
        when(userRepository.existsByEmail("confirmed@example.com")).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        authService.confirmChangeEmail(rawToken);

        assertEquals("confirmed@example.com", user.getEmail());
        assertEquals(2L, user.getTokenVersion());
        assertNotNull(token.getUsedAt());
        verify(userRepository).save(user);
        verify(sessionRepository).revokeAllByUserId(1L);
    }
}
