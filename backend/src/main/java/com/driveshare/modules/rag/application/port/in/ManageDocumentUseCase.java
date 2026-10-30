package com.driveshare.modules.rag.application.port.in;

import com.driveshare.modules.rag.dto.RagDocumentDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface ManageDocumentUseCase {
    RagDocumentDto uploadAndIndex(MultipartFile file);
    List<RagDocumentDto> getAllDocuments();
    void clearStore();
    Map<String, Object> getStats();
}

