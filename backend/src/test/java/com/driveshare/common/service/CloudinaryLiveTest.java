package com.driveshare.common.service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class CloudinaryLiveTest {

    @Disabled("Chạy thủ công khi cần kiểm thử kết nối trực tiếp Cloudinary")
    @Test
    void testLiveUploadToCloudinary() {
        String cloudName = System.getenv().getOrDefault("CLOUDINARY_CLOUD_NAME", "demo");
        String apiKey = System.getenv().getOrDefault("CLOUDINARY_API_KEY", "");
        String apiSecret = System.getenv().getOrDefault("CLOUDINARY_API_SECRET", "");
        CloudinaryService service = new CloudinaryService(
                cloudName,
                apiKey,
                apiSecret,
                "uploads"
        );

        // 1x1 transparent PNG bytes
        byte[] pngBytes = new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4,
                (byte) 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
                0x54, 0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
                0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte) 0xB4, 0x00,
                0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE,
                0x42, 0x60, (byte) 0x82
        };

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-sample.png",
                "image/png",
                pngBytes
        );

        String uploadedUrl = service.uploadImage(file, "test_folder", 5 * 1024 * 1024);
        System.out.println("UPLOADED CLOUDINARY URL = " + uploadedUrl);
        assertNotNull(uploadedUrl);
        assertTrue(uploadedUrl.contains("cloudinary.com") || uploadedUrl.contains("res.cloudinary.com"));
        assertTrue(uploadedUrl.contains("ajutfp98"));
    }
}
