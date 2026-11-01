import math
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from PIL import Image, ImageDraw, ImageFont

def get_hexagon_points(cx, cy, radius, flat_top=True):
    points = []
    # flat_top=True: angles 30, 90, 150, 210, 270, 330
    angles = [30, 90, 150, 210, 270, 330] if flat_top else [0, 60, 120, 180, 240, 300]
    for angle in angles:
        rad = math.radians(angle)
        x = cx + radius * math.cos(rad)
        y = cy + radius * math.sin(rad)
        points.append((x, y))
    return points

def draw_arrow(draw, start, end, color, width=4, arrow_size=16):
    draw.line([start, end], fill=color, width=width)
    x1, y1 = start
    x2, y2 = end
    angle = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 - arrow_size * math.cos(angle - math.pi / 6), y2 - arrow_size * math.sin(angle - math.pi / 6))
    p2 = (x2 - arrow_size * math.cos(angle + math.pi / 6), y2 - arrow_size * math.sin(angle + math.pi / 6))
    draw.polygon([end, p1, p2], fill=color)

def generate_hexagonal_diagram():
    w, h = 2700, 1300
    img = Image.new("RGB", (w, h), (248, 250, 252)) # Slate 50
    draw = ImageDraw.Draw(img)

    # Fonts
    try:
        f_title = ImageFont.truetype("segoeuib.ttf", 36)
        f_subtitle = ImageFont.truetype("segoeui.ttf", 20)
        f_badge_h = ImageFont.truetype("segoeuib.ttf", 22)
        f_hex_core = ImageFont.truetype("segoeuib.ttf", 25)
        f_hex_sub = ImageFont.truetype("segoeuib.ttf", 16)
        f_hex_ports = ImageFont.truetype("segoeuib.ttf", 20)
        f_box_h = ImageFont.truetype("segoeuib.ttf", 20)
        f_box_body = ImageFont.truetype("segoeui.ttf", 17)
        f_rule_h = ImageFont.truetype("segoeuib.ttf", 17)
        f_rule_sub = ImageFont.truetype("segoeui.ttf", 14)
    except:
        f_title = f_subtitle = f_badge_h = f_hex_core = f_hex_sub = f_hex_ports = f_box_h = f_box_body = f_rule_h = f_rule_sub = ImageFont.load_default()

    # Colors
    NAVY = (30, 58, 138)
    DARK_BLUE = (15, 23, 42)
    TEAL = (13, 148, 136)
    TEAL_DARK = (15, 118, 110)
    ORANGE = (234, 88, 12)
    ORANGE_DARK = (194, 65, 12)
    WHITE = (255, 255, 255)
    BORDER = (203, 213, 225)
    MUTED = (71, 85, 105)

    # 1. Header Box
    draw.rounded_rectangle([50, 25, w - 50, 120], radius=16, fill=WHITE, outline=BORDER, width=2)
    draw.text((80, 36), "MÔ HÌNH KIẾN TRÚC HEXAGONAL (PORTS & ADAPTERS) — HỆ THỐNG DRIVESHARE", font=f_title, fill=NAVY)
    draw.text((80, 82), "Triển khai triệt để nguyên lý Dependency Inversion: Cô lập Core Domain (Pure Java) độc lập với Web và Cơ sở dữ liệu", font=f_subtitle, fill=MUTED)

    # Coordinates of Hexagon Center
    cx, cy = 1350, 650

    # 2. Outer Hexagon (Ports & Application Layer)
    outer_hex = get_hexagon_points(cx, cy, radius=430, flat_top=True)
    draw.polygon(outer_hex, fill=(238, 242, 255), outline=(99, 102, 241), width=4) # Indigo tint

    # Outer Hexagon Label at Top
    draw.text((cx - 250, cy - 400), "TẦNG 2: APPLICATION LAYER (PORTS & USE CASES)", font=f_hex_ports, fill=(67, 56, 202))

    # Inbound Ports Box (inside outer hex, left side)
    inbound_rect = [cx - 370, cy - 250, cx - 180, cy + 250]
    draw.rounded_rectangle(inbound_rect, radius=12, fill=(224, 231, 255), outline=(129, 140, 248), width=2)
    draw.text((cx - 355, cy - 230), "INBOUND PORTS", font=f_box_h, fill=(49, 46, 129))
    draw.text((cx - 340, cy - 200), "(Cổng Vào)", font=f_hex_sub, fill=(79, 70, 229))
    inbound_items = [
        "• RentVehicleUseCase",
        "• ChatAdvisorUseCase",
        "• InspectionUseCase",
        "• DisputeUseCase",
        "• AdminUserUseCase",
        "• OwnerCarUseCase"
    ]
    for i, item in enumerate(inbound_items):
        draw.text((cx - 355, cy - 140 + i * 58), item, font=f_box_body, fill=DARK_BLUE)

    # Outbound Ports Box (inside outer hex, right side)
    outbound_rect = [cx + 180, cy - 250, cx + 370, cy + 250]
    draw.rounded_rectangle(outbound_rect, radius=12, fill=(224, 231, 255), outline=(129, 140, 248), width=2)
    draw.text((cx + 195, cy - 230), "OUTBOUND PORTS", font=f_box_h, fill=(49, 46, 129))
    draw.text((cx + 225, cy - 200), "(Cổng Ra)", font=f_hex_sub, fill=(79, 70, 229))
    outbound_items = [
        "• CarPort / RentalPort",
        "• PaymentGatewayPort",
        "• MediaStoragePort",
        "• LlmClientPort",
        "• NotificationPort",
        "• UserQueryPort"
    ]
    for i, item in enumerate(outbound_items):
        draw.text((cx + 195, cy - 140 + i * 58), item, font=f_box_body, fill=DARK_BLUE)

    # 3. Inner Hexagon (Core Domain)
    inner_hex = get_hexagon_points(cx, cy, radius=220, flat_top=True)
    draw.polygon(inner_hex, fill=(30, 58, 138), outline=(147, 197, 253), width=4) # Deep Navy

    # Text inside Inner Hexagon
    draw.text((cx - 115, cy - 135), "TẦNG 1: DOMAIN", font=f_hex_core, fill=WHITE)
    draw.text((cx - 110, cy - 98), "CORE (PURE JAVA)", font=f_hex_core, fill=(191, 219, 254))
    
    domain_items = [
        "• Domain Records",
        "• RentalPolicy",
        "• CarPolicy",
        "• Pure Business Rules",
        "---------------------",
        "⛔ CẤM IMPORT:",
        "Spring, JPA, Web"
    ]
    for i, item in enumerate(domain_items):
        col = (254, 202, 202) if "⛔" in item or "Spring" in item else WHITE
        fnt = f_hex_sub if "⛔" in item or "Spring" in item else f_box_body
        draw.text((cx - 95, cy - 50 + i * 29), item, font=fnt, fill=col)

    # 4. Left Box: DRIVING ADAPTERS (INBOUND - WEB / USER)
    left_card_box = [50, 150, 780, 1140]
    draw.rounded_rectangle(left_card_box, radius=18, fill=WHITE, outline=BORDER, width=2)
    # Header badge
    draw.rounded_rectangle([70, 170, 760, 230], radius=10, fill=(240, 253, 250), outline=TEAL, width=2)
    draw.text((120, 185), "PRIMARY / DRIVING ADAPTERS (INBOUND)", font=f_badge_h, fill=TEAL_DARK)

    driving_cards = [
        ("1. REST API Controllers (@RestController)",
         "• Tiếp nhận HTTP Requests (GET, POST, PUT, DELETE)\n• Validate tham số đầu vào bằng @Valid DTO\n• Bọc kết quả thống nhất format: ApiResponse<T>\n• Xử lý ngoại lệ toàn cục: GlobalExceptionHandler"),
        ("2. Spring Security 6 & JWT Filter",
         "• JwtAuthenticationFilter kiểm soát phiên Stateless\n• So khớp token_version thu hồi tức thì khi đổi mật khẩu\n• Phân quyền RBAC 3 vai trò: CUSTOMER, OWNER, ADMIN\n• Chống brute-force: Tự động khóa sau 5 lần sai mật khẩu"),
        ("3. Client Web Frontend & Chat AI",
         "• HTML5 / Modern CSS3 / Vanilla JavaScript ES6+\n• Bootstrap 5 tối ưu chuẩn Responsive đa thiết bị\n• Widget Trợ lý ảo AI Chatbot tư vấn chọn xe 24/7\n• Thanh toán mã QR ngân hàng VietQR trực quan")
    ]
    for idx, (title, desc) in enumerate(driving_cards):
        y_top = 250 + idx * 285
        draw.rounded_rectangle([75, y_top, 755, y_top + 265], radius=12, fill=(248, 250, 252), outline=BORDER, width=1)
        draw.text((95, y_top + 16), title, font=f_box_h, fill=NAVY)
        draw.line([95, y_top + 48, 735, y_top + 48], fill=(226, 232, 240), width=1)
        y_text = y_top + 62
        for line in desc.split("\n"):
            draw.text((95, y_text), line, font=f_box_body, fill=DARK_BLUE)
            y_text += 45

    # 5. Right Box: DRIVEN ADAPTERS (OUTBOUND - PERSISTENCE & SERVICES)
    right_card_box = [w - 780, 150, w - 50, 1140]
    draw.rounded_rectangle(right_card_box, radius=18, fill=WHITE, outline=BORDER, width=2)
    # Header badge
    draw.rounded_rectangle([w - 760, 170, w - 70, 230], radius=10, fill=(255, 247, 237), outline=ORANGE, width=2)
    draw.text((w - 710, 185), "SECONDARY / DRIVEN ADAPTERS (OUTBOUND)", font=f_badge_h, fill=ORANGE_DARK)

    driven_cards = [
        ("1. CSDL PostgreSQL 16 (Persistence Adapter)",
         "• Spring Data JPA Repositories (15 bảng nghiệp vụ)\n• Khóa bi quan: @Lock(PESSIMISTIC_WRITE)\n• SELECT FOR UPDATE chống Overbooking & hoàn cọc đôi\n• Đóng gói Docker Compose Alpine + giao diện Adminer"),
        ("2. Thanh Toán VietQR & Ký Quỹ Escrow",
         "• Cổng PayOS tích hợp mã VietQR động\n• Sàn giữ 30% cọc bảo đảm, giải ngân 90/10 khi xong\n• Cronjob 45 phút Soft Lock tự giải phóng đơn chờ"),
        ("3. Cloudinary CDN & Trợ Lý Gemini 2.5 Flash",
         "• Cloudinary: Lưu ảnh xe, cavet, ODO check-in/out\n• Gemini 2.5 Flash: Gợi ý xe theo ngân sách qua API\n• Fallback Regex: Dự phòng offline khi mất kết nối AI")
    ]
    for idx, (title, desc) in enumerate(driven_cards):
        y_top = 250 + idx * 285
        draw.rounded_rectangle([w - 755, y_top, w - 75, y_top + 265], radius=12, fill=(248, 250, 252), outline=BORDER, width=1)
        draw.text((w - 735, y_top + 16), title, font=f_box_h, fill=NAVY)
        draw.line([w - 735, y_top + 48, w - 95, y_top + 48], fill=(226, 232, 240), width=1)
        y_text = y_top + 62
        for line in desc.split("\n"):
            draw.text((w - 735, y_text), line, font=f_box_body, fill=DARK_BLUE)
            y_text += 45

    # 6. Connecting Arrows
    # Left Driving Adapters -> Inbound Ports
    draw_arrow(draw, (760, 380), (cx - 375, 460), color=TEAL, width=4, arrow_size=18)
    draw_arrow(draw, (760, 650), (cx - 375, 650), color=TEAL, width=4, arrow_size=18)
    draw_arrow(draw, (760, 950), (cx - 375, 840), color=TEAL, width=4, arrow_size=18)

    # Inbound Ports -> Domain (Inner Hexagon)
    draw_arrow(draw, (cx - 180, 650), (cx - 110, 650), color=(79, 70, 229), width=3, arrow_size=14)

    # Domain -> Outbound Ports
    draw_arrow(draw, (cx + 110, 650), (cx + 180, 650), color=(79, 70, 229), width=3, arrow_size=14)

    # Outbound Ports -> Right Driven Adapters
    draw_arrow(draw, (cx + 375, 460), (w - 760, 380), color=ORANGE, width=4, arrow_size=18)
    draw_arrow(draw, (cx + 375, 650), (w - 760, 650), color=ORANGE, width=4, arrow_size=18)
    draw_arrow(draw, (cx + 375, 840), (w - 760, 950), color=ORANGE, width=4, arrow_size=18)

    # 7. Bottom Badges: Architecture Rules & Environment
    draw.rounded_rectangle([50, 1160, w - 50, 1270], radius=14, fill=WHITE, outline=BORDER, width=2)

    rule_badges = [
        ("🛡️ QUY TẮC HƯỚNG TÂM", "Domain Core là độc lập tuyệt đối, không biết đến Adapter hay Web/DB."),
        ("⚖️ 7 LUẬT ARCHUNIT", "Kiểm tra tự động cấm import sai tầng, cấm phụ thuộc vòng liên module."),
        ("📦 11 MODULES ĐỘC LẬP", "Giao tiếp liên module bắt buộc thông qua Inbound Port công khai."),
        ("☕ CÔNG NGHỆ CHUẨN", "Java 17, Spring Boot 3.3.4, PostgreSQL 16 Alpine Docker Compose.")
    ]
    badge_w = (w - 160) // 4
    for i, (title, sub) in enumerate(rule_badges):
        bx = 70 + i * (badge_w + 20)
        draw.text((bx, 1176), title, font=f_rule_h, fill=NAVY)
        draw.text((bx, 1215), sub, font=f_rule_sub, fill=MUTED)

    # Save
    out_dir = "docs/diagrams"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "hexagonal_architecture_diagram.png")
    img.save(out_path, quality=95)
    print(f"[OK] Đã tạo thành công sơ đồ Kiến trúc Hexagonal hình lục giác tại: {out_path}")

if __name__ == "__main__":
    generate_hexagonal_diagram()
