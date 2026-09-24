package com.driveshare.modules.car.dto.response;

import com.driveshare.modules.car.entity.CarImage;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response DTO thông tin ảnh của xe")
public class CarImageResponse {

    @Schema(description = "ID ảnh", example = "1")
    private Long imageId;

    @Schema(description = "URL ảnh", example = "https://res.cloudinary.com/driveshare/image/upload/car_1.jpg")
    private String imageUrl;

    @Schema(description = "Có phải ảnh đại diện (thumbnail) không", example = "true")
    private Boolean isThumbnail;

    @Schema(description = "Thời gian tải lên")
    private Instant createdAt;

    public static CarImageResponse fromEntity(CarImage image) {
        if (image == null) return null;
        return CarImageResponse.builder()
                .imageId(image.getImageId())
                .imageUrl(image.getImageUrl())
                .isThumbnail(image.getIsThumbnail())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
