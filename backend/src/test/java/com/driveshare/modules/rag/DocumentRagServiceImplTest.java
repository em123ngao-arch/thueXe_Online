package com.driveshare.modules.rag;

import com.driveshare.modules.ai.service.GeminiService;
import com.driveshare.modules.rag.dto.DocumentChunk;
import com.driveshare.modules.rag.dto.RagAskRequest;
import com.driveshare.modules.rag.dto.RagAskResponse;
import com.driveshare.modules.rag.dto.RagDocumentDto;
import com.driveshare.modules.rag.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentRagServiceImplTest {

    @Mock
    private DocumentParserService documentParserService;

    @Mock
    private GeminiEmbeddingService geminiEmbeddingService;

    @Mock
    private GeminiService geminiService;

    private RamVectorStore ramVectorStore;
    private DocumentRagServiceImpl documentRagService;

    @BeforeEach
    void setUp() {
        ramVectorStore = new RamVectorStore();
        documentRagService = new DocumentRagServiceImpl(
                documentParserService,
                geminiEmbeddingService,
                ramVectorStore,
                geminiService
        );
    }

    @Test
    @DisplayName("Upload document: Chunks are embedded and stored in RAM")
    void testUploadAndIndex() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", "Nội dung tài liệu thử nghiệm".getBytes(StandardCharsets.UTF_8)
        );

        DocumentChunk chunk = DocumentChunk.builder()
                .chunkId("doc1_c1")
                .documentId("doc1")
                .documentName("test.txt")
                .pageNumber(1)
                .section("Đoạn 1")
                .chunkIndex(1)
                .content("Nội dung tài liệu thử nghiệm")
                .build();

        DocumentParserService.ParsedDocumentResult parsed = new DocumentParserService.ParsedDocumentResult(
                "doc1", "test.txt", "TXT", 25, 1, List.of(chunk)
        );

        when(documentParserService.parseAndChunk(file)).thenReturn(parsed);
        when(geminiEmbeddingService.embedText(any())).thenReturn(new float[]{0.1f, 0.2f, 0.3f});

        RagDocumentDto result = documentRagService.uploadAndIndex(file);

        assertThat(result).isNotNull();
        assertThat(result.getFileName()).isEqualTo("test.txt");
        assertThat(result.getChunkCount()).isEqualTo(1);
        assertThat(ramVectorStore.getTotalChunks()).isEqualTo(1);
    }

    @Test
    @DisplayName("Ask with empty store: Returns polite warning to upload documents")
    void testAskEmptyStore() {
        RagAskRequest request = new RagAskRequest("Quy định là gì?", 4);
        RagAskResponse response = documentRagService.ask(request);

        assertThat(response).isNotNull();
        assertThat(response.getAnswer()).contains("chưa có tài liệu nào được nạp vào bộ nhớ RAM");
        assertThat(response.getCitations()).isEmpty();
    }

    @Test
    @DisplayName("Ask with indexed document: Returns answer and exact chunk citation")
    void testAskWithIndexedDocument() {
        float[] vector = new float[]{1.0f, 0.0f};
        DocumentChunk chunk = DocumentChunk.builder()
                .chunkId("doc1_p1_c1")
                .documentId("doc1")
                .documentName("HuongDan.pdf")
                .pageNumber(2)
                .section("Trang 2 (Đoạn 1)")
                .chunkIndex(1)
                .content("Hạn nộp báo cáo là ngày 15 hàng tháng.")
                .embedding(vector)
                .build();

        RagDocumentDto doc = RagDocumentDto.builder()
                .id("doc1")
                .fileName("HuongDan.pdf")
                .fileType("PDF")
                .chunkCount(1)
                .build();

        ramVectorStore.addDocument(doc, List.of(chunk));

        when(geminiEmbeddingService.embedText(any())).thenReturn(vector);
        when(geminiService.generateContent(any(), any(), any()))
                .thenReturn(Optional.of("Hạn nộp báo cáo là ngày 15 hàng tháng theo tài liệu."));

        RagAskRequest request = new RagAskRequest("Hạn nộp báo cáo khi nào?", 3);
        RagAskResponse response = documentRagService.ask(request);

        assertThat(response).isNotNull();
        assertThat(response.getAnswer()).contains("ngày 15 hàng tháng");
        assertThat(response.getCitations()).hasSize(1);
        assertThat(response.getCitations().get(0).getDocumentName()).isEqualTo("HuongDan.pdf");
        assertThat(response.getCitations().get(0).getPageNumber()).isEqualTo(2);
        assertThat(response.getCitations().get(0).getChunkId()).isEqualTo("doc1_p1_c1");
    }
}
