package com.driveshare.modules.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagAskResponse {
    private String question;
    private String answer;
    private List<CitationSourceDto> citations;
    private int totalChunksSearched;
    private long processingTimeMs;
}
