# Tài Liệu Đặc Tả & Cơ Chế Hoạt Động Của Trợ Lý Ảo AI DriveShare

> **Dự án**: DriveShare — Nền tảng chia sẻ và cho thuê xe trực tuyến  
> **Phân hệ**: AI Chatbot Assistant (Sprint 3)  
> **Tác giả / Nhánh**: `feature/ai-chatbot-rag`  
> **Công nghệ cốt lõi**: Google Gemini 2.5 Flash, RAG (Retrieval-Augmented Generation), Spring Boot 3, PostgreSQL, Vanilla JS  

---

## 1. Tổng Quan Phân Hệ AI (Overview)

**Trợ Lý Ảo AI DriveShare** là phân hệ tư vấn thông minh hoạt động 24/7 trên nền tảng DriveShare. Trợ lý giúp người dùng:
1. **Tìm kiếm xe theo nhu cầu thực tế**: Tìm xe theo số chỗ (4, 5, 7 chỗ), hãng xe (VinFast, Mazda, Toyota, Kia...), loại nhiên liệu (xe điện, xăng, dầu), loại hộp số (tự động, số sàn), địa điểm và ngân sách.
2. **Tư vấn chính sách cọc 30% VietQR**: Giải đáp chi tiết quy trình đặt cọc, cơ chế thanh toán qua mã QR động và chính sách hoàn tiền khi hủy chuyến.
3. **Dịch vụ thuê kèm tài xế (Sprint 3)**: Tư vấn các xe có hỗ trợ tài xế riêng, bảng giá tài xế theo ngày và cách tính tổng chi phí.
4. **Tính toán chi phí & tiền cọc tức thì**: Bóc tách số ngày thuê từ tin nhắn, tự động tính tổng tiền thuê và cọc 30% chuẩn xác.

---

## 2. Kiến Trúc Kỹ Thuật (Architecture)

Phân hệ AI được xây dựng theo kiến trúc **Hybrid AI**: Kết hợp mô hình ngôn ngữ lớn (LLM) hiện đại nhất với dữ liệu xe thực tế từ cơ sở dữ liệu (**RAG**) và cơ chế dự phòng nội bộ (**Rule-based Fallback**).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          GIAO DIỆN NGƯỜI DÙNG                          │
│        (Frontend Widget: chat-ai.js / Render Thẻ Xe & Dự Toán Cọc)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP POST /api/v1/chat
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND: Spring Boot 3                          │
│                                                                        │
│   1. Phân Tích Ý Định (Intent Analyzer): Chào hỏi, Khiếu nại, Tìm xe... │
│   2. Nạp Lịch Sử Trò Chuyện (PostgreSQL: bảng chat_memory)             │
│   3. Truy Vấn Dữ Liệu Xe Thực (CarRepository - RAG Context)           │
│                                                                        │
│            ┌──────────────────────┴──────────────────────┐             │
│            │ (Trực tuyến)                                │ (Dự phòng)  │
│            ▼                                             ▼             │
│  [Google Gemini 2.5 Flash]                     [Rule-based NLP Engine] │
│  - System Prompt chống ảo giác                 - Phản hồi mẫu nghiệp vụ│
│  - Sinh văn bản tự nhiên, linh hoạt            - Zero-downtime khi lỗi │
│            │                                             │             │
│            └──────────────────────┬──────────────────────┘             │
│                                   ▼                                    │
│       4. Đóng gói ApiResponse<ChatReplyResponse> (Text + Car Cards)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Các Tính Năng Nổi Bật & Nguyên Tắc Hoạt Động

