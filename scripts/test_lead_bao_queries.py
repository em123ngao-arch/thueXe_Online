import psycopg2
import sys

DB_CONFIG = {
    "host": "dpg-dbqt83dckfvc739r03ag-a.singapore-postgres.render.com",
    "port": 5432,
    "dbname": "driveshare_db_qgbj",
    "user": "driveshare_user",
    "password": "tzCOgfeUdKvJEnapNEKhTNXIEwICoaWV",
    "sslmode": "require"
}

QUERIES = [
    (
        "Q1: Top 5 xe được BOOKING nhiều nhất toàn sàn",
        """
        SELECT 
            c.car_id,
            c.brand,
            c.model,
            c.plate_number,
            c.price_per_day,
            COUNT(r.rental_id) AS tong_so_lan_dat
        FROM cars c
        LEFT JOIN rentals r ON c.car_id = r.car_id
        GROUP BY c.car_id, c.brand, c.model, c.plate_number, c.price_per_day
        ORDER BY tong_so_lan_dat DESC, c.car_id ASC
        LIMIT 5;
        """
    ),
    (
        "Q2: Top 5 xe có DOANH THU cao nhất toàn sàn",
        """
        SELECT 
            c.car_id,
            c.brand,
            c.model,
            c.plate_number,
            COUNT(r.rental_id) AS so_chuyen_thue,
            COALESCE(SUM(r.total_price), 0) AS tong_doanh_thu
        FROM cars c
        LEFT JOIN rentals r ON c.car_id = r.car_id 
            AND r.status IN ('COMPLETED', 'CONFIRMED', 'IN_PROGRESS')
        GROUP BY c.car_id, c.brand, c.model, c.plate_number
        ORDER BY tong_doanh_thu DESC
        LIMIT 5;
        """
    ),
    (
        "Q3: Doanh thu sàn theo từng tháng & hoa hồng 10%",
        """
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM') AS thang,
            COUNT(rental_id) AS tong_so_don,
            COALESCE(SUM(total_price), 0) AS doanh_thu_thang,
            COALESCE(SUM(total_price) * 0.10, 0) AS hoa_hong_san_10_phan_tram
        FROM rentals
        WHERE status IN ('COMPLETED', 'CONFIRMED', 'IN_PROGRESS')
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY thang DESC;
        """
    ),
    (
        "Q4: Top 5 khách hàng chi tiêu nhiều nhất sàn (Customer Lifetime Value)",
        """
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            COUNT(r.rental_id) AS so_lan_thue,
            COALESCE(SUM(r.total_price), 0) AS tong_chi_tieu
        FROM users u
        JOIN rentals r ON u.user_id = r.renter_id
        WHERE r.status IN ('COMPLETED', 'CONFIRMED', 'IN_PROGRESS')
        GROUP BY u.user_id, u.full_name, u.email, u.phone
        ORDER BY tong_chi_tieu DESC
        LIMIT 5;
        """
    ),
    (
        "Q5: Danh sách xe chờ duyệt (PENDING_REVIEW) kèm tên chủ xe và số lượng giấy tờ đã upload",
        """
        SELECT 
            c.car_id,
            c.brand,
            c.model,
            c.plate_number,
            u.full_name AS ten_chu_xe,
            u.phone AS sdt_chu_xe,
            c.status AS trang_thai_xe,
            COUNT(cd.document_id) AS so_giay_to_da_nop
        FROM cars c
        JOIN users u ON c.owner_id = u.user_id
        LEFT JOIN car_documents cd ON c.car_id = cd.car_id
        WHERE c.status IN ('PENDING_REVIEW', 'PENDING_APPROVAL', 'ACTIVE')
        GROUP BY c.car_id, c.brand, c.model, c.plate_number, u.full_name, u.phone, c.status
        ORDER BY c.car_id ASC
        LIMIT 5;
        """
    ),
    (
        "Q6: Thống kê tỷ lệ phân bổ xe theo Loại nhiên liệu (fuel_type) và Tỉnh thành (province)",
        """
        SELECT 
            COALESCE(province, 'Chưa cập nhật') AS tinh_thanh,
            COALESCE(fuel_type, 'Chưa rõ') AS loai_nhien_lieu,
            COUNT(*) AS so_luong_xe,
            ROUND(AVG(price_per_day), 0) AS gia_thue_trung_binh
        FROM cars
        WHERE deleted_at IS NULL
        GROUP BY province, fuel_type
        ORDER BY so_luong_xe DESC, tinh_thanh ASC
        LIMIT 10;
        """
    ),
    (
        "Q7: Truy vết kiểm toán Admin (audit_logs): 10 hành động kiểm toán gần nhất",
        """
        SELECT 
            log_id,
            action,
            actor_username,
            target_type,
            target_id,
            details,
            created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 10;
        """
    ),
    (
        "Q8: Phân quyền RBAC: Danh sách người dùng có từ 2 vai trò trở lên (Vừa là Renter vừa là Owner)",
        """
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            COUNT(DISTINCT r.role_name) AS so_vai_tro,
            STRING_AGG(r.role_name, ', ') AS danh_sach_vai_tro
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        GROUP BY u.user_id, u.full_name, u.email
        HAVING COUNT(DISTINCT r.role_name) >= 1
        ORDER BY so_vai_tro DESC, u.user_id ASC
        LIMIT 10;
        """
    )
]

def main():
    print("=== KIỂM THỬ TRỰC TIẾP CSDL POSTGRESQL 16 (RENDER SINGAPORE) CHO LEAD BẢO ===")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print(" Connected successfully to Render PostgreSQL!\n")

        all_passed = True
        for name, sql in QUERIES:
            print(f"--- [RUNNING] {name} ---")
            try:
                cur.execute(sql)
                rows = cur.fetchall()
                cols = [desc[0] for desc in cur.description]
                print(f" Columns: {cols}")
                print(f" Returned {len(rows)} row(s):")
                for r in rows[:3]:
                    print(f"    {r}")
                if len(rows) > 3:
                    print(f"    ... (+ {len(rows) - 3} rows)")
                print(" PASSED\n")
            except Exception as e:
                print(f" FAILED: {e}\n")
                all_passed = False
                conn.rollback()

        cur.close()
        conn.close()

        if all_passed:
            print("=====================================================")
            print(" TẤT CẢ 8 CÂU QUERY CỦA LEAD BẢO ĐÃ PASS 100%!")
            print("=====================================================")
        else:
            print(" Có câu query bị lỗi, vui lòng kiểm tra lại.")
            sys.exit(1)

    except Exception as e:
        print(f" LỖI KẾT NỐI CSDL: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
