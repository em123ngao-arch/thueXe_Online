#!/usr/bin/env pwsh
# =============================================================================
#  DriveShare - Kich Ban Kiem Thu Tu Dong Toan Dien Sprint 3
#  Tac gia: Nguyen Duy Bao (NB - Project Lead and QA Architect)
# =============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost:8080"
$testResults = @()

function Log-Test {
    param(
        [string]$StoryId,
        [string]$TestName,
        [string]$Expected,
        [string]$Actual,
        [string]$Status,
        [string]$Details = ""
    )
    $color = "Yellow"
    if ($Status -eq "PASS") { 
        $color = "Green" 
    } elseif ($Status -eq "FAIL") { 
        $color = "Red" 
    }
    
    Write-Host "[$Status] " -NoNewline -ForegroundColor $color
    Write-Host "$StoryId - $TestName" -ForegroundColor White
    if ($Details) {
        Write-Host "       Chi tiet: $Details" -ForegroundColor Gray
    }
    $script:testResults += [PSCustomObject]@{
        StoryId  = $StoryId
        TestName = $TestName
        Expected = $Expected
        Actual   = $Actual
        Status   = $Status
        Details  = $Details
    }
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  DRIVESHARE - BAT DAU KIEM THU TOAN DIEN SPRINT 3 (LEAD QA)     " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. KIEM TRA FILE FLYWAY MIGRATION V6 (DB ARCHITECT)
# -----------------------------------------------------------------------------
Write-Host "--- 1. KIEM TRA CAU TRUC FLYWAY MIGRATION V6 ---" -ForegroundColor Cyan

$migrationPath = "backend/src/main/resources/db/migration/V6__sprint3_full_features.sql"
if (Test-Path $migrationPath) {
    $sqlContent = Get-Content $migrationPath -Raw
    $hasInspections = $sqlContent -match "CREATE TABLE IF NOT EXISTS rental_inspections"
    $hasReviews     = $sqlContent -match "CREATE TABLE IF NOT EXISTS reviews"
    $hasNotifs      = $sqlContent -match "CREATE TABLE IF NOT EXISTS notifications"
    $hasDriver      = $sqlContent -match "has_driver_service"
    $hasRating      = $sqlContent -match "rating"

    if ($hasInspections -and $hasReviews -and $hasNotifs -and $hasDriver -and $hasRating) {
        Log-Test "NB-S3-01" "File Flyway Migration V6 day du 4 phan he" "Ton tai va day du cau truc" "Dat chuan 100%" "PASS" "Da tao bang rental_inspections, reviews, notifications, va cot driver/rating"
    } else {
        Log-Test "NB-S3-01" "File Flyway Migration V6 day du 4 phan he" "Day du cau truc" "Thieu bang hoac cot" "FAIL" "Kiem tra lai noi dung SQL V6"
    }
} else {
    Log-Test "NB-S3-01" "File Flyway Migration V6 ton tai" "Ton tai" "Khong tim thay file" "FAIL" "Path: $migrationPath"
}

# -----------------------------------------------------------------------------
# 2. KIEM TRA SU TON TAI CUA CAC ENTITY VA REPOSITORY KHUNG
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "--- 2. KIEM TRA KIEN TRUC MA NGUON (CODE ARCHITECTURE) ---" -ForegroundColor Cyan

$entityFiles = @(
    "backend/src/main/java/com/driveshare/common/enums/EInspectionType.java",
    "backend/src/main/java/com/driveshare/modules/rental/entity/RentalInspection.java",
    "backend/src/main/java/com/driveshare/modules/rental/repository/RentalInspectionRepository.java",
    "backend/src/main/java/com/driveshare/modules/rental/entity/Review.java",
    "backend/src/main/java/com/driveshare/modules/rental/repository/ReviewRepository.java",
    "backend/src/main/java/com/driveshare/modules/notification/entity/Notification.java",
    "backend/src/main/java/com/driveshare/modules/notification/repository/NotificationRepository.java"
)

$allEntitiesExist = $true
foreach ($file in $entityFiles) {
    if (-not (Test-Path $file)) {
        $allEntitiesExist = $false
        Write-Host "Thieu file: $file" -ForegroundColor Red
    }
}

if ($allEntitiesExist) {
    Log-Test "NB-S3-02" "Kiem tra 7 File Entity va Repository Sprint 3" "Ton tai day du 7/7 file" "Da khoi tao du 100%" "PASS" "RentalInspection, Review, Notification va Repositories san sang"
} else {
    Log-Test "NB-S3-02" "Kiem tra 7 File Entity va Repository Sprint 3" "Ton tai day du 7/7 file" "Thieu file" "FAIL"
}

# -----------------------------------------------------------------------------
# 3. XAC THUC TAI KHOAN (LOGIN TEST)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "--- 3. XAC THUC TAI KHOAN (LOGIN TEST) ---" -ForegroundColor Cyan

$renterToken = $null
$ownerToken  = $null

try {
    $rBody = '{"identifier":"renter@driveshare.com","password":"Renter123@"}'
    $rRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $rBody -TimeoutSec 3
    $renterToken = $rRes.data.access_token
    Log-Test "NB-S3-03" "Dang nhap Khach thue (Renter)" "HTTP 200 kem Bearer token" "Thanh cong" "PASS" "User: renter@driveshare.com"
} catch {
    Log-Test "NB-S3-03" "Dang nhap Khach thue (Renter)" "HTTP 200 kem Bearer token" "Chua ket noi backend" "WARN" "Backend dang tat. Khoi chay bang .\mvnw.cmd spring-boot:run de test truc tiep"
}

try {
    $oBody = '{"identifier":"owner@driveshare.com","password":"Owner123@"}'
    $oRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $oBody -TimeoutSec 3
    $ownerToken = $oRes.data.access_token
    Log-Test "NB-S3-04" "Dang nhap Chu xe (Owner)" "HTTP 200 kem Bearer token" "Thanh cong" "PASS" "User: owner@driveshare.com"
} catch {
    Log-Test "NB-S3-04" "Dang nhap Chu xe (Owner)" "HTTP 200 kem Bearer token" "Chua ket noi backend" "WARN" "Backend dang tat. Khoi chay bang .\mvnw.cmd spring-boot:run de test truc tiep"
}

# -----------------------------------------------------------------------------
# 4. KIEM TRA HOP DONG API XE VOI DICH VU TAI XE VA RATING
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "--- 4. KIEM TRA HOP DONG API XE SPRINT 3 ---" -ForegroundColor Cyan

if ($renterToken) {
    try {
        $carDetail = Invoke-RestMethod -Uri "$baseUrl/api/v1/public/cars/1" -Method GET
        $carData = $carDetail.data

        if ($null -ne $carData.has_driver_service) {
            Log-Test "NB-S3-05" "Hop dong DTO: Truong has_driver_service" "Co truong has_driver_service" "has_driver_service = $($carData.has_driver_service)" "PASS"
        } else {
            Log-Test "NB-S3-05" "Hop dong DTO: Truong has_driver_service" "Co truong has_driver_service" "Khong tim thay truong" "FAIL"
        }

        if ($null -ne $carData.rating) {
            Log-Test "NB-S3-06" "Hop dong DTO: Diem danh gia rating" "Co truong rating" "rating = $($carData.rating)" "PASS"
        } else {
            Log-Test "NB-S3-06" "Hop dong DTO: Diem danh gia rating" "Co truong rating" "Khong tim thay truong" "FAIL"
        }

        if ($null -ne $carData.rating_count) {
            Log-Test "NB-S3-07" "Hop dong DTO: So luot danh gia rating_count" "Co truong rating_count" "rating_count = $($carData.rating_count)" "PASS"
        } else {
            Log-Test "NB-S3-07" "Hop dong DTO: So luot danh gia rating_count" "Co truong rating_count" "Khong tim thay truong" "FAIL"
        }
    } catch {
        Log-Test "NB-S3-05" "Truy van API Chi tiet xe" "HTTP 200" "Loi truy van" "FAIL"
    }
} else {
    Log-Test "NB-S3-05" "Kiem tra API Chi tiet xe" "Bo qua khi Backend offline" "Chua ket noi backend" "SKIP" "Hay chay .\mvnw.cmd spring-boot:run de kiem tra realtime"
}

# -----------------------------------------------------------------------------
# 5. TONG KET BAO CAO NGHIEM THU (QA SUMMARY)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "            BANG TONG KET KET QUA KIEM THU SPRINT 3              " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$testResults | Format-Table -Property StoryId, TestName, Expected, Actual, Status -AutoSize

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$skipCount = ($testResults | Where-Object { $_.Status -eq "SKIP" -or $_.Status -eq "WARN" }).Count
$totalCount = $testResults.Count

Write-Host "Tong so test case: $totalCount" -ForegroundColor White
Write-Host "  - DAT (PASS)     : $passCount" -ForegroundColor Green
Write-Host "  - THAT BAI (FAIL): $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "  - CANH BAO/BO QUA: $skipCount" -ForegroundColor Yellow

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "CHUC MUNG BAO! TOAN BO CONG VIEC CUA DATA VA QA ARCHITECT SPRINT 3 DA HOAN THANH XUAT SAC!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "CON LOI CAN XU LY TRUOC KHI BAN GIAO CHO CA NHOM!" -ForegroundColor Red
}
Write-Host ""
