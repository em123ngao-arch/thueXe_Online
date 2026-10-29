package com.driveshare.modules.rag.service;

import com.driveshare.modules.rag.dto.DocumentChunk;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class DocumentParserService {

    private static final int CHUNK_SIZE = 500; // ký tự mỗi chunk
    private static final int CHUNK_OVERLAP = 100; // ký tự gối đầu

    public record ParsedDocumentResult(
            String documentId,
            String fileName,
            String fileType,
            long fileSize,
            int pageCount,
            List<DocumentChunk> chunks
    ) {}

    public ParsedDocumentResult parseAndChunk(MultipartFile file) throws Exception {
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown_document";
        String lowerName = originalFilename.toLowerCase();
        String docId = UUID.randomUUID().toString();
        long fileSize = file.getSize();

        List<DocumentChunk> chunks = new ArrayList<>();
        int pageCount = 1;
        String fileType;

        if (lowerName.endsWith(".pdf")) {
            fileType = "PDF";
            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                pageCount = document.getNumberOfPages();
                PDFTextStripper stripper = new PDFTextStripper();

                for (int page = 1; page <= pageCount; page++) {
                    stripper.setStartPage(page);
                    stripper.setEndPage(page);
                    String pageText = stripper.getText(document);
                    if (pageText != null && !pageText.isBlank()) {
                        List<String> textPieces = splitIntoChunks(pageText.trim(), CHUNK_SIZE, CHUNK_OVERLAP);
                        for (int i = 0; i < textPieces.size(); i++) {
                            chunks.add(DocumentChunk.builder()
                                    .chunkId(docId + "_p" + page + "_c" + (i + 1))
                                    .documentId(docId)
                                    .documentName(originalFilename)
                                    .pageNumber(page)
                                    .section("Trang " + page + " (Đoạn " + (i + 1) + ")")
                                    .chunkIndex(chunks.size() + 1)
                                    .content(textPieces.get(i))
                                    .build());
                        }
                    }
                }
            }
        } else if (lowerName.endsWith(".docx")) {
            fileType = "DOCX";
            try (InputStream is = file.getInputStream();
                 XWPFDocument xwpf = new XWPFDocument(is);
                 XWPFWordExtractor extractor = new XWPFWordExtractor(xwpf)) {
                String fullText = extractor.getText();
                List<String> textPieces = splitIntoChunks(fullText.trim(), CHUNK_SIZE, CHUNK_OVERLAP);
                for (int i = 0; i < textPieces.size(); i++) {
                    chunks.add(DocumentChunk.builder()
                            .chunkId(docId + "_sec_c" + (i + 1))
                            .documentId(docId)
                            .documentName(originalFilename)
                            .pageNumber(1)
                            .section("Mục " + (i + 1))
                            .chunkIndex(chunks.size() + 1)
                            .content(textPieces.get(i))
                            .build());
                }
                pageCount = Math.max(1, (int) Math.ceil((double) fullText.length() / 2000));
            }
        } else {
            // Text thuần / Markdown / khác
            fileType = lowerName.endsWith(".md") ? "MARKDOWN" : "TXT";
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            List<String> textPieces = splitIntoChunks(content.trim(), CHUNK_SIZE, CHUNK_OVERLAP);
            for (int i = 0; i < textPieces.size(); i++) {
                chunks.add(DocumentChunk.builder()
                        .chunkId(docId + "_txt_c" + (i + 1))
                        .documentId(docId)
                        .documentName(originalFilename)
                        .pageNumber(1)
                        .section("Đoạn " + (i + 1))
                        .chunkIndex(chunks.size() + 1)
                        .content(textPieces.get(i))
                        .build());
            }
            pageCount = Math.max(1, (int) Math.ceil((double) content.length() / 2000));
        }

        log.info("Đã parse tài liệu '{}' ({}) thành {} chunks trên {} trang",
                originalFilename, fileType, chunks.size(), pageCount);

        return new ParsedDocumentResult(docId, originalFilename, fileType, fileSize, pageCount, chunks);
    }

    private List<String> splitIntoChunks(String text, int chunkSize, int overlap) {
        List<String> result = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return result;
        }

        int length = text.length();
        if (length <= chunkSize) {
            result.add(text);
            return result;
        }

        int start = 0;
        while (start < length) {
            int end = Math.min(start + chunkSize, length);
            
            // Tìm điểm ngắt câu tự nhiên gần nhất nếu chưa chạm cuối
            if (end < length) {
                int lastPeriod = text.lastIndexOf('\n', end);
                if (lastPeriod > start + (chunkSize / 2)) {
                    end = lastPeriod + 1;
                } else {
                    int lastSpace = text.lastIndexOf(' ', end);
                    if (lastSpace > start + (chunkSize / 2)) {
                        end = lastSpace + 1;
                    }
                }
            }

            String chunk = text.substring(start, end).trim();
            if (!chunk.isBlank()) {
                result.add(chunk);
            }

            if (end >= length) {
                break;
            }
            start = end - overlap;
            if (start < 0) start = 0;
        }
        return result;
    }
}
