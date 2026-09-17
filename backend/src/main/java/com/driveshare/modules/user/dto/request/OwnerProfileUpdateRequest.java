package com.driveshare.modules.user.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerProfileUpdateRequest {

    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    private String fullName;

    @Pattern(regexp = "^(0|\\+84)[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    @Size(max = 500, message = "Đường dẫn ảnh đại diện tối đa 500 ký tự")
    private String avatarUrl;

    @Pattern(regexp = "^[0-9]{9,12}$", message = "Số CMND/CCCD phải gồm 9 đến 12 chữ số")
    private String idCardNumber;

    @Pattern(regexp = "^[0-9]{6,30}$", message = "Số tài khoản ngân hàng phải gồm từ 6 đến 30 chữ số")
    private String bankAccountNumber;

    @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự")
    private String bankName;

    @Size(max = 500, message = "Đường dẫn ảnh mặt trước CMND/CCCD tối đa 500 ký tự")
    private String idCardFrontUrl;

    @Size(max = 500, message = "Đường dẫn ảnh mặt sau CMND/CCCD tối đa 500 ký tự")
    private String idCardBackUrl;
}
