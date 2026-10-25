package com.driveshare.modules.admin.service;

import com.driveshare.modules.admin.dto.response.OverdueRentalResponse;
import com.driveshare.modules.admin.dto.response.ViolationDossierResponse;

import java.util.List;

/**
 * Service quản lý các nghiệp vụ đơn thuê dành cho Admin (Sprint 4 - Duy Quân).
 */
public interface AdminRentalService {

    /**
     * Lấy danh sách tất cả các đơn thuê xe bị quá hạn trên toàn hệ thống.
     */
    List<OverdueRentalResponse> getOverdueRentals();

    /**
     * Xuất hồ sơ pháp lý 1-click (Dossier) của đơn thuê bị vi phạm chiếm dụng quá hạn.
     */
    ViolationDossierResponse getViolationDossier(Long rentalId);
}
