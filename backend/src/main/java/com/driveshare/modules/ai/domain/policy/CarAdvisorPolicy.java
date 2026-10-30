package com.driveshare.modules.ai.domain.policy;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Pure Java Domain Policy for AI Car Advisor rules.
 * Governs deposit rates (30%), fee calculation, and emergency handover detection.
 */
public final class CarAdvisorPolicy {

    public static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.30");
    public static final BigDecimal REMAINING_RATE = new BigDecimal("0.70");

    private static final List<String> EMERGENCY_KEYWORDS = Arrays.asList(
            "tai nạn", "cứu hộ", "khẩn cấp", "hỏng xe", "gặp sự cố", "bị hỏng",
            "va chạm", "cháy xe", "nổ lốp", "mất lái", "công an", "cảnh sát"
    );

    private static final List<String> HANDOVER_KEYWORDS = Arrays.asList(
            "gặp nhân viên", "nói chuyện với người", "gặp cskh", "liên hệ hỗ trợ",
            "tổng đài viên", "trực tiếp hỗ trợ", "khiếu nại", "lừa đảo", "tranh chấp"
    );

    private CarAdvisorPolicy() {}

    /**
     * Checks if the message content implies an emergency situation requiring immediate SOS protocol.
     */
    public static boolean isEmergencySituation(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        String lower = message.toLowerCase(Locale.ROOT);
        return EMERGENCY_KEYWORDS.stream().anyMatch(lower::contains);
    }

    /**
     * Checks if the user explicitly asks for human support / handover.
     */
    public static boolean isHandoverRequested(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        String lower = message.toLowerCase(Locale.ROOT);
        return HANDOVER_KEYWORDS.stream().anyMatch(lower::contains);
    }

    /**
     * Pure business logic for calculating rental deposit (VietQR 30% rule).
     */
    public static BigDecimal calculateDepositAmount(BigDecimal totalPrice) {
        if (totalPrice == null || totalPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return totalPrice.multiply(DEPOSIT_RATE).setScale(0, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateRemainingAmount(BigDecimal totalPrice) {
        if (totalPrice == null || totalPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return totalPrice.multiply(REMAINING_RATE).setScale(0, RoundingMode.HALF_UP);
    }
}

