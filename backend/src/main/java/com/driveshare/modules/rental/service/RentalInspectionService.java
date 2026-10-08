package com.driveshare.modules.rental.service;

import com.driveshare.modules.rental.dto.CheckInRequest;
import com.driveshare.modules.rental.dto.CheckOutRequest;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;

import java.util.List;

/**
 * Service quản lý vòng đời biên bản bàn giao và nghiệm thu trả xe (Sprint 3 - Vĩ).
 */
public interface RentalInspectionService {

    /**
     * Chủ xe bàn giao xe cho khách thuê (Check-in).
     * Ghi nhận ODO, mức nhiên liệu, ảnh hiện trạng và chuyển đơn sang IN_PROGRESS.
     *
     * @param rentalId ID của đơn thuê
     * @param ownerId  ID của chủ xe thực hiện check-in
     * @param request  Dữ liệu biên bản bàn giao
     * @return Thông tin biên bản bàn giao đã lưu
     */
    RentalInspectionResponse checkIn(Long rentalId, Long ownerId, CheckInRequest request);

    /**
     * Chủ xe nghiệm thu và nhận lại xe từ khách thuê (Check-out).
     * Ghi nhận ODO trả, mức xăng, phụ phí phát sinh (nếu có) và chuyển đơn sang COMPLETED.
     *
     * @param rentalId ID của đơn thuê
     * @param ownerId  ID của chủ xe thực hiện check-out
     * @param request  Dữ liệu biên bản nghiệm thu trả xe
     * @return Thông tin biên bản nghiệm thu trả xe đã lưu
     */
    RentalInspectionResponse checkOut(Long rentalId, Long ownerId, CheckOutRequest request);

    /**
     * Lấy danh sách toàn bộ biên bản bàn giao & trả xe của đơn thuê.
     * Áp dụng cho cả Chủ xe và Khách thuê trong đơn để đối chiếu.
     *
     * @param rentalId ID của đơn thuê
     * @param userId   ID người dùng yêu cầu (chủ xe hoặc khách thuê)
     * @return Danh sách các biên bản theo thứ tự thời gian tạo
     */
    List<RentalInspectionResponse> getInspections(Long rentalId, Long userId);
}
