package com.driveshare.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final boolean isConfigured;
    private final String uploadDir;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public CloudinaryService(
            @Value("${cloudinary.cloud-name:demo}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${driveshare.upload.dir:uploads}") String uploadDir
    ) {
        this.uploadDir = uploadDir;
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
            log.info("Cloudinary API credentials not provided. Hybrid Local Storage enabled (saving files to: {}).", uploadDir);
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
                        || originalFilename.toLowerCase().endsWith(".webp")
        );

        if (!validContentType && !validExtension) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
    }

    /**
     * Upload image to Cloudinary or save to local disk if Cloudinary is not configured
     */
    public String uploadImage(MultipartFile file, String folder, long maxSizeBytes) {
        validateImageFile(file, maxSizeBytes);

        String originalFilename = file.getOriginalFilename();
        String cleanName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "image.jpg";
        String uniqueId = UUID.randomUUID().toString().replace("-", "");
        String publicId = folder + "/" + uniqueId + "_" + cleanName;

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

        // Hybrid Local Storage: save physically to local disk
        try {
            Path targetDir = Paths.get(uploadDir, folder).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String fileName = uniqueId + "_" + cleanName;
            Path targetFile = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String accessUrl = buildFileUrl(folder, fileName);
            log.info("Saved image to local disk: {}, public access URL: {}", targetFile, accessUrl);
            return accessUrl;
        } catch (IOException e) {
            log.error("Local file storage failed: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Không thể lưu trữ tập tin hình ảnh vào máy chủ");
        }
    }

    private String buildFileUrl(String folder, String fileName) {
        String normalizedFolder = folder.replace("\\", "/");
        if (!normalizedFolder.startsWith("/")) {
            normalizedFolder = "/" + normalizedFolder;
        }
        if (!normalizedFolder.endsWith("/")) {
            normalizedFolder = normalizedFolder + "/";
        }
        String relativePath = "/uploads" + normalizedFolder + fileName;

        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(relativePath)
                    .toUriString();
        } catch (Exception e) {
            return "http://localhost:8080" + relativePath;
        }
    }
}

