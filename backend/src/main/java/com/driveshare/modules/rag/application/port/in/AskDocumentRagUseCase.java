package com.driveshare.modules.rag.application.port.in;

import com.driveshare.modules.rag.dto.RagAskRequest;
import com.driveshare.modules.rag.dto.RagAskResponse;

public interface AskDocumentRagUseCase {
    RagAskResponse ask(RagAskRequest request);
}

