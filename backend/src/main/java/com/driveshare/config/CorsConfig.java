package com.driveshare.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

        @Bean
        public CorsFilter corsFilter() {
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                // Config CORS cho API endpoints
                CorsConfiguration apiConfig = new CorsConfiguration();
                apiConfig.setAllowCredentials(true);
                apiConfig.setAllowedOriginPatterns(List.of(
                                "http://localhost:*",
                                "http://127.0.0.1:*",
                                "https://*.onrender.com"
                ));
                apiConfig.setAllowedHeaders(Arrays.asList(
                                "Origin",
                                "Content-Type",
                                "Accept",
                                "Authorization",
                                "X-Requested-With",
                                "Access-Control-Request-Method",
                                "Access-Control-Request-Headers"));
                apiConfig.setExposedHeaders(Arrays.asList(
                                "Authorization",
                                "Content-Disposition"));
                apiConfig.setAllowedMethods(Arrays.asList(
                                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                source.registerCorsConfiguration("/api/**", apiConfig);

                // Config CORS riêng cho /uploads/** - Cho phép mọi origin load ảnh (vì img tag không gửi cookie)
                CorsConfiguration uploadsConfig = new CorsConfiguration();
                uploadsConfig.setAllowCredentials(false); // Img tag không cần credential
                uploadsConfig.addAllowedOriginPattern("*");  // Cho phép mọi origin xem ảnh
                uploadsConfig.setAllowedMethods(Arrays.asList("GET", "HEAD", "OPTIONS"));
                uploadsConfig.setAllowedHeaders(Arrays.asList("Origin", "Accept", "Range"));
                uploadsConfig.addExposedHeader("Content-Length");
                source.registerCorsConfiguration("/uploads/**", uploadsConfig);

                return new CorsFilter(source);
        }
}

