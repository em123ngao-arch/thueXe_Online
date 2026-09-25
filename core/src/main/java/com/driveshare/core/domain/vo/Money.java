package com.driveshare.core.domain.vo;

import java.math.BigDecimal;
import java.util.Objects;

public record Money(BigDecimal amount, String currency) {
    public Money {
        Objects.requireNonNull(amount, "Amount must not be null");
        Objects.requireNonNull(currency, "Currency must not be null");
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
    }

    public static Money vnd(BigDecimal amount) {
        return new Money(amount, "VND");
    }

    public static Money vnd(long amount) {
        return new Money(BigDecimal.valueOf(amount), "VND");
    }
}
