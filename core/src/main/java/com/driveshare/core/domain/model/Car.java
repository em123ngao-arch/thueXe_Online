package com.driveshare.core.domain.model;

import com.driveshare.core.domain.vo.CarStatus;
import com.driveshare.core.domain.vo.Money;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class Car {
    private final Long id;
    private final Long ownerId;
    private String brand;
    private String model;
    private String licensePlate;
    private int seats;
    private String transmission;
    private String fuelType;
    private Money pricePerDay;
    private CarStatus status;
    private String address;
    private String description;
    private List<String> imageUrls;
    private final Instant createdAt;

    public Car(Long id, Long ownerId, String brand, String model, String licensePlate,
               int seats, String transmission, String fuelType, Money pricePerDay,
               CarStatus status, String address, String description, List<String> imageUrls,
               Instant createdAt) {
        this.id = id;
        this.ownerId = Objects.requireNonNull(ownerId, "ownerId must not be null");
        this.brand = Objects.requireNonNull(brand, "brand must not be null");
        this.model = Objects.requireNonNull(model, "model must not be null");
        this.licensePlate = Objects.requireNonNull(licensePlate, "licensePlate must not be null");
        this.seats = seats;
        this.transmission = transmission;
        this.fuelType = fuelType;
        this.pricePerDay = Objects.requireNonNull(pricePerDay, "pricePerDay must not be null");
        this.status = status != null ? status : CarStatus.AVAILABLE;
        this.address = address;
        this.description = description;
        this.imageUrls = imageUrls != null ? imageUrls : Collections.emptyList();
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public boolean isAvailable() {
        return this.status == CarStatus.AVAILABLE;
    }

    public void markAsRented() {
        if (!isAvailable()) {
            throw new IllegalStateException("Car is not available for rent. Current status: " + status);
        }
        this.status = CarStatus.RENTED;
    }

    public void markAsAvailable() {
        this.status = CarStatus.AVAILABLE;
    }

    public void updateStatus(CarStatus newStatus) {
        this.status = Objects.requireNonNull(newStatus, "newStatus must not be null");
    }

    public Long getId() { return id; }
    public Long getOwnerId() { return ownerId; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public String getLicensePlate() { return licensePlate; }
    public int getSeats() { return seats; }
    public String getTransmission() { return transmission; }
    public String getFuelType() { return fuelType; }
    public Money getPricePerDay() { return pricePerDay; }
    public CarStatus getStatus() { return status; }
    public String getAddress() { return address; }
    public String getDescription() { return description; }
    public List<String> getImageUrls() { return imageUrls; }
    public Instant getCreatedAt() { return createdAt; }
}
