package com.driveshare.common.enums;

public enum ERentalStatus {
    PENDING,                    // Khách gửi yêu cầu (tương thích ngược)
    PENDING_APPROVAL,           // Đặc tả v2.0.0: Khách đã gửi yêu cầu, đang chờ chủ xe duyệt hồ sơ
    WAITING_PAYMENT,            // Đặc tả v2.0.0: Chủ xe đã duyệt 1 khách, kích hoạt Soft Lock 45 phút
    APPROVED,                   // Tương thích ngược: Chủ xe đã duyệt, chờ khách cọc
    ON_HOLD,                    // Đặc tả v2.0.0: Đơn của các khách khác bị tạm hoãn do xe đang trong Soft Lock
    CONFIRMED,                  // Khách đã đặt cọc 30% thành công, kích hoạt Hard Lock
    IN_PROGRESS,                // Đã giao nhận xe, đang trong chuyến đi
    COMPLETED,                  // Đã trả xe và hoàn tất chuyến đi
    EXPIRED,                    // Hết hạn 45 phút giữ chỗ
    AUTO_EXPIRED_NO_HOST_ACTION,// Đặc tả v2.0.0: Quá hạn chủ xe không phản hồi
    REJECTED,                   // Bị từ chối bởi chủ xe hoặc hệ thống tự động từ chối do trùng lịch
    WITHDRAWN_BY_GUEST,         // Đặc tả v2.0.0: Khách chủ động rút yêu cầu khi chưa duyệt/chưa cọc
    CANCELLED,                  // Tương thích ngược: Khách hủy đơn
    CANCELLED_BY_GUEST,         // Đặc tả v2.0.0: Khách hủy sau khi cọc
    NO_SHOW,                    // Đặc tả v2.0.0: Khách không đến nhận xe
    CANCELLED_BY_HOST,          // Đặc tả v2.0.0: Chủ xe hủy sau khi cọc
    DISPUTED                    // Đặc tả v2.0.0: Có tranh chấp khi giao nhận/trả xe
}
