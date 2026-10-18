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
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class CloudinaryService {

    public static final long DEFAULT_MAX_MEDIA_SIZE = 50 * 1024 * 1024L; // 50MB
    public static final String DEFAULT_DISPUTE_FOLDER = "driveshare/disputes";

    private final Cloudinary cloudinary;
    private final boolean isConfigured;
    private final String uploadDir;

    private static final List<String> DANGEROUS_EXTENSIONS = Arrays.asList(
            ".exe", ".sh", ".php", ".bat", ".cmd", ".msi", ".jar", ".jsp",
            ".asp", ".aspx", ".pl", ".cgi", ".py", ".js", ".vbs", ".scr", ".pif"
    );

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-matroska"
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
     * Validate image file format and size (tương thích ngược với các module Car, User)
     */
    public void validateImageFile(MultipartFile file, long maxSizeBytes) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Tập tin không được để trống");
        }

        if (file.getSize() > maxSizeBytes) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED, "Kích thước tập tin vượt quá giới hạn");
        }

        String originalFilename = file.getOriginalFilename();
        checkDangerousFile(originalFilename);

        String contentType = file.getContentType();
        boolean validContentType = contentType != null && ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase(Locale.ROOT));
        boolean validExtension = originalFilename != null && (
                originalFilename.toLowerCase(Locale.ROOT).endsWith(".jpg")
                        || originalFilename.toLowerCase(Locale.ROOT).endsWith(".jpeg")
                        || originalFilename.toLowerCase(Locale.ROOT).endsWith(".png")
                        || originalFilename.toLowerCase(Locale.ROOT).endsWith(".webp")
        );

        if (!validContentType && !validExtension) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE, "Định dạng hình ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP");
        }

        validateFileContentHeader(file, originalFilename);
    }

    /**
     * Kiểm tra và ngăn chặn các định dạng tập tin thực thi nguy hiểm (.exe, .sh, .php...)
     */
    private void checkDangerousFile(String originalFilename) {
        if (originalFilename != null) {
            String lower = originalFilename.toLowerCase(Locale.ROOT);
            for (String ext : DANGEROUS_EXTENSIONS) {
                if (lower.endsWith(ext) || lower.contains(ext + ".")) {
                    log.warn("Blocked dangerous file upload attempt: {}", originalFilename);
                    throw new AppException(ErrorCode.INVALID_FILE_TYPE, "Tập tin thực thi độc hại không được phép tải lên hệ thống: " + ext);
                }
            }
        }
    }

    /**
     * Xác thực tệp đa phương tiện (Ảnh hoặc Video lên tới 50MB) - Phục vụ Sprint 3 Incident Disputes
     */
    public void validateMediaFile(MultipartFile file, long maxSizeBytes) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Tập tin bằng chứng không được để trống");
        }

        if (file.getSize() > maxSizeBytes) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED, "Kích thước tập tin vượt quá giới hạn tối đa cho phép (" + (maxSizeBytes / (1024 * 1024)) + "MB)");
        }

        String originalFilename = file.getOriginalFilename();
        checkDangerousFile(originalFilename);

        String lowerName = originalFilename != null ? originalFilename.toLowerCase(Locale.ROOT) : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";

        boolean isAllowedImage = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png") || lowerName.endsWith(".webp")
                || ALLOWED_IMAGE_TYPES.contains(contentType);

        boolean isAllowedVideo = lowerName.endsWith(".mp4") || lowerName.endsWith(".mov")
                || ALLOWED_VIDEO_TYPES.contains(contentType);

        if (!isAllowedImage && !isAllowedVideo) {
            log.warn("Rejected unsupported file type: name={}, contentType={}", originalFilename, contentType);
            throw new AppException(ErrorCode.INVALID_FILE_TYPE, "Định dạng tập tin không được hỗ trợ. Chỉ chấp nhận ảnh (JPG, PNG, WEBP) hoặc video (MP4, MOV)");
        }

        validateFileContentHeader(file, originalFilename);
    }

    /**
     * Kiểm tra tính toàn vẹn và chống giả mạo Header (Content-Type Spoofing Detection)
     */
    private void validateFileContentHeader(MultipartFile file, String originalFilename) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[16];
            int read = is.read(header);
            if (read >= 4) {
                // Kiểm tra chữ ký file thực thi Windows PE / DOS (.exe, .dll) -> Magic bytes "MZ"
                if (header[0] == 0x4D && header[1] == 0x5A) {
                    throw new AppException(ErrorCode.INVALID_FILE_TYPE, "Phát hiện tập tin thực thi nhị phân giả mạo đuôi file");
                }
                // Kiểm tra script PHP / Shell (<?php hoặc #!)
                String textStart = new String(header, 0, Math.min(read, 8)).toLowerCase(Locale.ROOT);
                if (textStart.startsWith("<?php") || textStart.startsWith("#!/") || textStart.startsWith("<script")) {
                    throw new AppException(ErrorCode.INVALID_FILE_TYPE, "Phát hiện mã kịch bản độc hại giả mạo đuôi file");
                }
            }
        } catch (IOException e) {
            log.warn("Could not read file header for spoofing check: {}", e.getMessage());
        }
    }

    /**
     * Upload ảnh lên Cloudinary (chuẩn Sprint 1 & 2)
     */
    public String uploadImage(MultipartFile file, String folder, long maxSizeBytes) {
        validateImageFile(file, maxSizeBytes);
        return performUpload(file, folder, "image");
    }

    /**
     * Upload đa phương tiện (Ảnh hoặc Video lên tới 50MB) - Hỗ trợ Sprint 3 Incident Disputes
     */
    public String uploadMedia(MultipartFile file, String folder) {
        return uploadMedia(file, folder, DEFAULT_MAX_MEDIA_SIZE);
    }

    public String uploadMedia(MultipartFile file, String folder, long maxSizeBytes) {
        validateMediaFile(file, maxSizeBytes);

        String targetFolder = (folder != null && !folder.isBlank()) ? folder : DEFAULT_DISPUTE_FOLDER;
        String originalFilename = file.getOriginalFilename();
        String lowerName = originalFilename != null ? originalFilename.toLowerCase(Locale.ROOT) : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";

        String resourceType = (lowerName.endsWith(".mp4") || lowerName.endsWith(".mov") || contentType.startsWith("video/"))
                ? "video"
                : "image";

        return performUpload(file, targetFolder, resourceType);
    }

    private String performUpload(MultipartFile file, String folder, String resourceType) {
        String originalFilename = file.getOriginalFilename();
        String cleanName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "media_file";
        String uniqueId = UUID.randomUUID().toString().replace("-", "");
        String publicId = folder + "/" + uniqueId + "_" + cleanName;

        if (isConfigured) {
            try {
                @SuppressWarnings("rawtypes")
                Map options = ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", resourceType,
                        "overwrite", true
                );

                if ("image".equals(resourceType)) {
                    options.put("quality", "auto");
                    options.put("fetch_format", "auto");
                }

                @SuppressWarnings("rawtypes")
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
                String secureUrl = uploadResult.get("secure_url").toString();
                log.info("Uploaded {} to Cloudinary successfully: {}", resourceType, secureUrl);
                return secureUrl;
            } catch (Exception e) {
                log.error("Cloudinary upload failed: {}", e.getMessage(), e);
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Không thể kết nối hoặc tải tệp lên máy chủ Cloudinary: " + e.getMessage());
            }
        }

        // Hybrid Local Storage fallback
        try {
            Path targetDir = Paths.get(uploadDir, folder).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String fileName = uniqueId + "_" + cleanName;
            Path targetFile = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String accessUrl = buildFileUrl(folder, fileName);
            log.info("Saved {} to local disk: {}, public access URL: {}", resourceType, targetFile, accessUrl);
            return accessUrl;
        } catch (IOException e) {
            log.error("Local file storage failed: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Không thể lưu trữ tập tin vào máy chủ nội bộ");
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
