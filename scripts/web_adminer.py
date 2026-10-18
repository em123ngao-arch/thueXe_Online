import sys
import json
import psycopg2
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

PORT = 8088
DB_PARAMS = {
    'host': 'localhost',
    'port': 5432,
    'dbname': 'driveshare_db',
    'user': 'postgres',
    'password': 'postgrespassword'
}

def get_connection():
    try:
        return psycopg2.connect(**DB_PARAMS)
    except Exception as e:
        return None

class AdminerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        conn = get_connection()
        if not conn:
            self.send_response(500)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b"<h1>Khong the ket noi PostgreSQL localhost:5432 (driveshare_db)</h1>")
            return

        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
        tables = [r[0] for r in cur.fetchall()]

        selected_table = query.get('table', [tables[0] if tables else None])[0]

        table_data = []
        columns = []
        if selected_table and selected_table in tables:
            try:
                cur.execute(f"SELECT * FROM {selected_table} LIMIT 100;")
                columns = [desc[0] for desc in cur.description]
                table_data = cur.fetchall()
            except Exception as e:
                pass

        conn.close()

        html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>DriveShare Web DB Adminer — PostgreSQL 16 (Port 8088)</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: #f1f5f9; display: flex; height: 100vh; }}
        .sidebar {{ width: 260px; background: #0f172a; color: #f8fafc; padding: 20px; box-sizing: border-box; overflow-y: auto; }}
        .sidebar h2 {{ font-size: 1.1rem; color: #38bdf8; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 10px; }}
        .sidebar-info {{ font-size: 0.78rem; color: #94a3b8; margin-bottom: 15px; line-height: 1.5; }}
        .table-list {{ list-style: none; padding: 0; margin: 0; }}
        .table-list li {{ margin-bottom: 6px; }}
        .table-list a {{ color: #cbd5e1; text-decoration: none; font-size: 0.85rem; padding: 6px 10px; display: block; border-radius: 6px; }}
        .table-list a:hover, .table-list a.active {{ background: #0284c7; color: #fff; font-weight: bold; }}
        .main-content {{ flex: 1; padding: 24px; overflow-y: auto; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }}
        .header h1 {{ font-size: 1.4rem; color: #0f172a; margin: 0; }}
        .badge {{ background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: bold; }}
        .data-table {{ width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 0.82rem; }}
        .data-table th {{ background: #f8fafc; color: #475569; text-align: left; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }}
        .data-table td {{ padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
        .data-table tr:hover td {{ background: #f8fafc; }}
        .empty-state {{ text-align: center; padding: 40px; color: #64748b; }}
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>DriveShare Web DB</h2>
        <div class="sidebar-info">
            <strong>Host:</strong> localhost:5432<br>
            <strong>Database:</strong> driveshare_db<br>
            <strong>User:</strong> postgres<br>
            <strong>Engine:</strong> PostgreSQL 16
        </div>
        <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px;">Danh sách bảng ({len(tables)}):</div>
        <ul class="table-list">
            {"".join(f'<li><a href="?table={t}" class="{"active" if t == selected_table else ""}">{t}</a></li>' for t in tables)}
        </ul>
    </div>
    <div class="main-content">
        <div class="header">
            <div>
                <h1>Bảng: <code>{selected_table or "Không có"}</code></h1>
                <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">Xem trước tối đa 100 bản ghi dữ liệu thực tế</div>
            </div>
            <div>
                <span class="badge">Đã kết nối PostgreSQL 5432</span>
            </div>
        </div>
        {"".join([
            f'<table class="data-table"><thead><tr>{"".join(f"<th>{col}</th>" for col in columns)}</tr></thead><tbody>',
            "".join(f'<tr>{"".join(f"<td title=\'{str(val)}\'>{str(val) if val is not None else '<i style=color:#94a3b8>null</i>'}</td>" for val in row)}</tr>' for row in table_data) if table_data else '<tr><td colspan="100" class="empty-state">Bảng này hiện chưa có dữ liệu.</td></tr>',
            '</tbody></table>'
        ]) if columns else '<div class="empty-state">Chưa chọn bảng hoặc cơ sở dữ liệu rỗng. Khởi chạy Backend để nạp dữ liệu.</div>'}
    </div>
</body>
</html>"""

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), AdminerHandler)
    print(f"DriveShare Web DB Adminer running on http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
