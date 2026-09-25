package com.driveshare.modules.car.service;

import com.driveshare.modules.car.dto.response.CarImageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Interface định nghĩa các dịch vụ quản lý ảnh xe (CRP-33).
 */
public interface CarImageService {

    /**
     * Upload ảnh mới cho xe của Owner.
     *
     * @param carId ID xe
     * @param file  File ảnh gửi từ client
     * @return Thông tin ảnh sau khi upload
     */
    CarImageResponse uploadPhoto(Long carId, MultipartFile file);

    /**
     * Lấy danh sách ảnh của một xe (Công khai hoặc Owner).
     *
     * @param carId ID xe
     * @return Danh sách DTO ảnh của xe
     */
    List<CarImageResponse> getCarPhotos(Long carId);

    /**
     * Xóa một ảnh của xe.
     *
     * @param carId   ID xe
     * @param photoId ID ảnh cần xóa
     */
    void deletePhoto(Long carId, Long photoId);

    /**
     * Đặt một ảnh làm ảnh đại diện (Thumbnail) cho xe.
     *
     * @param carId   ID xe
     * @param photoId ID ảnh cần đặt làm ảnh chính
     * @return Thông tin ảnh sau khi đặt làm ảnh chính
     */
    CarImageResponse setPrimaryPhoto(Long carId, Long photoId);
}
