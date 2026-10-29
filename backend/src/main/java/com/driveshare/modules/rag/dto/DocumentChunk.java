package com.driveshare.modules.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentChunk {
    private String chunkId;
    private String documentId;
    private String documentName;
    private int pageNumber;
    private String section;
    private int chunkIndex;
    private String content;
    private float[] embedding;
}
