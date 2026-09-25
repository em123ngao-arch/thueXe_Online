package com.driveshare.modules.car.service;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.dto.request.CarCreateRequest;
import com.driveshare.modules.car.dto.response.CarResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarImageRepository;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.impl.CarServiceImpl;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarServiceImplTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private CarImageRepository carImageRepository;

    @Mock
    private com.driveshare.modules.user.repository.UserRepository userRepository;

    @Mock
    private OwnerProfileRepository ownerProfileRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CustomUserDetails userDetails;

    @InjectMocks
    private CarServiceImpl carService;

    private CarCreateRequest createRequest;
    private OwnerProfile verifiedOwner;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);

        createRequest = new CarCreateRequest();
        createRequest.setPlateNumber("51A-12345");
        createRequest.setBrand("Toyota");
        createRequest.setModel("Camry");
        createRequest.setYear(2022);
        createRequest.setColor("Black");
        createRequest.setSeats(5);
        createRequest.setTransmission(ETransmission.AUTOMATIC);
        createRequest.setFuelType(EFuelType.GASOLINE);
        createRequest.setPricePerDay(new BigDecimal("1200000"));
        createRequest.setAddress("123 Nguyễn Huệ, Q1");
        createRequest.setProvince("TP. Hồ Chí Minh");
        createRequest.setDescription("Xe đẹp, máy êm, sạch sẽ");

        verifiedOwner = OwnerProfile.builder()
                .userId(100L)
                .verificationStatus(EVerificationStatus.VERIFIED)
                .build();
    }

    private void mockCurrentUser(Long userId) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUserId()).thenReturn(userId);
    }

    @Test
    @DisplayName("CRP-29: Đăng xe thành công khi dữ liệu hợp lệ và Owner đã VERIFIED")
    void createCar_Success() {
        // Arrange
        mockCurrentUser(100L);
        when(ownerProfileRepository.findById(100L)).thenReturn(Optional.of(verifiedOwner));
        when(carRepository.existsByPlateNumberAndDeletedAtIsNull("51A-12345")).thenReturn(false);

        Car savedCar = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .plateNumber("51A-12345")
                .brand("Toyota")
                .model("Camry")
                .year(2022)
                .pricePerDay(new BigDecimal("1200000"))
                .status(ECarStatus.PENDING_REVIEW)
                .build();

        when(carRepository.save(any(Car.class))).thenReturn(savedCar);

        // Act
        CarResponse response = carService.createCar(createRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getCarId()).isEqualTo(1L);
        assertThat(response.getPlateNumber()).isEqualTo("51A-12345");
        assertThat(response.getStatus()).isEqualTo(ECarStatus.PENDING_REVIEW);

        verify(carRepository, times(1)).save(any(Car.class));
    }

    @Test
    @DisplayName("CRP-29: Ném ra ngoại lệ OWNER_NOT_APPROVED khi Owner chưa được duyệt")
    void createCar_OwnerNotApproved_ThrowsException() {
        // Arrange
        mockCurrentUser(100L);
        OwnerProfile unverifiedOwner = OwnerProfile.builder()
                .userId(100L)
                .verificationStatus(EVerificationStatus.PENDING)
                .build();

        when(ownerProfileRepository.findById(100L)).thenReturn(Optional.of(unverifiedOwner));

        // Act & Assert
        assertThatThrownBy(() -> carService.createCar(createRequest))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.OWNER_NOT_APPROVED.getMessage());

        verify(carRepository, never()).save(any(Car.class));
    }

    @Test
    @DisplayName("CRP-29: Ném ra ngoại lệ CAR_PLATE_DUPLICATE khi biển số xe đã tồn tại")
    void createCar_DuplicatePlateNumber_ThrowsException() {
        // Arrange
        mockCurrentUser(100L);
        when(ownerProfileRepository.findById(100L)).thenReturn(Optional.of(verifiedOwner));
        when(carRepository.existsByPlateNumberAndDeletedAtIsNull("51A-12345")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> carService.createCar(createRequest))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.CAR_PLATE_DUPLICATE.getMessage());

        verify(carRepository, never()).save(any(Car.class));
    }

    @Test
    @DisplayName("CRP-39: Tìm kiếm danh sách xe theo nhiều tiêu chí (Filter & Sort)")
    void searchCars_Success() {
        // Arrange
        com.driveshare.modules.car.dto.request.CarSearchRequest searchRequest = new com.driveshare.modules.car.dto.request.CarSearchRequest();
        searchRequest.setBrand("Toyota");
        searchRequest.setProvince("TP. Hồ Chí Minh");
        searchRequest.setSortBy("price_asc");
        searchRequest.setPage(0);
        searchRequest.setSize(10);

        Car car1 = Car.builder()
                .carId(1L)
                .brand("Toyota")
                .model("Camry")
                .pricePerDay(new BigDecimal("1000000"))
                .status(ECarStatus.ACTIVE)
                .build();

        org.springframework.data.domain.Page<Car> mockPage = new org.springframework.data.domain.PageImpl<>(
                java.util.List.of(car1),
                org.springframework.data.domain.PageRequest.of(0, 10),
                1
        );

        when(carRepository.findAll(org.mockito.ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<Car>>any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(mockPage);

        // Act
        com.driveshare.common.dto.PageResponse<CarResponse> result = carService.searchCars(searchRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getBrand()).isEqualTo("Toyota");
        assertThat(result.getPagination().getTotalItems()).isEqualTo(1);


        verify(carRepository, times(1)).findAll(org.mockito.ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<Car>>any(), any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    @DisplayName("CRP-31: Lấy danh sách xe của Owner theo status và phân trang")
    void getMyCarsPaged_WithStatus_Success() {
        // Arrange
        mockCurrentUser(100L);

        Car car1 = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .brand("Honda")
                .model("Civic")
                .status(ECarStatus.ACTIVE)
                .build();

        org.springframework.data.domain.Page<Car> mockPage = new org.springframework.data.domain.PageImpl<>(
                java.util.List.of(car1),
                org.springframework.data.domain.PageRequest.of(0, 10),
                1
        );

        when(carRepository.findByOwnerIdAndStatusAndDeletedAtIsNull(eq(100L), eq(ECarStatus.ACTIVE), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(mockPage);

        // Act
        com.driveshare.common.dto.PageResponse<CarResponse> result = carService.getMyCarsPaged(ECarStatus.ACTIVE, 0, 10);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getBrand()).isEqualTo("Honda");

        verify(carRepository, times(1))
                .findByOwnerIdAndStatusAndDeletedAtIsNull(eq(100L), eq(ECarStatus.ACTIVE), any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    @DisplayName("CRP-30: Cập nhật thông tin xe thành công khi dữ liệu hợp lệ và đúng Owner")
    void updateCar_Success() {
        // Arrange
        mockCurrentUser(100L);

        Car existingCar = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .brand("Toyota")
                .model("Camry")
                .pricePerDay(new BigDecimal("1000000"))
                .status(ECarStatus.ACTIVE)
                .build();

        com.driveshare.modules.car.dto.request.CarUpdateRequest updateRequest = new com.driveshare.modules.car.dto.request.CarUpdateRequest();
        updateRequest.setBrand("Toyota Updated");
        updateRequest.setPricePerDay(new BigDecimal("1500000"));

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(existingCar));
        when(carRepository.hasActiveBooking(1L)).thenReturn(false);
        when(carRepository.save(any(Car.class))).thenReturn(existingCar);

        // Act
        CarResponse response = carService.updateCar(1L, updateRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(existingCar.getBrand()).isEqualTo("Toyota Updated");
        assertThat(existingCar.getPricePerDay()).isEqualTo(new BigDecimal("1500000"));
        verify(carRepository, times(1)).save(existingCar);
    }

    @Test
    @DisplayName("CRP-30: Ném ngoại lệ CAR_ACCESS_DENIED khi Owner khác cố cập nhật xe")
    void updateCar_AccessDenied_ThrowsException() {
        // Arrange
        mockCurrentUser(200L); // Current user là 200

        Car carOwner100 = Car.builder()
                .carId(1L)
                .ownerId(100L) // Xe thuộc owner 100
                .brand("Toyota")
                .build();

        com.driveshare.modules.car.dto.request.CarUpdateRequest updateRequest = new com.driveshare.modules.car.dto.request.CarUpdateRequest();
        updateRequest.setBrand("Hacked Brand");

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(carOwner100));

        // Act & Assert
        assertThatThrownBy(() -> carService.updateCar(1L, updateRequest))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.CAR_ACCESS_DENIED.getMessage());

        verify(carRepository, never()).save(any(Car.class));
    }

    @Test
    @DisplayName("CRP-30: Ném ngoại lệ khi xe đang có đơn đặt xe hoạt động (Active Booking)")
    void updateCar_HasActiveBooking_ThrowsException() {
        // Arrange
        mockCurrentUser(100L);

        Car activeCar = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .status(ECarStatus.ACTIVE)
                .build();

        com.driveshare.modules.car.dto.request.CarUpdateRequest updateRequest = new com.driveshare.modules.car.dto.request.CarUpdateRequest();

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(activeCar));
        when(carRepository.hasActiveBooking(1L)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> carService.updateCar(1L, updateRequest))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("đơn đặt xe hoạt động");

        verify(carRepository, never()).save(any(Car.class));
    }

    @Test
    @DisplayName("CRP-32: Owner ẩn xe (deactivate) thành công khi xe không có đơn đặt active")
    void deactivateCar_Success() {
        // Arrange
        mockCurrentUser(100L);

        Car activeCar = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .status(ECarStatus.ACTIVE)
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(activeCar));
        when(carRepository.hasActiveBooking(1L)).thenReturn(false);
        when(carRepository.save(any(Car.class))).thenReturn(activeCar);

        // Act
        CarResponse response = carService.deactivateCar(1L);

        // Assert
        assertThat(response).isNotNull();
        assertThat(activeCar.getStatus()).isEqualTo(ECarStatus.INACTIVE);
        verify(carRepository, times(1)).save(activeCar);
    }

    @Test
    @DisplayName("CRP-32: Ném ngoại lệ CAR_HAS_ACTIVE_BOOKING khi cố ẩn xe đang có đơn đặt active")
    void deactivateCar_HasActiveBooking_ThrowsException() {
        // Arrange
        mockCurrentUser(100L);

        Car activeCar = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .status(ECarStatus.ACTIVE)
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(activeCar));
        when(carRepository.hasActiveBooking(1L)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> carService.deactivateCar(1L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("không thể ẩn xe");

        verify(carRepository, never()).save(any(Car.class));
    }

    @Test
    @DisplayName("CRP-32: Xóa mềm xe thành công khi không có đơn đặt xe active")
    void deleteCar_Success() {
        // Arrange
        mockCurrentUser(100L);

        Car carToDelete = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .status(ECarStatus.INACTIVE)
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(carToDelete));
        when(carRepository.hasActiveBooking(1L)).thenReturn(false);

        // Act
        carService.deleteCar(1L);

        // Assert
        assertThat(carToDelete.getDeletedAt()).isNotNull();
        assertThat(carToDelete.getDeletedBy()).isEqualTo(100L);
        verify(carRepository, times(1)).save(carToDelete);
    }

    @Test
    @DisplayName("CRP-32: Ném ngoại lệ khi cố xóa xe đang có đơn đặt xe active")
    void deleteCar_HasActiveBooking_ThrowsException() {
        // Arrange
        mockCurrentUser(100L);

        Car carToDelete = Car.builder()
                .carId(1L)
                .ownerId(100L)
                .status(ECarStatus.ACTIVE)
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(carToDelete));
        when(carRepository.hasActiveBooking(1L)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> carService.deleteCar(1L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.CAR_HAS_ACTIVE_BOOKING.getMessage());

        verify(carRepository, never()).save(any(Car.class));
    }

    @Test
    @DisplayName("CRP-37: Lấy thông tin chi tiết xe công khai thành công và che biển số")
    void getPublicCarDetail_Success() {
        // Arrange
        Long carId = 1L;
        Long ownerId = 100L;

        Car car = Car.builder()
                .carId(carId)
                .ownerId(ownerId)
                .plateNumber("51A-12345")
                .brand("Toyota")
                .model("Camry")
                .year(2022)
                .pricePerDay(new BigDecimal("1200000"))
                .status(ECarStatus.ACTIVE)
                .build();

        User owner = User.builder()
                .userId(ownerId)
                .fullName("Nguyễn Văn A")
                .avatarUrl("http://avatar.url")
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(carId)).thenReturn(Optional.of(car));
        when(carImageRepository.findByCar_CarId(carId)).thenReturn(java.util.Collections.emptyList());
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(carRepository.countByOwnerIdAndStatusAndDeletedAtIsNull(ownerId, ECarStatus.ACTIVE)).thenReturn(3L);

        // Act
        com.driveshare.modules.car.dto.response.CarDetailResponse detail = carService.getPublicCarDetail(carId);

        // Assert
        assertThat(detail).isNotNull();
        assertThat(detail.getCarId()).isEqualTo(carId);
        assertThat(detail.getBrand()).isEqualTo("Toyota");
        assertThat(detail.getPlateNumberMasked()).isEqualTo("51A-123XX");
        assertThat(detail.getOwner()).isNotNull();
        assertThat(detail.getOwner().getFullName()).isEqualTo("Nguyễn Văn A");
        assertThat(detail.getOwner().getTotalCars()).isEqualTo(3L);
    }

    @Test
    @DisplayName("CRP-37: Ném ngoại lệ CAR_NOT_FOUND khi xe không tồn tại hoặc đã bị xóa")
    void getPublicCarDetail_NotFound_ThrowsException() {
        // Arrange
        when(carRepository.findByCarIdAndDeletedAtIsNull(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> carService.getPublicCarDetail(999L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.CAR_NOT_FOUND.getMessage());
    }
}