### 3.1. Cơ Chế RAG (Retrieval-Augmented Generation) & Chống Ảo Giác
* **Vấn đề của AI thông thường**: Các mô hình LLM thuần túy hay tự "bịa" ra thông tin xe không có thực trong kho xe của công ty (Hallucination).
* **Giải pháp của DriveShare**:
  1. Khi người dùng có nhu cầu tìm xe, Backend truy vấn bảng `cars` trong cơ sở dữ liệu PostgreSQL để lấy danh sách các xe thực sự đang hoạt động (`ACTIVE`).
  2. Dữ liệu xe thực (hãng, đời xe, giá thuê, địa chỉ, số chỗ, đánh giá sao, phí tài xế) được nhúng vào System Prompt dưới định dạng `[DỮ LIỆU XE KHẢ DỤNG]`.
  3. AI được chỉ định nguyên tắc tối cao: **Chỉ được tư vấn các xe nằm trong danh sách được cung cấp. Nếu xe người dùng tìm không có trong hệ thống, phải thẳng thắn thông báo chưa có và gợi ý xe khác tương đương.**
  4. Backend đồng thời đóng gói danh sách đối tượng `CarCardDto` gửi kèm JSON để Frontend hiển thị thẻ xe có hình ảnh, giá và nút đặt cọc ngay.

### 3.2. Bộ Nhận Diện Ý Định Thông Minh (Smart Intent Filtering)
Khắc phục triệt để tình trạng AI tự tiện gửi thẻ xe khi người dùng chưa yêu cầu:

| Ý định của khách | Câu mẫu đầu vào | Cách AI xử lý | Gắn thẻ xe? |
|---|---|---|:---:|
| **Chào hỏi / Xã giao** | `hello`, `hi`, `chào bạn`, `alo` | Niềm nở chào lại, giới thiệu dịch vụ và hỏi nhu cầu của khách | ❌ Không |
| **Đính chính / Chưa yêu cầu** | `tôi chưa ra yêu cầu mà`, `sao kì vậy`, `chưa cần`, `đang xem` | Lịch sự xin lỗi vì đã vội vàng, hướng dẫn các tiêu chí tìm xe khi khách cần | ❌ Không |
| **Hỏi chính sách cọc** | `chính sách cọc thế nào`, `cọc bao nhiêu %`, `vietqr` | Giải thích quy trình 4 bước cọc 30% VietQR và quy định hoàn cọc theo mốc 48h/24h | ❌ Không |
| **Hỏi thủ tục thuê xe** | `cần giấy tờ gì`, `thủ tục thế nào`, `bằng lái b2` | Liệt kê 3 loại: CCCD gắn chip, GPLX B1/B2, tài sản thế chấp | ❌ Không |
| **Hỏi dịch vụ tài xế** | `dịch vụ tài xế là sao`, `có người lái không` | Giới thiệu dịch vụ lái hộ chuyên nghiệp, cách tính phí cộng thêm theo ngày | ❌ Không |
| **Tìm xe thực tế** | `thuê xe 7 chỗ đi du lịch`, `xe điện vinfast`, `mazda tự động` | Kích hoạt RAG, lọc xe phù hợp trong DB và sinh câu trả lời kèm thẻ xe | ✅ **Có** |
| **Tính tiền cọc** | `thuê cx-5 trong 3 ngày hết bao nhiêu`, `tính cọc vios 2 ngày` | Bóc tách số ngày, tính: Tổng = Giá × Ngày, Cọc = 30% Tổng, Còn lại = 70% | ✅ **Kèm bảng cọc** |

### 3.3. Cơ Chế Dự Phòng Bền Bỉ (Dual-Engine Fallback Resilience)
* Nếu Gemini API Key chưa được cấu hình, bị hết hạn mức (quota), hoặc mất mạng:
* Hệ thống sẽ **không báo lỗi 500** cho người dùng, mà tự động chuyển sang **Rule-based NLP Engine** nội bộ được viết bằng Java.
* Người dùng vẫn nhận được câu trả lời chính xác, thông tin xe thực tế và thẻ xe tương tác mà không bị gián đoạn trải nghiệm.

### 3.4. Lưu Trữ Bộ Nhớ Hội Thoại (Multi-turn Chat Memory)
* Mỗi phiên chat được cấp một `sessionId` lưu trữ trên trình duyệt của người dùng.
* Toàn bộ lịch sử trao đổi được lưu vào bảng `chat_memory` trong cơ sở dữ liệu PostgreSQL (`backend/src/main/java/com/driveshare/modules/ai/entity/ChatMemory.java`).
* Nhờ đó, AI nắm được ngữ cảnh các câu nói trước của người dùng (ví dụ: người dùng nói *"Tôi muốn thuê xe ở HCM"*, sau đó hỏi tiếp *"Có xe nào dưới 1 triệu không?"*, AI vẫn nhớ địa điểm HCM).

