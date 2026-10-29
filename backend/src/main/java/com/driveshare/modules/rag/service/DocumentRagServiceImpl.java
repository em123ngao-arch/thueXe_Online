package com.driveshare.modules.rag.service;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.ai.service.GeminiService;
import com.driveshare.modules.rag.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentRagServiceImpl implements DocumentRagService {

    private final DocumentParserService documentParserService;
    private final GeminiEmbeddingService geminiEmbeddingService;
    private final RamVectorStore ramVectorStore;
    private final GeminiService geminiService;

    @Override
    public RagDocumentDto uploadAndIndex(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "File tải lên không được rỗng");
        }

        long startTime = System.currentTimeMillis();
        try {
            // 1. Parse văn bản và chia đoạn (Chunking)
            DocumentParserService.ParsedDocumentResult parsed = documentParserService.parseAndChunk(file);

            // 2. Tính Vector Embedding cho từng Chunk trong RAM
            for (DocumentChunk chunk : parsed.chunks()) {
                float[] embedding = geminiEmbeddingService.embedText(chunk.getContent());
                chunk.setEmbedding(embedding);
            }

            RagDocumentDto docDto = RagDocumentDto.builder()
                    .id(parsed.documentId())
                    .fileName(parsed.fileName())
                    .fileType(parsed.fileType())
                    .fileSize(parsed.fileSize())
                    .chunkCount(parsed.chunks().size())
                    .pageCount(parsed.pageCount())
                    .uploadedAt(LocalDateTime.now())
                    .build();

            // 3. Nạp vào bộ nhớ RAM Vector Store
            ramVectorStore.addDocument(docDto, parsed.chunks());

            log.info("Đã nạp thành công '{}' ({} chunks, {} ms) vào RAM Vector Store",
                    docDto.getFileName(), docDto.getChunkCount(), System.currentTimeMillis() - startTime);

            return docDto;
        } catch (Exception e) {
            log.error("Lỗi khi xử lý tài liệu RAG: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Không thể đọc hoặc embedding tài liệu: " + e.getMessage());
        }
    }

    @Override
    public RagAskResponse ask(RagAskRequest request) {
        long startTime = System.currentTimeMillis();
        String question = request.getQuestion().trim();
        int topK = request.getTopK() != null ? request.getTopK() : 4;

        if (ramVectorStore.getTotalChunks() == 0) {
            return RagAskResponse.builder()
                    .question(question)
                    .answer("⚠️ Hiện tại chưa có tài liệu nào được nạp vào bộ nhớ RAM. Vui lòng tải lên tài liệu PDF hoặc Word (.docx) ở khung bên trái trước khi đặt câu hỏi!")
                    .citations(Collections.emptyList())
                    .totalChunksSearched(0)
                    .processingTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        }

        // 1. Vectorize câu hỏi của người dùng
        float[] queryVector = geminiEmbeddingService.embedText(question);

        // 2. Tìm kiếm Top-K chunks tương đồng nhất trong RAM Vector Store
        List<RamVectorStore.ScoredChunk> topChunks = ramVectorStore.searchTopK(queryVector, topK);

        // 3. Xây dựng danh sách trích dẫn (Citations)
        List<CitationSourceDto> citations = new ArrayList<>();
        StringBuilder contextBuilder = new StringBuilder();

        for (int i = 0; i < topChunks.size(); i++) {
            RamVectorStore.ScoredChunk sc = topChunks.get(i);
            DocumentChunk c = sc.chunk();
            double sim = sc.score();

            citations.add(CitationSourceDto.builder()
                    .chunkId(c.getChunkId())
                    .documentName(c.getDocumentName())
                    .pageNumber(c.getPageNumber())
                    .section(c.getSection())
                    .similarity(Math.round(sim * 1000.0) / 1000.0)
                    .similarityPercent(String.format("%.1f%%", Math.max(0.0, sim * 100)))
                    .excerpt(c.getContent())
                    .build());

            contextBuilder.append(String.format("""
                    ---
                    [Đoạn %d - Tài liệu: %s | %s | Chunk ID: %s | Độ tương quan: %.1f%%]:
                    %s
                    """,
                    i + 1,
                    c.getDocumentName(),
                    c.getSection(),
                    c.getChunkId(),
                    sim * 100,
                    c.getContent()
            ));
        }

        // 4. Xây dựng Prompt cho LLM
        String systemInstruction = """
                Bạn là Trợ Lý RAG Chuyên Nghiệp. Nhiệm vụ của bạn là trả lời câu hỏi của người dùng DỰA HOÀN TOÀN TRÊN CÁC ĐOẠN TRÍCH TÀI LIỆU được trích xuất từ bộ nhớ RAM bên dưới.

                [CÁC ĐOẠN TRÍCH TÀI LIỆU KHẢ DỤNG]:
                """ + contextBuilder.toString() + """
                
                [QUY TẮC BẮT BUỘC]:
                1. CHỈ sử dụng thông tin có trong các đoạn trích trên để trả lời. TUYỆT ĐỐI KHÔNG tự bịa ra thông tin ngoài tài liệu.
                2. Nếu thông tin không có trong các đoạn trích, hãy trả lời rõ: "Tài liệu được cung cấp không chứa thông tin để trả lời câu hỏi này."
                3. Bắt buộc ở cuối câu trả lời, hãy tóm tắt nguồn thông tin: [Trích dẫn: Tên tài liệu, Trang/Mục, Chunk ID].
                4. Trả lời bằng tiếng Việt rõ ràng, mạch lạc, dễ hiểu.
                """;

        String answer;
        Optional<String> geminiOutput = geminiService.generateContent(systemInstruction, Collections.emptyList(), question);

        if (geminiOutput.isPresent() && !geminiOutput.get().isBlank()) {
            answer = geminiOutput.get().trim();
        } else {
            // Fallback khi không có kết nối Gemini
            log.info("Gemini không phản hồi, sử dụng RAG Local Extractive Fallback");
            answer = buildFallbackAnswer(question, topChunks);
        }

        return RagAskResponse.builder()
                .question(question)
                .answer(answer)
                .citations(citations)
                .totalChunksSearched(ramVectorStore.getTotalChunks())
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();
    }

    private String buildFallbackAnswer(String question, List<RamVectorStore.ScoredChunk> topChunks) {
        if (topChunks.isEmpty()) {
            return "Không tìm thấy nội dung phù hợp trong tài liệu để trả lời câu hỏi.";
        }

        RamVectorStore.ScoredChunk best = topChunks.get(0);
        DocumentChunk bestChunk = best.chunk();

        return String.format("""
                Dựa trên tài liệu **%s** (%s - Chunk: `%s`):
                
                %s
                
                *(Ghi chú: Phản hồi được trích xuất trực tiếp từ RAM Vector Store với độ tương đồng %.1f%%).*
                """,
                bestChunk.getDocumentName(),
                bestChunk.getSection(),
                bestChunk.getChunkId(),
                bestChunk.getContent(),
                best.score() * 100
        );
    }

    @Override
    public List<RagDocumentDto> getAllDocuments() {
        return ramVectorStore.getAllDocuments();
    }

    @Override
    public void clearStore() {
        ramVectorStore.clear();
    }

    @Override
    public Map<String, Object> getStats() {
        return Map.of(
                "totalDocuments", ramVectorStore.getTotalDocuments(),
                "totalChunksInRam", ramVectorStore.getTotalChunks(),
                "geminiEnabled", geminiService.isEnabled(),
                "status", "ACTIVE"
        );
    }
}
