package com.driveshare.common.enums;

public enum ERentalStatus {
    PENDING,        // Khách gửi yêu cầu, chờ chủ xe duyệt (tối đa 60 phút)
    APPROVED,       // Chủ xe đã duyệt, chờ khách thanh toán cọc 30%
    CONFIRMED,      // Khách đã đặt cọc thành công, chuyến đi chính thức được giữ chỗ
    REJECTED,       // Chủ xe từ chối hoặc bị hệ thống tự động từ chối do trùng lịch
    EXPIRED,        // Quá 60 phút chủ xe không phản hồi, đơn tự động hủy
    CANCELLED,      // Khách thuê chủ động hủy đơn khi còn PENDING
    IN_PROGRESS,    // Đã giao nhận xe, đang trong chuyến đi
    COMPLETED       // Đã trả xe và hoàn tất chuyến đi
}
