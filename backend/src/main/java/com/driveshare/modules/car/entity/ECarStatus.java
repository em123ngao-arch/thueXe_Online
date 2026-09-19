package com.driveshare.modules.car.entity;

/**
 * Trạng thái vòng đời của một chiếc xe trên hệ thống DriveShare.
 *
 * <pre>
 *  DRAFT   → Chủ xe tạo nháp, chưa gửi duyệt
 *  PENDING → Đã gửi yêu cầu, chờ Admin/Staff xét duyệt
 *  ACTIVE  → Được duyệt, đang hiển thị cho Renter thuê
 *  INACTIVE→ Chủ xe tạm ẩn (không hiển thị tìm kiếm)
 *  REJECTED→ Admin/Staff từ chối duyệt
 * </pre>
 */
public enum ECarStatus {
    DRAFT,
    PENDING,
    ACTIVE,
    INACTIVE,
    REJECTED
}
