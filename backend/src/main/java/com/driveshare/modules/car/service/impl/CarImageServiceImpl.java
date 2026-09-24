package com.driveshare.modules.car.service.impl;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.common.service.CloudinaryService;
import com.driveshare.modules.car.dto.response.CarImageResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.entity.CarImage;
import com.driveshare.modules.car.repository.CarImageRepository;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.CarImageService;
import com.driveshare.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Service xử lý logic tải lên, đặt ảnh chính và xóa ảnh xe (CRP-33).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CarImageServiceImpl implements CarImageService {

    private static final int MAX_PHOTOS_PER_CAR = 10;
    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024L; // 5MB

    private final CarRepository carRepository;
    private final CarImageRepository carImageRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public CarImageResponse uploadPhoto(Long carId, MultipartFile file) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        // 1. Kiểm tra số lượng ảnh hiện tại (tối đa 10 ảnh/xe)
        List<CarImage> existingPhotos = carImageRepository.findByCar_CarId(carId);
        if (existingPhotos.size() >= MAX_PHOTOS_PER_CAR) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Mỗi xe chỉ được tải lên tối đa " + MAX_PHOTOS_PER_CAR + " ảnh");
        }

        // 2. Upload ảnh qua CloudinaryService (validate format jpg/png và dung lượng <= 5MB)
        String imageUrl = cloudinaryService.uploadImage(file, "cars/" + carId, MAX_FILE_SIZE_BYTES);

        // 3. Nếu xe chưa có ảnh đại diện hoặc là ảnh đầu tiên -> đặt làm thumbnail
        boolean isFirstImage = existingPhotos.isEmpty() || car.getThumbnailUrl() == null;

        CarImage carImage = CarImage.builder()
                .car(car)
                .imageUrl(imageUrl)
                .isThumbnail(isFirstImage)
                .createdAt(Instant.now())
                .build();

        carImage = carImageRepository.save(carImage);

        if (isFirstImage) {
            car.setThumbnailUrl(imageUrl);
            carRepository.save(car);
        }

        log.info("Owner {} đã upload ảnh mới (id={}) cho xe carId={}", currentUserId, carImage.getImageId(), carId);
        return CarImageResponse.fromEntity(carImage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarImageResponse> getCarPhotos(Long carId) {
        // Kiểm tra xe có tồn tại không
        carRepository.findByCarIdAndDeletedAtIsNull(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        return carImageRepository.findByCar_CarId(carId).stream()
                .map(CarImageResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deletePhoto(Long carId, Long photoId) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        CarImage photoToDelete = carImageRepository.findById(photoId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hình ảnh cần xóa"));

        if (!photoToDelete.getCar().getCarId().equals(carId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Hình ảnh không thuộc về xe này");
        }

        boolean wasThumbnail = Boolean.TRUE.equals(photoToDelete.getIsThumbnail());

        carImageRepository.delete(photoToDelete);
        log.info("Owner {} đã xóa ảnh id={} của xe carId={}", currentUserId, photoId, carId);

        // Nếu ảnh bị xóa là ảnh đại diện, gán ảnh khác làm đại diện (nếu còn ảnh)
        if (wasThumbnail) {
            List<CarImage> remainingPhotos = carImageRepository.findByCar_CarId(carId);
            if (!remainingPhotos.isEmpty()) {
                CarImage newThumbnail = remainingPhotos.get(0);
                newThumbnail.setIsThumbnail(true);
                carImageRepository.save(newThumbnail);
                car.setThumbnailUrl(newThumbnail.getImageUrl());
            } else {
                car.setThumbnailUrl(null);
            }
            carRepository.save(car);
        }
    }

    @Override
    @Transactional
    public CarImageResponse setPrimaryPhoto(Long carId, Long photoId) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        List<CarImage> photos = carImageRepository.findByCar_CarId(carId);
        CarImage targetPhoto = photos.stream()
                .filter(p -> Objects.equals(p.getImageId(), photoId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hình ảnh"));

        // Cập nhật isThumbnail = false cho tất cả các ảnh khác, set true cho targetPhoto
        for (CarImage photo : photos) {
            photo.setIsThumbnail(Objects.equals(photo.getImageId(), photoId));
        }

        carImageRepository.saveAll(photos);

        // Cập nhật thumbnailUrl trên entity Car
        car.setThumbnailUrl(targetPhoto.getImageUrl());
        carRepository.save(car);

        log.info("Owner {} đã đặt ảnh id={} làm ảnh đại diện cho xe carId={}", currentUserId, photoId, carId);
        return CarImageResponse.fromEntity(targetPhoto);
    }

    // Helper: Lấy userId hiện tại và verify ownership
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getUserId();
    }

    private Car getCarAndVerifyOwnership(Long carId, Long currentUserId) {
        Car car = carRepository.findByCarIdAndDeletedAtIsNull(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        if (!car.getOwnerId().equals(currentUserId)) {
            log.warn("User {} cố thao tác ảnh của xe carId={} không thuộc sở hữu", currentUserId, carId);
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        return car;
    }
}
