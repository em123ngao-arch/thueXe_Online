package com.driveshare.modules.oauth2.handler;

import com.driveshare.common.enums.EAuthProvider;
import com.driveshare.modules.oauth2.service.OAuth2Service;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.UserRepository;
import com.driveshare.security.CustomUserDetails;
import com.driveshare.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final OAuth2Service oAuth2Service;
    private final JwtTokenProvider jwtTokenProvider;
    private final com.driveshare.modules.auth.repository.AuthSessionRepository authSessionRepository;

    @Value("${driveshare.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String googleId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        log.info("Google OAuth2 login successful for email: {}, googleId: {}", email, googleId);

        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            // BR-03-7: Email Google trùng tài khoản local
            if (existingUser.getAuthProvider() == EAuthProvider.LOCAL) {
                log.warn("Email {} đã đăng ký bằng tài khoản Local, từ chối đăng nhập Google", email);
                String redirectUrl = frontendUrl + "/login.html?error=" + URLEncoder.encode("Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu!", StandardCharsets.UTF_8);
                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
                return;
            }

            // BR-03-6: Đăng nhập Google lần thứ 2 trở đi -> vào thẳng, không hỏi role
            CustomUserDetails userDetails = CustomUserDetails.build(existingUser);
            String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

            // Lưu session vào DB để JwtAuthenticationFilter xác thực được
            io.jsonwebtoken.Claims claims = jwtTokenProvider.getClaims(accessToken);
            authSessionRepository.save(com.driveshare.modules.auth.entity.AuthSession.builder()
                    .jti(claims.getId())
                    .userId(existingUser.getUserId())
                    .tokenVersion(existingUser.getTokenVersion())
                    .expiresAt(claims.getExpiration().toInstant())
                    .build());

            String redirectUrl = frontendUrl + "/oauth2-callback.html?token=" + accessToken + "&isNewUser=false";
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } else {
            // BR-03-2: Tài khoản Google lần đầu -> Tạo token tạm và chuyển về FE để chọn Role
            String tempToken = oAuth2Service.createTempGoogleToken(googleId, email, name, picture);

            String redirectUrl = frontendUrl + "/oauth2-callback.html?token=" + tempToken + "&isNewUser=true&needRole=true";
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }
}
