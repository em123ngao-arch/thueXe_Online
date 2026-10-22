package com.driveshare.modules.ai;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.modules.ai.dto.request.ChatRequest;
import com.driveshare.modules.ai.dto.response.ChatReplyResponse;
import com.driveshare.modules.ai.repository.ChatMemoryRepository;
import com.driveshare.modules.ai.service.GeminiService;
import com.driveshare.modules.ai.service.impl.AiChatServiceImpl;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiChatServiceImplTest {

    @Mock
    private ChatMemoryRepository chatMemoryRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private AiChatServiceImpl aiChatService;

    private Car sampleCar;

    @BeforeEach
    void setUp() {
        aiChatService = new AiChatServiceImpl(chatMemoryRepository, carRepository, objectMapper, geminiService);

        sampleCar = Car.builder()
                .carId(1L)
                .brand("Toyota")
                .model("Camry")
                .year(2023)
                .seats(5)
                .transmission(ETransmission.AUTOMATIC)
                .fuelType(EFuelType.GASOLINE)
                .pricePerDay(BigDecimal.valueOf(900_000))
                .status(ECarStatus.ACTIVE)
                .address("Quận 1, TP Hồ Chí Minh")
                .province("Hồ Chí Minh")
                .rating(BigDecimal.valueOf(4.9))
                .ratingCount(12)
                .hasDriverService(true)
                .driverFeePerDay(BigDecimal.valueOf(300_000))
                .build();
    }

    @Test
    @DisplayName("RAG search: User asks for 5 seats car in HCM under 1 million -> returns matched car cards")
    void testChatWithRagSearch() {
        when(geminiService.isEnabled()).thenReturn(false);
        when(chatMemoryRepository.findByUserIdAndSessionId(any(), any())).thenReturn(Optional.empty());

        when(carRepository.findByStatusAndDeletedAtIsNull(eq(ECarStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleCar)));

        ChatRequest request = new ChatRequest("sess-123", "Tìm xe 5 chỗ ở HCM giá dưới 1 triệu");
        ChatReplyResponse response = aiChatService.chat(request, 100L);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).isNotEmpty();
        assertThat(response.getSuggestedCars()).isNotEmpty();
        assertThat(response.getSuggestedCars()).hasSize(1);

        var card = response.getSuggestedCars().get(0);
        assertThat(card.getCarId()).isEqualTo(1L);
        assertThat(card.getName()).contains("Toyota Camry");
        assertThat(card.getSeats()).isEqualTo(5);
        assertThat(card.getTransmission()).isEqualTo("Tự động");
        assertThat(card.getFuelType()).isEqualTo("Xăng");
        assertThat(card.getBookingUrl()).isEqualTo("/car-detail.html?id=1");
    }

    @Test
    @DisplayName("Tool calling: User asks to calculate deposit for 3 days -> returns 30% deposit calculation")
    void testChatWithDepositCalculation() {
        when(geminiService.isEnabled()).thenReturn(false);
        when(chatMemoryRepository.findByUserIdAndSessionId(any(), any())).thenReturn(Optional.empty());

        when(carRepository.findByStatusAndDeletedAtIsNull(eq(ECarStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleCar)));

        ChatRequest request = new ChatRequest("sess-123", "Tôi muốn thuê xe Toyota Camry trong 3 ngày kèm tài xế hết bao nhiêu, cọc bao nhiêu?");
        ChatReplyResponse response = aiChatService.chat(request, 100L);

        assertThat(response).isNotNull();
        assertThat(response.getDepositCalculation()).isNotNull();

        var deposit = response.getDepositCalculation();
        assertThat(deposit.getRentalDays()).isEqualTo(3);
        assertThat(deposit.getWithDriver()).isTrue();
        // 900,000 * 3 = 2,700,000; driver 300,000 * 3 = 900,000 => Grand total = 3,600,000
        assertThat(deposit.getGrandTotal()).isEqualByComparingTo(BigDecimal.valueOf(3_600_000));
        // Deposit 30% = 1,080,000
        assertThat(deposit.getDepositAmount()).isEqualByComparingTo(BigDecimal.valueOf(1_080_000));
        // Remaining 70% = 2,520,000
        assertThat(deposit.getRemainingAmount()).isEqualByComparingTo(BigDecimal.valueOf(2_520_000));
    }

    @Test
    @DisplayName("Gemini LLM: When enabled, uses Gemini text while attaching RAG car cards")
    void testChatWithGeminiEnabled() {
        when(geminiService.isEnabled()).thenReturn(true);
        when(geminiService.generateContent(any(), any(), any()))
                .thenReturn(Optional.of("Chào bạn! Dưới đây là mẫu xe Toyota Camry 2023 rất phù hợp cho bạn."));
        when(chatMemoryRepository.findByUserIdAndSessionId(any(), any())).thenReturn(Optional.empty());
        when(carRepository.findByStatusAndDeletedAtIsNull(eq(ECarStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleCar)));

        ChatRequest request = new ChatRequest("sess-gemini", "Gợi ý cho tôi xe Toyota");
        ChatReplyResponse response = aiChatService.chat(request, 100L);

        assertThat(response).isNotNull();
        assertThat(response.getSuggestedCars()).isNotEmpty();
        assertThat(response.getSuggestedCars().get(0).getName()).contains("Toyota Camry");
    }

    @Test
    @DisplayName("Greeting: When user says hello, responds with greeting and no car cards")
    void testChatGreeting() {
        when(geminiService.isEnabled()).thenReturn(false);
        when(chatMemoryRepository.findByUserIdAndSessionId(any(), any())).thenReturn(Optional.empty());

        ChatRequest request = new ChatRequest("sess-hello", "hello");
        ChatReplyResponse response = aiChatService.chat(request, 100L);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).contains("Trợ lý AI DriveShare");
        assertThat(response.getSuggestedCars()).isNull();
    }

    @Test
    @DisplayName("Small talk: When user says 'tôi chưa ra yêu cầu mà', responds politely without car cards")
    void testChatSmallTalkNoRequest() {
        when(geminiService.isEnabled()).thenReturn(false);
        when(chatMemoryRepository.findByUserIdAndSessionId(any(), any())).thenReturn(Optional.empty());

        ChatRequest request = new ChatRequest("sess-chat", "tôi chưa ra yêu cầu mà");
        ChatReplyResponse response = aiChatService.chat(request, 100L);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).contains("Không sao ạ");
        assertThat(response.getSuggestedCars()).isNull();
    }
}
