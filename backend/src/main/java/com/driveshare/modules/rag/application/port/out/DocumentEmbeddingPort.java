package com.driveshare.modules.rag.application.port.out;

public interface DocumentEmbeddingPort {
    float[] computeEmbedding(String text);
}