---

## 4. Đặc Tả Dữ Liệu API (API Specification)

### Endpoint Chatbot
* **URL**: `POST /api/v1/chat`
* **Quyền truy cập**: Public (hỗ trợ cả khách vãng lai lẫn người dùng đã đăng nhập)

#### Request Body
```json
{
  "sessionId": "session_abc123_1728400000000",
  "message": "Tôi muốn tìm xe điện đi lại trong nội thành HCM"
}
```

#### Response Body (`ApiResponse<ChatReplyResponse>`)
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "sessionId": "session_abc123_1728400000000",
    "message": "Chào bạn! Tôi xin gợi ý mẫu xe điện VinFast phù hợp di chuyển trong nội thành HCM:\n\n🚗 VinFast VF8 (Đời 2023)...",
    "suggestedCars": [
      {
        "id": 2,
        "brand": "VinFast",
        "model": "VF8",
        "year": 2023,
        "seats": 5,
        "transmission": "Tự động",
        "fuelType": "Điện",
        "pricePerDay": 1200000,
        "thumbnailUrl": "/images/cars/vf8.jpg",
        "rating": 4.8,
        "ratingCount": 5,
        "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
        "hasDriverService": true,
        "driverFeePerDay": 500000
      }
    ],
    "depositCalculation": null
  }
}
```

---

## 5. Cấu Trúc Mã Nguồn Phân Hệ AI

```text
backend/src/main/java/com/driveshare/modules/ai/
├── controller/
│   └── ChatController.java               # REST Controller: /api/v1/chat (chat, history, clear)
├── dto/
│   ├── request/
│   │   └── ChatRequest.java              # Request DTO: sessionId, message
│   └── response/
│       ├── ChatReplyResponse.java        # Response DTO: message, suggestedCars, depositCalculation
│       ├── CarCardDto.java               # DTO thẻ xe hiển thị trên widget
│       ├── DepositCalculation.java       # DTO chi tiết tính cọc 30% VietQR
│       └── ChatMessageDto.java           # DTO một tin nhắn (USER / ASSISTANT)
├── entity/
│   └── ChatMemory.java                   # Entity lưu lịch sử trò chuyện trong PostgreSQL
├── repository/
│   └── ChatMemoryRepository.java         # Spring Data JPA Repository cho ChatMemory
└── service/
    ├── AiChatService.java                # Interface nghiệp vụ AI
    ├── GeminiService.java                # Interface giao tiếp Google Gemini API
    └── impl/
        ├── GeminiServiceImpl.java        # Tích hợp Google Gemini 2.5 Flash REST API
        └── AiChatServiceImpl.java        # Core RAG, phân tích ý định, tính cọc & fallback engine

backend/src/main/resources/
├── prompts/
│   └── car-advisor-system.txt            # System Prompt định nghĩa vai trò, giọng điệu & nguyên tắc AI
└── application.yml                       # Cấu hình gemini.api-key, gemini.model (gemini-2.5-flash)

frontend/
├── js/
│   └── chat-ai.js                        # Widget Chatbot giao diện người dùng
```

---

## 6. Hướng Dẫn Cấu Hình & Chạy Thử

### 6.1. Cấu hình Biến Môi Trường (Environment Variables)
Trước khi khởi động backend, thiết lập biến môi trường trong PowerShell:
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:GEMINI_API_KEY = "AIzaSy..."                # Điền Google Gemini API Key của bạn
$env:GEMINI_MODEL = "gemini-2.5-flash"
```

### 6.2. Khởi chạy Backend & Frontend
* **Backend**:
  ```powershell
  cd backend
  .\mvnw.cmd spring-boot:run
  ```
* **Frontend**:
  ```powershell
  cd frontend
  python -m http.server 3000
  ```
* Truy cập `http://localhost:3000`, bấm vào biểu tượng robot 🤖 ở góc dưới bên phải màn hình để tương tác trực tiếp với Trợ lý AI.
