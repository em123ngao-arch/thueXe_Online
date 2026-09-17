package com.driveshare.modules.user.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenterProfileUpdateRequest {

    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    private String fullName;

    @Pattern(regexp = "^(0|\\+84)[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    @Size(max = 500, message = "Đường dẫn ảnh đại diện tối đa 500 ký tự")
    private String avatarUrl;

    @Pattern(regexp = "^[0-9]{9,12}$", message = "Số CMND/CCCD phải gồm 9 đến 12 chữ số")
    private String idCardNumber;

    @Pattern(regexp = "^[0-9]{12}$", message = "Số giấy phép lái xe phải gồm đúng 12 chữ số")
    private String licenseNumber;

    @Size(max = 150, message = "Họ tên trên GPLX tối đa 150 ký tự")
    private String licenseFullName;

    private LocalDate licenseDob;

    private LocalDate licenseIssueDate;

    @Future(message = "Ngày hết hạn bằng lái phải ở tương lai")
    private LocalDate licenseExpiryDate;

    @Size(max = 500, message = "Đường dẫn ảnh mặt trước GPLX tối đa 500 ký tự")
    private String licenseFrontUrl;

    @Size(max = 500, message = "Đường dẫn ảnh mặt sau GPLX tối đa 500 ký tự")
    private String licenseBackUrl;
}
