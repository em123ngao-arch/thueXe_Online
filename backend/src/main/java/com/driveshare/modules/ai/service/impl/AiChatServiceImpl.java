package com.driveshare.modules.ai.service.impl;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.request.ChatRequest;
import com.driveshare.modules.ai.dto.response.ChatReplyResponse;
import com.driveshare.modules.ai.entity.ChatMemoryEntity;
import com.driveshare.modules.ai.repository.ChatMemoryRepository;
import com.driveshare.modules.ai.service.AiChatService;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final ChatMemoryRepository chatMemoryRepository;
    private final CarRepository carRepository;
    private final ObjectMapper objectMapper;

    private static final Locale VI_LOCALE = new Locale("vi", "VN");

    @Override
    @Transactional
    public ChatReplyResponse chat(ChatRequest request, Long userId) {
        String sessionId = request.getSessionId();
        String userMessage = request.getMessage().trim();

        // 1. Tải lịch sử chat
        List<ChatMessageDto> history = loadHistory(userId, sessionId);

        // 2. Thêm tin nhắn của User
        history.add(ChatMessageDto.builder().role("USER").content(userMessage).build());

        // 3. Xử lý tạo câu trả lời thông minh dựa trên kho xe thật trong Database
        String botReply = generateSmartResponse(userMessage);

        // 4. Thêm phản hồi của Assistant
        history.add(ChatMessageDto.builder().role("ASSISTANT").content(botReply).build());

        // 5. Lưu lại lịch sử hội thoại vào PostgreSQL
        saveHistory(userId, sessionId, history);

        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message(botReply)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getHistory(String sessionId, Long userId) {
        return loadHistory(userId, sessionId);
    }

    @Override
    @Transactional
    public void clearHistory(String sessionId, Long userId) {
        chatMemoryRepository.findByUserIdAndSessionId(userId, sessionId)
                .ifPresent(chatMemoryRepository::delete);
    }

    // =========================================================================
    // Xử lý logic gợi ý xe thông minh & giải đáp chính sách
    // =========================================================================

    private String generateSmartResponse(String query) {
        String lower = query.toLowerCase();

        // Kiểm tra câu hỏi về chính sách / cọc / thủ tục
        if (lower.contains("cọc") || lower.contains("đặt cọc") || lower.contains("bao nhiêu phần trăm")) {
            return "Chính sách đặt cọc tại DriveShare: Quý khách chỉ cần thanh toán trước **30% tiền cọc** qua chuyển khoản VietQR để khóa lịch xe ngay lập tức. Số tiền 70% còn lại sẽ thanh toán khi nhận xe thực tế!";
        }

        if (lower.contains("thủ tục") || lower.contains("giấy tờ") || lower.contains("bằng lái") || lower.contains("gplx") || lower.contains("cccd")) {
            return "Để thuê xe trên DriveShare, quý khách cần: 1) CCCD gắn chip hợp lệ, 2) Bằng lái xe (GPLX hạng B1 hoặc B2 trở lên) đã được duyệt trên hệ thống, và 3) Tài sản thế chấp (hoặc xe máy + cà vẹt) khi nhận xe từ chủ xe.";
        }

        if (lower.contains("hủy") || lower.contains("hoàn tiền")) {
            return "Chính sách hủy chuyến của DriveShare: Hủy trước 48 giờ nhận xe được hoàn 100% tiền cọc; hủy từ 24h - 48h hoàn 70% cọc; hủy dưới 24h không được hoàn cọc.";
        }

        // Tìm kiếm xe trong CSDL thật
        org.springframework.data.domain.Page<Car> carPage = carRepository.findByStatusAndDeletedAtIsNull(
                ECarStatus.ACTIVE, org.springframework.data.domain.PageRequest.of(0, 20)
        );
        List<Car> activeCars = carPage.getContent();

        if (!activeCars.isEmpty()) {
            Car matchedCar = findBestMatchingCar(activeCars, lower);
            if (matchedCar != null) {
                String priceFormatted = formatCurrency(matchedCar.getPricePerDay());
                return String.format(
                        "Dựa trên yêu cầu của bạn, tôi gợi ý dòng xe: **%s %s** (Đời %d, %d chỗ, hộp số %s, nhiên liệu %s).\n\n" +
                        "• **Địa chỉ nhận xe:** %s\n" +
                        "• **Giá thuê:** %s / ngày\n" +
                        "• **Đặc điểm nổi bật:** %s\n\n" +
                        "Bạn có thể bấm vào xe này trên trang chủ để xem chi tiết ảnh và đặt cọc 30%% qua VietQR ngay nhé!",
                        matchedCar.getBrand(),
                        matchedCar.getModel(),
                        matchedCar.getYear() != null ? matchedCar.getYear() : 2023,
                        matchedCar.getSeats() != null ? matchedCar.getSeats() : 5,
                        "AUTOMATIC".equalsIgnoreCase(String.valueOf(matchedCar.getTransmission())) ? "Tự động" : "Số sàn",
                        "ELECTRIC".equalsIgnoreCase(String.valueOf(matchedCar.getFuelType())) ? "Điện" : "Xăng",
                        matchedCar.getAddress() != null ? matchedCar.getAddress() : "TP. Hồ Chí Minh",
                        priceFormatted,
                        matchedCar.getDescription() != null ? matchedCar.getDescription() : "Xe được bảo dưỡng chính hãng định kỳ, sạch sẽ thơm tho."
                );
            }
        }

        // Lời chào và hướng dẫn mặc định
        return "Xin chào! Tôi là **Trợ lý AI DriveShare**. Tôi có thể giúp bạn tìm xe thuê theo số chỗ (4-7 chỗ), loại xe (Sedan, SUV, Xe điện VinFast...), khoảng giá hoặc giải đáp chính sách cọc 30% VietQR. Bạn đang muốn tìm xe đi đâu và cho mấy người?";
    }

    private Car findBestMatchingCar(List<Car> cars, String lowerQuery) {
        // 1. Tìm theo số chỗ
        if (lowerQuery.contains("7 chỗ") || lowerQuery.contains("7 cho") || lowerQuery.contains("bảy chỗ")) {
            for (Car c : cars) {
                if (c.getSeats() != null && c.getSeats() >= 7) return c;
            }
        }
        if (lowerQuery.contains("5 chỗ") || lowerQuery.contains("4 chỗ") || lowerQuery.contains("5 cho")) {
            for (Car c : cars) {
                if (c.getSeats() != null && c.getSeats() <= 5) return c;
            }
        }

        // 2. Tìm theo hãng
        if (lowerQuery.contains("vinfast") || lowerQuery.contains("xe điện") || lowerQuery.contains("vf8") || lowerQuery.contains("vf9")) {
            for (Car c : cars) {
                if ("VinFast".equalsIgnoreCase(c.getBrand()) || "ELECTRIC".equalsIgnoreCase(String.valueOf(c.getFuelType()))) return c;
            }
        }
        if (lowerQuery.contains("toyota") || lowerQuery.contains("vios") || lowerQuery.contains("camry")) {
            for (Car c : cars) {
                if ("Toyota".equalsIgnoreCase(c.getBrand())) return c;
            }
        }
        if (lowerQuery.contains("mazda") || lowerQuery.contains("cx5") || lowerQuery.contains("cx-5")) {
            for (Car c : cars) {
                if ("Mazda".equalsIgnoreCase(c.getBrand())) return c;
            }
        }

        // 3. Mặc định lấy chiếc xe đầu tiên có sẵn
        return cars.get(0);
    }

    private List<ChatMessageDto> loadHistory(Long userId, String sessionId) {
        return chatMemoryRepository.findByUserIdAndSessionId(userId, sessionId)
                .map(entity -> {
                    try {
                        return objectMapper.readValue(entity.getMessages(), new TypeReference<List<ChatMessageDto>>() {});
                    } catch (Exception e) {
                        log.warn("Không thể parse chat history cho session {}: {}", sessionId, e.getMessage());
                        return new ArrayList<ChatMessageDto>();
                    }
                })
                .orElseGet(ArrayList::new);
    }

    private void saveHistory(Long userId, String sessionId, List<ChatMessageDto> history) {
        try {
            // Giới hạn tối đa 20 tin nhắn gần nhất để tránh phình dữ liệu
            List<ChatMessageDto> truncated = history.size() > 20
                    ? history.subList(history.size() - 20, history.size())
                    : history;

            String json = objectMapper.writeValueAsString(truncated);
            ChatMemoryEntity entity = chatMemoryRepository.findByUserIdAndSessionId(userId, sessionId)
                    .map(existing -> {
                        existing.setMessages(json);
                        existing.setUpdatedAt(Instant.now());
                        return existing;
                    })
                    .orElseGet(() -> ChatMemoryEntity.builder()
                            .userId(userId)
                            .sessionId(sessionId)
                            .messages(json)
                            .updatedAt(Instant.now())
                            .build());

            chatMemoryRepository.save(entity);
        } catch (Exception e) {
            log.error("Lỗi khi lưu chat history cho session {}: {}", sessionId, e.getMessage());
        }
    }

    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) return "Thỏa thuận";
        NumberFormat nf = NumberFormat.getInstance(VI_LOCALE);
        return nf.format(amount) + " đ";
    }
}
