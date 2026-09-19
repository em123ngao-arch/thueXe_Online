package com.driveshare.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // General & Validation
    UNCATEGORIZED_EXCEPTION("INTERNAL_SERVER_ERROR", "Lỗi máy chủ nội bộ", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_FAILED("VALIDATION_FAILED", "Dữ liệu gửi lên không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST("INVALID_REQUEST", "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Không tìm thấy dữ liệu yêu cầu", HttpStatus.NOT_FOUND),

    // Authentication & Authorization
    AUTH_FAILED("AUTH_FAILED", "Email/Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    UNAUTHENTICATED("UNAUTHENTICATED", "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    ACCOUNT_LOCKED("ACCOUNT_LOCKED", "Tài khoản của bạn đã bị khóa", HttpStatus.FORBIDDEN),
    ACCOUNT_PENDING("ACCOUNT_PENDING", "Tài khoản của bạn đang chờ phê duyệt", HttpStatus.FORBIDDEN),
    TOKEN_INVALID("TOKEN_INVALID", "Mã xác thực JWT không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    RATE_LIMITED("RATE_LIMITED", "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút", HttpStatus.TOO_MANY_REQUESTS),
    WEAK_PASSWORD("WEAK_PASSWORD", "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số", HttpStatus.BAD_REQUEST),
    PASSWORD_CONFIRM_MISMATCH("PASSWORD_CONFIRM_MISMATCH", "Mật khẩu xác nhận không khớp", HttpStatus.BAD_REQUEST),
    RESET_TOKEN_INVALID("RESET_TOKEN_INVALID", "Liên kết đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng", HttpStatus.BAD_REQUEST),

    // User & Profile
    USER_NOT_FOUND("USER_NOT_FOUND", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    EMAIL_EXISTED("EMAIL_EXISTED", "Địa chỉ email đã được sử dụng", HttpStatus.CONFLICT),
    USERNAME_EXISTED("USERNAME_EXISTED", "Tên đăng nhập đã tồn tại", HttpStatus.CONFLICT),
    PHONE_EXISTED("PHONE_EXISTED", "Số điện thoại đã được sử dụng", HttpStatus.CONFLICT),
    PASSWORD_NOT_MATCH("PASSWORD_NOT_MATCH", "Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND("ROLE_NOT_FOUND", "Vai trò không hợp lệ", HttpStatus.NOT_FOUND),
    CANNOT_EDIT_OTHER_PROFILE("CANNOT_EDIT_OTHER_PROFILE", "Bạn không có quyền chỉnh sửa hồ sơ của người dùng khác", HttpStatus.FORBIDDEN),
    ID_CARD_EXISTED("ID_CARD_EXISTED", "Số CMND/CCCD đã được sử dụng", HttpStatus.CONFLICT),
    LICENSE_NUMBER_EXISTED("LICENSE_NUMBER_EXISTED", "Số giấy phép lái xe đã tồn tại trong hệ thống", HttpStatus.CONFLICT),
    RENTER_PROFILE_NOT_FOUND("RENTER_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ giấy tờ của khách thuê", HttpStatus.NOT_FOUND),

    // Upload & File Validation (BR-08)
    MISSING_CCCD_SIDE("MISSING_CCCD_SIDE", "Phải upload đủ cả mặt trước và mặt sau CCCD", HttpStatus.BAD_REQUEST),
    INVALID_FILE_FORMAT("INVALID_FILE_FORMAT", "Định dạng không hợp lệ. Chỉ chấp nhận JPG, PNG", HttpStatus.BAD_REQUEST),
    FILE_SIZE_EXCEEDED("FILE_SIZE_EXCEEDED", "Kích thước file vượt quá giới hạn cho phép", HttpStatus.BAD_REQUEST),
    FIELD_LOCKED("FIELD_LOCKED", "Thông tin định danh đã được phê duyệt, không thể chỉnh sửa. Vui lòng liên hệ Admin", HttpStatus.BAD_REQUEST),
    ROLE_NOT_SUPPORTED("ROLE_NOT_SUPPORTED", "Chức năng này chỉ áp dụng cho vai trò Khách thuê (Renter)", HttpStatus.BAD_REQUEST),

    // Car Management (CRP-23, CRP-24)
    CAR_NOT_FOUND("CAR_NOT_FOUND", "Không tìm thấy thông tin xe", HttpStatus.NOT_FOUND),
    CAR_ACCESS_DENIED("CAR_ACCESS_DENIED", "Bạn không có quyền thao tác trên xe này", HttpStatus.FORBIDDEN),
    CAR_PLATE_DUPLICATE("CAR_PLATE_DUPLICATE", "Biển số xe đã tồn tại trong hệ thống", HttpStatus.CONFLICT),
    CAR_HAS_ACTIVE_BOOKING("CAR_HAS_ACTIVE_BOOKING", "Xe đang có chuyến đi hoạt động, không thể xóa", HttpStatus.BAD_REQUEST),
    CAR_ALREADY_PROCESSED("CAR_ALREADY_PROCESSED", "Xe đã được xử lý thẩm định trước đó", HttpStatus.BAD_REQUEST),
    OWNER_NOT_APPROVED("OWNER_NOT_APPROVED", "Hồ sơ chủ xe của bạn chưa được phê duyệt để đăng xe", HttpStatus.FORBIDDEN),

    // Document & Admin (Khiêm - feat/Backend)
    DOCUMENT_NOT_FOUND("DOCUMENT_NOT_FOUND", "Không tìm thấy giấy tờ yêu cầu", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
