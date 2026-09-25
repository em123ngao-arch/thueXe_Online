package com.driveshare.modules.rental.service;

import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;

public interface RentalService {

    /**
     * CRP-41 & CRP-42: Khách thuê tạo yêu cầu thuê xe mới (trạng thái ban đầu: PENDING).
     * Tự động kiểm tra giới hạn không quá 3 yêu cầu PENDING cho mỗi khách.
     *
     * @param request thông tin xe và thời gian thuê
     * @return RentalResponse thông tin đơn thuê vừa tạo
     */
    RentalResponse createRentalRequest(CreateRentalRequest request);
}
