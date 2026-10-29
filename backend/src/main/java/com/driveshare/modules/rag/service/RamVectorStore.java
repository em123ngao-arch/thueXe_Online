package com.driveshare.modules.rag.service;

import com.driveshare.modules.rag.dto.DocumentChunk;
import com.driveshare.modules.rag.dto.RagDocumentDto;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class RamVectorStore {

    public record ScoredChunk(DocumentChunk chunk, double score) {}

    private final Map<String, RagDocumentDto> documents = new ConcurrentHashMap<>();
    @Getter
    private final List<DocumentChunk> chunks = new CopyOnWriteArrayList<>();

    public synchronized void addDocument(RagDocumentDto doc, List<DocumentChunk> docChunks) {
        // Xóa chunks cũ của file trùng tên (nếu có) để tránh nhân bản dữ liệu khi upload lại
        chunks.removeIf(c -> c.getDocumentName() != null && c.getDocumentName().equalsIgnoreCase(doc.getFileName()));
        documents.put(doc.getId(), doc);
        chunks.addAll(docChunks);
        log.info("RAM Vector Store đã nạp: '{}'. Hiện có: {} tài liệu, {} chunks trong RAM",
                doc.getFileName(), documents.size(), chunks.size());
    }

    public List<ScoredChunk> searchTopK(float[] queryEmbedding, int topK) {
        if (chunks.isEmpty() || queryEmbedding == null || queryEmbedding.length == 0) {
            return Collections.emptyList();
        }

        List<ScoredChunk> scoredList = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            if (chunk.getEmbedding() != null) {
                double sim = cosineSimilarity(queryEmbedding, chunk.getEmbedding());
                scoredList.add(new ScoredChunk(chunk, sim));
            }
        }

        scoredList.sort((a, b) -> Double.compare(b.score(), a.score()));
        return scoredList.stream().limit(Math.max(1, topK)).toList();
    }

    public synchronized void clear() {
        documents.clear();
        chunks.clear();
        log.info("RAM Vector Store đã được reset trống.");
    }

    public List<RagDocumentDto> getAllDocuments() {
        return new ArrayList<>(documents.values());
    }

    public int getTotalChunks() {
        return chunks.size();
    }

    public int getTotalDocuments() {
        return documents.size();
    }

    public static double cosineSimilarity(float[] v1, float[] v2) {
        if (v1 == null || v2 == null || v1.length != v2.length) {
            return 0.0;
        }
        double dot = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            normA += v1[i] * v1[i];
            normB += v2[i] * v2[i];
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
