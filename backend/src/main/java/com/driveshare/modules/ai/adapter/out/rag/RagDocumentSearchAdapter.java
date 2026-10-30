package com.driveshare.modules.ai.adapter.out.rag;

import com.driveshare.modules.ai.application.port.out.DocumentSearchPort;
import com.driveshare.modules.rag.service.GeminiEmbeddingService;
import com.driveshare.modules.rag.service.RamVectorStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class RagDocumentSearchAdapter implements DocumentSearchPort {

    @Autowired(required = false)
    private RamVectorStore ramVectorStore;

    @Autowired(required = false)
    private GeminiEmbeddingService geminiEmbeddingService;

    @Override
    public List<String> findRelevantSnippets(String query, int topK) {
        if (ramVectorStore == null || ramVectorStore.getChunks().isEmpty() || geminiEmbeddingService == null) {
            return Collections.emptyList();
        }
        try {
            float[] queryVector = geminiEmbeddingService.getEmbedding(query);
            List<RamVectorStore.ScoredChunk> topDocs = ramVectorStore.searchTopK(queryVector, topK);
            return topDocs.stream()
                    .filter(c -> c.score() >= 0.50)
                    .map(c -> String.format("[%s (Trang %d)] %s",
                            c.chunk().getDocumentName(), c.chunk().getPageNumber(), c.chunk().getText()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Không thể truy vấn RAG document: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}

