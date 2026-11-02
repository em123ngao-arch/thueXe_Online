package com.driveshare.modules.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Phản hồi từ AI Chatbot DriveShare.
 * Bao gồm tin nhắn văn bản + metadata cấu trúc cho Frontend render Car Cards.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatReplyResponse {

    /** Session ID của cuộc hội thoại */
    private String sessionId;

    /** Nội dung phản hồi dạng văn bản (có thể chứa Markdown) */
    private String message;

    /** Danh sách xe gợi ý dạng structured data — Frontend dùng để render Car Cards */
    private List<CarCardDto> suggestedCars;

    /** Kết quả tính tiền cọc 30% (nếu khách hỏi tính tiền) */
    private DepositCalculation depositCalculation;

    @JsonProperty("sessionId")
    public String getSessionIdCamel() {
        return sessionId;
    }

    @JsonProperty("suggestedCars")
    public List<CarCardDto> getSuggestedCarsCamel() {
        return suggestedCars;
    }

    @JsonProperty("depositCalculation")
    public DepositCalculation getDepositCalculationCamel() {
        return depositCalculation;
    }
}
