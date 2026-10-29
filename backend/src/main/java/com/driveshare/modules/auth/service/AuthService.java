package com.driveshare.modules.auth.service;

import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.auth.dto.*;
import com.driveshare.modules.auth.entity.AuthSession;
import com.driveshare.modules.auth.entity.EmailChangeToken;
import com.driveshare.modules.auth.entity.EmailOtp;
import com.driveshare.modules.auth.entity.PasswordResetToken;
import com.driveshare.modules.auth.repository.AuthSessionRepository;
import com.driveshare.modules.auth.repository.EmailChangeTokenRepository;
import com.driveshare.modules.auth.repository.PasswordResetTokenRepository;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.RenterProfile;
import com.driveshare.modules.user.entity.Role;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.RoleRepository;
import com.driveshare.modules.user.repository.UserRepository;
import com.driveshare.security.CustomUserDetails;
import com.driveshare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.driveshare.common.service.CloudinaryService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_MINUTES = 15;
    private static final long RESET_TOKEN_SECONDS = 10 * 60;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RenterProfileRepository renterProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthSessionRepository sessionRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailChangeTokenRepository emailChangeTokenRepository;
    private final CloudinaryService cloudinaryService;
    private final OtpService otpService;
    // Không nằm trong constructor: chỉ dùng khi đăng ký có kèm vé OTP
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private RegisterOtpService registerOtpService;
    private static final long EMAIL_CHANGE_MINUTES = 15;

    @Value("${driveshare.frontend.base-url:http://127.0.0.1:5500/thueXe_Online/frontend/index.html}")
    private String frontendBaseUrl;

    private final ConcurrentHashMap<String, FailureWindow> ipFailures = new ConcurrentHashMap<>();

    @Transactional
    public Map<String, Object> registerWithDocs(
            RegisterRequest request,
            MultipartFile cccdFront,
            MultipartFile cccdBack,
            MultipartFile gplxFront
    ) {
        if (request == null) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        // 1. Bắt buộc có cả 2 mặt CCCD
        if (cccdFront == null || cccdFront.isEmpty() || cccdBack == null || cccdBack.isEmpty()) {
            throw new AppException(ErrorCode.MISSING_CCCD_SIDE);
        }

        // 2. Xác định vai trò
        ERole targetRole = ("OWNER".equalsIgnoreCase(request.getRole()) || "ROLE_OWNER".equalsIgnoreCase(request.getRole()))
                ? ERole.ROLE_OWNER
                : ERole.ROLE_RENTER;

        // 3. Khách thuê xe bắt buộc phải có GPLX
        if (targetRole == ERole.ROLE_RENTER) {
            if (gplxFront == null || gplxFront.isEmpty()) {
                throw new AppException(ErrorCode.VALIDATION_FAILED, "Khách thuê xe bắt buộc phải tải lên ảnh Giấy phép lái xe (GPLX)");
            }
        }

        // 4. Validate các trường thông tin cơ bản
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Email không được để trống");
        }
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        validatePassword(request.getPassword());

        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()
                && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        String username = request.getUsername() != null && !request.getUsername().isBlank()
                ? request.getUsername().trim()
                : generateUsername(email);

        if (userRepository.existsByUsername(username)) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        if (request.getIdCardNumber() != null && !request.getIdCardNumber().isBlank()
                && userRepository.existsByIdCardNumber(request.getIdCardNumber().trim())) {
            throw new AppException(ErrorCode.ID_CARD_EXISTED);
        }

        // 5. Bắt buộc xác thực mã OTP trước khi tạo tài khoản
        boolean preVerified = redeemRegisterTicket(request.getOtpTicket(), email);
        if (!preVerified) {
            throw new AppException(ErrorCode.OTP_INVALID, "Vui lòng xác thực mã OTP gửi về email trước khi tạo tài khoản");
        }

        // 6. Upload ảnh giấy tờ
        String cccdFrontUrl = cloudinaryService.uploadImage(cccdFront, "driveshare/cccd", 10 * 1024 * 1024L);
        String cccdBackUrl = cloudinaryService.uploadImage(cccdBack, "driveshare/cccd", 10 * 1024 * 1024L);
        String gplxFrontUrl = (gplxFront != null && !gplxFront.isEmpty())
                ? cloudinaryService.uploadImage(gplxFront, "driveshare/gplx", 10 * 1024 * 1024L)
                : null;

        // 7. Tạo người dùng với trạng thái PENDING (chờ Admin duyệt CCCD & GPLX)
        Role role = roleRepository.findByRoleName(targetRole)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(targetRole).build()));

        User user = User.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName() != null && !request.getFullName().isBlank() ? request.getFullName().trim() : username)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .idCardNumber(request.getIdCardNumber() != null && !request.getIdCardNumber().isBlank() ? request.getIdCardNumber().trim() : null)
                .status(EUserStatus.PENDING)
                .emailVerified(true)
                .roles(new HashSet<>(Set.of(role)))
                .build();

        User savedUser = userRepository.save(user);

        // 7. Tạo Profile tương ứng
        if (targetRole == ERole.ROLE_OWNER) {
            OwnerProfile profile = OwnerProfile.builder()
                    .user(savedUser)
                    .idCardFrontUrl(cccdFrontUrl)
                    .idCardBackUrl(cccdBackUrl)
                    .bankAccountNumber(request.getBankAccountNumber())
                    .bankName(request.getBankName())
                    .verificationStatus(EVerificationStatus.PENDING)
                    .build();
            ownerProfileRepository.save(profile);
        } else {
            RenterProfile profile = RenterProfile.builder()
                    .user(savedUser)
                    .idCardFrontUrl(cccdFrontUrl)
                    .idCardBackUrl(cccdBackUrl)
                    .licenseNumber(request.getLicenseNumber() != null ? request.getLicenseNumber().trim() : null)
                    .licenseFrontUrl(gplxFrontUrl)
                    .verificationStatus(EVerificationStatus.PENDING)
                    .licenseVerificationStatus(EVerificationStatus.PENDING)
                    .build();
            renterProfileRepository.save(profile);
        }

        log.info("[REGISTER_WITH_DOCS] User #{} ({}) registered with PENDING status. CCCD front={}, back={}, GPLX={}",
                savedUser.getUserId(), savedUser.getEmail(), cccdFrontUrl != null, cccdBackUrl != null, gplxFrontUrl != null);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", "Đăng ký thành công! Email đã được xác thực — hồ sơ của bạn đã được chuyển tới Admin xét duyệt.");
        resp.put("requiresEmailVerification", false);
        resp.put("username", savedUser.getUsername());
        resp.put("email", savedUser.getEmail());
        resp.put("status", savedUser.getStatus().name());
        resp.put("role", targetRole.name());
        return resp;
    }

    @Transactional
    public Map<String, Object> registerOwner(RegisterRequest request) {
        return registerUser(request, ERole.ROLE_OWNER, EUserStatus.PENDING);
    }

    @Transactional
    public Map<String, Object> registerRenter(RegisterRequest request) {
        return registerUser(request, ERole.ROLE_RENTER, EUserStatus.ACTIVE);
    }

    @Transactional
    public Map<String, Object> registerUser(RegisterRequest request, ERole targetRole, EUserStatus initialStatus) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        validatePassword(request.getPassword());

        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()
                && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        String username = request.getUsername() != null && !request.getUsername().isBlank()
                ? request.getUsername().trim()
                : generateUsername(email);

        if (userRepository.existsByUsername(username)) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        if (request.getIdCardNumber() != null && !request.getIdCardNumber().isBlank()
                && userRepository.existsByIdCardNumber(request.getIdCardNumber().trim())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        boolean preVerified = redeemRegisterTicket(request.getOtpTicket(), email);
        if (!preVerified) {
            throw new AppException(ErrorCode.OTP_INVALID, "Vui lòng xác thực mã OTP gửi về email trước khi tạo tài khoản");
        }
        Role role = roleRepository.findByRoleName(targetRole)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(targetRole).build()));

        User user = User.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName() != null && !request.getFullName().isBlank() ? request.getFullName().trim() : username)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .idCardNumber(request.getIdCardNumber() != null && !request.getIdCardNumber().isBlank() ? request.getIdCardNumber().trim() : null)
                .status(initialStatus)
                .emailVerified(true)
                .roles(new HashSet<>(Set.of(role)))
                .build();

        User savedUser = userRepository.save(user);

        if (targetRole == ERole.ROLE_OWNER) {
            OwnerProfile profile = OwnerProfile.builder()
                    .user(savedUser)
                    .bankAccountNumber(request.getBankAccountNumber())
                    .bankName(request.getBankName())
                    .verificationStatus(EVerificationStatus.PENDING)
                    .build();
            ownerProfileRepository.save(profile);
        } else if (targetRole == ERole.ROLE_RENTER) {
            RenterProfile profile = RenterProfile.builder()
                    .user(savedUser)
                    .licenseVerificationStatus(EVerificationStatus.PENDING)
                    .build();
            renterProfileRepository.save(profile);
        }

        String message = "Đăng ký thành công! Email đã được xác thực"
                + (initialStatus == EUserStatus.PENDING ? " — tài khoản đang chờ Admin phê duyệt." : ". Bạn có thể đăng nhập ngay.");

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", message);
        resp.put("requiresEmailVerification", false);
        resp.put("userId", savedUser.getUserId());
        resp.put("username", savedUser.getUsername());
        resp.put("email", savedUser.getEmail());
        resp.put("status", savedUser.getStatus().name());
        resp.put("role", targetRole.name());
        return resp;
    }

    private String generateUsername(String email) {
        String prefix = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
        if (prefix.isBlank()) prefix = "user";
        String username = prefix;
        int counter = 1;
        while (userRepository.existsByUsername(username)) {
            username = prefix + counter;
            counter++;
        }
        return username;
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String clientKey) {
        String identifier = request.getIdentifier().trim().toLowerCase();
        String key = clientKey == null ? "unknown" : clientKey;
        FailureWindow window = ipFailures.computeIfAbsent(key, k -> new FailureWindow());
        if (window.isLimited()) throw new AppException(ErrorCode.RATE_LIMITED);

        User user = userRepository.findByUsernameOrEmail(identifier, identifier).orElse(null);
        if (user == null || user.isDeleted() || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            window.recordFailure();
            if (window.isLimited()) throw new AppException(ErrorCode.RATE_LIMITED);
            throw new AppException(ErrorCode.AUTH_FAILED);
        }

        if (!user.hasVerifiedEmail()) {
            throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (user.getStatus() == EUserStatus.LOCKED) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (user.getStatus() == EUserStatus.BLOCKED) {
            throw new AppException(ErrorCode.USER_BLOCKED_OVERDUE_VIOLATION);
        }
        if (user.getStatus() == EUserStatus.PENDING) {
            throw new AppException(ErrorCode.ACCOUNT_PENDING);
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        window.reset();

        CustomUserDetails details = CustomUserDetails.build(user);
        String access = tokenProvider.generateAccessToken(details);
        String refresh = tokenProvider.generateRefreshToken(details);
        ClaimsData claims = claims(access);
        sessionRepository.save(AuthSession.builder()
                .jti(claims.jti)
                .userId(user.getUserId())
                .tokenVersion(user.getTokenVersion())
                .expiresAt(claims.expiresAt)
                .build());

        List<String> roleList = details.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList());
        String primaryRole = resolvePrimaryRole(roleList);

        return AuthResponse.builder()
                .accessToken(access).refreshToken(refresh).tokenType("Bearer")
                .userId(user.getUserId()).username(user.getUsername()).email(user.getEmail())
                .role(primaryRole)
                .roles(roleList)
                .build();
    }

    private String resolvePrimaryRole(List<String> roles) {
        if (roles == null || roles.isEmpty()) return "ROLE_RENTER";
        if (roles.contains("ROLE_ADMIN")) return "ROLE_ADMIN";
        if (roles.contains("ROLE_OWNER")) return "ROLE_OWNER";
        if (roles.contains("ROLE_STAFF")) return "ROLE_STAFF";
        return "ROLE_RENTER";
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
        String token = request.getRefreshToken().trim();
        if (!tokenProvider.validateToken(token) || !tokenProvider.isRefreshToken(token)) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        Long userId = tokenProvider.getUserIdFromToken(token);
        Long tokenVersion = tokenProvider.getTokenVersionFromToken(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.isDeleted() || user.getStatus() != EUserStatus.ACTIVE || user.getTokenVersion() != tokenVersion) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        CustomUserDetails details = CustomUserDetails.build(user);
        String newAccessToken = tokenProvider.generateAccessToken(details);
        String newRefreshToken = tokenProvider.generateRefreshToken(details);

        ClaimsData claims = claims(newAccessToken);
        sessionRepository.save(AuthSession.builder()
                .jti(claims.jti)
                .userId(user.getUserId())
                .tokenVersion(user.getTokenVersion())
                .expiresAt(claims.expiresAt)
                .build());

        List<String> refreshRoles = details.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList());
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(resolvePrimaryRole(refreshRoles))
                .roles(refreshRoles)
                .build();
    }

    @Transactional
    public void logout(String accessToken) {
        if (accessToken == null || !tokenProvider.validateToken(accessToken)) return;
        sessionRepository.findByJti(tokenProvider.getJtiFromToken(accessToken)).ifPresent(s -> {
            s.setRevokedAt(Instant.now());
            sessionRepository.save(s);
        });
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        validatePassword(request.getNewPassword());
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        String currentPassword = request.getOldPassword() != null ? request.getOldPassword() : request.getCurrentPassword();
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_OLD);
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        sessionRepository.revokeAllByUserId(userId);
    }

    @Transactional
    public void requestChangeEmail(Long userId, ChangeEmailRequest request) {
        if (request == null || request.getNewEmail() == null || request.getNewEmail().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }
        String newEmail = request.getNewEmail().trim().toLowerCase();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getEmail().equalsIgnoreCase(newEmail)) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        if (userRepository.existsByEmail(newEmail)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID();
        EmailChangeToken token = EmailChangeToken.builder()
                .userId(userId)
                .newEmail(newEmail)
                .tokenHash(sha256(rawToken))
                .expiresAt(Instant.now().plusSeconds(EMAIL_CHANGE_MINUTES * 60))
                .build();
        emailChangeTokenRepository.save(token);

        String confirmationUrl = frontendBaseUrl + "#change-email=" + rawToken;
        log.info("Email confirmation link for user {} to change to {} (development): {}", user.getEmail(), newEmail, confirmationUrl);
    }

    @Transactional
    public void confirmChangeEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AppException(ErrorCode.EMAIL_CHANGE_TOKEN_INVALID);
        }
        EmailChangeToken token = emailChangeTokenRepository.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_CHANGE_TOKEN_INVALID));

        if (!token.isUsable()) {
            throw new AppException(ErrorCode.EMAIL_CHANGE_TOKEN_INVALID);
        }

        if (userRepository.existsByEmail(token.getNewEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setEmail(token.getNewEmail());
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        emailChangeTokenRepository.save(token);

        sessionRepository.revokeAllByUserId(user.getUserId());
    }

    // ─────────────────────────────────────────────────────────────
    // OTP EMAIL: xác thực đăng ký
    // ─────────────────────────────────────────────────────────────
    /** Có vé OTP hợp lệ (đã nhập đúng OTP trước khi đăng ký) -> true. Không có vé -> false (luồng cũ). */
    private boolean redeemRegisterTicket(String ticket, String email) {
        if (ticket == null || ticket.isBlank()) return false;
        if (registerOtpService == null) throw new AppException(ErrorCode.OTP_EXPIRED);
        return registerOtpService.redeem(ticket, email);
    }

    private void sendRegisterOtp(String email) {
        otpService.issueAndSend(email, EmailOtp.PURPOSE_REGISTER,
                "[DriveShare] Mã OTP xác thực email đăng ký",
                "Xác thực email đăng ký",
                "Nhập mã dưới đây vào trang đăng ký để xác thực email. Sau khi xác thực, hồ sơ của bạn sẽ được chuyển tới Admin để duyệt.");
    }

    @Transactional(noRollbackFor = AppException.class)
    public Map<String, Object> verifyRegistrationOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isDeleted() || user.hasVerifiedEmail()) {
            // Không tiết lộ email có tồn tại/đã xác thực hay chưa
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        otpService.verify(email, EmailOtp.PURPOSE_REGISTER, request.getOtp());

        user.setEmailVerified(true);
        userRepository.save(user);

        boolean waitingAdmin = user.getStatus() == EUserStatus.PENDING;
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", waitingAdmin
                ? "Xác thực email thành công! Hồ sơ của bạn đã được gửi tới Admin và đang chờ duyệt. Vui lòng đợi xét duyệt trước khi đăng nhập."
                : "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.");
        resp.put("status", user.getStatus().name());
        resp.put("waitingAdminApproval", waitingAdmin);
        return resp;
    }

    /** Gửi lại OTP đăng ký. Luôn trả về như nhau để không lộ email nào đã đăng ký. */
    @Transactional
    public void resendRegistrationOtp(ResendOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isDeleted() || user.hasVerifiedEmail()) return;
        if (otpService.isInCooldown(email, EmailOtp.PURPOSE_REGISTER)) return;
        sendRegisterOtp(email);
    }

    // ─────────────────────────────────────────────────────────────
    // OTP EMAIL: quên mật khẩu (email -> OTP -> reset token -> mật khẩu mới)
    // ─────────────────────────────────────────────────────────────
    // Không dùng @Transactional ở đây: lỗi gửi mail bị nuốt, tránh UnexpectedRollbackException do transaction con đánh dấu rollback-only.
    public ResetResponse forgotPassword(ForgotPasswordRequest request) {
        String generic = "Nếu email tồn tại, hệ thống đã gửi mã OTP đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.";
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isDeleted() || !user.hasVerifiedEmail()) {
            return ResetResponse.builder().message(generic).build();
        }
        if (otpService.isInCooldown(email, EmailOtp.PURPOSE_RESET_PASSWORD)) {
            return ResetResponse.builder().message(generic).build();
        }
        try {
            otpService.issueAndSend(email, EmailOtp.PURPOSE_RESET_PASSWORD,
                    "[DriveShare] Mã OTP đặt lại mật khẩu",
                    "Đặt lại mật khẩu",
                    "Bạn vừa yêu cầu đặt lại mật khẩu. Nhập mã dưới đây để tiếp tục.");
        } catch (AppException e) {
            // Không báo lỗi ra ngoài để tránh lộ việc email có tồn tại hay không
            log.error("Không gửi được OTP quên mật khẩu tới {}: {}", email, e.getMessage());
        }
        return ResetResponse.builder().message(generic).build();
    }

    /** Bước 2: nhập đúng OTP -> cấp reset token dùng một lần để đổi mật khẩu. */
    @Transactional(noRollbackFor = AppException.class)
    public ResetTokenResponse verifyResetOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isDeleted()) throw new AppException(ErrorCode.OTP_EXPIRED);
        otpService.verify(email, EmailOtp.PURPOSE_RESET_PASSWORD, request.getOtp());

        String raw = UUID.randomUUID().toString() + UUID.randomUUID();
        resetTokenRepository.save(PasswordResetToken.builder()
                .userId(user.getUserId()).tokenHash(sha256(raw))
                .expiresAt(Instant.now().plusSeconds(RESET_TOKEN_SECONDS)).build());
        return ResetTokenResponse.builder().resetToken(raw).expiresInSeconds(RESET_TOKEN_SECONDS).build();
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        validatePassword(request.getNewPassword());
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }
        PasswordResetToken reset = resetTokenRepository.findByTokenHash(sha256(request.getToken()))
                .orElseThrow(() -> new AppException(ErrorCode.RESET_TOKEN_INVALID));
        if (!reset.isUsable()) throw new AppException(ErrorCode.RESET_TOKEN_INVALID);
        User user = userRepository.findById(reset.getUserId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        sessionRepository.revokeAllByUserId(user.getUserId());
        reset.setUsedAt(Instant.now());
        resetTokenRepository.save(reset);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingOwners() {
        Role ownerRole = roleRepository.findByRoleName(ERole.ROLE_OWNER)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        return userRepository.findAll().stream()
                .filter(u -> !u.isDeleted() && u.hasVerifiedEmail() && u.getStatus() == EUserStatus.PENDING && u.getRoles().contains(ownerRole))
                .map(u -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("userId", u.getUserId());
                    map.put("username", u.getUsername());
                    map.put("email", u.getEmail());
                    map.put("fullName", u.getFullName());
                    map.put("phone", u.getPhone());
                    map.put("idCardNumber", u.getIdCardNumber());
                    map.put("status", u.getStatus().name());
                    map.put("createdAt", u.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> approveOwner(Long userId, Long adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus(EUserStatus.ACTIVE);
        userRepository.save(user);

        ownerProfileRepository.findById(userId).ifPresent(p -> {
            p.setVerificationStatus(EVerificationStatus.VERIFIED);
            p.setVerifiedBy(adminUserId);
            p.setVerifiedAt(Instant.now());
            ownerProfileRepository.save(p);
        });

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", "Phê duyệt tài khoản Chủ xe thành công. Chủ xe hiện có thể đăng nhập.");
        resp.put("userId", user.getUserId());
        resp.put("email", user.getEmail());
        resp.put("status", user.getStatus().name());
        return resp;
    }

    @Transactional(readOnly = true)
    public User currentUser(Long userId) { return userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)); }

    public void validatePassword(String password) {
        if (password == null || password.length() < 8 || !password.matches(".*[A-Z].*") || !password.matches(".*[a-z].*") || !password.matches(".*\\d.*")) {
            throw new AppException(ErrorCode.WEAK_PASSWORD);
        }
    }

    private ClaimsData claims(String token) {
        var claims = tokenProvider.getClaims(token);
        return new ClaimsData(claims.getId(), claims.getExpiration().toInstant());
    }

    private record ClaimsData(String jti, Instant expiresAt) {}

    private static final class FailureWindow {
        private int count;
        private Instant limitedUntil = Instant.MIN;
        synchronized void recordFailure() {
            if (Instant.now().isAfter(limitedUntil)) count = 0;
            count++;
            if (count >= MAX_FAILED_ATTEMPTS) limitedUntil = Instant.now().plusSeconds(LOCK_MINUTES * 60);
        }
        synchronized boolean isLimited() {
            if (Instant.now().isAfter(limitedUntil)) { count = 0; return false; }
            return limitedUntil.isAfter(Instant.now());
        }
        synchronized void reset() { count = 0; limitedUntil = Instant.MIN; }
    }

    public static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
