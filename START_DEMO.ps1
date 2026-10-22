##############################################################
# START_DEMO.ps1 — DriveShare Quick Start Script
# Dùng sáng ngày demo: chạy script này 1 lần là đủ
# Chạy: PowerShell -ExecutionPolicy Bypass -File .\START_DEMO.ps1
##############################################################

$host.UI.RawUI.WindowTitle = "DriveShare Demo Launcher"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   DRIVESHARE — DEMO LAUNCHER" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# ─────────────────────────────────────
# BƯỚC 1: Kiểm tra & Khởi động Docker
# ─────────────────────────────────────
Write-Host "`n[1/4] Kiểm tra Docker..." -ForegroundColor Yellow

$dockerRunning = docker ps 2>&1 | Select-String -Pattern "CONTAINER ID" -Quiet
if (-not $dockerRunning) {
    Write-Host "  → Docker chưa chạy, đang khởi động Docker Desktop..." -ForegroundColor Yellow
    $dockerExe = "C:\Users\ADMIN\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    if (Test-Path $dockerExe) {
        Start-Process $dockerExe -WindowStyle Normal
        Write-Host "  → Đợi Docker Desktop khởi động (45 giây)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 45
    } else {
        Write-Host "  ⚠ Không tìm thấy Docker Desktop!" -ForegroundColor Red
        Write-Host "  → Chuyển sang Plan B: Dùng H2 in-memory database..." -ForegroundColor Yellow
        goto PlanB
    }
}

$dockerOk = docker ps 2>&1 | Select-String -Pattern "CONTAINER ID" -Quiet
if (-not $dockerOk) {
    Write-Host "  ⚠ Docker vẫn chưa sẵn sàng, chuyển sang Plan B (H2 DB)..." -ForegroundColor Red
    $usePlanB = $true
} else {
    Write-Host "  ✓ Docker đang chạy!" -ForegroundColor Green
    $usePlanB = $false
}

# ─────────────────────────────────────
# BƯỚC 2: Khởi động PostgreSQL container
# ─────────────────────────────────────
if (-not $usePlanB) {
    Write-Host "`n[2/4] Khởi động PostgreSQL Database..." -ForegroundColor Yellow
    Set-Location "d:\MONHOCITC\K4\Spring_ThucTap_k4"
    docker-compose up -d 2>&1 | Out-Null
    Start-Sleep -Seconds 5
    $pgReady = docker exec driveshare-postgres pg_isready -U postgres 2>&1
    if ($pgReady -like "*accepting connections*") {
        Write-Host "  ✓ PostgreSQL sẵn sàng!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ PostgreSQL chưa sẵn sàng, đợi thêm 10 giây..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

# ─────────────────────────────────────
# BƯỚC 3: Khởi động Backend Spring Boot
# ─────────────────────────────────────
Write-Host "`n[3/4] Khởi động Backend (cổng 8080)..." -ForegroundColor Yellow

$backendCmd = if ($usePlanB) {
    Write-Host "  → Plan B: Dùng H2 in-memory DB (không cần Docker)" -ForegroundColor Yellow
    ".\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2"
} else {
    ".\mvnw.cmd spring-boot:run"
}

$backendJob = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", `
        "cd 'd:\MONHOCITC\K4\Spring_ThucTap_k4\backend'; $backendCmd" `
    -WindowStyle Normal -PassThru

Write-Host "  → Backend đang khởi động trong cửa sổ mới (PID: $($backendJob.Id))..." -ForegroundColor Cyan
Write-Host "  → Đợi backend sẵn sàng (30 giây)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Kiểm tra backend
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 200) {
        Write-Host "  ✓ Backend ONLINE - Port 8080 sẵn sàng!" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ Backend đang khởi động... Kiểm tra cửa sổ powershell kia." -ForegroundColor Yellow
}

# ─────────────────────────────────────
# BƯỚC 4: Khởi động Frontend
# ─────────────────────────────────────
Write-Host "`n[4/4] Khởi động Frontend (cổng 3000)..." -ForegroundColor Yellow

Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", `
        "cd 'd:\MONHOCITC\K4\Spring_ThucTap_k4\frontend'; python -m http.server 3000" `
    -WindowStyle Normal

Write-Host "  ✓ Frontend server khởi động tại http://localhost:3000" -ForegroundColor Green

# ─────────────────────────────────────
# KẾT QUẢ
# ─────────────────────────────────────
Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   DEMO LINKS - MỞ TRONG TRÌNH DUYỆT:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Tab 1 (Trang chủ):   http://localhost:3000/index.html" -ForegroundColor White
Write-Host "  Tab 2 (Đăng nhập):   http://localhost:3000/login.html" -ForegroundColor White
Write-Host "  Tab 3 (Chủ xe):      http://localhost:3000/owner-cars.html" -ForegroundColor White
Write-Host "  Tab 4 (Admin):        http://localhost:3000/admin.html" -ForegroundColor White
Write-Host "  Tab 5 (Swagger API):  http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "`n  CREDENTIALS DEMO:" -ForegroundColor Cyan
Write-Host "  Renter: renter@driveshare.com / Renter123@" -ForegroundColor White
Write-Host "  Owner:  owner@driveshare.com  / Owner123@" -ForegroundColor White
Write-Host "  Admin:  admin@driveshare.com  / Admin123@" -ForegroundColor White

if ($usePlanB) {
    Write-Host "`n  [PLAN B MODE] Dùng H2 in-memory DB - Backend restart sẽ mất data!" -ForegroundColor Yellow
    Write-Host "  H2 Console: http://localhost:8080/h2-console (JDBC URL: jdbc:h2:mem:driveshare_db)" -ForegroundColor Yellow
}

Write-Host "`n  Nhấn bất kỳ phím nào để mở trình duyệt..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Mở tabs trình duyệt
Start-Process "http://localhost:3000/index.html"
Start-Sleep -Milliseconds 500
Start-Process "http://localhost:3000/login.html"

Write-Host "`n✅ DriveShare Demo đã sẵn sàng! Chúc demo thành công!" -ForegroundColor Green
