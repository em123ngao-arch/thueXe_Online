package com.driveshare.modules.rag.service;

import com.driveshare.modules.rag.application.port.in.AskDocumentRagUseCase;
import com.driveshare.modules.rag.application.port.in.ManageDocumentUseCase;

public interface DocumentRagService extends AskDocumentRagUseCase, ManageDocumentUseCase {
}
