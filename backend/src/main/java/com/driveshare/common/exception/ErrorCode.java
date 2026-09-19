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

    // User & Profile
    USER_NOT_FOUND("USER_NOT_FOUND", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    EMAIL_EXISTED("EMAIL_EXISTED", "Địa chỉ email đã được sử dụng", HttpStatus.CONFLICT),
    USERNAME_EXISTED("USERNAME_EXISTED", "Tên đăng nhập đã tồn tại", HttpStatus.CONFLICT),
    PHONE_EXISTED("PHONE_EXISTED", "Số điện thoại đã được sử dụng", HttpStatus.CONFLICT),
    PASSWORD_NOT_MATCH("PASSWORD_NOT_MATCH", "Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND("ROLE_NOT_FOUND", "Vai trò không hợp lệ", HttpStatus.NOT_FOUND),
    RENTER_PROFILE_NOT_FOUND("RENTER_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ giấy tờ của khách thuê", HttpStatus.NOT_FOUND),

    // Car & Vehicle Documents
    CAR_NOT_FOUND("CAR_NOT_FOUND", "Không tìm thấy thông tin xe", HttpStatus.NOT_FOUND),
    CAR_ALREADY_PROCESSED("CAR_ALREADY_PROCESSED", "Xe đã được xử lý thẩm định trước đó", HttpStatus.BAD_REQUEST),
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
