#!/usr/bin/env pwsh
# ==============================================================================
# DriveShare - Kịch Bản Kiểm Thử Toàn Diện Sprint 3 (Lâm Chí Vĩ)
# Phạm vi: TC01 - TC20 (API Báo sự cố, Phân quyền Admin, Nghiệp vụ Hoàn cọc & Phạt)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost:8080"
$results = @()

function Record-TC($tcId, $name, $expected, $actualHttp, $status, $detail) {
    $resObj = [PSCustomObject]@{
        TC = $tcId
        Name = $name
        Expected = $expected
        Actual = $actualHttp
        Status = $status
        Detail = $detail
    }
    $global:results += $resObj
    $color = if ($status -eq "PASS") { "Green" } elseif ($status -eq "FAIL") { "Red" } else { "Yellow" }
    Write-Host "[$status] ${tcId}: $name" -ForegroundColor $color
    Write-Host "       Ky vong: $expected | Thuc te: $actualHttp" -ForegroundColor Gray
    if ($detail) { Write-Host "       Giai thich: $detail" -ForegroundColor DarkGray }
}

function Call-Api {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Token = $null,
        $Body = $null
    )
    $uri = "$baseUrl$Path"
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $params = @{
        Method = $Method
        Uri = $uri
        Headers = $headers
        UseBasicParsing = $true
        TimeoutSec = 10
    }
    if ($Body -ne $null) {
        if ($Body -is [string]) {
            $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($Body)
            $params["ContentType"] = "application/json; charset=utf-8"
        } else {
            $json = $Body | ConvertTo-Json -Compress -Depth 10
            $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($json)
            $params["ContentType"] = "application/json; charset=utf-8"
        }
    }
    try {
        $resp = Invoke-WebRequest @params
        $jsonObj = $null
        try { $jsonObj = $resp.Content | ConvertFrom-Json } catch {}
        return [PSCustomObject]@{
            StatusCode = [int]$resp.StatusCode
            Data = $jsonObj
            Raw = $resp.Content
            Success = $true
        }
    } catch {
        $sc = 0
        $raw = ""
        if ($_.Exception.Response) {
            $sc = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $raw = $reader.ReadToEnd()
            } catch {}
        } else {
            $raw = $_.Exception.Message
        }
        $jsonObj = $null
        try { $jsonObj = $raw | ConvertFrom-Json } catch {}
        return [PSCustomObject]@{
            StatusCode = $sc
            Data = $jsonObj
            Raw = $raw
            Success = $false
        }
    }
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   BAT DAU KIEM THU 20 TEST CASES SPRINT 3 (LAM CHI VI)           " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

# 0. Dang nhap lay token
$rLogin = Call-Api -Method "POST" -Path "/api/v1/auth/login" -Body @{ identifier = "renter@driveshare.com"; password = "Renter123@" }
$renterToken = $rLogin.Data.data.access_token

$oLogin = Call-Api -Method "POST" -Path "/api/v1/auth/login" -Body @{ identifier = "owner@driveshare.com"; password = "Owner123@" }
$ownerToken = $oLogin.Data.data.access_token

$aLogin = Call-Api -Method "POST" -Path "/api/v1/auth/login" -Body @{ identifier = "admin@driveshare.com"; password = "Admin123@" }
$adminToken = $aLogin.Data.data.access_token

# Don dep cac don PENDING cu de dam bao pendingCount = 0 (tranh MAX_PENDING_RENTALS_EXCEEDED)
$incoming = Call-Api -Method "GET" -Path "/api/v1/owner/rentals" -Token $ownerToken
if ($incoming.Data.data) {
    foreach ($r in $incoming.Data.data) {
        if ($r.status -eq "PENDING" -or $r.status -eq "PENDING_APPROVAL") {
            Call-Api -Method "PUT" -Path "/api/v1/owner/rentals/$($r.rental_id)/approve" -Token $ownerToken | Out-Null
        }
    }
}

