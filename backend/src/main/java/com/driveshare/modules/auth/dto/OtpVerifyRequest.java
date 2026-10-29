package com.driveshare.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerifyRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải gồm đúng 6 chữ số")
    private String otp;

    private String purpose;
}

