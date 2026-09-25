package com.driveshare.modules.admin.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long pendingCarsCount;
    private long pendingCccdCount;
    private long pendingLicensesCount;
    private long activeCarsCount;
    private long totalBookingsCount;
    private long totalUsersCount;
}
