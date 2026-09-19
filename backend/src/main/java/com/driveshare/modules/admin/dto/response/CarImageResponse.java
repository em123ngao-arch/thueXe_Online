package com.driveshare.modules.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarImageResponse {
    private Long imageId;
    private String imageUrl;
    private Boolean isThumbnail;
    private Instant createdAt;
}
