package com.driveshare.modules.rental.service;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RentalDisputeService {

    /**
     * Khách thuê báo sự cố chủ xe không giao xe và yêu cầu hoàn cọc.
     */
    RentalDisputeResponse reportNoShow(Long rentalId, String reason, List<MultipartFile> evidenceFiles, Long currentUserId);

    /**
     * Admin xử lý khiếu nại (hoàn 100% cọc + phạt chủ xe hoặc từ chối khiếu nại).
     */
    RentalDisputeResponse resolveDispute(Long disputeId, ResolveDisputeRequest request, Long adminId);

    /**
     * Lấy thông tin khiếu nại theo mã đơn thuê.
     */
    RentalDisputeResponse getDisputeByRentalId(Long rentalId, Long currentUserId);

    /**
     * Admin lấy toàn bộ danh sách khiếu nại để giải quyết.
     */
    List<RentalDisputeResponse> getAllDisputes(EDisputeStatus status);
}
