package com.driveshare.modules.rental.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Yêu cầu gửi đánh giá sau chuyến đi (Sprint 3 - Issue #26)")
public record CreateReviewRequest(
        @Schema(description = "Số sao đánh giá (1 đến 5)", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Số sao đánh giá không được để trống")
        @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
        @Max(value = 5, message = "Đánh giá tối đa 5 sao")
        Integer rating,

        @Schema(description = "Nội dung nhận xét, cảm nghĩ", example = "Xe chạy rất êm, máy lạnh mát, chủ xe hỗ trợ nhiệt tình.")
        String comment
) {}
