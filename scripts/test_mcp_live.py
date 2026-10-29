#!/usr/bin/env python3
"""
Kiểm thử tự động các Tools và Resources của DriveShare MCP Server.
"""

import sys
import os

# Thiet lap UTF-8 output cho console Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Them duong dan thu muc goc vao sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp_server.server import (
    driveshare_search_cars,
    driveshare_get_car_detail,
    driveshare_calculate_deposit,
    driveshare_check_langfuse_status,
    driveshare_test_langfuse_trace,
    driveshare_query_rag_knowledge,
    get_rental_terms_resource,
    get_platform_health_resource,
    mcp
)

def run_mcp_tests():
    print("=" * 70)
    print("🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN DRIVESHARE MCP SERVER")
    print("=" * 70)

    # 1. Kiểm tra khởi tạo MCP Server
    print(f"\n[1] Kiểm tra định danh MCP Server: {mcp.name}")
    assert mcp.name == "driveshare-server", "Tên server MCP không đúng"
    print("   -> Đạt chuẩn định danh FastMCP / MCPServer.")

    # 2. Tool: Tính toán tiền cọc và chi phí thuê xe (driveshare_calculate_deposit)
    print("\n[2] Test Tool: driveshare_calculate_deposit (Xe tự lái 3 ngày)")
    res1 = driveshare_calculate_deposit(
        price_per_day=900000.0,
        start_date="2026-11-01",
        end_date="2026-11-04",
        with_driver=False
    )
    print(res1)
    assert "TIỀN CỌC GIỮ XE (30% qua VietQR tự động): 810,000 đ" in res1
    assert "THANH TOÁN KHI NHẬN XE (70% còn lại): 1,890,000 đ" in res1
    print("   -> ✅ driveshare_calculate_deposit đạt chuẩn nghiệp vụ 30% VietQR.")

    # 3. Tool: Tính toán cọc xe kèm dịch vụ tài xế
    print("\n[3] Test Tool: driveshare_calculate_deposit (Kèm tài xế 2 ngày, phụ phí 500k/ngày)")
    res2 = driveshare_calculate_deposit(
        price_per_day=1000000.0,
        start_date="2026-11-10",
        end_date="2026-11-12",
        with_driver=True,
        driver_fee_per_day=500000.0
    )
    print(res2)
    assert "Phụ phí tài xế: 500,000 đ/ngày x 2 ngày = 1,000,000 đ" in res2
    assert "TỔNG CHI PHÍ DỰ KIẾN: 3,000,000 đ" in res2
    assert "TIỀN CỌC GIỮ XE (30% qua VietQR tự động): 900,000 đ" in res2
    print("   -> ✅ driveshare_calculate_deposit (Chauffeur service) hoạt động chính xác.")

    # 4. Resource: Quy chế thuê xe (driveshare://policies/rental-terms)
    print("\n[4] Test Resource: driveshare://policies/rental-terms")
    terms = get_rental_terms_resource()
    print(terms.strip()[:200] + "...")
    assert "QUY CHẾ THUÊ XE NỀN TẢNG DRIVESHARE" in terms
    assert "30%" in terms
    print("   -> ✅ Resource rental-terms trả về chuẩn xác.")

    # 5. Resource: Sức khỏe nền tảng (driveshare://platform/health)
    print("\n[5] Test Resource: driveshare://platform/health")
    health = get_platform_health_resource()
    print(health)
    assert "DriveShare Car Rental Platform" in health
    assert "Langfuse" in health
    print("   -> ✅ Resource platform/health sẵn sàng cung cấp ngữ cảnh cho LLM.")

    # 6. Tool: Trạng thái Langfuse Tracing
    print("\n[6] Test Tool: driveshare_check_langfuse_status (Khi backend offline)")
    langfuse_status = driveshare_check_langfuse_status()
    print(langfuse_status)
    print("   -> ✅ driveshare_check_langfuse_status xử lý fallback an toàn không gây crash.")

    print("\n" + "=" * 70)
    print("🎉 TOÀN BỘ 6/6 BÀI TEST MCP SERVER ĐÃ VƯỢT QUA 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_mcp_tests()
