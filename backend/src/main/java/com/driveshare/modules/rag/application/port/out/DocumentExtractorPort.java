package com.driveshare.modules.rag.application.port.out;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface DocumentExtractorPort {
    List<com.driveshare.modules.rag.dto.DocumentChunk> parseFile(MultipartFile file);
}

