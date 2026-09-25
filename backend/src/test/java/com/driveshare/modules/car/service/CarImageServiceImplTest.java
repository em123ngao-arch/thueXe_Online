package com.driveshare.modules.car.service;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.service.CloudinaryService;
import com.driveshare.modules.car.dto.response.CarImageResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.entity.CarImage;
import com.driveshare.modules.car.repository.CarImageRepository;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.impl.CarImageServiceImpl;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarImageServiceImplTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private CarImageRepository carImageRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CustomUserDetails userDetails;

    @InjectMocks
    private CarImageServiceImpl carImageService;

    private Car mockCar;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);

        mockCar = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .brand("Toyota")
                .model("Camry")
                .build();
    }

    private void mockCurrentUser(Long userId) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUserId()).thenReturn(userId);
    }

    @Test
    @DisplayName("CRP-33: Upload ảnh xe thành công khi chưa quá 10 ảnh")
    void uploadPhoto_Success() {
        // Arrange
        mockCurrentUser(100L);
        MockMultipartFile file = new MockMultipartFile("file", "car.jpg", "image/jpeg", "image content".getBytes());

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(mockCar));
        when(carImageRepository.findByCar_CarId(1L)).thenReturn(new ArrayList<>());
        when(cloudinaryService.uploadImage(any(MultipartFile.class), anyString(), anyLong()))
                .thenReturn("https://res.cloudinary.com/driveshare/image/upload/car1.jpg");

        CarImage savedImage = CarImage.builder()
                .imageId(10L)
                .car(mockCar)
                .imageUrl("https://res.cloudinary.com/driveshare/image/upload/car1.jpg")
                .isThumbnail(true)
                .build();

        when(carImageRepository.save(any(CarImage.class))).thenReturn(savedImage);

        // Act
        CarImageResponse response = carImageService.uploadPhoto(1L, file);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getImageId()).isEqualTo(10L);
        assertThat(response.getIsThumbnail()).isTrue();

        verify(carImageRepository, times(1)).save(any(CarImage.class));
    }

    @Test
    @DisplayName("CRP-33: Ném ngoại lệ khi upload quá 10 ảnh mỗi xe")
    void uploadPhoto_MaxLimitExceeded_ThrowsException() {
        // Arrange
        mockCurrentUser(100L);
        MockMultipartFile file = new MockMultipartFile("file", "car.jpg", "image/jpeg", "image content".getBytes());

        List<CarImage> tenPhotos = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            tenPhotos.add(CarImage.builder().imageId((long) i).build());
        }

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(mockCar));
        when(carImageRepository.findByCar_CarId(1L)).thenReturn(tenPhotos);

        // Act & Assert
        assertThatThrownBy(() -> carImageService.uploadPhoto(1L, file))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Mỗi xe chỉ được tải lên tối đa 10 ảnh");

        verify(cloudinaryService, never()).uploadImage(any(), any(), anyLong());
    }

    @Test
    @DisplayName("CRP-33: Đặt ảnh làm ảnh đại diện (Thumbnail) thành công")
    void setPrimaryPhoto_Success() {
        // Arrange
        mockCurrentUser(100L);

        CarImage img1 = CarImage.builder().imageId(10L).car(mockCar).imageUrl("url1").isThumbnail(true).build();
        CarImage img2 = CarImage.builder().imageId(20L).car(mockCar).imageUrl("url2").isThumbnail(false).build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(mockCar));
        when(carImageRepository.findByCar_CarId(1L)).thenReturn(List.of(img1, img2));

        // Act
        CarImageResponse response = carImageService.setPrimaryPhoto(1L, 20L);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getImageId()).isEqualTo(20L);
        assertThat(img1.getIsThumbnail()).isFalse();
        assertThat(img2.getIsThumbnail()).isTrue();
        assertThat(mockCar.getThumbnailUrl()).isEqualTo("url2");

        verify(carImageRepository, times(1)).saveAll(anyList());
        verify(carRepository, times(1)).save(mockCar);
    }

    @Test
    @DisplayName("CRP-33: Xóa ảnh thành công")
    void deletePhoto_Success() {
        // Arrange
        mockCurrentUser(100L);

        CarImage img1 = CarImage.builder().imageId(10L).car(mockCar).imageUrl("url1").isThumbnail(false).build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(mockCar));
        when(carImageRepository.findById(10L)).thenReturn(Optional.of(img1));

        // Act
        carImageService.deletePhoto(1L, 10L);

        // Assert
        verify(carImageRepository, times(1)).delete(img1);
    }
}
