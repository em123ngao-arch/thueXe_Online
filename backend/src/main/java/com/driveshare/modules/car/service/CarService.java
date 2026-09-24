package com.driveshare.modules.car.service;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.car.dto.request.CarCreateRequest;
import com.driveshare.modules.car.dto.request.CarStatusUpdateRequest;
import com.driveshare.modules.car.dto.request.CarUpdateRequest;
import com.driveshare.modules.car.dto.response.CarResponse;

import com.driveshare.modules.car.dto.request.CarSearchRequest;

/**
 * Interface định nghĩa các nghiệp vụ liên quan đến quản lý xe (module car).
 *
 * <ul>
 *   <li>CRP-23: {@link #createCar(CarCreateRequest)} — Owner đăng xe mới</li>
 *   <li>CRP-24: {@link #updateCar}, {@link #updateCarStatus}, {@link #deleteCar},
 *       {@link #getMyCarsPaged} — Owner quản lý xe của mình</li>
 *   <li>CRP-39: {@link #searchCars(CarSearchRequest)} — Tìm kiếm và lọc danh sách xe</li>
 * </ul>
 */
public interface CarService {

    /**
     * CRP-23 — Owner đăng ký xe mới.
     * <p>Logic: xác thực Owner đã duyệt → check trùng biển số → tạo xe với status PENDING.
     *
     * @param request dữ liệu xe từ Client (đã validate @Valid)
     * @return thông tin xe vừa tạo
     */
    CarResponse createCar(CarCreateRequest request);

    /**
     * CRP-24 — Owner cập nhật thông tin xe.
     * <p>Logic: tìm xe → kiểm tra quyền → cập nhật các trường not-null từ request.
     *
     * @param carId   ID xe cần cập nhật
     * @param request dữ liệu mới (các trường null sẽ giữ nguyên)
     * @return thông tin xe sau khi cập nhật
     */
    CarResponse updateCar(Long carId, CarUpdateRequest request);

    /**
     * CRP-24/CRP-32 — Owner đổi trạng thái xe (chỉ cho phép ACTIVE ↔ INACTIVE).
     *
     * @param carId   ID xe
     * @param request trạng thái mới
     * @return thông tin xe sau khi đổi trạng thái
     */
    CarResponse updateCarStatus(Long carId, CarStatusUpdateRequest request);

    /**
     * CRP-32 — Owner ẩn xe (deactivate xe).
     *
     * @param carId ID xe cần ẩn
     * @return thông tin xe sau khi ẩn (status = INACTIVE)
     */
    CarResponse deactivateCar(Long carId);

    /**
     * CRP-24 — Owner xóa mềm xe.
     * <p>Logic: tìm xe → check quyền → check active booking → set deletedAt.
     *
     * @param carId ID xe cần xóa
     */
    void deleteCar(Long carId);

    /**
     * CRP-24/CRP-31 — Lấy danh sách xe của Owner đang đăng nhập (có phân trang và lọc theo trạng thái).
     *
     * @param status trạng thái xe cần lọc (tùy chọn)
     * @param page   trang hiện tại (0-based)
     * @param size   số bản ghi mỗi trang
     * @return danh sách xe phân trang
     */
    PageResponse<CarResponse> getMyCarsPaged(com.driveshare.common.enums.ECarStatus status, int page, int size);

    /**
     * BR-04-2 — Lấy danh sách xe công khai có trạng thái ACTIVE (dành cho khách thuê xem trang chủ).
     *
     * @param page trang hiện tại (0-based)
     * @param size số bản ghi mỗi trang
     * @return danh sách xe ACTIVE phân trang
     */
    PageResponse<CarResponse> getPublicActiveCars(int page, int size);

    /**
     * CRP-37 — Lấy thông tin chi tiết xe công khai (Vehicle Detail Page).
     *
     * @param carId ID xe
     * @return thông tin chi tiết xe bao gồm gallery ảnh, thông tin chủ xe và lịch ngày đã đặt
     */
    com.driveshare.modules.car.dto.response.CarDetailResponse getPublicCarDetail(Long carId);

    /**
     * CRP-39 — Tìm kiếm và lọc xe theo nhiều tiêu chí động (Location, Dates, Price, Brand, Seats, Transmission...).
     *
     * @param request thông tin các filter và phân trang
     * @return danh sách xe khớp điều kiện dạng PageResponse
     */
    PageResponse<CarResponse> searchCars(CarSearchRequest request);
}

