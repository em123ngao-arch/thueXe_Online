package com.driveshare.modules.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO phản hồi dạng "thẻ xe" (Car Card) cho AI Chatbot.
 * Frontend sử dụng metadata này để render thẻ xe sinh động ngay trong ô chat.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarCardDto {

    /** ID của xe trong hệ thống */
    private Long carId;

    /** Tên hiển thị: "Toyota Camry 2023" */
    private String name;

    /** Hãng xe */
    private String brand;

    /** Model xe */
    private String model;

    /** Năm sản xuất */
    private Integer year;

    /** Số chỗ ngồi */
    private Integer seats;

    /** Loại hộp số: "Tự động" / "Số sàn" */
    private String transmission;

    /** Loại nhiên liệu: "Xăng" / "Dầu" / "Điện" / "Hybrid" */
    private String fuelType;

    /** Giá thuê mỗi ngày (VND) */
    private BigDecimal pricePerDay;

    /** Giá thuê đã format: "900.000 đ" */
    private String priceFormatted;

    /** URL ảnh đại diện xe */
    private String thumbnailUrl;

    /** Địa chỉ nhận xe */
    private String address;

    /** Tỉnh/Thành phố */
    private String province;

    /** Điểm đánh giá trung bình (0-5) */
    private BigDecimal rating;

    /** Số lượt đánh giá */
    private Integer ratingCount;

    /** Có dịch vụ tài xế không (Sprint 3) */
    private Boolean hasDriverService;

    /** Phí tài xế/ngày (VND) */
    private BigDecimal driverFeePerDay;

    /** Phí tài xế đã format: "500.000 đ" */
    private String driverFeeFormatted;

    /** Link đặt xe trên frontend */
    private String bookingUrl;
}
