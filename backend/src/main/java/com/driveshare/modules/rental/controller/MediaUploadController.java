package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media Management", description = "API tải lên đa phương tiện (ảnh & video 50MB) lên Cloudinary")
@SecurityRequirement(name = "bearerAuth")
public class MediaUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tải lên đa phương tiện (Sprint 3)", description = "Hỗ trợ ảnh JPG/PNG/WEBP và video MP4/MOV lên tới 50MB lưu vào Cloudinary")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "driveshare/disputes") String folder
    ) {
        String url = cloudinaryService.uploadMedia(file, folder);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "url", url,
                "original_filename", file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown",
                "size_bytes", String.valueOf(file.getSize())
        )));
    }
}
