package com.driveshare.modules.health;

import com.driveshare.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Root & Home", description = "Trang chỉ mục và điều hướng hệ thống")
public class HomeController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Trang chào mừng và cổng điều hướng hệ thống Backend / Frontend")
    public String homeHtml() {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>DriveShare Backend Service (Port 8080)</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  background: linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0f172a 100%);
                  color: #f1f5f9;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 24px;
                }
                .container {
                  background: rgba(30, 41, 59, 0.85);
                  backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 24px;
                  max-width: 620px;
                  width: 100%;
                  padding: 40px;
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
                  text-align: center;
                }
                .badge {
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  background: rgba(16, 185, 129, 0.2);
                  color: #34d399;
                  border: 1px solid rgba(16, 185, 129, 0.4);
                  padding: 6px 16px;
                  border-radius: 9999px;
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 20px;
                }
                .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
                h1 { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
                p.sub { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
                .notice-box {
                  background: rgba(59, 130, 246, 0.1);
                  border: 1px solid rgba(59, 130, 246, 0.3);
                  border-radius: 12px;
                  padding: 14px 18px;
                  margin-bottom: 28px;
                  text-align: left;
                  font-size: 14px;
                  color: #bfdbfe;
                  display: flex;
                  gap: 12px;
                  align-items: flex-start;
                }
                .links-grid { display: flex; flex-direction: column; gap: 14px; }
                .btn {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 16px 20px;
                  border-radius: 14px;
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 15px;
                  transition: all 0.2s ease;
                }
                .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3); }
                .btn-primary {
                  background: linear-gradient(135deg, #2563eb, #3b82f6);
                  color: #ffffff;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .btn-secondary {
                  background: #1e293b;
                  color: #38bdf8;
                  border: 1px solid #334155;
                }
                .btn-secondary:hover { background: #334155; }
                .btn-third {
                  background: #1e293b;
                  color: #a78bfa;
                  border: 1px solid #334155;
                }
                .btn-third:hover { background: #334155; }
                .btn-content { display: flex; align-items: center; gap: 14px; }
                .btn-content i { font-size: 18px; width: 20px; }
                .btn-tag { font-size: 12px; font-weight: 500; opacity: 0.8; }
                .footer { margin-top: 32px; font-size: 13px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="badge"><span class="dot"></span> Spring Boot Backend (Port 8080) Đang Hoạt Động</div>
                <h1>🚗 DriveShare Car Rental Platform</h1>
                <p class="sub">Bạn đang mở cổng <strong>Backend REST API</strong>. Để xem giao diện website người dùng, vui lòng click nút bên dưới:</p>
                
                <div class="notice-box">
                  <i class="fa-solid fa-circle-info" style="font-size: 18px; margin-top: 2px;"></i>
                  <div>
                    <strong>Lưu ý:</strong> Giao diện Web được chạy tại cổng <strong>3000</strong>. Nếu mở <code>http://localhost:8080</code> thì đây là cổng API dành cho lập trình viên.
                  </div>
                </div>

                <div class="links-grid">
                  <a href="http://localhost:3000" class="btn btn-primary" target="_blank">
                    <div class="btn-content">
                      <i class="fa-solid fa-globe"></i>
                      <span>Truy cập Giao Diện Website (Frontend)</span>
                    </div>
                    <span class="btn-tag">http://localhost:3000 &rarr;</span>
                  </a>

                  <a href="/swagger-ui.html" class="btn btn-secondary">
                    <div class="btn-content">
                      <i class="fa-solid fa-book-bookmark"></i>
                      <span>Tài Liệu Swagger UI / OpenAPI</span>
                    </div>
                    <span class="btn-tag">/swagger-ui.html &rarr;</span>
                  </a>

                  <a href="/api/v1/chat/langfuse-status" class="btn btn-third">
                    <div class="btn-content">
                      <i class="fa-solid fa-robot"></i>
                      <span>Trạng Thái AI, RAG & Langfuse</span>
                    </div>
                    <span class="btn-tag">/api/v1/chat/langfuse-status &rarr;</span>
                  </a>

                  <a href="/h2-console" class="btn btn-secondary" target="_blank">
                    <div class="btn-content">
                      <i class="fa-solid fa-database"></i>
                      <span>Quản Trị Cơ Sở Dữ Liệu H2 Console</span>
                    </div>
                    <span class="btn-tag">/h2-console &rarr;</span>
                  </a>
                </div>

                <div class="footer">
                  DriveShare Project &copy; 2026 • Spring Boot 3.3.4 • Java 21
                </div>
              </div>
            </body>
            </html>
            """;
    }

    @GetMapping(value = "/", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Thông tin dịch vụ Backend khi gọi dạng JSON")
    public ResponseEntity<ApiResponse<Map<String, Object>>> homeJson() {
        return ResponseEntity.ok(ApiResponse.success("DriveShare Backend Service is running", Map.of(
                "status", "UP",
                "frontend_url", "http://localhost:3000",
                "swagger_docs", "/swagger-ui.html",
                "langfuse_status", "/api/v1/chat/langfuse-status",
                "health_check", "/api/v1/health"
        )));
    }
}
