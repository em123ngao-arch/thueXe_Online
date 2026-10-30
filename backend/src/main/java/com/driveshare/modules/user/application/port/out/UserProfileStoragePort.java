package com.driveshare.modules.user.application.port.out;

import org.springframework.web.multipart.MultipartFile;

public interface UserProfileStoragePort {
    String uploadAvatar(MultipartFile file);
    String uploadCccd(MultipartFile file);
    String uploadGplx(MultipartFile file);
}

