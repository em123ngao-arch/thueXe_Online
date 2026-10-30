package com.driveshare.modules.oauth2.adapter.in.web;

import com.driveshare.modules.oauth2.application.port.in.OAuth2UseCase;
import com.driveshare.modules.oauth2.domain.model.OAuth2LoginResult;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final OAuth2UseCase oAuth2UseCase;

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

        OAuth2LoginResult result = oAuth2UseCase.processOAuth2Login(googleId, email, name, picture);

        if (result.isLocalConflict()) {
            String redirectUrl = frontendUrl + "/login.html?error=" + URLEncoder.encode(result.errorMessage(), StandardCharsets.UTF_8);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            return;
        }

        if (result.isNewUser()) {
            String redirectUrl = frontendUrl + "/oauth2-callback.html?token=" + result.token() + "&isNewUser=true&needRole=true";
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } else {
            String redirectUrl = frontendUrl + "/oauth2-callback.html?token=" + result.token() + "&isNewUser=false";
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }
}

