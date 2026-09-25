package com.driveshare.modules.car.dto.request;

import com.driveshare.common.enums.ECarStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO cho API PATCH /api/v1/cars/{id}/status (CRP-24).
 * Owner chỉ được phép chuyển qua lại giữa ACTIVE và INACTIVE.
 * Việc validate giá trị hợp lệ được thực hiện trong Service.
 */
@Data
public class CarStatusUpdateRequest {

    @NotNull(message = "Trạng thái mới không được để trống")
    private ECarStatus status;
}
