package com.driveshare.modules.user.adapter.out.storage;

import com.driveshare.common.service.CloudinaryService;
import com.driveshare.modules.user.application.port.out.UserProfileStoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@RequiredArgsConstructor
public class CloudinaryUserProfileStorageAdapter implements UserProfileStoragePort {

    private final CloudinaryService cloudinaryService;

    @Override
    public String uploadAvatar(MultipartFile file) {
        return cloudinaryService.uploadImage(file, "driveshare/avatars", 5 * 1024 * 1024L);
    }

    @Override
    public String uploadCccd(MultipartFile file) {
        return cloudinaryService.uploadImage(file, "driveshare/cccd", 10 * 1024 * 1024L);
    }

    @Override
    public String uploadGplx(MultipartFile file) {
        return cloudinaryService.uploadImage(file, "driveshare/gplx", 10 * 1024 * 1024L);
    }
}
