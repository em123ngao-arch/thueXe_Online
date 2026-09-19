package com.driveshare.modules.admin.service;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.admin.dto.request.AdminCarFilterRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarDocumentRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarRequest;
import com.driveshare.modules.admin.dto.response.AdminCarDetailResponse;
import com.driveshare.modules.admin.dto.response.AdminCarItemResponse;
import com.driveshare.modules.admin.dto.response.CarDocumentResponse;

public interface AdminCarService {

    PageResponse<AdminCarItemResponse> getCars(AdminCarFilterRequest request);

    AdminCarDetailResponse getCarById(Long carId);

    AdminCarDetailResponse approveCar(Long carId, Long actorId, String actorUsername);

    AdminCarDetailResponse rejectCar(Long carId, ApproveCarRequest request, Long actorId, String actorUsername);

    CarDocumentResponse approveCarDocument(Long carId, Long documentId, ApproveCarDocumentRequest request, Long actorId, String actorUsername);
}
