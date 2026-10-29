package com.driveshare.modules.rag.service;

import com.driveshare.modules.rag.dto.RagAskRequest;
import com.driveshare.modules.rag.dto.RagAskResponse;
import com.driveshare.modules.rag.dto.RagDocumentDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface DocumentRagService {
    RagDocumentDto uploadAndIndex(MultipartFile file);
    RagAskResponse ask(RagAskRequest request);
    List<RagDocumentDto> getAllDocuments();
    void clearStore();
    Map<String, Object> getStats();
}
