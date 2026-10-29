package com.driveshare.common.enums;

/**
 * Trạng thái đồng thuận 2 chiều của biên bản bàn giao (Sprint Final - Lâm Chí Vĩ).
 */
public enum EInspectionStatus {
    PENDING_RENTER_CONFIRMATION, // Chủ xe đã lập biên bản, đang chờ khách kiểm tra và ký nhận
    CONFIRMED,                   // Khách đã đồng ý và ký nhận biên bản
    DISPUTED                     // Khách từ chối và khiếu nại sai lệch hiện trạng
}

