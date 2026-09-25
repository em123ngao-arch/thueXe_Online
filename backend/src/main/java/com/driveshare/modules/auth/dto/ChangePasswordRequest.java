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
    @JsonProperty("oldPassword")
    @JsonAlias({"oldPassword", "old_password", "currentPassword", "current_password"})
    private String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @JsonProperty("newPassword")
    @JsonAlias({"newPassword", "new_password"})
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    @JsonProperty("confirmPassword")
    @JsonAlias({"confirmPassword", "confirm_password"})
    private String confirmPassword;

    public String getCurrentPassword() {
        return oldPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.oldPassword = currentPassword;
    }
}
