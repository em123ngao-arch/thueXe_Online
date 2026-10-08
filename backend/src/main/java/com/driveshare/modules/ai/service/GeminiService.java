package com.driveshare.modules.ai.service;

import com.driveshare.modules.ai.dto.ChatMessageDto;

import java.util.List;
import java.util.Optional;

/**
 * Service giao tiếp với Google Gemini AI REST API.
 */
public interface GeminiService {

    /**
     * Gửi yêu cầu sinh nội dung tới Gemini kèm System Instruction (RAG) và lịch sử chat.
     *
     * @param systemInstruction Ngữ cảnh hệ thống & danh sách xe thật từ DB
     * @param history           Lịch sử hội thoại trước đó
     * @param userMessage       Câu hỏi hiện tại của khách
     * @return Phản hồi văn bản từ Gemini nếu thành công, hoặc Optional.empty() nếu không cấu hình key hoặc có lỗi
     */
    Optional<String> generateContent(String systemInstruction, List<ChatMessageDto> history, String userMessage);

    /**
     * Kiểm tra xem Gemini API có sẵn sàng hoạt động (đã cấu hình api-key).
     */
    boolean isEnabled();
}
