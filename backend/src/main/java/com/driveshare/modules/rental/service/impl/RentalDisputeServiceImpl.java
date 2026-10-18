package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.entity.RentalDispute;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.common.service.CloudinaryService;
import com.driveshare.modules.rental.dto.RentalDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalDisputeRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.RentalDisputeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalDisputeServiceImpl implements RentalDisputeService {

    private final RentalRepository rentalRepository;
    private final RentalDisputeRepository rentalDisputeRepository;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RentalDisputeResponse reportNoShow(Long rentalId, Long renterId, RentalDisputeRequest request) {
        log.info("Processing dispute report-no-show for rentalId: {}, renterId: {}", rentalId, renterId);

        // 1. Kiểm tra tồn tại đơn thuê
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        // 2. Chốt chặn bảo mật (TC-K06): Ngăn chặn IDOR attack - Chỉ chính chủ Renter mới được khiếu nại
        if (!rental.getRenterId().equals(renterId)) {
            log.warn("IDOR attempt: User {} tried to dispute rental {} belonging to user {}", renterId, rentalId, rental.getRenterId());
            throw new AppException(ErrorCode.UNAUTHORIZED, "Bạn không có quyền khiếu nại đơn thuê của người khác");
        }

        // 3. Chốt chặn trạng thái (Fail-Fast Validation): Chỉ cho phép khiếu nại khi đã cọc (CONFIRMED)
        if (rental.getStatus() != ERentalStatus.CONFIRMED) {
            log.warn("Invalid dispute state for rentalId {}: status is {}", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.INVALID_REQUEST, "Chỉ có thể khiếu nại bàn giao xe khi đơn thuê ở trạng thái đã đặt cọc (CONFIRMED)");
        }

        // 4. Upload bằng chứng đa phương tiện (ảnh + video) lên Cloudinary
        List<String> proofUrls = new ArrayList<>();
        if (request.getEvidenceFiles() != null && !request.getEvidenceFiles().isEmpty()) {
            if (request.getEvidenceFiles().size() > 5) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Chỉ được gửi tối đa 5 tệp bằng chứng");
            }

            for (MultipartFile file : request.getEvidenceFiles()) {
                if (file != null && !file.isEmpty()) {
                    String url = cloudinaryService.uploadMedia(file, CloudinaryService.DEFAULT_DISPUTE_FOLDER);
                    proofUrls.add(url);
                }
            }
        }

        String proofUrlsJson;
        try {
            proofUrlsJson = objectMapper.writeValueAsString(proofUrls);
        } catch (Exception e) {
            log.error("Failed to serialize proof URLs", e);
            proofUrlsJson = "[]";
        }

        // 5. Khởi tạo bản ghi khiếu nại
        RentalDispute dispute = RentalDispute.builder()
                .rentalId(rentalId)
                .reporterId(renterId)
                .reason(request.getReason())
                .proofUrls(proofUrlsJson)
                .status("PENDING")
                .refundAmount(rental.getDepositAmount() != null ? rental.getDepositAmount() : BigDecimal.ZERO)
                .penaltyAmount(BigDecimal.ZERO)
                .createdAt(Instant.now())
                .build();

        RentalDispute savedDispute = rentalDisputeRepository.save(dispute);

        // 6. Cập nhật trạng thái đơn thuê sang DISPUTED
        rental.setStatus(ERentalStatus.DISPUTED);
        rentalRepository.save(rental);

        log.info("Dispute created successfully with ID: {} for rentalId: {}", savedDispute.getId(), rentalId);
        return mapToResponse(savedDispute, proofUrls);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalDisputeResponse> getDisputesByRental(Long rentalId, Long userId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        if (!rental.getRenterId().equals(userId) && !rental.getCar().getOwnerId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Bạn không có quyền xem khiếu nại của đơn này");
        }

        List<RentalDispute> disputes = rentalDisputeRepository.findByRentalId(rentalId);
        return disputes.stream()
                .map(d -> mapToResponse(d, parseProofUrls(d.getProofUrls())))
                .collect(Collectors.toList());
    }

    private List<String> parseProofUrls(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Could not deserialize proofUrls JSON: {}", json);
            return Collections.emptyList();
        }
    }

    private RentalDisputeResponse mapToResponse(RentalDispute d, List<String> urls) {
        return RentalDisputeResponse.builder()
                .id(d.getId())
                .rentalId(d.getRentalId())
                .reporterId(d.getReporterId())
                .reason(d.getReason())
                .proofUrls(urls)
                .status(d.getStatus())
                .refundAmount(d.getRefundAmount())
                .penaltyAmount(d.getPenaltyAmount())
                .adminNote(d.getAdminNote())
                .createdAt(d.getCreatedAt())
                .resolvedAt(d.getResolvedAt())
                .build();
    }
}
