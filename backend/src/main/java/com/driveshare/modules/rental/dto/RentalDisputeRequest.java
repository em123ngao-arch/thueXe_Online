package com.driveshare.modules.rental.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalDisputeRequest {

    @NotBlank(message = "Lý do khiếu nại không được để trống")
    private String reason;

    private List<MultipartFile> evidenceFiles;
}
