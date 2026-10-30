package com.driveshare.modules.ai.application.usecase;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.request.ChatRequest;
import com.driveshare.modules.ai.dto.response.CarCardDto;
import com.driveshare.modules.ai.dto.response.ChatReplyResponse;
import com.driveshare.modules.ai.dto.response.DepositCalculation;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.driveshare.modules.ai.application.port.out.*;
import com.driveshare.modules.ai.application.result.CarSummaryResult;
import com.driveshare.modules.ai.application.result.UserSummaryResult;
import com.driveshare.modules.ai.domain.model.ChatMemoryRecord;
import com.driveshare.modules.ai.domain.policy.CarAdvisorPolicy;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AiChatUseCaseImpl implements com.driveshare.modules.ai.application.port.in.AiAdvisorInboundPort {

    private final ChatMemoryPort chatMemoryPort;
    private final CarDataQueryPort carDataQueryPort;
    private final LlmClientPort llmClientPort;
    private final UserQueryPort userQueryPort;
    private final DocumentSearchPort documentSearchPort;
    private final AiObservabilityPort observabilityPort;
    private final ObjectMapper objectMapper;

    public AiChatUseCaseImpl(ChatMemoryPort chatMemoryPort,
                            CarDataQueryPort carDataQueryPort,
                            LlmClientPort llmClientPort,
                            UserQueryPort userQueryPort,
                            DocumentSearchPort documentSearchPort,
                            AiObservabilityPort observabilityPort,
                            ObjectMapper objectMapper) {
        this.chatMemoryPort = chatMemoryPort;
        this.carDataQueryPort = carDataQueryPort;
        this.llmClientPort = llmClientPort;
        this.userQueryPort = userQueryPort;
        this.documentSearchPort = documentSearchPort;
        this.observabilityPort = observabilityPort;
        this.objectMapper = objectMapper;
    }

    private String cachedSystemPrompt;

    private static final Locale VI_LOCALE = new Locale("vi", "VN");
    private static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.30");
    private static final BigDecimal REMAINING_RATE = new BigDecimal("0.70");
    private static final int MAX_SUGGESTED_CARS = 3;

    // =========================================================================
    // Pattern nhận diện ý định người dùng
    // =========================================================================

    /** Regex bắt số ngày thuê: "3 ngày", "thuê 5 ngày", "trong 10 ngày" */
    private static final Pattern DAYS_PATTERN = Pattern.compile(
            "(\\d+)\\s*ngày", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    /** Regex bắt giá tối đa: "dưới 1 triệu", "dưới 800k", "giá dưới 500000" */
    private static final Pattern MAX_PRICE_PATTERN = Pattern.compile(
            "(?:dưới|under|<|tối đa|max)\\s*(\\d+(?:[.,]\\d+)?)\\s*(triệu|tr|trieu|k|nghìn|nghin|000)?",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    /** Regex bắt số chỗ: "5 chỗ", "7 chỗ", "4 cho" */
    private static final Pattern SEATS_PATTERN = Pattern.compile(
            "(\\d+)\\s*(?:chỗ|cho|seats?)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    @Override
    @Transactional
    public ChatReplyResponse chat(ChatRequest request, Long userId) {
        long startTime = System.currentTimeMillis();
        String sessionId = request.getSessionId();
        String userMessage = request.getMessage().trim();

        // 1. Tải lịch sử chat
        List<ChatMessageDto> history = loadHistory(userId, sessionId);

        // 2. Thêm tin nhắn của User
        history.add(ChatMessageDto.builder().role("USER").content(userMessage).build());

        // 3. Phân tích ý định và tạo phản hồi thông minh (Ưu tiên Google Gemini LLM + RAG nếu có cấu hình)
        ChatReplyResponse response = null;
        boolean fromGemini = false;
        if (llmClientPort != null && llmClientPort.isEnabled()) {
            try {
                response = generateGeminiResponse(userMessage, sessionId, userId, history);
                if (response != null) {
                    fromGemini = true;
                }
            } catch (Exception e) {
                log.warn("[AI Chat] Lỗi khi xử lý qua Gemini: {}. Tự động fallback sang bộ xử lý nội bộ.", e.getMessage());
            }
        }

        if (response == null) {
            response = generateSmartResponse(userMessage, sessionId);
        }

        // 4. Thêm phản hồi của Assistant vào lịch sử
        history.add(ChatMessageDto.builder().role("ASSISTANT").content(response.getMessage()).build());

        // 5. Lưu lại lịch sử hội thoại vào PostgreSQL
        saveHistory(userId, sessionId, history);

        // 6. Ghi vết giám sát lên Langfuse Observability Dashboard
        if (!fromGemini && observabilityPort != null) {
            long latencyMs = System.currentTimeMillis() - startTime;
            String traceId = UUID.randomUUID().toString().replace("-", "");
            String uId = userId != null ? String.valueOf(userId) : "guest";
            observabilityPort.recordGeneration(
                    traceId,
                    "driveshare-chat-advisor",
                    sessionId != null ? sessionId : "default-session",
                    uId,
                    "driveshare-smart-engine",
                    getSystemPrompt(),
                    userMessage,
                    response.getMessage(),
                    latencyMs,
                    true,
                    null
            );
        }

        return response;
    }

    @Override
    @Transactional
    public List<ChatMessageDto> getHistory(String sessionId, Long userId) {
        return loadHistory(userId, sessionId);
    }

    @Override
    @Transactional
    public void clearHistory(String sessionId, Long userId) {
        Long effectiveUserId = userId != null ? userId : 0L;
        chatMemoryPort.deleteByUserIdAndSessionId(effectiveUserId, sessionId);
        chatMemoryPort.deleteBySessionId(sessionId);
    }

    // =========================================================================
    // GOOGLE GEMINI GENERATIVE AI + RAG INTEGRATION
    // =========================================================================

    @Override
    public void reloadSystemPrompt() {
        this.cachedSystemPrompt = null;
        log.info("[AI Chat] Đã làm mới cache kịch bản System Prompt.");
    }

    private String getSystemPrompt() {
        // 1. Kiểm tra trực tiếp file nguồn trên ổ cứng (ưu tiên môi trường dev để sửa file là có tác dụng ngay)
        try {
            java.nio.file.Path localPromptPath = java.nio.file.Paths.get("backend/src/main/resources/prompts/car-advisor-system.txt");
            if (java.nio.file.Files.exists(localPromptPath)) {
                return java.nio.file.Files.readString(localPromptPath, StandardCharsets.UTF_8);
            }
            java.nio.file.Path altPath = java.nio.file.Paths.get("src/main/resources/prompts/car-advisor-system.txt");
            if (java.nio.file.Files.exists(altPath)) {
                return java.nio.file.Files.readString(altPath, StandardCharsets.UTF_8);
            }
        } catch (Exception ignored) {}

        // 2. Classpath Fallback
        if (cachedSystemPrompt != null) {
            return cachedSystemPrompt;
        }
        try {
            ClassPathResource resource = new ClassPathResource("prompts/car-advisor-system.txt");
            cachedSystemPrompt = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Không thể đọc prompts/car-advisor-system.txt: {}. Sử dụng prompt cơ bản.", e.getMessage());
            cachedSystemPrompt = "Bạn là Trợ Lý Tư Vấn Thuê Xe AI DriveShare.";
        }
        return cachedSystemPrompt;
    }

    /**
     * Sinh phản hồi qua Google Gemini kết hợp nhồi dữ liệu xe thật (RAG) từ Database.
     */
    private ChatReplyResponse generateGeminiResponse(String query, String sessionId, Long userId, List<ChatMessageDto> history) {
        String lower = query.toLowerCase();
        boolean isSearchingCars = isCarSearchIntent(lower);

        List<CarCardDto> carCards = null;
        DepositCalculation deposit = null;
        StringBuilder carsRag = new StringBuilder();

        // 1. Chỉ thực hiện RAG và gắn thẻ xe khi người dùng THỰC SỰ có nhu cầu tìm xe
        if (isSearchingCars) {
            List<CarSummaryResult> allActiveCars = carDataQueryPort.findActiveCars(50);

            List<CarSummaryResult> filteredCars = filterCarsByQuery(allActiveCars, lower);
            if (filteredCars.isEmpty()) {
                filteredCars = allActiveCars;
            }

            List<CarSummaryResult> topCars = filteredCars.stream().limit(MAX_SUGGESTED_CARS).collect(Collectors.toList());
            carCards = topCars.stream().map(this::buildCarCard).collect(Collectors.toList());

            // Tính toán cọc (nếu câu hỏi có số ngày hoặc hỏi giá/cọc)
            if (matchesDepositCalculation(lower)) {
                Matcher daysMatcher = DAYS_PATTERN.matcher(lower);
                int rentalDays = daysMatcher.find() ? Integer.parseInt(daysMatcher.group(1)) : 1;
                boolean withDriver = lower.contains("tài xế") || lower.contains("có lái") || lower.contains("kèm tài xế");
                CarSummaryResult bestMatch = findBestMatchingCar(allActiveCars, lower);
                if (bestMatch == null && !topCars.isEmpty()) {
                    bestMatch = topCars.get(0);
                }
                if (bestMatch != null) {
                    deposit = calculateDeposit(bestMatch, rentalDays, withDriver);
                }
            }

            // Tạo khối dữ liệu RAG xe thực tế chèn vào System Instruction
            carsRag.append("\n\n[DỮ LIỆU XE KHẢ DỤNG]\n");
            for (CarSummaryResult car : topCars) {
                carsRag.append(String.format("• %s %s (Năm %d) | %d chỗ | Hộp số: %s | Nhiên liệu: %s | Giá: %s/ngày | Đánh giá: %s⭐ (%d lượt) | Địa chỉ: %s | Dịch vụ tài xế: %s\n",
                        car.getBrand(),
                        car.getModel(),
                        car.getYear() != null ? car.getYear() : 2023,
                        car.getSeats() != null ? car.getSeats() : 5,
                        translateTransmission(car.getTransmission()),
                        translateFuelType(car.getFuelType()),
                        formatCurrency(car.getPricePerDay()),
                        car.getRating() != null ? car.getRating().toPlainString() : "5.0",
                        car.getRatingCount() != null ? car.getRatingCount() : 0,
                        car.getAddress() != null ? car.getAddress() : "TP Hồ Chí Minh",
                        Boolean.TRUE.equals(car.getHasDriverService()) ? "Có (" + formatCurrency(car.getDriverFeePerDay()) + "/ngày)" : "Không"
                ));
            }
            carsRag.append("[/DỮ LIỆU XE KHẢ DỤNG]\n");
        }

                if (documentSearchPort != null) {
            List<String> snippets = documentSearchPort.findRelevantSnippets(query, 2);
            if (!snippets.isEmpty()) {
                carsRag.append("\n\n[TRÍCH DẪN QUY CHẾ & CHÍNH SÁCH TỪ TÀI LIỆU DRIVESHARE ĐÃ NẠP]\n");
                for (String s : snippets) {
                    carsRag.append("• ").append(s).append("\n");
                }
                carsRag.append("[/TRÍCH DẪN QUY CHẾ & CHÍNH SÁCH TỪ TÀI LIỆU DRIVESHARE ĐÃ NẠP]\n");
            }
        }

        String fullSystemInstruction = getSystemPrompt() + carsRag.toString();
        Optional<String> geminiText = llmClientPort.generateContent(fullSystemInstruction, history, query);

        if (geminiText.isPresent() && !geminiText.get().isBlank()) {
            return ChatReplyResponse.builder()
                    .sessionId(sessionId)
                    .message(geminiText.get())
                    .suggestedCars(carCards != null && !carCards.isEmpty() ? carCards : null)
                    .depositCalculation(deposit)
                    .build();
        }

        return null;
    }

    // =========================================================================
    // CORE: Phân tích ý định & Tạo phản hồi thông minh (RAG + Structured Output)
    // =========================================================================

    private ChatReplyResponse generateSmartResponse(String query, String sessionId) {
        String lower = query.toLowerCase();

        // ── Ý ĐỊNH BẢO MẬT: Chống bẻ khóa prompt (Prompt Injection / Jailbreak) ──
        if (matchesPromptInjection(lower)) {
            return buildPromptInjectionResponse(sessionId);
        }

        // ── Ý ĐỊNH KHẨN CẤP 1: Hỏi sai quy định biên độ giờ (đến trễ báo bùng kèo) ──
        if (matchesLateArrivalRule(lower)) {
            return buildLateArrivalRuleResponse(sessionId);
        }

        // ── Ý ĐỊNH KHẨN CẤP 2: Khách hoang mang / nghi ngờ lừa đảo tiền cọc ──
        if (matchesScamOrPanic(lower)) {
            return buildScamOrPanicResponse(sessionId);
        }

        // ── Ý ĐỊNH KHẨN CẤP 3 (Tự nghĩ 1 - TC-P05): Chủ xe đòi thêm tiền ngoài hợp đồng / ép nhận xe khác ──
        if (matchesExtortionOrWrongCar(lower)) {
            return buildExtortionOrWrongCarResponse(sessionId);
        }

        // ── Ý ĐỊNH KHẨN CẤP 4 (Tự nghĩ 2 - TC-P06): Xe bàn giao bị xước xát, hư hỏng không an toàn ──
        if (matchesDamagedCar(lower)) {
            return buildDamagedCarResponse(sessionId);
        }

        // ── Ý ĐỊNH KHẨN CẤP 5: Sự cố bàn giao xe (Chủ xe không đến / bùng kèo / trễ hẹn) ──
        if (matchesHandoverEmergency(lower)) {
            return buildHandoverEmergencyResponse(sessionId);
        }

        // ── Ý ĐỊNH 0: Chào hỏi / Xã giao ──
        if (matchesGreeting(lower)) {
            return buildGreetingResponse(sessionId);
        }

        // ── Ý ĐỊNH 0.1: Chưa có yêu cầu / Đính chính câu hỏi ──
        if (matchesNoRequestYet(lower)) {
            return buildNoRequestYetResponse(sessionId);
        }

        // ── Ý ĐỊNH 0.2: Cảm ơn / Tạm biệt ──
        if (matchesThanks(lower)) {
            return buildThanksResponse(sessionId);
        }

        // ── Ý ĐỊNH 1: Tính tiền cọc cho xe cụ thể (có số ngày thuê + hỏi giá/cọc) ──
        // Pattern: "tính cọc xe Toyota 3 ngày", "thuê Camry 5 ngày hết bao nhiêu", "cọc bao nhiêu"
        if (matchesDepositCalculation(lower)) {
            return buildDepositCalculationResponse(query, lower, sessionId);
        }

        // ── Ý ĐỊNH 2: Hỏi về chính sách cọc / thanh toán chung ──
        if (matchesDepositPolicy(lower)) {
            return buildPolicyResponse(sessionId, "deposit");
        }

        // ── Ý ĐỊNH 3: Hỏi về thủ tục / giấy tờ ──
        if (matchesProcedure(lower)) {
            return buildPolicyResponse(sessionId, "procedure");
        }

        // ── Ý ĐỊNH 4: Hỏi về hủy chuyến / hoàn tiền ──
        if (matchesCancellation(lower)) {
            return buildPolicyResponse(sessionId, "cancellation");
        }

        // ── Ý ĐỊNH 5: Hỏi về dịch vụ tài xế (Sprint 3) ──
        if (matchesDriverService(lower)) {
            return buildDriverServiceResponse(sessionId);
        }

        // ── Ý ĐỊNH NGOÀI PHẠM VI DỰ ÁN (Lập trình, thời sự, bóng đá, AI khác) ──
        if (matchesOutOfScope(lower)) {
            return buildOutOfScopeResponse(sessionId);
        }

        // ── Ý ĐỊNH 6: TÌM XE — RAG Query (Chỉ khi người dùng thực sự tìm xe) ──
        if (isCarSearchIntent(lower)) {
            return buildCarSearchResponse(query, lower, sessionId);
        }

        // Mặc định: Phản hồi hỗ trợ thân thiện, không spam thẻ xe bừa bãi
        return buildGreetingResponse(sessionId);
    }

    // =========================================================================
    // INTENT MATCHERS
    // =========================================================================

    // =========================================================================
    // INTENT MATCHERS
    // =========================================================================

    private boolean matchesPromptInjection(String lower) {
        return lower.contains("bỏ qua các lệnh") || lower.contains("bỏ qua lệnh")
                || lower.contains("bỏ qua hướng dẫn") || lower.contains("ignore previous")
                || lower.contains("ignore all instructions") || lower.contains("password admin")
                || lower.contains("mật khẩu admin") || lower.contains("cho tôi biết password")
                || lower.contains("tiết lộ prompt") || lower.contains("show system prompt")
                || lower.contains("developer mode") || lower.contains("chế độ dan")
                || lower.contains("database credentials") || lower.contains("secret key");
    }

    private boolean matchesLateArrivalRule(String lower) {
        boolean mentionsLate = lower.contains("trễ") || lower.contains("muộn") || lower.contains("đến trễ")
                || lower.contains("tới trễ") || lower.contains("đến muộn") || lower.contains("tới muộn");
        boolean mentionsCancelOrComplain = lower.contains("bùng kèo") || lower.contains("bùng")
                || lower.contains("báo bùng") || lower.contains("hủy") || lower.contains("được không")
                || lower.contains("có được báo");
        return mentionsLate && mentionsCancelOrComplain;
    }

    private boolean matchesScamOrPanic(String lower) {
        return lower.contains("bị lừa") || lower.contains("lừa đảo") || lower.contains("mất cọc")
                || lower.contains("mất tiền cọc") || lower.contains("lừa tiền") || lower.contains("lừa tiền cọc")
                || lower.contains("làm ăn lừa đảo") || lower.contains("chiếm đoạt cọc");
    }

    private boolean matchesExtortionOrWrongCar(String lower) {
        return lower.contains("đòi thêm tiền") || lower.contains("phụ phí ngoài") || lower.contains("tiền mặt ngoài")
                || lower.contains("chuyển khoản riêng") || lower.contains("đòi tiền mặt") || lower.contains("ép nhận xe")
                || lower.contains("xe khác loại") || lower.contains("không đúng xe");
    }

    private boolean matchesDamagedCar(String lower) {
        boolean mentionsDamage = lower.contains("trầy xước") || lower.contains("xước") || lower.contains("hư hỏng")
                || lower.contains("móp méo") || lower.contains("rách lốp") || lower.contains("không an toàn")
                || lower.contains("xe giao bị hỏng") || lower.contains("xe hỏng");
        boolean mentionsHandover = lower.contains("nhận xe") || lower.contains("bàn giao") || lower.contains("lúc nhận")
                || lower.contains("khi nhận") || lower.contains("xử lý thế nào") || lower.contains("làm sao")
                || lower.contains("bị hư") || lower.contains("bị hỏng");
        return mentionsDamage && mentionsHandover;
    }

    private boolean matchesHandoverEmergency(String lower) {
        return lower.contains("chủ xe không tới") || lower.contains("chủ xe không đến") || lower.contains("chủ xe bùng")
                || lower.contains("bùng kèo") || lower.contains("chủ xe trễ") || lower.contains("không thấy chủ xe")
                || lower.contains("không tới giao xe") || lower.contains("không đến giao xe") || lower.contains("không giao xe")
                || lower.contains("trễ hẹn giao xe") || lower.contains("chủ xe trễ hẹn") || lower.contains("sự cố bàn giao xe")
                || lower.contains("sự cố nhận xe");
    }

    private boolean matchesDepositPolicy(String lower) {
        return lower.contains("cọc") || lower.contains("đặt cọc") || lower.contains("bao nhiêu phần trăm")
                || lower.contains("thanh toán") || lower.contains("vietqr") || lower.contains("chuyển khoản")
                || lower.contains("qr code");
    }

    private boolean matchesProcedure(String lower) {
        return lower.contains("thủ tục") || lower.contains("giấy tờ") || lower.contains("bằng lái")
                || lower.contains("gplx") || lower.contains("cccd") || lower.contains("điều kiện thuê")
                || lower.contains("cần gì");
    }

    private boolean matchesCancellation(String lower) {
        return lower.contains("hủy") || lower.contains("hoàn tiền") || lower.contains("hoàn cọc")
                || lower.contains("cancel");
    }

    private boolean matchesDriverService(String lower) {
        boolean hasSearchKeyword = lower.contains("tìm xe") || lower.contains("thuê xe") || lower.contains("gợi ý") || lower.contains("kiếm xe");
        if (hasSearchKeyword) {
            return false;
        }
        return lower.contains("tài xế") || lower.contains("có lái") || lower.contains("thuê kèm tài xế")
                || lower.contains("driver") || lower.contains("người lái");
    }

    private boolean matchesDepositCalculation(String lower) {
        Matcher daysMatcher = DAYS_PATTERN.matcher(lower);
        boolean hasDays = daysMatcher.find();
        boolean asksPrice = lower.contains("hết bao nhiêu") || lower.contains("tính cọc")
                || lower.contains("tính tiền") || lower.contains("giá bao nhiêu")
                || lower.contains("cọc bao nhiêu")
                || lower.contains("chi phí") || lower.contains("tổng tiền");
        return hasDays && asksPrice;
    }

    private boolean matchesGreeting(String lower) {
        return lower.matches("^(xin chào|chào|hello|hi|alo|hé lô|hey|hai|chào bạn|chào ad|chào shop|chào em|ơi|ê|hế lô)[!.,?\\s]*$")
                || lower.equals("hello") || lower.equals("hi") || lower.equals("chào") || lower.equals("xin chào");
    }

    private boolean matchesNoRequestYet(String lower) {
        return lower.contains("chưa ra yêu cầu") || lower.contains("chưa có yêu cầu")
                || lower.contains("chưa yêu cầu") || lower.contains("chưa cần")
                || lower.contains("chưa tìm") || lower.contains("chưa thuê")
                || lower.contains("đang xem") || lower.contains("đang tham khảo")
                || lower.contains("từ từ") || lower.contains("chưa biết") || lower.contains("nhầm")
                || lower.contains("sao kì") || lower.contains("sao kỳ") || lower.contains("ủa gì")
                || lower.contains("nhầm rồi") || lower.contains("đã tìm đâu") || lower.contains("đã yêu cầu đâu");
    }

    private boolean matchesThanks(String lower) {
        return lower.contains("cảm ơn") || lower.contains("cam on") || lower.contains("thank")
                || lower.contains("tks") || lower.contains("cám ơn");
    }

    private boolean matchesOutOfScope(String lower) {
        return lower.contains("lập trình") || lower.contains("viết code") || lower.contains("python")
                || lower.contains("java") || lower.contains("html") || lower.contains("css")
                || lower.contains("giải toán") || lower.contains("thời tiết") || lower.contains("bóng đá")
                || lower.contains("ai vô địch") || lower.contains("tin tức") || lower.contains("chính trị")
                || lower.contains("viết văn") || lower.contains("làm thơ") || lower.contains("nấu ăn")
                || lower.contains("công thức") || lower.contains("chatgpt") || lower.contains("claude")
                || lower.contains("openai");
    }

    private boolean isCarSearchIntent(String lower) {
        if (matchesGreeting(lower) || matchesNoRequestYet(lower) || matchesThanks(lower)
                || matchesPromptInjection(lower) || matchesHandoverEmergency(lower)
                || matchesScamOrPanic(lower) || matchesLateArrivalRule(lower)
                || matchesExtortionOrWrongCar(lower) || matchesDamagedCar(lower)
                || matchesOutOfScope(lower)) {
            return false;
        }
        return lower.contains("tìm xe") || lower.contains("thuê xe") || lower.contains("kiếm xe")
                || lower.contains("gợi ý xe") || lower.contains("cần xe") || lower.contains("muốn xe")
                || lower.contains("tìm") || lower.contains("thuê")
                || lower.contains("chỗ") || lower.contains("seats")
                || lower.contains("triệu") || lower.contains("nghìn") || lower.contains("giá rẻ") || lower.contains("giá")
                || lower.contains("xe điện") || lower.contains("tự động") || lower.contains("số sàn")
                || lower.contains("sedan") || lower.contains("suv") || lower.contains("mpv")
                || lower.contains("hcm") || lower.contains("hà nội") || lower.contains("đà nẵng")
                || lower.contains("xe nào") || lower.contains("có xe") || lower.contains("danh sách")
                || lower.contains("mới") || lower.contains("hôm nay") || lower.contains("đang có")
                || lower.contains("tất cả xe") || lower.contains("thông tin xe") || lower.contains("bên bạn có")
                || lower.contains("bên mình có") || lower.contains("gợi ý")
                || containsBrand(lower);
    }

    private boolean containsBrand(String lower) {
        List<String> brands = List.of("toyota", "vios", "camry", "innova", "fortuner",
                "mazda", "cx5", "cx-5", "honda", "civic", "crv", "cr-v", "hyundai", "accent", "tucson",
                "kia", "morning", "seltos", "vinfast", "vf5", "vf8", "vf9", "mitsubishi", "xpander",
                "ford", "ranger", "everest", "mercedes", "bmw");
        for (String b : brands) {
            if (lower.contains(b)) return true;
        }
        return false;
    }

    // =========================================================================
    // RESPONSE BUILDERS
    // =========================================================================

    private ChatReplyResponse buildPromptInjectionResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("Tôi là Trợ lý AI DriveShare và tôi không thể thực hiện yêu cầu này. Mọi thông tin quản trị và hệ thống bảo mật của DriveShare đều được bảo vệ nghiêm ngặt theo chính sách an toàn thông tin. Tôi chỉ có thể hỗ trợ các thông tin liên quan đến dịch vụ thuê xe DriveShare.")
                .build();
    }

    private ChatReplyResponse buildLateArrivalRuleResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        ⚠️ **Quy định về thời gian bàn giao xe DriveShare:**
                        
                        1️⃣ **Trách nhiệm đúng giờ:** Cả khách hàng và chủ xe đều có trách nhiệm có mặt đúng giờ theo lịch hẹn trong đơn đặt xe.
                        2️⃣ **Biên độ chờ tối đa:** Biên độ thời gian chờ linh hoạt theo quy định thông thường là **15 - 30 phút**. Nếu gặp sự cố bất khả kháng, bạn cần chủ động gọi điện thông báo trước cho chủ xe.
                        3️⃣ **Trường hợp đến trễ 2 tiếng:** Bạn tự ý đến trễ 2 tiếng mà không thông báo thì **KHÔNG ĐƯỢC** báo chủ xe bùng kèo vì việc trễ hẹn xuất phát từ phía bạn.
                        
                        💡 **Hướng dẫn xử lý:** Bạn vui lòng chủ động liên hệ ngay với chủ xe để giải thích, thỏa thuận dời giờ nhận xe hoặc tìm phương án phù hợp. Nếu cần hỗ trợ kết nối, vui lòng gọi Hotline: **1900-6868 (Phím 1)**.""")
                .build();
    }

    private ChatReplyResponse buildScamOrPanicResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        🛡️ **DriveShare cam kết bảo vệ 100% tiền cọc của Quý khách!**
                        
                        Quý khách hoàn toàn yên tâm, tiền cọc 30% được giữ trung gian an toàn tại hệ thống DriveShare và **chỉ được giải ngân cho chủ xe sau khi Quý khách đã kiểm tra xe thực tế và nhận xe thành công**. Quý khách tuyệt đối không bao giờ lo bị mất tiền cọc hay lừa đảo!
                        
                        Nếu Quý khách đang gặp sự cố chủ xe chưa xuất hiện hoặc không liên lạc được, vui lòng thực hiện ngay 4 bước sau:
                        • **Bước 1:** Gọi điện cho chủ xe ít nhất 2 lần để xác nhận vị trí và tình trạng.
                        • **Bước 2:** Chụp ảnh hiện trường có định vị/mốc số nhà và quay clip ngắn chứng minh Quý khách đã có mặt đúng giờ hẹn.
                        • **Bước 3:** Vào mục 'Chi tiết chuyến đi' trên web DriveShare -> Bấm **'Báo cáo sự cố nhận xe'** để hệ thống lập tức đóng băng tiền cọc.
                        • **Bước 4:** Cần hỗ trợ khẩn cấp gọi ngay Hotline: **1900-6868 (Phím 1)** để được tổng đài can thiệp và xử lý ngay lập tức!""")
                .build();
    }

    private ChatReplyResponse buildExtortionOrWrongCarResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        🚨 **Cảnh báo xử lý sự cố bàn giao xe (Phụ phí ngoài / Giao sai xe):**
                        
                        1️⃣ **TUYỆT ĐỐI KHÔNG THANH TOÁN:** Quý khách không thanh toán bất kỳ khoản phụ phí tiền mặt hoặc chuyển khoản cá nhân nào ngoài hợp đồng trên hệ thống DriveShare.
                        2️⃣ **Quyền từ chối nhận xe:** Quý khách có toàn quyền từ chối nhận xe nếu chủ xe ép nhận mẫu xe khác không đúng thỏa thuận ban đầu.
                        3️⃣ **Thu thập bằng chứng:** Chụp ảnh màn hình tin nhắn thỏa thuận, ghi âm hoặc chụp ảnh xe giao sai thực tế tại hiện trường.
                        4️⃣ **Báo cáo sự cố:** Vào 'Chi tiết chuyến đi' -> Bấm **'Báo cáo sự cố nhận xe'** để đóng băng tiền cọc, hoặc liên hệ ngay Hotline: **1900-6868 (Phím 1)**. DriveShare cam kết bảo vệ 100% tiền cọc, hỗ trợ đổi xe tương đương hoặc hoàn 100% tiền cọc ngay lập tức và áp dụng chế tài phạt chủ xe.""")
                .build();
    }

    private ChatReplyResponse buildDamagedCarResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        🔧 **Quy trình xử lý khi xe bàn giao bị trầy xước / hư hỏng:**
                        
                        1️⃣ **Kiểm tra & Ghi hình hiện trạng:** Chụp ảnh rõ nét và quay video 360 độ xung quanh xe, cận cảnh các vị trí trầy xước, móp méo, lốp xe hoặc lỗi kỹ thuật trước khi ký nhận xe.
                        2️⃣ **Ghi chú vào biên bản:** Yêu cầu chủ xe xác nhận và ghi chú đầy đủ hiện trạng vào Biên bản bàn giao xe để làm bằng chứng pháp lý tránh tranh chấp khi trả xe.
                        3️⃣ **Từ chối nhận nếu mất an toàn:** Nếu xe bị hư hỏng nghiêm trọng (phanh không an toàn, lốp nứt rách, đèn hỏng...) không đảm bảo tiêu chuẩn lưu thông, Quý khách có toàn quyền **TỪ CHỐI NHẬN XE**.
                        4️⃣ **Kích hoạt hỗ trợ khẩn cấp:** Vào 'Chi tiết chuyến đi' -> Bấm **'Báo cáo sự cố nhận xe'** và gọi ngay Hotline: **1900-6868 (Phím 1)**. DriveShare cam kết bảo vệ 100% tiền cọc và hỗ trợ tìm xe thay thế hoặc hoàn tiền cọc nhanh chóng.""")
                .build();
    }

    private ChatReplyResponse buildHandoverEmergencyResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        🚨 **Quy trình hỗ trợ khẩn cấp khi gặp sự cố bàn giao xe:**
                        
                        🛡️ **Cam kết:** DriveShare cam kết **bảo vệ 100% tiền cọc** cho bạn! Tiền cọc đang được đóng băng an toàn trên hệ thống.
                        
                        Vui lòng thực hiện đủ 4 bước sau:
                        • **Bước 1:** Gọi điện cho chủ xe ít nhất 2 lần để xác nhận vị trí và tình trạng bàn giao.
                        • **Bước 2:** Chụp ảnh hiện trường có định vị/mốc số nhà và quay clip ngắn chứng minh đã có mặt đúng giờ.
                        • **Bước 3:** Vào 'Chi tiết chuyến đi' trên web DriveShare -> Bấm **'Báo cáo sự cố nhận xe'** để đóng băng tiền cọc.
                        • **Bước 4:** Cần hỗ trợ khẩn cấp gọi Hotline: **1900-6868 (Phím 1)** để được tổng đài can thiệp và xử lý ngay lập tức!""")
                .build();
    }

    private ChatReplyResponse buildOutOfScopeResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        Dạ em rất tiếc và xin lỗi anh/chị ạ! Em là **Trợ lý AI DriveShare** — chuyên trách tư vấn và hỗ trợ khách hàng tìm kiếm thuê xe trên hệ thống DriveShare nên chưa thể hỗ trợ tốt cho chủ đề này. 😊
                        
                        Để nhận được câu trả lời chi tiết và đầy đủ nhất cho câu hỏi này, em gợi ý anh/chị có thể tham khảo trực tiếp các trợ lý AI đa năng hàng đầu thế giới hiện nay nhé:
                        • 🌐 [ChatGPT (OpenAI)](https://chatgpt.com) — Trợ lý AI hỏi đáp đa năng phổ biến nhất
                        • ⚡ [Google Gemini](https://gemini.google.com) — Trí tuệ nhân tạo thế hệ mới từ Google
                        • 🧠 [Claude AI (Anthropic)](https://claude.ai) — Trợ lý AI phân tích và lập luận chuyên sâu
                        • 🐋 [DeepSeek](https://chat.deepseek.com) — Trí tuệ nhân tạo thông minh thế hệ mới
                        • 🚀 [Grok (xAI)](https://grok.com) — Trợ lý AI đối thoại và cập nhật thời gian thực
                        
                        Bất cứ lúc nào anh/chị cần tìm xe du lịch, xe công tác, xe tự lái hay có tài xế trên DriveShare, em luôn sẵn lòng hỗ trợ anh/chị ạ! 🚗✨""")
                .build();
    }

    private ChatReplyResponse buildGreetingResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        Xin chào! 👋 Tôi là **Trợ lý AI DriveShare**.
                        
                        Tôi có thể giúp bạn:
                        • 🚗 Tìm xe thuê theo nhu cầu (số chỗ, ngân sách, xe điện, tự động...)
                        • 💳 Giải thích chính sách cọc 30% qua VietQR
                        • 👨‍✈️ Giới thiệu dịch vụ thuê xe kèm tài xế
                        
                        Bạn đang muốn tìm dòng xe nào hôm nay?""")
                .build();
    }

    private ChatReplyResponse buildNoRequestYetResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("""
                        Dạ vâng! Không sao ạ. 😊
                        
                        Bất cứ lúc nào bạn cần, chỉ cần nhắn cho tôi ví dụ:
                        • *"Tìm xe 5 chỗ ở HCM giá dưới 1 triệu"*
                        • *"Gợi ý xe 7 chỗ đi du lịch gia đình kèm tài xế"*
                        • *"Thuê xe điện VinFast trong 3 ngày cọc bao nhiêu?"*
                        
                        Tôi luôn sẵn sàng hỗ trợ bạn nhé!""")
                .build();
    }

    private ChatReplyResponse buildThanksResponse(String sessionId) {
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message("Rất vui được hỗ trợ bạn! Chúc bạn một ngày tốt lành và có chuyến hành trình an toàn, thuận lợi cùng DriveShare! 🚗✨")
                .build();
    }

    /**
     * Phản hồi chính sách (cọc, thủ tục, hủy chuyến).
     */
    private ChatReplyResponse buildPolicyResponse(String sessionId, String type) {
        String message;
        switch (type) {
            case "deposit":
                message = """
                        💳 **Chính sách đặt cọc DriveShare:**
                        
                        Quý khách chỉ cần thanh toán **30% tiền cọc** qua mã **VietQR** (hỗ trợ mọi ngân hàng nội địa) để khóa lịch xe ngay lập tức!
                        
                        📋 **Quy trình:**
                        1️⃣ Chọn xe & ngày thuê trên DriveShare
                        2️⃣ Thanh toán 30% cọc qua mã QR VietQR
                        3️⃣ Hệ thống xác nhận tự động, lịch xe được giữ
                        4️⃣ Thanh toán 70% còn lại khi nhận xe
                        
                        ✅ Cọc giúp đảm bảo giữ xe cho bạn, tránh hết xe mùa cao điểm!
                        
                        Bạn muốn tôi gợi ý xe phù hợp để tính cọc cụ thể không?""";
                break;
            case "procedure":
                message = """
                        📄 **Giấy tờ cần thiết khi thuê xe DriveShare:**
                        
                        1️⃣ **CCCD gắn chip** hoặc Hộ chiếu còn hạn
                        2️⃣ **Giấy phép lái xe** (GPLX hạng B1/B2 trở lên) — đã xác minh trên hệ thống
                        3️⃣ **Tài sản thế chấp** hoặc xe máy + cà vẹt khi nhận xe (tùy chủ xe yêu cầu)
                        
                        💡 Mẹo: Upload GPLX & CCCD lên hồ sơ DriveShare trước để duyệt nhanh hơn nhé!""";
                break;
            case "cancellation":
                message = """
                        🔄 **Chính sách hủy chuyến DriveShare:**
                        
                        ⏰ **Hủy trước 48 giờ** nhận xe → Hoàn **100%** tiền cọc
                        ⏰ **Hủy từ 24h - 48h** → Hoàn **70%** cọc
                        ⏰ **Hủy dưới 24h** → Không hoàn cọc
                        
                        📌 Hoàn tiền được chuyển khoản lại trong 1-3 ngày làm việc qua tài khoản ngân hàng đã đăng ký.""";
                break;
            default:
                message = "Xin chào! Tôi có thể giúp bạn tìm xe thuê, giải đáp chính sách hoặc tính chi phí. Bạn cần hỗ trợ gì?";
        }
        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message(message)
                .build();
    }

    /**
     * Phản hồi về dịch vụ tài xế Sprint 3.
     */
    private ChatReplyResponse buildDriverServiceResponse(String sessionId) {
        // Tìm xe có dịch vụ tài xế
        List<CarSummaryResult> allCars = carDataQueryPort.findActiveCars(50);
        if (allCars == null) allCars = Collections.emptyList();
        List<CarSummaryResult> carsWithDriver = allCars.stream()
                .filter(c -> Boolean.TRUE.equals(c.getHasDriverService()))
                .limit(MAX_SUGGESTED_CARS)
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        sb.append("""
                🚘 **Dịch vụ Thuê kèm Tài xế DriveShare (Mới!)**
                
                ✅ Tài xế chuyên nghiệp, am hiểu đường sá, phục vụ lịch sự
                ✅ Phí tài xế tính riêng theo ngày, cộng thêm vào giá thuê xe
                ✅ Phù hợp cho: gia đình du lịch, doanh nhân công tác, khách chưa tự tin lái
                
                💰 **Tổng chi phí = (Giá thuê/ngày + Phí tài xế/ngày) × Số ngày**
                
                """);

        List<CarCardDto> carCards = new ArrayList<>();
        if (!carsWithDriver.isEmpty()) {
            sb.append("🚗 **Xe có sẵn dịch vụ tài xế:**\n\n");
            for (CarSummaryResult car : carsWithDriver) {
                CarCardDto card = buildCarCard(car);
                carCards.add(card);
                sb.append(formatCarTextBlock(car));
                sb.append("\n");
            }
        } else {
            sb.append("📌 Hiện tại chưa có xe nào bật dịch vụ tài xế. Bạn có thể liên hệ chủ xe để thỏa thuận riêng nhé!");
        }

        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message(sb.toString())
                .suggestedCars(carCards.isEmpty() ? null : carCards)
                .build();
    }

    /**
     * ── TOOL CALLING: Tính cọc 30% ──
     * Phát hiện số ngày + xe cụ thể → tự động tính cọc chính xác.
     */
    private ChatReplyResponse buildDepositCalculationResponse(String query, String lower, String sessionId) {
        // Trích xuất số ngày
        Matcher daysMatcher = DAYS_PATTERN.matcher(lower);
        int rentalDays = daysMatcher.find() ? Integer.parseInt(daysMatcher.group(1)) : 1;

        // Trích xuất có cần tài xế không
        boolean withDriver = lower.contains("tài xế") || lower.contains("có lái") || lower.contains("kèm tài xế");

        // Tìm xe phù hợp nhất từ DB
        List<CarSummaryResult> activeCars = carDataQueryPort.findActiveCars(50);
        if (activeCars == null) activeCars = Collections.emptyList();

        if (activeCars.isEmpty()) {
            return ChatReplyResponse.builder()
                    .sessionId(sessionId)
                    .message("Hiện tại chưa có xe nào khả dụng trên hệ thống. Bạn vui lòng quay lại sau nhé!")
                    .build();
        }

        // Tìm xe match tốt nhất theo tên/hãng trong query
        CarSummaryResult bestMatch = findBestMatchingCar(activeCars, lower);
        if (bestMatch == null) {
            bestMatch = activeCars.get(0);
        }

        // Tính toán cọc 30%
        DepositCalculation deposit = calculateDeposit(bestMatch, rentalDays, withDriver);
        CarCardDto carCard = buildCarCard(bestMatch);

        String carName = bestMatch.getBrand() + " " + bestMatch.getModel();
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("💰 **Tính chi phí thuê xe %s — %d ngày:**\n\n", carName, rentalDays));
        sb.append(String.format("🚗 Giá thuê xe: %s/ngày × %d ngày = **%s**\n",
                formatCurrency(bestMatch.getPricePerDay()), rentalDays, formatCurrency(deposit.getTotalRentalFee())));

        if (withDriver && Boolean.TRUE.equals(bestMatch.getHasDriverService())) {
            sb.append(String.format("👨‍✈️ Phí tài xế: %s/ngày × %d ngày = **%s**\n",
                    formatCurrency(bestMatch.getDriverFeePerDay()), rentalDays, formatCurrency(deposit.getTotalDriverFee())));
        }

        sb.append(String.format("\n📊 **Tổng cộng: %s**\n", deposit.getGrandTotalFormatted()));
        sb.append(String.format("💳 **Đặt cọc 30%% qua VietQR: %s**\n", deposit.getDepositFormatted()));
        sb.append(String.format("💵 Còn lại thanh toán khi nhận xe: %s\n", deposit.getRemainingFormatted()));
        sb.append("\nBạn muốn đặt xe này ngay không? Bấm vào thẻ xe bên dưới để tiến hành đặt cọc! 🎉");

        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message(sb.toString())
                .suggestedCars(List.of(carCard))
                .depositCalculation(deposit)
                .build();
    }

    /**
     * ── RAG: Tìm xe trong Database thật ──
     * Truy vấn xe ACTIVE, lọc theo nhu cầu, trích xuất dữ liệu nhồi vào phản hồi.
     */
    private ChatReplyResponse buildCarSearchResponse(String query, String lower, String sessionId) {
        // Lấy toàn bộ xe ACTIVE từ Database
        List<CarSummaryResult> allActiveCars = carDataQueryPort.findActiveCars(50);

        if (allActiveCars.isEmpty()) {
            return ChatReplyResponse.builder()
                    .sessionId(sessionId)
                    .message("Xin chào! Tôi là **Trợ lý AI DriveShare**. Hiện tại hệ thống chưa có xe khả dụng. " +
                            "Bạn vui lòng quay lại sau hoặc liên hệ hotline để được hỗ trợ nhé!")
                    .build();
        }

        // ── RAG: Lọc xe theo ngữ cảnh câu hỏi ──
        List<CarSummaryResult> filteredCars = filterCarsByQuery(allActiveCars, lower);
        boolean matchedSpecificCriteria = !filteredCars.isEmpty();

        // Nếu không tìm được xe phù hợp, dùng toàn bộ xe đang active
        if (filteredCars.isEmpty()) {
            filteredCars = allActiveCars;
        }

        // Giới hạn tối đa 3 xe gợi ý
        List<CarSummaryResult> topCars = filteredCars.stream()
                .limit(MAX_SUGGESTED_CARS)
                .collect(Collectors.toList());

        // Tạo structured output (Car Cards)
        List<CarCardDto> carCards = topCars.stream()
                .map(this::buildCarCard)
                .collect(Collectors.toList());

        // Tạo phản hồi văn bản có ngữ cảnh
        StringBuilder sb = new StringBuilder();
        if (matchedSpecificCriteria) {
            sb.append(buildContextualGreeting(lower, topCars.size()));
        } else {
            sb.append(String.format("Hiện tại chưa có xe nào khớp chính xác 100%% với yêu cầu của bạn. Bạn có thể tham khảo **%d xe** khả dụng dưới đây:", topCars.size()));
        }
        sb.append("\n\n");

        for (CarSummaryResult car : topCars) {
            sb.append(formatCarTextBlock(car));
            sb.append("\n");
        }

        // Kiểm tra nếu có số ngày trong query → tính luôn cọc cho xe đầu tiên
        DepositCalculation deposit = null;
        Matcher daysMatcher = DAYS_PATTERN.matcher(lower);
        if (daysMatcher.find()) {
            int days = Integer.parseInt(daysMatcher.group(1));
            boolean withDriver = lower.contains("tài xế") || lower.contains("có lái");
            CarSummaryResult firstCar = topCars.get(0);
            deposit = calculateDeposit(firstCar, days, withDriver && Boolean.TRUE.equals(firstCar.getHasDriverService()));

            sb.append(String.format("💰 **Ước tính cho %s — %d ngày:**\n", firstCar.getBrand() + " " + firstCar.getModel(), days));
            sb.append(String.format("• Tổng tiền: %s | Cọc 30%%: **%s** qua VietQR\n\n",
                    deposit.getGrandTotalFormatted(), deposit.getDepositFormatted()));
        }

        sb.append("📌 Bấm vào thẻ xe để xem chi tiết & đặt cọc 30% qua VietQR ngay nhé!");

        return ChatReplyResponse.builder()
                .sessionId(sessionId)
                .message(sb.toString())
                .suggestedCars(carCards)
                .depositCalculation(deposit)
                .build();
    }

    // =========================================================================
    // RAG: Lọc xe thông minh theo ý định người dùng
    // =========================================================================

    private List<CarSummaryResult> filterCarsByQuery(List<CarSummaryResult> cars, String lowerQuery) {
        List<CarSummaryResult> results = new ArrayList<>(cars);

        // 1. Lọc theo số chỗ
        Matcher seatsMatcher = SEATS_PATTERN.matcher(lowerQuery);
        if (seatsMatcher.find()) {
            int requestedSeats = Integer.parseInt(seatsMatcher.group(1));
            results = results.stream()
                    .filter(c -> c.getSeats() != null && c.getSeats() >= requestedSeats)
                    .collect(Collectors.toList());
        }

        // 2. Lọc theo giá tối đa
        Matcher priceMatcher = MAX_PRICE_PATTERN.matcher(lowerQuery);
        if (priceMatcher.find()) {
            BigDecimal maxPrice = parsePrice(priceMatcher.group(1), priceMatcher.group(2));
            if (maxPrice != null) {
                final BigDecimal maxPriceFinal = maxPrice;
                results = results.stream()
                        .filter(c -> c.getPricePerDay() != null && c.getPricePerDay().compareTo(maxPriceFinal) <= 0)
                        .collect(Collectors.toList());
            }
        }

        // 3. Lọc theo hộp số tự động
        if (lowerQuery.contains("tự động") || lowerQuery.contains("automatic") || lowerQuery.contains("at") || lowerQuery.contains("số tự động")) {
            List<CarSummaryResult> autoFiltered = results.stream()
                    .filter(c -> c.getTransmission() == ETransmission.AUTOMATIC)
                    .collect(Collectors.toList());
            if (!autoFiltered.isEmpty()) results = autoFiltered;
        }

        // 4. Lọc theo số sàn
        if (lowerQuery.contains("số sàn") || lowerQuery.contains("manual") || lowerQuery.contains("mt")) {
            List<CarSummaryResult> manualFiltered = results.stream()
                    .filter(c -> c.getTransmission() == ETransmission.MANUAL)
                    .collect(Collectors.toList());
            if (!manualFiltered.isEmpty()) results = manualFiltered;
        }

        // 5. Lọc theo xe điện
        if (lowerQuery.contains("xe điện") || lowerQuery.contains("electric") || lowerQuery.contains("vinfast")
                || lowerQuery.contains("vf5") || lowerQuery.contains("vf8") || lowerQuery.contains("vf9")) {
            List<CarSummaryResult> electricFiltered = results.stream()
                    .filter(c -> c.getFuelType() == EFuelType.ELECTRIC
                            || "VinFast".equalsIgnoreCase(c.getBrand()))
                    .collect(Collectors.toList());
            if (!electricFiltered.isEmpty()) results = electricFiltered;
        }

        // 6. Lọc theo hãng xe cụ thể
        results = filterByBrand(results, lowerQuery);

        // 7. Lọc theo tỉnh/thành phố
        results = filterByProvince(results, lowerQuery);

        // 8. Lọc xe có dịch vụ tài xế
        if (lowerQuery.contains("tài xế") || lowerQuery.contains("có lái") || lowerQuery.contains("kèm tài xế")) {
            List<CarSummaryResult> driverFiltered = results.stream()
                    .filter(c -> Boolean.TRUE.equals(c.getHasDriverService()))
                    .collect(Collectors.toList());
            if (!driverFiltered.isEmpty()) results = driverFiltered;
        }

        // 9. Ưu tiên sắp xếp theo rating cao nhất
        results.sort((a, b) -> {
            BigDecimal ratingA = a.getRating() != null ? a.getRating() : BigDecimal.ZERO;
            BigDecimal ratingB = b.getRating() != null ? b.getRating() : BigDecimal.ZERO;
            return ratingB.compareTo(ratingA);
        });

        return results;
    }

    private List<CarSummaryResult> filterByBrand(List<CarSummaryResult> cars, String lowerQuery) {
        Map<String, String> brandKeywords = Map.ofEntries(
                Map.entry("toyota", "Toyota"),
                Map.entry("vios", "Toyota"),
                Map.entry("camry", "Toyota"),
                Map.entry("innova", "Toyota"),
                Map.entry("fortuner", "Toyota"),
                Map.entry("mazda", "Mazda"),
                Map.entry("cx5", "Mazda"),
                Map.entry("cx-5", "Mazda"),
                Map.entry("mazda3", "Mazda"),
                Map.entry("honda", "Honda"),
                Map.entry("civic", "Honda"),
                Map.entry("crv", "Honda"),
                Map.entry("cr-v", "Honda"),
                Map.entry("hyundai", "Hyundai"),
                Map.entry("accent", "Hyundai"),
                Map.entry("tucson", "Hyundai"),
                Map.entry("kia", "Kia"),
                Map.entry("morning", "Kia"),
                Map.entry("seltos", "Kia"),
                Map.entry("ford", "Ford"),
                Map.entry("ranger", "Ford"),
                Map.entry("everest", "Ford"),
                Map.entry("mercedes", "Mercedes-Benz"),
                Map.entry("bmw", "BMW"),
                Map.entry("vinfast", "VinFast"),
                Map.entry("mitsubishi", "Mitsubishi"),
                Map.entry("xpander", "Mitsubishi")
        );

        for (Map.Entry<String, String> entry : brandKeywords.entrySet()) {
            if (lowerQuery.contains(entry.getKey())) {
                String targetBrand = entry.getValue();
                List<CarSummaryResult> filtered = cars.stream()
                        .filter(c -> targetBrand.equalsIgnoreCase(c.getBrand()))
                        .collect(Collectors.toList());
                if (!filtered.isEmpty()) return filtered;
            }
        }
        return cars;
    }

    private List<CarSummaryResult> filterByProvince(List<CarSummaryResult> cars, String lowerQuery) {
        Map<String, List<String>> provinceKeywords = Map.of(
                "Hồ Chí Minh", List.of("hcm", "hồ chí minh", "sài gòn", "saigon", "tp.hcm", "tphcm"),
                "Hà Nội", List.of("hà nội", "ha noi", "hanoi", "hn"),
                "Đà Nẵng", List.of("đà nẵng", "da nang", "danang"),
                "Đà Lạt", List.of("đà lạt", "da lat", "dalat"),
                "Nha Trang", List.of("nha trang"),
                "Phú Quốc", List.of("phú quốc", "phu quoc"),
                "Huế", List.of("huế", "hue"),
                "Cần Thơ", List.of("cần thơ", "can tho"),
                "Hải Phòng", List.of("hải phòng", "hai phong"),
                "Vũng Tàu", List.of("vũng tàu", "vung tau")
        );

        for (Map.Entry<String, List<String>> entry : provinceKeywords.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (lowerQuery.contains(keyword)) {
                    String province = entry.getKey();
                    List<CarSummaryResult> filtered = cars.stream()
                            .filter(c -> {
                                String carProvince = c.getProvince() != null ? c.getProvince() : "";
                                String carAddress = c.getAddress() != null ? c.getAddress() : "";
                                return carProvince.toLowerCase().contains(province.toLowerCase())
                                        || carAddress.toLowerCase().contains(province.toLowerCase())
                                        || carAddress.toLowerCase().contains(keyword);
                            })
                            .collect(Collectors.toList());
                    if (!filtered.isEmpty()) return filtered;
                }
            }
        }
        return cars;
    }

    // =========================================================================
    // Matching xe tốt nhất (cho deposit calculation)
    // =========================================================================

    private CarSummaryResult findBestMatchingCar(List<CarSummaryResult> cars, String lowerQuery) {
        // 1. Tìm theo số chỗ
        Matcher seatsMatcher = SEATS_PATTERN.matcher(lowerQuery);
        if (seatsMatcher.find()) {
            int requestedSeats = Integer.parseInt(seatsMatcher.group(1));
            for (CarSummaryResult c : cars) {
                if (c.getSeats() != null && c.getSeats() >= requestedSeats) return c;
            }
        }

        // 2. Tìm theo hãng/model
        Map<String, String> brandKeywords = Map.ofEntries(
                Map.entry("toyota", "Toyota"), Map.entry("vios", "Toyota"),
                Map.entry("camry", "Toyota"), Map.entry("innova", "Toyota"),
                Map.entry("fortuner", "Toyota"), Map.entry("mazda", "Mazda"),
                Map.entry("cx5", "Mazda"), Map.entry("cx-5", "Mazda"),
                Map.entry("honda", "Honda"), Map.entry("civic", "Honda"),
                Map.entry("crv", "Honda"), Map.entry("hyundai", "Hyundai"),
                Map.entry("accent", "Hyundai"), Map.entry("kia", "Kia"),
                Map.entry("vinfast", "VinFast"), Map.entry("xpander", "Mitsubishi"),
                Map.entry("ford", "Ford"), Map.entry("mercedes", "Mercedes-Benz")
        );

        for (Map.Entry<String, String> entry : brandKeywords.entrySet()) {
            if (lowerQuery.contains(entry.getKey())) {
                for (CarSummaryResult c : cars) {
                    if (entry.getValue().equalsIgnoreCase(c.getBrand())) return c;
                }
            }
        }

        // 3. Tìm theo xe điện
        if (lowerQuery.contains("xe điện") || lowerQuery.contains("electric")) {
            for (CarSummaryResult c : cars) {
                if (c.getFuelType() == EFuelType.ELECTRIC) return c;
            }
        }

        // 4. Mặc định lấy chiếc xe đầu tiên
        return cars.isEmpty() ? null : cars.get(0);
    }

    // =========================================================================
    // TOOL CALLING: Tính cọc 30%
    // =========================================================================

    private DepositCalculation calculateDeposit(CarSummaryResult car, int rentalDays, boolean withDriver) {
        BigDecimal pricePerDay = car.getPricePerDay() != null ? car.getPricePerDay() : BigDecimal.ZERO;
        BigDecimal driverFee = (withDriver && Boolean.TRUE.equals(car.getHasDriverService()) && car.getDriverFeePerDay() != null)
                ? car.getDriverFeePerDay()
                : BigDecimal.ZERO;

        BigDecimal totalRental = pricePerDay.multiply(BigDecimal.valueOf(rentalDays));
        BigDecimal totalDriver = driverFee.multiply(BigDecimal.valueOf(rentalDays));
        BigDecimal grandTotal = totalRental.add(totalDriver);
        BigDecimal depositAmount = grandTotal.multiply(DEPOSIT_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal remainingAmount = grandTotal.subtract(depositAmount);

        return DepositCalculation.builder()
                .carId(car.getCarId())
                .carName(car.getBrand() + " " + car.getModel())
                .rentalDays(rentalDays)
                .pricePerDay(pricePerDay)
                .totalRentalFee(totalRental)
                .withDriver(withDriver)
                .driverFeePerDay(driverFee)
                .totalDriverFee(totalDriver)
                .grandTotal(grandTotal)
                .depositAmount(depositAmount)
                .remainingAmount(remainingAmount)
                .depositFormatted(formatCurrency(depositAmount))
                .grandTotalFormatted(formatCurrency(grandTotal))
                .remainingFormatted(formatCurrency(remainingAmount))
                .build();
    }

    // =========================================================================
    // STRUCTURED OUTPUT: Build Car Card DTO
    // =========================================================================

    private CarCardDto buildCarCard(CarSummaryResult car) {
        String thumbnailUrl = car.getThumbnailUrl();
        // Nếu không có thumbnail, lấy ảnh đầu tiên từ danh sách images
        if ((thumbnailUrl == null || thumbnailUrl.isBlank()) && car.getImages() != null && !car.getImages().isEmpty()) {
            thumbnailUrl = car.getImages().get(0);
        }

        return CarCardDto.builder()
                .carId(car.getCarId())
                .name(car.getBrand() + " " + car.getModel() + " " + (car.getYear() != null ? car.getYear() : ""))
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .seats(car.getSeats())
                .transmission(translateTransmission(car.getTransmission()))
                .fuelType(translateFuelType(car.getFuelType()))
                .pricePerDay(car.getPricePerDay())
                .priceFormatted(formatCurrency(car.getPricePerDay()))
                .thumbnailUrl(thumbnailUrl)
                .address(car.getAddress())
                .province(car.getProvince())
                .rating(car.getRating())
                .ratingCount(car.getRatingCount())
                .hasDriverService(car.getHasDriverService())
                .driverFeePerDay(car.getDriverFeePerDay())
                .driverFeeFormatted(car.getDriverFeePerDay() != null && car.getDriverFeePerDay().compareTo(BigDecimal.ZERO) > 0
                        ? formatCurrency(car.getDriverFeePerDay()) : null)
                .bookingUrl("index.html?carId=" + car.getCarId())
                .build();
    }

    // =========================================================================
    // TEXT FORMATTING HELPERS
    // =========================================================================

    private String formatCarTextBlock(CarSummaryResult car) {
        String driverInfo = Boolean.TRUE.equals(car.getHasDriverService())
                ? String.format("✅ Có — Phí: %s/ngày", formatCurrency(car.getDriverFeePerDay()))
                : "❌ Không";

        return String.format("""
                        🚗 **%s %s** (Đời %d)
                        • Số chỗ: %d | Hộp số: %s | Nhiên liệu: %s
                        • Giá thuê: **%s/ngày**
                        • Đánh giá: ⭐ %s/5 (%d lượt)
                        • Địa điểm: %s
                        • 🚘 Dịch vụ tài xế: %s
                        """,
                car.getBrand(),
                car.getModel(),
                car.getYear() != null ? car.getYear() : 2023,
                car.getSeats() != null ? car.getSeats() : 5,
                translateTransmission(car.getTransmission()),
                translateFuelType(car.getFuelType()),
                formatCurrency(car.getPricePerDay()),
                car.getRating() != null ? car.getRating().toPlainString() : "5.00",
                car.getRatingCount() != null ? car.getRatingCount() : 0,
                car.getAddress() != null ? car.getAddress() : "Chưa cập nhật",
                driverInfo
        );
    }

    private String buildContextualGreeting(String lowerQuery, int resultCount) {
        if (lowerQuery.contains("du lịch") || lowerQuery.contains("gia đình") || lowerQuery.contains("đi chơi")) {
            return String.format("🏖️ Tuyệt vời! Tôi tìm được **%d xe** phù hợp cho chuyến du lịch gia đình:", resultCount);
        }
        if (lowerQuery.contains("công tác") || lowerQuery.contains("doanh nhân") || lowerQuery.contains("họp")) {
            return String.format("💼 Dành cho chuyến công tác, tôi gợi ý **%d xe** sang trọng & tiện nghi:", resultCount);
        }
        if (lowerQuery.contains("xe điện") || lowerQuery.contains("vinfast") || lowerQuery.contains("electric")) {
            return String.format("⚡ Xe điện thân thiện môi trường! Tôi tìm được **%d xe** điện phù hợp:", resultCount);
        }
        if (lowerQuery.contains("tiết kiệm") || lowerQuery.contains("rẻ") || lowerQuery.contains("giá thấp") || lowerQuery.contains("budget")) {
            return String.format("💰 Xe giá tốt nhất cho bạn! Tôi tìm được **%d xe** tiết kiệm:", resultCount);
        }
        if (lowerQuery.contains("tự động") || lowerQuery.contains("automatic")) {
            return String.format("🔄 Xe số tự động dễ lái! Tôi gợi ý **%d xe** phù hợp:", resultCount);
        }
        return String.format("Dựa trên yêu cầu của bạn, tôi tìm được **%d xe** phù hợp:", resultCount);
    }

    private String translateTransmission(ETransmission transmission) {
        if (transmission == null) return "Chưa rõ";
        return switch (transmission) {
            case AUTOMATIC -> "Tự động";
            case MANUAL -> "Số sàn";
        };
    }

    private String translateFuelType(EFuelType fuelType) {
        if (fuelType == null) return "Chưa rõ";
        return switch (fuelType) {
            case GASOLINE -> "Xăng";
            case DIESEL -> "Dầu";
            case ELECTRIC -> "Điện";
            case HYBRID -> "Hybrid";
        };
    }

    private BigDecimal parsePrice(String numberStr, String unit) {
        try {
            BigDecimal value = new BigDecimal(numberStr.replace(",", "."));
            if (unit == null) return value;
            String unitLower = unit.toLowerCase();
            if (unitLower.startsWith("triệu") || unitLower.startsWith("tr")) {
                return value.multiply(BigDecimal.valueOf(1_000_000));
            }
            if (unitLower.equals("k") || unitLower.startsWith("nghìn") || unitLower.startsWith("nghin")) {
                return value.multiply(BigDecimal.valueOf(1_000));
            }
            if (unitLower.equals("000")) {
                return value.multiply(BigDecimal.valueOf(1_000));
            }
            return value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // =========================================================================
    // Persistence: Load & Save Chat History
    // =========================================================================

    private List<ChatMessageDto> loadHistory(Long userId, String sessionId) {
        Long effectiveUserId = userId != null ? userId : 0L;

        // 1. Tìm theo effectiveUserId và sessionId
        Optional<ChatMemoryRecord> memoryOpt = chatMemoryPort.findByUserIdAndSessionId(effectiveUserId, sessionId);

        // 2. Nếu user đã đăng nhập mà chưa có bản ghi theo userId, kiểm tra xem có bản ghi vãng lai (0L) với cùng sessionId không để chuyển giao
        if (memoryOpt.isEmpty() && effectiveUserId > 0) {
            Optional<ChatMemoryRecord> anonMemoryOpt = chatMemoryPort.findByUserIdAndSessionId(0L, sessionId);
            if (anonMemoryOpt.isPresent()) {
                ChatMemoryRecord anon = anonMemoryOpt.get();
                anon.setUserId(effectiveUserId);
                updateUserMetadata(anon, effectiveUserId);
                chatMemoryPort.save(anon);
                memoryOpt = Optional.of(anon);
                log.info("[AI Chat] Đã tự động chuyển giao lịch sử session {} từ vãng lai sang User ID: {}", sessionId, effectiveUserId);
            }
        }

        // Tuyệt đối không lấy trộm session của user khác: Chỉ đọc hội thoại của chính effectiveUserId
        return memoryOpt.map(entity -> {
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
            Long effectiveUserId = userId != null ? userId : 0L;

            // Chỉ tìm entity của chính user này hoặc session vãng lai (0L) để chuyển giao, không ghi đè session của user khác
            ChatMemoryRecord entity = chatMemoryPort.findByUserIdAndSessionId(effectiveUserId, sessionId)
                    .or(() -> {
                        if (effectiveUserId > 0) {
                            return chatMemoryPort.findByUserIdAndSessionId(0L, sessionId);
                        }
                        return Optional.empty();
                    })
                    .orElseGet(() -> ChatMemoryRecord.builder()
                            .sessionId(sessionId)
                            .userId(effectiveUserId)
                            .build());

            entity.setUserId(effectiveUserId);
            entity.setMessages(json);
            entity.setMessageCount(history.size());
            entity.setUpdatedAt(Instant.now());

            // Lưu câu hỏi đầu tiên và tin nhắn cuối cùng để hiển thị tóm tắt trong lịch sử
            if (!history.isEmpty()) {
                ChatMessageDto first = history.stream()
                        .filter(m -> "USER".equalsIgnoreCase(m.getRole()))
                        .findFirst()
                        .orElse(history.get(0));
                ChatMessageDto last = history.get(history.size() - 1);
                entity.setFirstMessage(truncateString(first.getContent(), 300));
                entity.setLastMessage(truncateString(last.getContent(), 300));
            }

            updateUserMetadata(entity, effectiveUserId);
            chatMemoryPort.save(entity);
        } catch (Exception e) {
            log.error("Lỗi khi lưu chat history cho session {}: {}", sessionId, e.getMessage());
        }
    }

    private void updateUserMetadata(ChatMemoryRecord entity, Long userId) {
        if (userId == null || userId <= 0) {
            entity.setUserRole("GUEST");
            entity.setUserFullName("Khách vãng lai");
            entity.setUserEmail("Chưa đăng nhập");
            return;
        }
        if (userQueryPort != null) {
            userQueryPort.findUserById(userId).ifPresent(user -> {
                entity.setUserEmail(user.getEmail());
                entity.setUserFullName(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername());
                if (user.getRole() != null) {
                    entity.setUserRole(user.getRole());
                } else {
                    entity.setUserRole("ROLE_RENTER");
                }
            });
        }
    }

    private String truncateString(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto> getMyChatSessions(Long userId) {
        if (userId == null || userId <= 0) {
            return Collections.emptyList();
        }
        return chatMemoryPort.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toSessionSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto> getAllSessionsForAdmin(String roleFilter, String search) {
        List<ChatMemoryRecord> list;
        if (roleFilter != null && !roleFilter.isBlank() && !"ALL".equalsIgnoreCase(roleFilter)) {
            list = chatMemoryPort.findByUserRoleOrderByUpdatedAtDesc(roleFilter.trim().toUpperCase());
        } else {
            list = chatMemoryPort.findAllByOrderByUpdatedAtDesc();
        }

        if (search != null && !search.isBlank()) {
            String s = search.trim().toLowerCase();
            list = list.stream().filter(e ->
                    (e.getSessionId() != null && e.getSessionId().toLowerCase().contains(s)) ||
                    (e.getUserEmail() != null && e.getUserEmail().toLowerCase().contains(s)) ||
                    (e.getUserFullName() != null && e.getUserFullName().toLowerCase().contains(s)) ||
                    (e.getFirstMessage() != null && e.getFirstMessage().toLowerCase().contains(s))
            ).collect(Collectors.toList());
        }

        return list.stream().map(this::toSessionSummary).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getSessionTranscriptForAdmin(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return Collections.emptyList();
        }
        Optional<ChatMemoryRecord> opt = chatMemoryPort.findFirstBySessionIdOrderByUpdatedAtDesc(sessionId);
        if (opt.isEmpty()) {
            opt = chatMemoryPort.findBySessionId(sessionId);
        }
        return opt.map(entity -> {
                    try {
                        return objectMapper.readValue(entity.getMessages(), new TypeReference<List<ChatMessageDto>>() {});
                    } catch (Exception e) {
                        log.warn("Không thể parse chat history cho session {}: {}", sessionId, e.getMessage());
                        return new ArrayList<ChatMessageDto>();
                    }
                })
                .orElseGet(ArrayList::new);
    }

    private com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto toSessionSummary(ChatMemoryRecord e) {
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                .ofPattern("HH:mm dd/MM/yyyy")
                .withZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));

        return com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto.builder()
                .id(e.getId())
                .sessionId(e.getSessionId())
                .userId(e.getUserId())
                .userRole(e.getUserRole() != null ? e.getUserRole() : "GUEST")
                .userEmail(e.getUserEmail() != null ? e.getUserEmail() : "Chưa đăng nhập")
                .userFullName(e.getUserFullName() != null ? e.getUserFullName() : "Khách vãng lai")
                .messageCount(e.getMessageCount() != null ? e.getMessageCount() : 0)
                .firstMessage(e.getFirstMessage() != null ? e.getFirstMessage() : "Cuộc trò chuyện mới")
                .lastMessage(e.getLastMessage())
                .updatedAt(e.getUpdatedAt())
                .updatedAtFormatted(e.getUpdatedAt() != null ? formatter.format(e.getUpdatedAt()) : "")
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "Thỏa thuận";
        NumberFormat nf = NumberFormat.getInstance(VI_LOCALE);
        return nf.format(amount) + " đ";
    }
}
