package com.driveshare.modules.rental.application.port.in;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RentalDisputeUseCase {

    RentalDisputeResponse reportNoShow(Long rentalId, String reason, List<MultipartFile> evidenceFiles, Long currentUserId);

    RentalDisputeResponse resolveDispute(Long disputeId, ResolveDisputeRequest request, Long adminId);

    RentalDisputeResponse getDisputeByRentalId(Long rentalId, Long currentUserId);

    List<RentalDisputeResponse> getAllDisputes(EDisputeStatus status);
}

