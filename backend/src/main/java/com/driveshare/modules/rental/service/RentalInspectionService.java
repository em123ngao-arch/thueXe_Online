package com.driveshare.modules.rental.service;

import com.driveshare.modules.rental.dto.CheckInRequest;
import com.driveshare.modules.rental.dto.CheckOutRequest;
import com.driveshare.modules.rental.dto.ConfirmInspectionRequest;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;

import java.util.List;

/**
 * Service quản lý vòng đời biên bản bàn giao và nghiệm thu trả xe (Sprint 3 & Sprint Final - Lâm Chí Vĩ).
 */
public interface RentalInspectionService {

    /**
     * Chủ xe lập biên bản bàn giao xe cho khách thuê (Check-in).
     * Ghi nhận ODO, mức nhiên liệu, ảnh hiện trạng và lưu trạng thái PENDING_RENTER_CONFIRMATION.
     *
     * @param rentalId ID của đơn thuê
     * @param ownerId  ID của chủ xe thực hiện check-in
     * @param request  Dữ liệu biên bản bàn giao
     * @return Thông tin biên bản bàn giao đã lưu ở trạng thái chờ khách xác nhận
     */
    RentalInspectionResponse checkIn(Long rentalId, Long ownerId, CheckInRequest request);

    /**
     * Chủ xe nghiệm thu và nhận lại xe từ khách thuê (Check-out).
     * Ghi nhận ODO trả, mức xăng, phụ phí phát sinh (nếu có) và lưu trạng thái PENDING_RENTER_CONFIRMATION.
     *
     * @param rentalId ID của đơn thuê
     * @param ownerId  ID của chủ xe thực hiện check-out
     * @param request  Dữ liệu biên bản nghiệm thu trả xe
     * @return Thông tin biên bản nghiệm thu trả xe đã lưu ở trạng thái chờ khách xác nhận
     */
    RentalInspectionResponse checkOut(Long rentalId, Long ownerId, CheckOutRequest request);

    /**
     * Khách thuê xác nhận đồng ý nhận/trả xe hoặc khiếu nại sai lệch hiện trạng (Sprint Final - Two-Way Handover Consensus).
     *
     * @param rentalId     ID của đơn thuê
     * @param inspectionId ID của biên bản kiểm tra cần xác nhận
     * @param customerId   ID của khách thuê thao tác
     * @param request      Dữ liệu xác nhận (agreed = true/false, lý do khiếu nại, ảnh đối chứng)
     * @return Biên bản kiểm tra sau khi cập nhật trạng thái
     */
    RentalInspectionResponse confirmInspection(Long rentalId, Long inspectionId, Long customerId, ConfirmInspectionRequest request);

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
