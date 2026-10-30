package com.driveshare.modules.rag.application.port.out;

import com.driveshare.modules.rag.dto.DocumentChunk;

import java.util.List;

public interface DocumentVectorStorePort {
    void storeChunks(List<DocumentChunk> chunks);
    List<DocumentChunk> searchSimilar(float[] queryVector, int topK);
    List<DocumentChunk> getAllChunks();
    void clear();
}

