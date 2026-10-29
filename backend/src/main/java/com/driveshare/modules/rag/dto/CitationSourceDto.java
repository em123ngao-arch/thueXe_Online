package com.driveshare.modules.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitationSourceDto {
    private String chunkId;
    private String documentName;
    private int pageNumber;
    private String section;
    private double similarity;
    private String similarityPercent;
    private String excerpt;
}
