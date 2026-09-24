package com.driveshare.core.domain.model;

import com.driveshare.core.domain.vo.Money;
import com.driveshare.core.domain.vo.RentalStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

public class Rental {
    private final Long id;
    private final Long carId;
    private final Long renterId;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final Money totalAmount;
    private final Money depositAmount;
    private RentalStatus status;
    private final Instant createdAt;

    public Rental(Long id, Long carId, Long renterId, LocalDate startDate, LocalDate endDate,
                  Money totalAmount, Money depositAmount, RentalStatus status, Instant createdAt) {
        this.id = id;
        this.carId = Objects.requireNonNull(carId, "carId must not be null");
        this.renterId = Objects.requireNonNull(renterId, "renterId must not be null");
        this.startDate = Objects.requireNonNull(startDate, "startDate must not be null");
        this.endDate = Objects.requireNonNull(endDate, "endDate must not be null");
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate cannot be before startDate");
        }
        this.totalAmount = Objects.requireNonNull(totalAmount, "totalAmount must not be null");
        this.depositAmount = depositAmount != null ? depositAmount : Money.vnd(0);
        this.status = status != null ? status : RentalStatus.PENDING;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public long calculateRentalDays() {
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    public void confirm() {
        this.status = RentalStatus.CONFIRMED;
    }

    public void cancel() {
        if (this.status == RentalStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed rental");
        }
        this.status = RentalStatus.CANCELLED;
    }

    public Long getId() { return id; }
    public Long getCarId() { return carId; }
    public Long getRenterId() { return renterId; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public Money getTotalAmount() { return totalAmount; }
    public Money getDepositAmount() { return depositAmount; }
    public RentalStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
