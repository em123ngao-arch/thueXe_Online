package com.driveshare.modules.admin.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCarFilterRequest {

    @Builder.Default
    private int page = 1;

    @Builder.Default
    private int limit = 10;

    private String search;

    @Builder.Default
    private String status = "all";

    @Builder.Default
    private String sortBy = "created_at";

    @Builder.Default
    private String sortDir = "desc";
}