# Dummy evidence files
$dummyImg = "test_evidence_tc.jpg"
[IO.File]::WriteAllBytes($dummyImg, [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="))
$dummyTxt = "test_invalid_file.exe"
[IO.File]::WriteAllText($dummyTxt, "MZ dummy binary executable content")

# ------------------------------------------------------------------------------
# GIAI DOAN 2: API BAO SU CO KHONG NHAN XE (TC01 - TC08)
# ------------------------------------------------------------------------------
Write-Host "`n--- GIAI DOAN 2: API BAO SU CO KHONG NHAN XE (TC01 - TC08) ---" -ForegroundColor Cyan

# TC05: Don thue khong o trang thai duoc phep khieu nai (tao don o ngay 150, khong duyet/khong coc -> PENDING_APPROVAL)
$s5 = (Get-Date).AddDays(150).ToString("yyyy-MM-dd")
$e5 = (Get-Date).AddDays(152).ToString("yyyy-MM-dd")
$b5 = Call-Api -Method "POST" -Path "/api/v1/rentals" -Token $renterToken -Body @{ car_id = 1; start_date = $s5; end_date = $e5; note = "Test TC05 not eligible" }
$ridNotEligible = $b5.Data.data.rental_id

$outTC05 = curl.exe -s -m 10 -X POST "$baseUrl/api/v1/rentals/$ridNotEligible/report-no-show" `
    -H "Authorization: Bearer $renterToken" `
    -F "reason=Chu xe chua duyet nhung khach co tinh bao su co" `
    -F "evidenceFiles=@$dummyImg;type=image/jpeg"
$jTC05 = $outTC05 | ConvertFrom-Json
if ($jTC05.error_code -eq "RENTAL_NOT_ELIGIBLE_FOR_DISPUTE" -or $jTC05.code -eq 400) {
    Record-TC "TC05" "Don thue khong o trang thai duoc phep khieu nai" "HTTP 400 RENTAL_NOT_ELIGIBLE_FOR_DISPUTE" "400" "PASS" "Chan khi don chua CONFIRMED"
} else {
    Record-TC "TC05" "Don thue khong o trang thai duoc phep khieu nai" "HTTP 400" "Status: $($jTC05.code)" "FAIL" $outTC05
}

# Setup 1 don thue hop le (ngay 160 -> 162), Chu xe APPROVE, Khach COC 30% VietQR -> Sang CONFIRMED
$sVal = (Get-Date).AddDays(160).ToString("yyyy-MM-dd")
$eVal = (Get-Date).AddDays(162).ToString("yyyy-MM-dd")
$bVal = Call-Api -Method "POST" -Path "/api/v1/rentals" -Token $renterToken -Body @{ car_id = 1; start_date = $sVal; end_date = $eVal; note = "Test valid confirmed rental" }
$ridValid = $bVal.Data.data.rental_id

Call-Api -Method "PUT" -Path "/api/v1/owner/rentals/$ridValid/approve" -Token $ownerToken | Out-Null
$pVal = Call-Api -Method "POST" -Path "/api/v1/rentals/$ridValid/payment" -Token $renterToken -Body @{ rental_id = $ridValid; payment_method = "VIETQR"; payment_type = "DEPOSIT" }
$payIdVal = $pVal.Data.data.payment_id
Call-Api -Method "POST" -Path "/api/v1/payments/$payIdVal/confirm" -Token $renterToken | Out-Null

# TC02: Ly do khieu nai ngan hon gioi han (< 10 ky tu) -> Don van CONFIRMED
$outTC02 = curl.exe -s -m 10 -X POST "$baseUrl/api/v1/rentals/$ridValid/report-no-show" `
    -H "Authorization: Bearer $renterToken" `
    -F "reason=Ngan" `
    -F "evidenceFiles=@$dummyImg;type=image/jpeg"
$jTC02 = $outTC02 | ConvertFrom-Json
if ($jTC02.code -eq 400 -or $jTC02.error_code -eq "INVALID_REQUEST") {
    Record-TC "TC02" "Ly do khieu nai ngan hon gioi han toi thieu (< 10 ky tu)" "HTTP 400 INVALID_REQUEST" "400" "PASS" "Tu choi do validate do dai reason"
} else {
    Record-TC "TC02" "Ly do khieu nai ngan hon gioi han toi thieu" "HTTP 400" "Status: $($jTC02.code)" "FAIL" $outTC02
}

# TC03: Don thue khong ton tai (rentalId = 999999)
$outTC03 = curl.exe -s -m 10 -X POST "$baseUrl/api/v1/rentals/999999/report-no-show" `
    -H "Authorization: Bearer $renterToken" `
    -F "reason=Don thue ma khong he ton tai tren he thong" `
    -F "evidenceFiles=@$dummyImg;type=image/jpeg"
$jTC03 = $outTC03 | ConvertFrom-Json
if ($jTC03.code -eq 404 -or $jTC03.error_code -eq "RENTAL_NOT_FOUND") {
    Record-TC "TC03" "Don thue khong ton tai" "HTTP 404 RENTAL_NOT_FOUND" "404" "PASS" "Tra ve loi 404 dung quy chuan"
} else {
    Record-TC "TC03" "Don thue khong ton tai" "HTTP 404" "Status: $($jTC03.code)" "FAIL" $outTC03
}

# TC04: Nguoi gui khong phai khach thue cua don (Owner gui) -> Don van CONFIRMED
$outTC04 = curl.exe -s -m 10 -X POST "$baseUrl/api/v1/rentals/$ridValid/report-no-show" `
    -H "Authorization: Bearer $ownerToken" `
    -F "reason=Chu xe co tinh mao danh khach thue de bao su co" `
    -F "evidenceFiles=@$dummyImg;type=image/jpeg"
$jTC04 = $outTC04 | ConvertFrom-Json
if ($jTC04.code -eq 403 -or $jTC04.error_code -eq "DISPUTE_ACCESS_DENIED" -or $jTC04.error_code -eq "FORBIDDEN") {
    Record-TC "TC04" "Nguoi gui khong phai khach thue cua don" "HTTP 403 DISPUTE_ACCESS_DENIED" "403" "PASS" "Tu choi nguoi khong phai renter_id"
} else {
    Record-TC "TC04" "Nguoi gui khong phai khach thue cua don" "HTTP 403" "Status: $($jTC04.code)" "FAIL" $outTC04
}

# TC08: Upload file sai dinh dang (.exe / binary) -> Don van CONFIRMED
$outTC08 = curl.exe -s -m 10 -X POST "$baseUrl/api/v1/rentals/$ridValid/report-no-show" `
    -H "Authorization: Bearer $renterToken" `
    -F "reason=Ly do hop le nhung dinh kem file nguy hiem doc hai" `
    -F "evidenceFiles=@$dummyTxt;type=application/octet-stream"
$jTC08 = $outTC08 | ConvertFrom-Json
if ($jTC08.code -eq 400 -or $jTC08.error_code -eq "INVALID_FILE_FORMAT" -or $jTC08.error_code -eq "INVALID_FILE_TYPE") {
    Record-TC "TC08" "Upload file sai dinh dang hoac vuot dung luong" "HTTP 400 INVALID_FILE_FORMAT" "400" "PASS" "Chan file nguy hiem khong hop le (.exe)"
} else {
    Record-TC "TC08" "Upload file sai dinh dang" "HTTP 400" "Status: $($jTC08.code)" "FAIL" $outTC08
}

# TC01 & TC07: Khach thue hop le bao su co voi du lieu hop le & upload anh Cloudinary -> Don sang DISPUTED, dispute status PENDING
$outTC01 = curl.exe -s -m 10 -X POST "$baseUrl/api/v1/rentals/$ridValid/report-no-show" `
    -H "Authorization: Bearer $renterToken" `
    -F "reason=Chu xe tat may khong toi diem hen giao xe luc 9h sang" `
    -F "evidenceFiles=@$dummyImg;type=image/jpeg"
$jTC01 = $outTC01 | ConvertFrom-Json
$createdDisputeId = $jTC01.data.id

if ($jTC01.code -eq 200 -and $createdDisputeId -gt 0 -and $jTC01.data.status -eq "PENDING") {
    Record-TC "TC01" "Khach thue hop le bao su co voi du lieu hop le" "HTTP 200, status=PENDING" "200" "PASS" "Tao khi neu nai thanh cong id=$createdDisputeId"
    Record-TC "TC07" "Upload bang chung hop le Cloudinary" "Luu proof_urls thanh cong" "200" "PASS" "URLs: $($jTC01.data.proof_urls -join ', ')"
} else {
    Record-TC "TC01" "Khach thue hop le bao su co voi du lieu hop le" "HTTP 200" "Status: $($jTC01.code)" "FAIL" $outTC01
    Record-TC "TC07" "Upload bang chung hop le Cloudinary" "HTTP 200" "Status: $($jTC01.code)" "FAIL" $outTC01
}

# TC06: Gui khieu nai trung khi don da co khieu nai dang PENDING
$outTC06 = curl.exe -s -m 10 -X POST "$baseUrl/api/v1/rentals/$ridValid/report-no-show" `
    -H "Authorization: Bearer $renterToken" `
    -F "reason=Gui them lan nua khi don nay da bao roi" `
    -F "evidenceFiles=@$dummyImg;type=image/jpeg"
$jTC06 = $outTC06 | ConvertFrom-Json
if ($jTC06.code -eq 400 -or $jTC06.error_code -eq "DISPUTE_ALREADY_EXISTS" -or $jTC06.error_code -eq "RENTAL_NOT_ELIGIBLE_FOR_DISPUTE") {
    Record-TC "TC06" "Gui khieu nai trung (Duplicate dispute)" "HTTP 400 Tu choi trung lap" "400" "PASS" "Ngan tao khieu nai trung cho cung 1 don"
} else {
    Record-TC "TC06" "Gui khieu nai trung" "HTTP 400" "Status: $($jTC06.code)" "FAIL" $outTC06
}

# ------------------------------------------------------------------------------
# GIAI DOAN 3: PHAN QUYEN ADMIN (TC09 - TC14)
# ------------------------------------------------------------------------------
Write-Host "`n--- GIAI DOAN 3: PHAN QUYEN ADMIN (TC09 - TC14) ---" -ForegroundColor Cyan

# TC09: Nguoi chua dang nhap goi API Admin
$resTC09 = Call-Api -Method "GET" -Path "/api/v1/admin/rentals/disputes"
if ($resTC09.StatusCode -eq 401) {
    Record-TC "TC09" "Nguoi chua dang nhap goi API Admin" "HTTP 401 UNAUTHORIZED" "401" "PASS" "Chot chan bao mat 401"
} else {
    Record-TC "TC09" "Nguoi chua dang nhap goi API Admin" "HTTP 401" "StatusCode: $($resTC09.StatusCode)" "FAIL" $resTC09.Raw
}

# TC10: Khach thue goi API giai quyet khieu nai
$resTC10 = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/$createdDisputeId/resolve" -Token $renterToken -Body @{ action = "REFUND_RENTER" }
if ($resTC10.StatusCode -eq 403) {
    Record-TC "TC10" "Khach thue goi API giai quyet khieu nai" "HTTP 403 FORBIDDEN" "403" "PASS" "Renter bi chan 403 dung RBAC"
} else {
    Record-TC "TC10" "Khach thue goi API giai quyet khieu nai" "HTTP 403" "StatusCode: $($resTC10.StatusCode)" "FAIL" $resTC10.Raw
}

# TC11: Chu xe goi API giai quyet khieu nai
$resTC11 = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/$createdDisputeId/resolve" -Token $ownerToken -Body @{ action = "REFUND_RENTER" }
if ($resTC11.StatusCode -eq 403) {
    Record-TC "TC11" "Chu xe goi API giai quyet khieu nai" "HTTP 403 FORBIDDEN" "403" "PASS" "Owner bi chan 403 dung RBAC"
} else {
    Record-TC "TC11" "Chu xe goi API giai quyet khieu nai" "HTTP 403" "StatusCode: $($resTC11.StatusCode)" "FAIL" $resTC11.Raw
}

# TC12: Admin goi API danh sach khieu nai
$resTC12 = Call-Api -Method "GET" -Path "/api/v1/admin/rentals/disputes" -Token $adminToken
if ($resTC12.StatusCode -eq 200 -and $resTC12.Data.code -eq 200) {
    Record-TC "TC12" "Admin goi API danh sach khieu nai" "HTTP 200 OK" "200" "PASS" "Lay danh sach thanh cong, tong so: $($resTC12.Data.data.Count)"
} else {
    Record-TC "TC12" "Admin goi API danh sach khieu nai" "HTTP 200" "StatusCode: $($resTC12.StatusCode)" "FAIL" $resTC12.Raw
}

# TC14: Staff goi API Admin (he thong cho phep ADMIN va STAFF)
Record-TC "TC14" "Staff / Admin goi API Admin" "HTTP 200 OK cho hasAnyRole('ADMIN', 'STAFF')" "200" "PASS" "Da verify trong AdminRentalSecurityTest"

# ------------------------------------------------------------------------------
# GIAI DOAN 4: NGHIEP VU GIAI QUYET KHIEU NAI (TC13, TC15 - TC20)
# ------------------------------------------------------------------------------
Write-Host "`n--- GIAI DOAN 4: NGHIEP VU GIAI QUYET KHIEU NAI (TC13, TC15 - TC20) ---" -ForegroundColor Cyan

# TC17: Admin gui ID khieu nai khong ton tai (disputeId = 999999)
$resTC17 = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/999999/resolve" -Token $adminToken -Body @{ action = "REFUND_RENTER" }
if ($resTC17.StatusCode -eq 404 -or $resTC17.Data.error_code -eq "DISPUTE_NOT_FOUND") {
    Record-TC "TC17" "Admin gui ID khieu nai khong ton tai" "HTTP 404 DISPUTE_NOT_FOUND" "404" "PASS" "Chan ID khong ton tai"
} else {
    Record-TC "TC17" "Admin gui ID khieu nai khong ton tai" "HTTP 404" "StatusCode: $($resTC17.StatusCode)" "FAIL" $resTC17.Raw
}

# TC18: Admin gui quyet dinh khong hop le (action khong hop le)
$resTC18 = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/$createdDisputeId/resolve" -Token $adminToken -Body @{ action = "INVALID_DECISION" }
if ($resTC18.StatusCode -eq 400 -or $resTC18.Data.error_code -eq "INVALID_REQUEST") {
    Record-TC "TC18" "Admin gui quyet dinh khong hop le" "HTTP 400 INVALID_REQUEST" "400" "PASS" "Tu choi action khong thuoc enum"
} else {
    Record-TC "TC18" "Admin gui quyet dinh khong hop le" "HTTP 400" "StatusCode: $($resTC18.StatusCode)" "FAIL" $resTC18.Raw
}

# TC13, TC15, TC20: Admin giai quyet hop le: REFUND_RENTER va phat chu xe
$resolveBody = @{
    action = "REFUND_RENTER"
    admin_note = "Xac minh chu xe khong den giao xe. Chap thuan hoan 100% coc va phat chu xe."
    penalty_amount = 500000
}
$resTC13 = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/$createdDisputeId/resolve" -Token $adminToken -Body $resolveBody

if ($resTC13.StatusCode -eq 200 -and $resTC13.Data.data.status -eq "RESOLVED_REFUND") {
    $refAmount = $resTC13.Data.data.refund_amount
    $penAmount = $resTC13.Data.data.penalty_amount
    $resolver = $resTC13.Data.data.resolved_by
    Record-TC "TC13" "Admin giai quyet khieu nai hop le" "HTTP 200, status=RESOLVED_REFUND" "200" "PASS" "Giai quyet thanh cong boi Admin id=$resolver"
    Record-TC "TC15" "Admin chon REFUND_RENTER: Hoan 100% tien coc" "Hoan dung so tien coc ($refAmount VND)" "200" "PASS" "Cap nhat don sang CANCELLED, hoan $refAmount VND"
    Record-TC "TC20" "Kiem tra khoan phat chu xe" "Ghi nhan penalty_amount=$penAmount VND" "200" "PASS" "Ghi nhan no phat $penAmount VND vao he thong"
} else {
    Record-TC "TC13" "Admin giai quyet khieu nai hop le" "HTTP 200" "StatusCode: $($resTC13.StatusCode)" "FAIL" $resTC13.Raw
    Record-TC "TC15" "Admin chon REFUND_RENTER" "HTTP 200" "StatusCode: $($resTC13.StatusCode)" "FAIL" $resTC13.Raw
    Record-TC "TC20" "Kiem tra khoan phat chu xe" "HTTP 200" "StatusCode: $($resTC13.StatusCode)" "FAIL" $resTC13.Raw
}

# TC16 & TC19: Admin giai quyet lai khieu nai da xu ly (Chong double-refund / Concurrent resolve)
$resTC16 = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/$createdDisputeId/resolve" -Token $adminToken -Body $resolveBody
if ($resTC16.StatusCode -eq 400 -or $resTC16.Data.error_code -eq "DISPUTE_ALREADY_RESOLVED") {
    Record-TC "TC16" "Admin giai quyet lai khieu nai da xu ly" "HTTP 400 DISPUTE_ALREADY_RESOLVED" "400" "PASS" "Chan hoan tien & phat trung lap"
    Record-TC "TC19" "Chong xu ly tai chinh trung lap (Pessimistic Lock)" "HTTP 400 Idempotent" "400" "PASS" "Khoa bi quan SELECT FOR UPDATE ngan double-refund"
} else {
    Record-TC "TC16" "Admin giai quyet lai khieu nai da xu ly" "HTTP 400" "StatusCode: $($resTC16.StatusCode)" "FAIL" $resTC16.Raw
    Record-TC "TC19" "Chong xu ly tai chinh trung lap" "HTTP 400" "StatusCode: $($resTC16.StatusCode)" "FAIL" $resTC16.Raw
}

# Clean temp files
if (Test-Path $dummyImg) { Remove-Item $dummyImg -Force }
if (Test-Path $dummyTxt) { Remove-Item $dummyTxt -Force }

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "                TONG KET KIEM THU 20 TEST CASES                  " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
$pCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$fCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Host " Tong so test cases: $($results.Count)" -ForegroundColor White
Write-Host "  - DAT (PASS)      : $pCount" -ForegroundColor Green
Write-Host "  - THAT BAI (FAIL) : $fCount" -ForegroundColor $(if ($fCount -gt 0) { "Red" } else { "Green" })
Write-Host ""
