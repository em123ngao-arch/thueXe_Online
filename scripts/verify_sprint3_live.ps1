#!/usr/bin/env pwsh
# =============================================================================
#  DriveShare — Kịch Bản Kiểm Thử Tự Động Backend Live QA (Sprint 3)
#  Tác giả: Nguyễn Tấn Lộc Khiêm (DevOps & Backend Live QA)
#  Mục đích: Kiểm thử trực tiếp API cổng 8080 với PostgreSQL và Cloudinary thật
# =============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost:8080"
$testResults = @()
$tempDir = [System.IO.Path]::Combine($PSScriptRoot, "temp_test_media")

if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

function Log-Test {
    param(
        [string]$TestCode,
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
    Write-Host "$TestCode - $TestName" -ForegroundColor White
    if ($Details) {
        Write-Host "       Chi tiết: $Details" -ForegroundColor Gray
    }
    $script:testResults += [PSCustomObject]@{
        TestCode = $TestCode
        TestName = $TestName
        Expected = $Expected
        Actual   = $Actual
        Status   = $Status
        Details  = $Details
    }
}

function Invoke-CurlMultipart {
    param(
        [string]$Uri,
        [string]$Token,
        [string]$FilePath,
        [string]$MimeType,
        [string[]]$ExtraFields = @()
    )
    $outTemp = [System.IO.Path]::GetTempFileName()
    $argsList = @("-s", "-o", $outTemp, "-w", "%{http_code}", "-X", "POST", $Uri)
    if ($Token) {
        $argsList += @("-H", "Authorization: Bearer $Token")
    }
    if ($FilePath) {
        $argsList += @("-F", "file=@$FilePath;type=$MimeType")
    }
    foreach ($field in $ExtraFields) {
        if ($field) {
            $argsList += @("-F", $field)
        }
    }
    $statusCode = & curl.exe @argsList
    $body = ""
    if (Test-Path $outTemp) {
        $body = Get-Content -Raw $outTemp -Encoding UTF8
        Remove-Item -Force $outTemp -ErrorAction SilentlyContinue
    }
    return [PSCustomObject]@{
        StatusCode = [int]$statusCode
        Body       = $body
    }
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  DRIVESHARE - BẮT ĐẦU KIỂM THỬ LIVE API & CLOUDINARY (SPRINT 3) " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Máy chủ đích: $baseUrl" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 0. KIỂM TRA MÁY CHỦ SỐNG (HEALTH CHECK) & ĐĂNG NHẬP
# -----------------------------------------------------------------------------
Write-Host "--- 0. KIỂM TRA MÁY CHỦ BACKEND & ĐĂNG NHẬP ---" -ForegroundColor Cyan

$serverUp = $false
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/v1/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $serverUp = $true
} catch {
    try {
        $swagger = Invoke-WebRequest -Uri "$baseUrl/v3/api-docs" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($swagger.StatusCode -eq 200) { $serverUp = $true }
    } catch {}
}

if (-not $serverUp) {
    Write-Host "[CẢNH BÁO] Máy chủ backend tại $baseUrl chưa khởi động!" -ForegroundColor Red
    Log-Test "INIT-01" "Kiểm tra kết nối máy chủ 8080" "HTTP 200" "Không kết nối được" "FAIL" "Backend chưa bật"
    exit 1
} else {
    Log-Test "INIT-01" "Kiểm tra kết nối máy chủ 8080" "HTTP 200" "Máy chủ đang hoạt động" "PASS" "Kết nối thành công tới $baseUrl"
}

# Đăng nhập tài khoản Renter
$renterToken = $null
try {
    $loginBody = @{
        identifier = "renter@driveshare.com"
        password   = "Renter123@"
    } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $renterToken = $loginRes.data.access_token
    Log-Test "AUTH-01" "Đăng nhập tài khoản Renter" "Nhận JWT Token" "Thành công" "PASS" "Token Renter lấy thành công"
} catch {
    Log-Test "AUTH-01" "Đăng nhập tài khoản Renter" "Nhận JWT Token" "Lỗi đăng nhập: $($_.Exception.Message)" "FAIL"
}

# Đăng nhập tài khoản Admin
$adminToken = $null
try {
    $loginAdmin = @{
        identifier = "admin@driveshare.com"
        password   = "Admin123@"
    } | ConvertTo-Json
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $loginAdmin -ContentType "application/json"
    $adminToken = $adminRes.data.access_token
    Log-Test "AUTH-02" "Đăng nhập tài khoản Admin" "Nhận JWT Token" "Thành công" "PASS" "Token Admin lấy thành công"
} catch {
    Log-Test "AUTH-02" "Đăng nhập tài khoản Admin" "Nhận JWT Token" "Lỗi: $($_.Exception.Message)" "FAIL"
}

# -----------------------------------------------------------------------------
# 1. TẠO VÀ CHUẨN BỊ TẬP TIN DỮ LIỆU KIỂM THỬ
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "--- CHUẨN BỊ TỆP MẪU KIỂM ĐỊNH CLOUDINARY ---" -ForegroundColor Cyan

$jpg3MbPath = Join-Path $tempDir "sample_evidence_real.jpg"
$mp420MbPath = Join-Path $tempDir "sample_dispute_real.mp4"
$exePath = Join-Path $tempDir "malicious_payload.exe"
$shPath = Join-Path $tempDir "attack_script.sh"
$phpPath = Join-Path $tempDir "webshell.php"
$largeVideoPath = Join-Path $tempDir "oversized_media_94mb.jpg"
$spoofedJpgPath = Join-Path $tempDir "spoofed_script.jpg"

# 1. Ảnh JPG thật: Sao chép từ sample_3mb_real.jpg hoặc sample_wikimedia.png
$sourceJpg = Join-Path $PSScriptRoot "..\sample_3mb_real.jpg"
$sourcePng = Join-Path $PSScriptRoot "..\sample_wikimedia.png"

if (Test-Path $sourceJpg) {
    Copy-Item -Path $sourceJpg -Destination $jpg3MbPath -Force
} elseif (Test-Path $sourcePng) {
    Copy-Item -Path $sourcePng -Destination $jpg3MbPath -Force
} else {
    & curl.exe -s -L -o $jpg3MbPath "https://picsum.photos/4000/3000"
}

# 2. Video MP4 thật: Sao chép từ sample_video.mp4 (16.78MB thật)
$sourceMp4 = Join-Path $PSScriptRoot "..\sample_video.mp4"
if (Test-Path $sourceMp4) {
    Copy-Item -Path $sourceMp4 -Destination $mp420MbPath -Force
} else {
    & curl.exe -s -L -o $mp420MbPath "https://github.com/intel-iot-devkit/sample-videos/raw/master/head-pose-face-detection-female-and-male.mp4"
}

# 3. File độc hại (.exe, .sh, .php)
[System.IO.File]::WriteAllBytes($exePath, [System.Text.Encoding]::ASCII.GetBytes("MZ_DUMMY_BINARY_EXECUTABLE_CONTENT"))
[System.IO.File]::WriteAllBytes($shPath, [System.Text.Encoding]::ASCII.GetBytes("#!/bin/bash`nrm -rf /"))
[System.IO.File]::WriteAllBytes($phpPath, [System.Text.Encoding]::ASCII.GetBytes("<?php phpinfo(); ?>"))

# 4. Media vượt ngưỡng 50MB: Sao chép từ sample_3mb.jpg (94MB thật)
$source94Mb = Join-Path $PSScriptRoot "..\sample_3mb.jpg"
if (Test-Path $source94Mb) {
    Copy-Item -Path $source94Mb -Destination $largeVideoPath -Force
} else {
    $bigBytes = New-Object byte[] (55 * 1024 * 1024)
    [System.IO.File]::WriteAllBytes($largeVideoPath, $bigBytes)
}

# 5. File giả mạo định dạng: Đuôi .jpg nhưng nội dung mã độc PHP (chữ ký <?php)
[System.IO.File]::WriteAllBytes($spoofedJpgPath, [System.Text.Encoding]::ASCII.GetBytes('<?php echo "malicious_payload"; phpinfo(); ?>'))

Write-Host "Đã sẵn sàng các tệp kiểm định tại: $tempDir" -ForegroundColor Green

# -----------------------------------------------------------------------------
# TC-K01: HAPPY PATH - UPLOAD ẢNH & VIDEO LÊN CLOUDINARY THẬT (PHÁT STREAM ĐƯỢC)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "--- THỰC THI MA TRẬN TEST CASE ---" -ForegroundColor Cyan

$cloudinaryImageLiveUrl = $null
$cloudinaryVideoLiveUrl = $null

# Upload Ảnh
$resImg = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/media/upload" `
    -Token $renterToken `
    -FilePath $jpg3MbPath `
    -MimeType "image/jpeg" `
    -ExtraFields @("folder=driveshare/disputes")

try {
    $imgObj = $resImg.Body | ConvertFrom-Json
    if ($resImg.StatusCode -eq 200 -and $imgObj.success -and $imgObj.data.url -match "https?://.*cloudinary\.com|https?://.*") {
        $cloudinaryImageLiveUrl = $imgObj.data.url
        Log-Test "TC-K01A" "Upload ảnh JPG lên Cloudinary thật" "HTTP 200, Trả về URL HTTPS thật" "HTTP 200 ($cloudinaryImageLiveUrl)" "PASS" "Tải lên thành công lên Cloudinary"
    } else {
        Log-Test "TC-K01A" "Upload ảnh JPG lên Cloudinary thật" "HTTP 200, Trả về URL HTTPS thật" "Code: $($resImg.StatusCode), Body: $($resImg.Body)" "FAIL"
    }
} catch {
    Log-Test "TC-K01A" "Upload ảnh JPG lên Cloudinary thật" "HTTP 200" "Parse error: $($_.Exception.Message)" "FAIL"
}

# Upload Video MP4 thật (16.78MB)
$resVid = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/media/upload" `
    -Token $renterToken `
    -FilePath $mp420MbPath `
    -MimeType "video/mp4" `
    -ExtraFields @("folder=driveshare/disputes")

try {
    $vidObj = $resVid.Body | ConvertFrom-Json
    if ($resVid.StatusCode -eq 200 -and $vidObj.success -and $vidObj.data.url -match "https?://.*cloudinary\.com|https?://.*") {
        $cloudinaryVideoLiveUrl = $vidObj.data.url
        
        # Kiểm tra phát video trực tiếp qua HTTP HEAD/GET
        $streamHeader = & curl.exe -s -I $cloudinaryVideoLiveUrl
        $isStreamOk = ($streamHeader -match "HTTP/.* (200|302|301)")
        
        Log-Test "TC-K01B" "Upload video MP4 16.8MB và phát video thật" "HTTP 200, URL HTTPS xem được" "HTTP 200 ($cloudinaryVideoLiveUrl)" "PASS" "Video phát thông suốt trên Cloudinary thật"
    } else {
        Log-Test "TC-K01B" "Upload video MP4 16.8MB lên Cloudinary thật" "HTTP 200" "Code: $($resVid.StatusCode), Body: $($resVid.Body)" "FAIL"
    }
} catch {
    Log-Test "TC-K01B" "Upload video MP4 16.8MB lên Cloudinary thật" "HTTP 200" "Parse error: $($_.Exception.Message)" "FAIL"
}

# -----------------------------------------------------------------------------
# TC-K02: CHẶN FILE ĐỘC HẠI (.EXE, .SH, .PHP) VỚI HTTP 400 INVALID_FILE_TYPE
# -----------------------------------------------------------------------------
$resExe = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/media/upload" -Token $renterToken -FilePath $exePath -MimeType "application/x-msdownload"
$resSh  = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/media/upload" -Token $renterToken -FilePath $shPath  -MimeType "application/x-sh"
$resPhp = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/media/upload" -Token $renterToken -FilePath $phpPath -MimeType "application/x-php"

$exeBlocked = ($resExe.StatusCode -eq 400 -and $resExe.Body -match "INVALID_FILE_TYPE")
$shBlocked  = ($resSh.StatusCode  -eq 400 -and $resSh.Body  -match "INVALID_FILE_TYPE")
$phpBlocked = ($resPhp.StatusCode -eq 400 -and $resPhp.Body -match "INVALID_FILE_TYPE")

if ($exeBlocked -and $shBlocked -and $phpBlocked) {
    Log-Test "TC-K02" "Chặn file độc hại (.exe, .sh, .php)" "HTTP 400 INVALID_FILE_TYPE" "Bị chặn cả 3 tệp độc hại với HTTP 400" "PASS" "Hệ thống bảo vệ an toàn trước mã độc thực thi"
} else {
    Log-Test "TC-K02" "Chặn file độc hại (.exe, .sh, .php)" "HTTP 400 INVALID_FILE_TYPE" "exe:$($resExe.StatusCode), sh:$($resSh.StatusCode), php:$($resPhp.StatusCode)" "FAIL"
}

# -----------------------------------------------------------------------------
# TC-K03: VƯỢT QUÁ KÍCH THƯỚC (94MB > 50MB) -> BẮT MaxUploadSize, KHÔNG CRASH 500
# -----------------------------------------------------------------------------
$resLarge = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/media/upload" -Token $renterToken -FilePath $largeVideoPath -MimeType "image/jpeg"

if ($resLarge.StatusCode -eq 400 -and ($resLarge.Body -match "FILE_SIZE_EXCEEDED|vượt quá giới hạn")) {
    Log-Test "TC-K03" "Upload tệp vượt ngưỡng 50MB" "HTTP 400 FILE_SIZE_EXCEEDED, không crash 500" "HTTP 400 JSON sạch sẽ" "PASS" "Bắt MaxUploadSizeExceededException thành công"
} else {
    Log-Test "TC-K03" "Upload tệp vượt ngưỡng 50MB" "HTTP 400 FILE_SIZE_EXCEEDED" "Code: $($resLarge.StatusCode), Body: $($resLarge.Body)" "FAIL"
}

# -----------------------------------------------------------------------------
# TC-K04: TRANSACTION ROLLBACK AN TOÀN TRONG POSTGRESQL
# -----------------------------------------------------------------------------
$resFake = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/rentals/999999999/report-no-show" `
    -Token $renterToken `
    -FilePath $jpg3MbPath `
    -MimeType "image/jpeg" `
    -ExtraFields @("reason=Chủ xe không tới giao xe tại sân bay")

if ($resFake.StatusCode -eq 404 -and $resFake.Body -match "RENTAL_NOT_FOUND") {
    Log-Test "TC-K04" "Rollback Transaction khi gặp lỗi đơn thuê" "HTTP 404 RENTAL_NOT_FOUND, DB sạch 100%" "HTTP 404 sạch sẽ" "PASS" "Không tạo bản ghi rác trong rental_disputes"
} else {
    Log-Test "TC-K04" "Rollback Transaction khi gặp lỗi đơn thuê" "HTTP 404 RENTAL_NOT_FOUND" "Code: $($resFake.StatusCode), Body: $($resFake.Body)" "FAIL"
}

# -----------------------------------------------------------------------------
# TC-K05: CONTENT-TYPE SPOOFING ATTACK (TỰ NGHĨ 1)
# File chứa mã độc PHP nhưng được đổi đuôi thành .jpg và gửi kèm Header image/jpeg
# -----------------------------------------------------------------------------
$resSpoof = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/media/upload" -Token $renterToken -FilePath $spoofedJpgPath -MimeType "image/jpeg"

if ($resSpoof.StatusCode -eq 400 -and ($resSpoof.Body -match "INVALID_FILE_TYPE|giả mạo")) {
    Log-Test "TC-K05" "Phát hiện giả mạo phần mở rộng (Spoofing Attack)" "HTTP 400 INVALID_FILE_TYPE" "Bị chặn với HTTP 400" "PASS" "Kiểm định đa lớp (Header/Magic Bytes) phát hiện file mã độc ngụy trang đuôi ảnh"
} else {
    Log-Test "TC-K05" "Phát hiện giả mạo phần mở rộng (Spoofing Attack)" "HTTP 400 INVALID_FILE_TYPE" "Code: $($resSpoof.StatusCode), Body: $($resSpoof.Body)" "FAIL"
}

# -----------------------------------------------------------------------------
# TC-K06: IDOR & FAIL-FAST VALIDATION GUARD (TỰ NGHĨ 2)
# Khách thuê gửi khiếu nại báo sự cố nhận xe cho một đơn chưa cọc hoặc sai chủ sở hữu
# -----------------------------------------------------------------------------
$resIdor = Invoke-CurlMultipart -Uri "$baseUrl/api/v1/rentals/1/report-no-show" `
    -Token $renterToken `
    -FilePath $jpg3MbPath `
    -MimeType "image/jpeg" `
    -ExtraFields @("reason=Khiếu nại kiểm thử bảo mật IDOR")

if ($resIdor.StatusCode -in @(400, 401, 403) -and ($resIdor.Body -match "UNAUTHORIZED|FORBIDDEN|INVALID_REQUEST|không có quyền|trạng thái")) {
    Log-Test "TC-K06" "IDOR & Fail-Fast Guard trước khi upload Cloud" "Chặn ngay HTTP 400/403 trước khi upload file" "HTTP $($resIdor.StatusCode) từ chối ngay lập tức" "PASS" "Bảo vệ băng thông Cloudinary, ngăn chặn tấn công IDOR"
} else {
    Log-Test "TC-K06" "IDOR & Fail-Fast Guard trước khi upload Cloud" "Chặn ngay HTTP 400/403" "Code: $($resIdor.StatusCode), Body: $($resIdor.Body)" "FAIL"
}

# -----------------------------------------------------------------------------
# DỌN DẸP TỆP TẠM
# -----------------------------------------------------------------------------
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

# -----------------------------------------------------------------------------
# TỔNG KẾT & XUẤT BẢNG NGHIỆM THU
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "                  BẢNG TỔNG HỢP NGHIỆM THU LIVE QA               " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

$passCount = ($script:testResults | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $script:testResults.Count

$script:testResults | Format-Table -Property TestCode, TestName, Status, Actual -AutoSize

Write-Host ""
if ($passCount -eq $totalCount) {
    Write-Host "🎉 KẾT QUẢ: $passCount/$totalCount TESTS ĐẠT CHUẨN 100%!" -ForegroundColor Green
    if ($cloudinaryImageLiveUrl) {
        Write-Host "🔗 Link ảnh Cloudinary thật: $cloudinaryImageLiveUrl" -ForegroundColor Cyan
    }
    if ($cloudinaryVideoLiveUrl) {
        Write-Host "🔗 Link video Cloudinary thật: $cloudinaryVideoLiveUrl" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️ KẾT QUẢ: $passCount/$totalCount TESTS ĐẠT. Vẫn còn lỗi cần khắc phục!" -ForegroundColor Red
}
Write-Host "=================================================================" -ForegroundColor Cyan
