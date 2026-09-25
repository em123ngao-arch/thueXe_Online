package com.driveshare.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final boolean isConfigured;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    public CloudinaryService(
            @Value("${cloudinary.cloud-name:demo}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret
    ) {
        if (apiKey != null && !apiKey.isBlank() && apiSecret != null && !apiSecret.isBlank()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
            this.isConfigured = true;
            log.info("Cloudinary configured successfully for cloud: {}", cloudName);
        } else {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "secure", true
            ));
            this.isConfigured = false;
            log.warn("Cloudinary API credentials not provided. Mock upload URLs will be generated in development mode.");
        }
    }

    /**
     * Validate file format and size
     */
    public void validateImageFile(MultipartFile file, long maxSizeBytes) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (file.getSize() > maxSizeBytes) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        boolean validContentType = contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase());
        boolean validExtension = originalFilename != null && (
                originalFilename.toLowerCase().endsWith(".jpg")
                        || originalFilename.toLowerCase().endsWith(".jpeg")
                        || originalFilename.toLowerCase().endsWith(".png")
        );

        if (!validContentType && !validExtension) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
    }

    /**
     * Upload image to Cloudinary (or return dev URL if not configured)
     */
    public String uploadImage(MultipartFile file, String folder, long maxSizeBytes) {
        validateImageFile(file, maxSizeBytes);

        String originalFilename = file.getOriginalFilename();
        String cleanName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "image.jpg";
        String publicId = folder + "/" + UUID.randomUUID() + "_" + cleanName;

        if (isConfigured) {
            try {
                @SuppressWarnings("rawtypes")
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", "image",
                        "overwrite", true
                ));
                return uploadResult.get("secure_url").toString();
            } catch (IOException e) {
                log.error("Cloudinary upload failed: {}", e.getMessage(), e);
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }
        }

        // Fallback for development without API keys
        String fallbackUrl = "https://res.cloudinary.com/driveshare/image/upload/v1726750000/" + publicId;
        log.info("Development mode: generated mock image URL: {}", fallbackUrl);
        return fallbackUrl;
    }
}
