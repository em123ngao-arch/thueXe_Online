package com.driveshare.modules.rental.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request DTO cho việc chủ xe từ chối yêu cầu thuê xe (CRP-48)")
public class RejectRentalRequest {

    @NotBlank(message = "Vui lòng cung cấp lý do từ chối yêu cầu thuê xe")
    @Schema(description = "Lý do từ chối đơn thuê", example = "Xe bận bảo dưỡng định kỳ đột xuất")
    private String reason;
}
