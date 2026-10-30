package com.driveshare.modules.ai.application.port.out;

import java.util.List;

/**
 * Outbound Port for document retrieval augmentation (RAG).
 */
public interface DocumentSearchPort {
    List<String> findRelevantSnippets(String query, int topK);
}

