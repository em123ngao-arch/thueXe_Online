package com.driveshare.modules.user.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMyProfileRequest {

    @JsonProperty("phoneNumber")
    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phoneNumber;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("address")
    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String address;

    @JsonProperty("fullName")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    private String fullName;

    public String resolvePhoneNumber() {
        return phoneNumber != null ? phoneNumber : phone;
    }
}
