package com.driveshare.modules.admin.application.port.in;

import com.driveshare.modules.admin.dto.response.AdminRentalResponse;
import com.driveshare.modules.admin.dto.response.OverdueRentalResponse;
import com.driveshare.modules.admin.dto.response.ViolationDossierResponse;

import java.util.List;

public interface AdminRentalUseCase {

    List<AdminRentalResponse> getAllRentals(String status);

    List<OverdueRentalResponse> getOverdueRentals();

    ViolationDossierResponse getViolationDossier(Long rentalId);
}

