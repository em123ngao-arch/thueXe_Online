package com.driveshare.modules.car.application.port.in;

import com.driveshare.modules.car.dto.response.CarImageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CarPhotoUseCase {

    CarImageResponse uploadPhoto(Long carId, MultipartFile file);

    List<CarImageResponse> getCarPhotos(Long carId);

    void deletePhoto(Long carId, Long photoId);

    CarImageResponse setPrimaryPhoto(Long carId, Long photoId);
}

