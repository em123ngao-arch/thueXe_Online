#!/usr/bin/env pwsh
# ============================================================
# DriveShare — Script khởi chạy Backend với Cloudinary
# ============================================================
# Cách dùng:
#   1. Copy file .env.example thành .env: cp .env.example .env
#   2. Điền 3 giá trị Cloudinary vào .env
#   3. Chạy script này: .\run-backend.ps1
# ============================================================

param(
    [string]$EnvFile = ".env"
)

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  DriveShare Backend — Khởi chạy với Cloudinary CDN" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Đọc file .env nếu tồn tại
if (Test-Path $EnvFile) {
    Write-Host "✅ Đọc biến môi trường từ $EnvFile" -ForegroundColor Green
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        # Bỏ qua comment và dòng trống
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                if ($key -like "*SECRET*" -or $key -like "*PASSWORD*") {
                    Write-Host "   SET $key=***" -ForegroundColor Gray
                } else {
                    Write-Host "   SET $key=$value" -ForegroundColor Gray
                }
            }
        }
    }
} else {
    Write-Host "⚠️  Không tìm thấy file .env" -ForegroundColor Yellow
    Write-Host "   Tạo file .env từ .env.example:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor White
    Write-Host ""
    Write-Host "   Hoặc set biến môi trường thủ công:" -ForegroundColor Yellow
    Write-Host "   `$env:CLOUDINARY_CLOUD_NAME='your_cloud_name'" -ForegroundColor White
    Write-Host "   `$env:CLOUDINARY_API_KEY='your_api_key'" -ForegroundColor White
    Write-Host "   `$env:CLOUDINARY_API_SECRET='your_api_secret'" -ForegroundColor White
    Write-Host ""
    Write-Host "   Chạy ở chế độ Local Storage (không có Cloudinary)..." -ForegroundColor Yellow
}

# Kiểm tra Cloudinary có được cấu hình không
$cloudName = $env:CLOUDINARY_CLOUD_NAME
$apiKey = $env:CLOUDINARY_API_KEY

Write-Host ""
if ($apiKey -and $apiKey -ne "your_api_key_here") {
    Write-Host "🌩️  Cloudinary: KÍCH HOẠT (cloud=$cloudName)" -ForegroundColor Green
} else {
    Write-Host "💾  Cloudinary: TẮT — Dùng Local Storage (ảnh lưu vào uploads/)" -ForegroundColor Yellow
}
Write-Host ""

# Kiểm tra Docker (PostgreSQL) đang chạy không
Write-Host "🐘 Kiểm tra PostgreSQL (Docker)..." -ForegroundColor Cyan
try {
    $pgCheck = docker ps --filter "name=driveshare-postgres" --filter "status=running" -q 2>$null
    if ($pgCheck) {
        Write-Host "   PostgreSQL: ĐANG CHẠY ✅" -ForegroundColor Green
    } else {
        Write-Host "   PostgreSQL: CHƯA CHẠY — Khởi động Docker containers..." -ForegroundColor Yellow
        docker-compose up -d 2>$null
        Start-Sleep -Seconds 3
    }
} catch {
    Write-Host "   Docker: Không kiểm tra được — Tiếp tục..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Khởi chạy Spring Boot Backend (cổng 8080)..." -ForegroundColor Cyan
Write-Host "   Nhấn Ctrl+C để dừng" -ForegroundColor Gray
Write-Host ""

# Chạy backend
Set-Location backend
.\mvnw.cmd spring-boot:run
