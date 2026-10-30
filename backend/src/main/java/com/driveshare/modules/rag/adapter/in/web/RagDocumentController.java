package com.driveshare.modules.rag.adapter.in.web;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.rag.application.port.in.AskDocumentRagUseCase;
import com.driveshare.modules.rag.application.port.in.ManageDocumentUseCase;
import com.driveshare.modules.rag.dto.RagAskRequest;
import com.driveshare.modules.rag.dto.RagAskResponse;
import com.driveshare.modules.rag.dto.RagDocumentDto;
import com.driveshare.modules.rag.service.DocumentRagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rag")
@RequiredArgsConstructor
@Tag(name = "Document RAG Controller", description = "Endpoints cho phép tải tài liệu PDF/Word lên RAM, tính embedding và Chat Q&A trích dẫn chunk")
public class RagDocumentController {

    private final DocumentRagService documentRagService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải file PDF, DOCX, TXT để chunking và lưu vector vào RAM")
    public ResponseEntity<ApiResponse<RagDocumentDto>> uploadDocument(@RequestParam("file") MultipartFile file) {
        RagDocumentDto result = documentRagService.uploadAndIndex(file);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/ask")
    @Operation(summary = "Chat hỏi đáp thông tin tài liệu đã nạp trong RAM, kèm nguồn trích dẫn")
    public ResponseEntity<ApiResponse<RagAskResponse>> askQuestion(@Valid @RequestBody RagAskRequest request) {
        RagAskResponse response = documentRagService.ask(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/documents")
    @Operation(summary = "Lấy danh sách các tài liệu hiện có trong RAM")
    public ResponseEntity<ApiResponse<List<RagDocumentDto>>> getDocuments() {
        List<RagDocumentDto> list = documentRagService.getAllDocuments();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Xóa toàn bộ vector và tài liệu trong RAM để nạp bộ mới")
    public ResponseEntity<ApiResponse<Map<String, String>>> clearStore() {
        documentRagService.clearStore();
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Đã xóa toàn bộ dữ liệu trong RAM Vector Store")));
    }

    @GetMapping("/stats")
    @Operation(summary = "Xem thống kê số lượng tài liệu và chunk trong RAM")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = documentRagService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}

