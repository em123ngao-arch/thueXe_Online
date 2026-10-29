# 🔌 DriveShare Model Context Protocol (MCP) Server

Máy chủ **MCP (Model Context Protocol)** chuẩn mở dành riêng cho nền tảng **DriveShare**, cho phép mọi Trợ lý AI (như **Antigravity IDE**, **Claude Desktop**, **Cursor**, **Gemini Code Assist**) kết nối và thực thi nghiệp vụ trực tiếp với hệ sinh thái cho thuê xe.

---

## 🛠️ 1. Các Tools & Resources Cung Cấp

### 🧰 Tools:
1. `driveshare_search_cars`: Tìm kiếm và lọc xe theo hãng, khoảng giá, số ghế, hộp số, nhiên liệu, vị trí.
2. `driveshare_get_car_detail`: Xem chi tiết thông số, tiện nghi, biểu phí và đánh giá khách hàng theo `car_id`.
3. `driveshare_calculate_deposit`: Tính toán tiền thuê xe, tỷ lệ cọc 30% VietQR, 70% thanh toán khi giao xe và phụ phí tài xế.
4. `driveshare_check_langfuse_status`: Kiểm tra trạng thái giám sát AI Tracing trên Langfuse.
5. `driveshare_test_langfuse_trace`: Bắn một Trace kiểm thử lên Langfuse Dashboard.
6. `driveshare_query_rag_knowledge`: Tra cứu điều khoản, hợp đồng, quy chế thế chấp xe qua Document RAG Studio.

### 📚 Resources:
- `driveshare://policies/rental-terms`: Quy chuẩn thuê xe tự lái và xe có tài xế.
- `driveshare://platform/health`: Sức khỏe hệ sinh thái Backend, AI, RAG & Langfuse.

---

## 🚀 2. Hướng Dẫn Chạy Độc Lập

Sử dụng công cụ `uv` có sẵn trong máy:

```powershell
# Chạy trực tiếp qua uv với gói mcp
uv run --with mcp==2.2.0 mcp run mcp_server/server.py
```

---

## ⚙️ 3. Cấu Hình Vào Antigravity IDE / Claude Desktop

Bổ sung cấu hình vào file `C:\Users\PHAT\.gemini\config\mcp_config.json`:

```json
{
  "mcpServers": {
    "driveshare-server": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "mcp==2.2.0",
        "mcp",
        "run",
        "d:\\JavaSpring2\\JavaSpring2_Project_ThueXeOnline\\thueXe_Online\\mcp_server\\server.py"
      ],
      "cwd": "d:\\JavaSpring2\\JavaSpring2_Project_ThueXeOnline\\thueXe_Online"
    }
  }
}
```
