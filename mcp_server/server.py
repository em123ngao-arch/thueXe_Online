#!/usr/bin/env python3
"""
DriveShare Model Context Protocol (MCP) Server.
Cung cấp các Tool và Resource chuẩn MCP (Model Context Protocol)
cho phép AI Assistant (Antigravity IDE, Claude, Gemini) tương tác trực tiếp với nền tảng DriveShare.
"""

import os
import json
import urllib.request
import urllib.parse
from datetime import datetime
from typing import Optional, List, Dict, Any

try:
    from mcp.server.mcpserver import MCPServer
    mcp = MCPServer("driveshare-server")
except (ImportError, ModuleNotFoundError):
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("driveshare-server")

DEFAULT_API_BASE = os.getenv("DRIVESHARE_API_BASE", "http://localhost:8080/api/v1")


def _http_get(endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    url = f"{DEFAULT_API_BASE.rstrip('/')}/{endpoint.lstrip('/')}"
    if params:
        query_string = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
        if query_string:
            url = f"{url}?{query_string}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DriveShare-MCP-Server/1.0"})
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data
    except Exception as e:
        return {"success": False, "message": f"Lỗi gọi API ({url}): {str(e)}"}


def _http_post(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{DEFAULT_API_BASE.rstrip('/')}/{endpoint.lstrip('/')}"
    data_bytes = json.dumps(payload).encode("utf-8")
    try:
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "DriveShare-MCP-Server/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data
    except Exception as e:
        return {"success": False, "message": f"Lỗi gọi API ({url}): {str(e)}"}


# =============================================================================
# MCP TOOLS
# =============================================================================

@mcp.tool()
def driveshare_search_cars(
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    seats: Optional[int] = None,
    transmission: Optional[str] = None,
    fuel_type: Optional[str] = None,
    province: Optional[str] = None,
    has_driver: Optional[bool] = None
) -> str:
    """
    Tìm kiếm danh sách xe cho thuê đang hoạt động (ACTIVE) trong hệ thống DriveShare.
    Hỗ trợ lọc theo hãng xe, khoảng giá, số ghế, hộp số (AUTO/MANUAL), nhiên liệu và tỉnh thành.
    """
    params = {
        "brand": brand,
        "minPrice": min_price,
        "maxPrice": max_price,
        "seats": seats,
        "transmission": transmission,
        "fuelType": fuel_type,
        "province": province,
        "hasDriver": has_driver
    }
    res = _http_get("/public/cars", params)
    if not res.get("success", False):
        return f"Không thể tra cứu xe: {res.get('message', 'Máy chủ không phản hồi')}"
    
    cars = res.get("data", [])
    if isinstance(cars, dict) and "content" in cars:
        cars = cars["content"]
        
    if not cars:
        return "Không tìm thấy xe nào phù hợp với điều kiện tìm kiếm."
        
    results = []
    for c in cars:
        car_id = c.get("carId") or c.get("id")
        brand_name = c.get("brand", "")
        model = c.get("model", "")
        year = c.get("year", "")
        price = c.get("pricePerDay", 0)
        seats_cnt = c.get("seatCapacity", 5)
        trans = c.get("transmission", "Tự động")
        fuel = c.get("fuelType", "Xăng")
        rating = c.get("averageRating", "4.9")
        has_drv = "Có hỗ trợ tài xế" if c.get("hasDriverService") else "Tự lái"
        results.append(
            f"- [ID: {car_id}] {brand_name} {model} ({year}) | {seats_cnt} chỗ | {trans} | {fuel} | "
            f"Giá: {price:,.0f} đ/ngày | Rating: ⭐{rating} | {has_drv}"
        )
    return "\n".join(results)


@mcp.tool()
def driveshare_get_car_detail(car_id: int) -> str:
    """
    Lấy thông tin chi tiết đầy đủ của một xe trong DriveShare theo ID (mô tả, địa chỉ nhận xe,
    thông số, điều khoản cọc 30%, và phụ phí có tài xế).
    """
    res = _http_get(f"/public/cars/{car_id}")
    if not res.get("success", False):
        return f"Không tìm thấy xe có ID {car_id}: {res.get('message')}"
    
    data = res.get("data", {})
    brand = data.get("brand", "")
    model = data.get("model", "")
    year = data.get("year", "")
    price = data.get("pricePerDay", 0)
    deposit = price * 0.3
    address = data.get("address", "TP. Hồ Chí Minh")
    rating = data.get("averageRating", "5.0")
    rating_cnt = data.get("ratingCount", 0)
    has_driver = data.get("hasDriverService", False)
    driver_fee = data.get("driverFeePerDay", 0)
    features = ", ".join(data.get("features", ["Bản đồ", "Bluetooth", "Camera lùi"]))
    description = data.get("description", "Xe gia đình giữ gìn sạch sẽ.")

    detail = [
        f"=== CHI TIẾT XE {brand} {model} ({year}) - ID: {car_id} ===",
        f"- Đánh giá: ⭐ {rating}/5.0 ({rating_cnt} lượt đánh giá)",
        f"- Giá thuê: {price:,.0f} đ/ngày",
        f"- Tiền đặt cọc giữ chỗ (30% VietQR): {deposit:,.0f} đ",
        f"- Tiền thanh toán khi nhận xe (70%): {(price - deposit):,.0f} đ",
        f"- Địa điểm giao nhận: {address}",
        f"- Tiện nghi: {features}",
        f"- Dịch vụ kèm tài xế: {'Có (Phụ phí: ' + f'{driver_fee:,.0f}' + ' đ/ngày)' if has_driver else 'Không (Chỉ cho thuê tự lái)'}",
        f"- Mô tả xe: {description}"
    ]
    return "\n".join(detail)


@mcp.tool()
def driveshare_calculate_deposit(
    price_per_day: float,
    start_date: str,
    end_date: str,
    with_driver: bool = False,
    driver_fee_per_day: float = 0.0
) -> str:
    """
    Tính toán chi phí thuê xe chi tiết và tiền cọc 30% VietQR theo chuẩn nghiệp vụ DriveShare.
    Định dạng ngày: YYYY-MM-DD (Ví dụ: 2026-11-01 đến 2026-11-03).
    """
    try:
        d1 = datetime.strptime(start_date, "%Y-%m-%d")
        d2 = datetime.strptime(end_date, "%Y-%m-%d")
        total_days = max(1, (d2 - d1).days)
    except Exception as e:
        return f"Lỗi định dạng ngày (cần dùng YYYY-MM-DD): {str(e)}"
    
    car_total = price_per_day * total_days
    driver_total = (driver_fee_per_day * total_days) if with_driver else 0.0
    grand_total = car_total + driver_total
    deposit_30 = grand_total * 0.3
    remaining_70 = grand_total - deposit_30

    calc = [
        f"=== BẢNG TÍNH GIÁ THUÊ & TIỀN CỌC DRIVESHARE ===",
        f"- Thời gian thuê: Từ {start_date} đến {end_date} ({total_days} ngày)",
        f"- Đơn giá xe: {price_per_day:,.0f} đ/ngày x {total_days} ngày = {car_total:,.0f} đ",
    ]
    if with_driver:
        calc.append(f"- Phụ phí tài xế: {driver_fee_per_day:,.0f} đ/ngày x {total_days} ngày = {driver_total:,.0f} đ")
        calc.append(f"  (Đặc quyền: Miễn thế chấp xe máy/15 triệu, miễn kiểm tra bằng lái GPLX)")
    else:
        calc.append(f"- Hình thức: Tự lái (Yêu cầu GPLX B1/B2 và tài sản thế chấp xe máy/15tr khi nhận xe)")

    calc.extend([
        f"- TỔNG CHI PHÍ DỰ KIẾN: {grand_total:,.0f} đ",
        f"- TIỀN CỌC GIỮ XE (30% qua VietQR tự động): {deposit_30:,.0f} đ",
        f"- THANH TOÁN KHI NHẬN XE (70% còn lại): {remaining_70:,.0f} đ"
    ])
    return "\n".join(calc)


@mcp.tool()
def driveshare_check_langfuse_status() -> str:
    """
    Kiểm tra trạng thái kết nối giám sát Langfuse LLM Observability & Tracing của DriveShare.
    Trả về thông tin kết nối, host, và URL Dashboard.
    """
    res = _http_get("/chat/langfuse-status")
    if not res.get("success", False):
        return f"Không thể lấy trạng thái Langfuse: {res.get('message')}"
    
    data = res.get("data", {})
    enabled = data.get("enabled", False)
    host = data.get("host", "https://cloud.langfuse.com")
    has_pub = data.get("hasPublicKey", False)
    has_sec = data.get("hasSecretKey", False)
    
    lines = [
        "=== TRẠNG THÁI GIÁM SÁT LANGFUSE TRACING ===",
        f"- Kích hoạt (Enabled): {'ĐÃ BẬT' if enabled else 'TẮT (Chế độ Local Logging)'}",
        f"- Máy chủ (Host): {host}",
        f"- Public Key: {'Hợp lệ' if has_pub else 'Chưa cấu hình'}",
        f"- Secret Key: {'Hợp lệ' if has_sec else 'Chưa cấu hình'}",
        f"- Dashboard URL: {host}/project"
    ]
    return "\n".join(lines)


@mcp.tool()
def driveshare_test_langfuse_trace(prompt: str, reply: str) -> str:
    """
    Gửi một Trace mẫu lên Langfuse Cloud Dashboard để kiểm tra kết nối ngay lập tức.
    """
    payload = {"prompt": prompt, "reply": reply}
    res = _http_post("/chat/langfuse-test-trace", payload)
    if not res.get("success", False):
        return f"Không thể gửi trace lên Langfuse: {res.get('message')}"
    return f"Gửi trace thành công! Trace ID: {res.get('data')}. Bạn có thể kiểm tra ngay trên Langfuse Dashboard."


@mcp.tool()
def driveshare_query_rag_knowledge(question: str) -> str:
    """
    Tra cứu kho tài liệu quy chế, điều khoản thuê xe, thủ tục bàn giao xe (Check-in/Check-out),
    và giải quyết tranh chấp qua phân hệ RAG (Retrieval-Augmented Generation) của DriveShare.
    """
    payload = {"question": question}
    res = _http_post("/rag/ask", payload)
    if not res.get("success", False):
        return f"Lỗi tra cứu RAG: {res.get('message', 'Không phản hồi')}"
    
    data = res.get("data", {})
    answer = data.get("answer", "Không tìm thấy nội dung liên quan.")
    sources = data.get("citations", [])
    src_text = ""
    if sources:
        src_text = "\nNguồn trích dẫn: " + ", ".join([s.get("documentName", "") for s in sources])
    return f"Kết quả từ RAG DriveShare:\n{answer}{src_text}"


# =============================================================================
# MCP RESOURCES
# =============================================================================

@mcp.resource("driveshare://policies/rental-terms")
def get_rental_terms_resource() -> str:
    """Quy chế và điều khoản thuê xe chuẩn của nền tảng DriveShare."""
    return """
    QUY CHẾ THUÊ XE NỀN TẢNG DRIVESHARE:
    1. Đặt cọc giữ xe: Khách hàng thanh toán trước 30% giá trị hợp đồng qua cổng thanh toán tự động VietQR.
    2. Hồ sơ khách thuê: Cần cung cấp CCCD gắn chip và Giấy phép lái xe (GPLX) hạng B1/B2 trở lên đã được Admin duyệt.
    3. Dịch vụ có tài xế: Khi chọn kèm tài xế, khách hàng được miễn thủ tục thế chấp xe máy/15 triệu và miễn xác minh bằng lái GPLX.
    4. Bàn giao xe (Check-in): Ghi nhận ODO số km, mức xăng/pin, và chụp ảnh 4 góc xe. Thanh toán 70% giá trị còn lại.
    5. Trả xe (Check-out): Nghiệm thu tình trạng xe, tính phụ phí (nếu vượt km hoặc thiếu xăng) và hoàn tất đơn thuê.
    """


@mcp.resource("driveshare://platform/health")
def get_platform_health_resource() -> str:
    """Trạng thái tổng thể hệ thống DriveShare."""
    return json.dumps({
        "platform": "DriveShare Car Rental Platform",
        "backend": "Spring Boot 3.3.4 (Port 8080)",
        "ai_assistant": "Google Gemini 2.5 Flash",
        "observability": "Langfuse v2 Ingestion API",
        "rag_engine": "Document RAG Studio with RAM Vector Store",
        "mcp_server": "FastMCP 2.2.0"
    }, indent=2)


if __name__ == "__main__":
    mcp.run()
