package com.driveshare.common.enums;

/**
 * Nhà cung cấp xác thực tài khoản.
 * LOCAL  = Đăng ký bằng email + mật khẩu thông thường.
 * GOOGLE = Đăng nhập qua Google OAuth2 (BR-03).
 */
public enum EAuthProvider {
    LOCAL,
    GOOGLE
}
