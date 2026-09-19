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

@Slf4j
@Service
@RequiredArgsConstructor
public class CarServiceImpl implements CarService {

    private final CarRepository carRepository;
    private final OwnerProfileRepository ownerProfileRepository;

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

        car.setStatus(newStatus);
        car = carRepository.save(car);
        log.info("Owner {} đã đổi trạng thái xe carId={} sang {}", currentUserId, carId, newStatus);

        return CarResponse.fromEntity(car);
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
    public PageResponse<CarResponse> getMyCarsPaged(int page, int size) {
        Long currentUserId = getCurrentUserId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CarResponse> resultPage = carRepository
                .findByOwnerIdAndDeletedAtIsNull(currentUserId, pageable)
                .map(CarResponse::fromEntity);

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
