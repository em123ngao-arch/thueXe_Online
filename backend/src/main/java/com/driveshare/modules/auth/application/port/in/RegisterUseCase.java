package com.driveshare.modules.auth.application.port.in;

import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.modules.auth.dto.RegisterRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface RegisterUseCase {
    Map<String, Object> registerOwner(RegisterRequest request);
    Map<String, Object> registerRenter(RegisterRequest request);
    Map<String, Object> registerUser(RegisterRequest request, ERole targetRole, EUserStatus initialStatus);
    Map<String, Object> registerWithDocs(RegisterRequest request, MultipartFile cccdFront, MultipartFile cccdBack, MultipartFile gplxFront);
}
