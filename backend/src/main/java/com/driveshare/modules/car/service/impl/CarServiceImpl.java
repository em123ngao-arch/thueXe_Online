package com.driveshare.modules.car.service.impl;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.dto.request.CarCreateRequest;
import com.driveshare.modules.car.dto.request.CarStatusUpdateRequest;
import com.driveshare.modules.car.dto.request.CarUpdateRequest;
import com.driveshare.modules.car.dto.response.CarResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.CarService;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

import com.driveshare.modules.car.repository.CarImageRepository;
import com.driveshare.modules.user.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarServiceImpl implements CarService {

    private final CarRepository carRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final CarImageRepository carImageRepository;
    private final UserRepository userRepository;

    /**
     * Tập trạng thái được phép khi Owner tự đổi trạng thái xe.
     * Admin/Staff có quyền đổi sang PENDING, REJECTED — xử lý ở module admin.
     */
    private static final Set<ECarStatus> OWNER_ALLOWED_STATUSES = Set.of(
            ECarStatus.ACTIVE,
            ECarStatus.INACTIVE
    );

    // =====================================================================
    // CRP-23 — Đăng xe mới
    // =====================================================================

    @Override
    @Transactional
    public CarResponse createCar(CarCreateRequest request) {
        Long currentUserId = getCurrentUserId();

        // 1. Kiểm tra Owner đã được Admin duyệt chưa
        OwnerProfile ownerProfile = ownerProfileRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.OWNER_NOT_APPROVED));

        if (ownerProfile.getVerificationStatus() != EVerificationStatus.VERIFIED) {
            log.warn("Owner {} cố đăng xe nhưng chưa được duyệt (status: {})",
                    currentUserId, ownerProfile.getVerificationStatus());
            throw new AppException(ErrorCode.OWNER_NOT_APPROVED);
        }

        // 2. Kiểm tra trùng biển số (bỏ qua xe đã xóa mềm)
        if (carRepository.existsByPlateNumberAndDeletedAtIsNull(request.getPlateNumber())) {
            throw new AppException(ErrorCode.CAR_PLATE_DUPLICATE);
        }

        // 3. Tạo entity và lưu
        Car car = Car.builder()
                .ownerId(currentUserId)
                .plateNumber(request.getPlateNumber().toUpperCase().trim())
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .color(request.getColor())
                .seats(request.getSeats())
                .transmission(request.getTransmission())
                .fuelType(request.getFuelType())
                .pricePerDay(request.getPricePerDay())
                .address(request.getAddress())
                .province(request.getProvince())
                .description(request.getDescription())
                .features(request.getFeatures())
                .thumbnailUrl(request.getThumbnailUrl())
                .status(ECarStatus.PENDING_REVIEW) // Mặc định: chờ Admin duyệt
                .build();

        car = carRepository.save(car);
        log.info("Owner {} đã đăng xe mới: carId={}, plateNumber={}", currentUserId, car.getCarId(), car.getPlateNumber());

        return CarResponse.fromEntity(car);
    }

    // =====================================================================
    // CRP-24 — Cập nhật thông tin xe
    // =====================================================================

    @Override
    @Transactional
    public CarResponse updateCar(Long carId, CarUpdateRequest request) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        // Kiểm tra business rule: xe đang có đơn đặt xe hoạt động thì không cho sửa
        if (carRepository.hasActiveBooking(carId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Xe đang có đơn đặt xe hoạt động, không thể cập nhật thông tin");
        }

        // Chỉ cập nhật trường nào được gửi lên (not null) — Partial Update
        if (request.getBrand() != null)        car.setBrand(request.getBrand());
        if (request.getModel() != null)        car.setModel(request.getModel());
        if (request.getYear() != null)         car.setYear(request.getYear());
        if (request.getColor() != null)        car.setColor(request.getColor());
        if (request.getSeats() != null)        car.setSeats(request.getSeats());
        if (request.getTransmission() != null) car.setTransmission(request.getTransmission());
        if (request.getFuelType() != null)     car.setFuelType(request.getFuelType());
        if (request.getPricePerDay() != null)  car.setPricePerDay(request.getPricePerDay());
        if (request.getAddress() != null)      car.setAddress(request.getAddress());
        if (request.getProvince() != null)     car.setProvince(request.getProvince());
        if (request.getDescription() != null)  car.setDescription(request.getDescription());
        if (request.getFeatures() != null)     car.setFeatures(request.getFeatures());
        if (request.getThumbnailUrl() != null) car.setThumbnailUrl(request.getThumbnailUrl());

        car = carRepository.save(car);
        log.info("Owner {} đã cập nhật xe carId={}", currentUserId, carId);

        return CarResponse.fromEntity(car);
    }

    // =====================================================================
    // CRP-24 — Đổi trạng thái xe (ACTIVE ↔ INACTIVE)
    // =====================================================================

    @Override
    @Transactional
    public CarResponse updateCarStatus(Long carId, CarStatusUpdateRequest request) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        ECarStatus newStatus = request.getStatus();

        // Chỉ cho phép Owner tự chuyển giữa ACTIVE và INACTIVE
        if (!OWNER_ALLOWED_STATUSES.contains(newStatus)) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Bạn chỉ có thể chuyển trạng thái xe sang ACTIVE hoặc INACTIVE");
        }

        // Xe phải đang ở trạng thái ACTIVE hoặc INACTIVE mới được đổi
        if (!OWNER_ALLOWED_STATUSES.contains(car.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Xe đang ở trạng thái " + car.getStatus() + ", không thể tự đổi trạng thái");
        }

        // Nếu chuyển sang INACTIVE, phải kiểm tra xem xe có active booking không
        if (newStatus == ECarStatus.INACTIVE && carRepository.hasActiveBooking(carId)) {
            throw new AppException(ErrorCode.CAR_HAS_ACTIVE_BOOKING,
                    "Xe đang có chuyến đi hoặc đơn đặt xe hoạt động, không thể ẩn xe");
        }

        car.setStatus(newStatus);
        car = carRepository.save(car);
        log.info("Owner {} đã đổi trạng thái xe carId={} sang {}", currentUserId, carId, newStatus);

        return CarResponse.fromEntity(car);
    }

    @Override
    @Transactional
    public CarResponse deactivateCar(Long carId) {
        CarStatusUpdateRequest request = new CarStatusUpdateRequest();
        request.setStatus(ECarStatus.INACTIVE);
        return updateCarStatus(carId, request);
    }

    // =====================================================================
    // CRP-24 — Xóa mềm xe
    // =====================================================================

    @Override
    @Transactional
    public void deleteCar(Long carId) {
        Long currentUserId = getCurrentUserId();
        Car car = getCarAndVerifyOwnership(carId, currentUserId);

        // Kiểm tra xe có đơn đặt nào đang hoạt động không
        if (carRepository.hasActiveBooking(carId)) {
            throw new AppException(ErrorCode.CAR_HAS_ACTIVE_BOOKING);
        }

        // Soft delete: ghi lại thời điểm và người thực hiện xóa
        car.setDeletedAt(Instant.now());
        car.setDeletedBy(currentUserId);
        carRepository.save(car);
        log.info("Owner {} đã xóa (soft delete) xe carId={}", currentUserId, carId);
    }

    // =====================================================================
    // CRP-24 — Lấy danh sách xe của Owner đang đăng nhập
    // =====================================================================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CarResponse> getMyCarsPaged(ECarStatus status, int page, int size) {
        Long currentUserId = getCurrentUserId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Car> carPage;

        if (status != null) {
            carPage = carRepository.findByOwnerIdAndStatusAndDeletedAtIsNull(currentUserId, status, pageable);
        } else {
            carPage = carRepository.findByOwnerIdAndDeletedAtIsNull(currentUserId, pageable);
        }

        Page<CarResponse> resultPage = carPage.map(CarResponse::fromEntity);

        return PageResponse.from(resultPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CarResponse> getPublicActiveCars(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CarResponse> resultPage = carRepository
                .findByStatusAndDeletedAtIsNull(ECarStatus.ACTIVE, pageable)
                .map(CarResponse::fromEntity);

        return PageResponse.from(resultPage);
    }

    // =====================================================================
    // CRP-37 — Xem chi tiết thông tin xe (Vehicle Detail Page)
    // =====================================================================

    @Override
    @Transactional(readOnly = true)
    public com.driveshare.modules.car.dto.response.CarDetailResponse getPublicCarDetail(Long carId) {
        Car car = carRepository.findByCarIdAndDeletedAtIsNull(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        // 1. Mask biển số xe khi hiển thị công khai (VD: 51A-12345 -> 51A-123.XX)
        String maskedPlate = maskPlateNumber(car.getPlateNumber());

        // 2. Lấy bộ sưu tập ảnh xe
        List<com.driveshare.modules.car.dto.response.CarImageResponse> images = carImageRepository
                .findByCar_CarId(carId).stream()
                .map(com.driveshare.modules.car.dto.response.CarImageResponse::fromEntity)
                .collect(Collectors.toList());

        // 3. Lấy thông tin chủ xe
        com.driveshare.modules.car.dto.response.CarDetailResponse.OwnerInfo ownerInfo = null;
        if (car.getOwnerId() != null) {
            var ownerUser = userRepository.findById(car.getOwnerId()).orElse(null);
            long totalCars = carRepository.countByOwnerIdAndStatusAndDeletedAtIsNull(car.getOwnerId(), ECarStatus.ACTIVE);

            if (ownerUser != null) {
                ownerInfo = com.driveshare.modules.car.dto.response.CarDetailResponse.OwnerInfo.builder()
                        .ownerId(ownerUser.getUserId())
                        .fullName(ownerUser.getFullName() != null ? ownerUser.getFullName() : ownerUser.getUsername())
                        .avatarUrl(ownerUser.getAvatarUrl())
                        .rating(5.0) // Mặc định 5.0 sao
                        .totalCars(totalCars)
                        .build();
            }
        }

        log.info("Lấy thông tin chi tiết xe công khai: carId={}, brand={}", carId, car.getBrand());

        return com.driveshare.modules.car.dto.response.CarDetailResponse.builder()
                .carId(car.getCarId())
                .plateNumberMasked(maskedPlate)
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .color(car.getColor())
                .seats(car.getSeats())
                .transmission(car.getTransmission())
                .fuelType(car.getFuelType())
                .pricePerDay(car.getPricePerDay())
                .address(car.getAddress())
                .province(car.getProvince())
                .description(car.getDescription())
                .features(car.getFeatures())
                .thumbnailUrl(car.getThumbnailUrl())
                .status(car.getStatus())
                .images(images)
                .owner(ownerInfo)
                .unavailableDates(new java.util.ArrayList<>())
                .build();
    }

    private String maskPlateNumber(String plate) {
        if (plate == null || plate.length() < 4) return plate;
        int len = plate.length();
        return plate.substring(0, len - 2) + "XX";
    }

    // =====================================================================
    // CRP-39 — Tìm kiếm và lọc xe linh hoạt
    // =====================================================================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CarResponse> searchCars(com.driveshare.modules.car.dto.request.CarSearchRequest request) {
        // Xử lý tiêu chí Sắp xếp (Sort)
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt"); // Mặc định: mới nhất
        if ("price_asc".equalsIgnoreCase(request.getSortBy())) {
            sort = Sort.by(Sort.Direction.ASC, "pricePerDay");
        } else if ("price_desc".equalsIgnoreCase(request.getSortBy())) {
            sort = Sort.by(Sort.Direction.DESC, "pricePerDay");
        }

        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        // Tạo Specification từ tiêu chí lọc truyền vào
        org.springframework.data.jpa.domain.Specification<Car> spec = 
                com.driveshare.modules.car.repository.specification.CarSpecification.filterCars(request);

        Page<CarResponse> resultPage = carRepository.findAll(spec, pageable)
                .map(CarResponse::fromEntity);

        log.info("Tìm kiếm xe với query parameters: brand={}, province={}, minPrice={}, maxPrice={}, kết quả={}",
                request.getBrand(), request.getProvince(), request.getMinPrice(), request.getMaxPrice(), resultPage.getTotalElements());

        return PageResponse.from(resultPage);
    }


    // =====================================================================
    // Helper methods
    // =====================================================================

    /**
     * Lấy userId của người dùng hiện tại từ SecurityContext.
     * Token JWT đã được JwtAuthenticationFilter xác thực và đưa vào context.
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getUserId();
    }

    /**
     * Tìm xe theo ID (chỉ xe chưa xóa mềm) và xác minh quyền sở hữu.
     *
     * @param carId         ID xe cần thao tác
     * @param currentUserId ID người dùng đang đăng nhập
     * @return Car entity nếu hợp lệ
     * @throws AppException CAR_NOT_FOUND nếu không tìm thấy xe
     * @throws AppException CAR_ACCESS_DENIED nếu xe không thuộc về currentUser
     */
    private Car getCarAndVerifyOwnership(Long carId, Long currentUserId) {
        Car car = carRepository.findByCarIdAndDeletedAtIsNull(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        if (!car.getOwnerId().equals(currentUserId)) {
            log.warn("User {} cố thao tác xe carId={} không thuộc quyền sở hữu", currentUserId, carId);
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        return car;
    }
}
