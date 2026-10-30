package com.driveshare.modules.rag.domain.model;

/**
 * Pure Java Domain Model for RAG document chunk.
 */
public class RagDocumentChunk {
    private String chunkId;
    private String documentId;
    private String content;
    private int pageNumber;

    public RagDocumentChunk() {}

    public RagDocumentChunk(String chunkId, String documentId, String content, int pageNumber) {
        this.chunkId = chunkId;
        this.documentId = documentId;
        this.content = content;
        this.pageNumber = pageNumber;
    }

    public String getChunkId() { return chunkId; }
    public void setChunkId(String chunkId) { this.chunkId = chunkId; }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }
}

