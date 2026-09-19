package com.driveshare.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu cũ không được để trống")
    @JsonAlias({"oldPassword", "currentPassword"})
    @JsonProperty("oldPassword")
    private String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;

    public String getCurrentPassword() {
        return oldPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.oldPassword = currentPassword;
    }
}
