package com.driveshare.common.enums;

public enum EDisputeStatus {
    PENDING,            // Đang chờ Admin xác minh và xử lý
    RESOLVED_REFUND,    // Đã giải quyết: Hoàn 100% tiền cọc cho khách và xử phạt chủ xe
    REJECTED            // Đã từ chối khiếu nại (bằng chứng không hợp lệ / khiếu nại sai)
}
