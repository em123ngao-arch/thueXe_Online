#!/usr/bin/env pwsh
# ==============================================================================
# DriveShare - Script Kiem Thu Live Chot 1 & Hai Edge Cases Sprint 3 (Lâm Chí Vĩ)
# Chay truc tiep tren Backend dang hoat dong o cong 8080
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost:8080"
$passCount = 0
$failCount = 0

function Report-Step($name, $passed, $details) {
    if ($passed) {
        $global:passCount++
        Write-Host " [PASS] $name" -ForegroundColor Green
        if ($details) { Write-Host "        $details" -ForegroundColor Gray }
    } else {
        $global:failCount++
        Write-Host " [FAIL] $name" -ForegroundColor Red
        if ($details) { Write-Host "        $details" -ForegroundColor Yellow }
    }
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
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    $params = @{
        Method = $Method
        Uri = $uri
        Headers = $headers
        UseBasicParsing = $true
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

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  KIEM THU LIVE CHOT 1 (BACKEND QA) & HAI EDGE CASES SPRINT 3    " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. TEST CHUA DANG NHAP -> HTTP 401 UNAUTHORIZED
# ------------------------------------------------------------------------------
Write-Host "--- 1. KIEM TRA BAO MAT: NGUOI CHUA DANG NHAP (KHACH VANG LAI) ---" -ForegroundColor Cyan

$res1 = Call-Api -Method "GET" -Path "/api/v1/admin/rentals/disputes"
if ($res1.StatusCode -eq 401) {
    Report-Step "API Admin Disputes: Chua dang nhap bi chan HTTP 401" $true "HTTP 401 UNAUTHORIZED - Dung bao mat chot chan"
} else {
    Report-Step "API Admin Disputes: Chua dang nhap bi chan HTTP 401" $false "StatusCode thuc te: $($res1.StatusCode) (Ky vong 401)"
}

$res2 = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/1/resolve" -Body @{ action = "REFUND_RENTER" }
if ($res2.StatusCode -eq 401) {
    Report-Step "API Admin Resolve: Chua dang nhap bi chan HTTP 401" $true "HTTP 401 UNAUTHORIZED - Dung bao mat chot chan"
} else {
    Report-Step "API Admin Resolve: Chua dang nhap bi chan HTTP 401" $false "StatusCode thuc te: $($res2.StatusCode) (Ky vong 401)"
}

# ------------------------------------------------------------------------------
# 2. DANG NHAP CAC TAI KHOAN
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "--- 2. DANG NHAP HE THONG (LAY JWT TOKEN) ---" -ForegroundColor Cyan

$rLogin = Call-Api -Method "POST" -Path "/api/v1/auth/login" -Body @{ identifier = "renter@driveshare.com"; password = "Renter123@" }
$renterToken = $rLogin.Data.data.access_token
if ($renterToken) {
    Report-Step "Dang nhap Renter (renter@driveshare.com)" $true "Token hop le"
} else {
    Report-Step "Dang nhap Renter" $false "Khong lay duoc token: $($rLogin.Raw)"
}

$oLogin = Call-Api -Method "POST" -Path "/api/v1/auth/login" -Body @{ identifier = "owner@driveshare.com"; password = "Owner123@" }
$ownerToken = $oLogin.Data.data.access_token
if ($ownerToken) {
    Report-Step "Dang nhap Owner (owner@driveshare.com)" $true "Token hop le"
} else {
    Report-Step "Dang nhap Owner" $false "Khong lay duoc token: $($oLogin.Raw)"
}

$aLogin = Call-Api -Method "POST" -Path "/api/v1/auth/login" -Body @{ identifier = "admin@driveshare.com"; password = "Admin123@" }
$adminToken = $aLogin.Data.data.access_token
if ($adminToken) {
    Report-Step "Dang nhap Admin (admin@driveshare.com)" $true "Token hop le"
} else {
    Report-Step "Dang nhap Admin" $false "Khong lay duoc token: $($aLogin.Raw)"
}

# ------------------------------------------------------------------------------
# 3. EDGE CASE 1: NGUOI KHONG PHAI ADMIN CO GIAI QUYET HOAC XEM TRANH CHAP
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "--- 3. EDGE CASE 1: TAI KHOAN KHONG CO QUYEN ADMIN BI CHAN HTTP 403 ---" -ForegroundColor Cyan

$rGet = Call-Api -Method "GET" -Path "/api/v1/admin/rentals/disputes" -Token $renterToken
if ($rGet.StatusCode -eq 403) {
    Report-Step "Edge Case 1 - Renter xem API Admin Disputes: Bi chan HTTP 403" $true "HTTP 403 FORBIDDEN - Dung phan quyen RBAC"
} else {
    Report-Step "Edge Case 1 - Renter xem API Admin Disputes: Bi chan HTTP 403" $false "StatusCode thuc te: $($rGet.StatusCode) (Ky vong 403)"
}

$rResolve = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/1/resolve" -Token $renterToken -Body @{
    action = "REFUND_RENTER"
    admin_note = "Renter hack resolve"
}
if ($rResolve.StatusCode -eq 403) {
    Report-Step "Edge Case 1 - Renter goi API Admin Resolve: Bi chan HTTP 403" $true "HTTP 403 FORBIDDEN - Dung phan quyen RBAC"
} else {
    Report-Step "Edge Case 1 - Renter goi API Admin Resolve: Bi chan HTTP 403" $false "StatusCode thuc te: $($rResolve.StatusCode) (Ky vong 403)"
}

$oResolve = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/1/resolve" -Token $ownerToken -Body @{
    action = "REFUND_RENTER"
    admin_note = "Owner hack resolve"
}
if ($oResolve.StatusCode -eq 403) {
    Report-Step "Edge Case 1 - Owner goi API Admin Resolve: Bi chan HTTP 403" $true "HTTP 403 FORBIDDEN - Dung phan quyen RBAC"
} else {
    Report-Step "Edge Case 1 - Owner goi API Admin Resolve: Bi chan HTTP 403" $false "StatusCode thuc te: $($oResolve.StatusCode) (Ky vong 403)"
}

# ------------------------------------------------------------------------------
# 4. ADMIN TRUY VAN DANH SACH KHIEU NAI (HTTP 200 OK)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "--- 4. ADMIN XEM DANH SACH KHIEU NAI (HTTP 200 OK) ---" -ForegroundColor Cyan

$adminDisputes = Call-Api -Method "GET" -Path "/api/v1/admin/rentals/disputes" -Token $adminToken
if ($adminDisputes.StatusCode -eq 200 -and $adminDisputes.Data.code -eq 200) {
    Report-Step "Admin xem danh sach khieu nai" $true "HTTP 200 OK, code = 200, so luong hien co = $($adminDisputes.Data.data.Count)"
} else {
    Report-Step "Admin xem danh sach khieu nai" $false "Ket qua: $($adminDisputes.Raw)"
}

# ------------------------------------------------------------------------------
# 5. LUONG NGHIEP VU HOAN COK VA EDGE CASE 2 (CHONG HOAN COK 2 LAN)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "--- 5. LUONG HOAN COK 100% & EDGE CASE 2: CHONG HOAN TIEN HAI LAN ---" -ForegroundColor Cyan

# 5.1 Renter tao don thue xe khong trung lich (dat xa sau 35 ngay)
$activeCarsRes = Call-Api -Method "GET" -Path "/api/v1/public/cars"
$targetCarId = 13
if ($activeCarsRes.Data.data.items -and $activeCarsRes.Data.data.items.Count -gt 0) {
    $targetCarId = $activeCarsRes.Data.data.items[0].car_id
}

$startStr = (Get-Date).AddDays(35).ToString("yyyy-MM-dd")
$endStr   = (Get-Date).AddDays(37).ToString("yyyy-MM-dd")

$bookRes = Call-Api -Method "POST" -Path "/api/v1/rentals" -Token $renterToken -Body @{
    car_id = $targetCarId
    start_date = $startStr
    end_date = $endStr
    note = "Kiem thu live khieu nai"
}

$testRentalId = $null
if ($bookRes.StatusCode -eq 200 -and $bookRes.Data.code -eq 200) {
    $testRentalId = $bookRes.Data.data.rental_id
    Report-Step "Tao don thue xe moi de kiem thu" $true "rental_id = $testRentalId, status = $($bookRes.Data.data.status)"
} else {
    Report-Step "Tao don thue xe moi" $false "Loi: $($bookRes.Raw)"
}

if ($testRentalId) {
    # 5.2 Chu xe duyet don (PUT /api/v1/owner/rentals/{id}/approve)
    $appRes = Call-Api -Method "PUT" -Path "/api/v1/owner/rentals/$testRentalId/approve" -Token $ownerToken
    if ($appRes.StatusCode -eq 200 -and $appRes.Data.code -eq 200) {
        Report-Step "Chu xe duyet don thue" $true "status = APPROVED"
    } else {
        Report-Step "Chu xe duyet don thue" $false "Loi: $($appRes.Raw)"
    }

    # 5.3 Khach thue tao giao dich coc 30% (POST /api/v1/rentals/{id}/payment)
    $createPayRes = Call-Api -Method "POST" -Path "/api/v1/rentals/$testRentalId/payment" -Token $renterToken -Body @{
        rental_id = $testRentalId
        payment_method = "VIETQR"
        payment_type = "DEPOSIT"
    }
    $paymentId = $createPayRes.Data.data.payment_id

    # Xac nhan thanh toan coc -> Don sang CONFIRMED
    $confirmPayRes = Call-Api -Method "POST" -Path "/api/v1/payments/$paymentId/confirm" -Token $renterToken
    if ($confirmPayRes.StatusCode -eq 200 -and $confirmPayRes.Data.code -eq 200) {
        Report-Step "Khach dat coc 30% thanh cong" $true "paymentId = $paymentId, rental sang CONFIRMED"
    } else {
        Report-Step "Khach dat coc 30%" $false "Loi: $($confirmPayRes.Raw)"
    }

    # 5.4 Khach bao su co khong nhan duoc xe (Report No-Show kem anh bang chung)
    $dummyImgPath = "test_evidence.jpg"
    [IO.File]::WriteAllBytes($dummyImgPath, [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="))

    $reportOut = curl.exe -s -X POST "$baseUrl/api/v1/rentals/$testRentalId/report-no-show" `
        -H "Authorization: Bearer $renterToken" `
        -F "reason=Chu xe tat may khong toi diem hen giao xe" `
        -F "evidenceFiles=@$dummyImgPath;type=image/jpeg"

    $disputeJson = $null
    try { $disputeJson = $reportOut | ConvertFrom-Json } catch {}
    $disputeId = $null
    if ($disputeJson -and $disputeJson.code -eq 200 -and $disputeJson.data.id) {
        $disputeId = $disputeJson.data.id
        Report-Step "Khach gui khieu nai khong nhan xe (kem bang chung)" $true "disputeId = $disputeId, status = $($disputeJson.data.status)"
    } else {
        Report-Step "Khach gui khieu nai khong nhan xe" $false "Loi: $reportOut"
    }

    # 5.5 Admin giai quyet khieu nai lan 1: REFUND_RENTER
    if ($disputeId) {
        $resolveBody = @{
            action = "REFUND_RENTER"
            admin_note = "Xac minh chu xe vang mat khong den giao xe. Chap thuan hoan 100% coc va phat chu xe."
            penalty_amount = 600000
        }
        $res1Res = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/$disputeId/resolve" -Token $adminToken -Body $resolveBody

        if ($res1Res.StatusCode -eq 200 -and $res1Res.Data.data.status -eq "RESOLVED_REFUND") {
            Report-Step "Admin resolve lan 1 (REFUND_RENTER) thanh cong" $true "Hoan coc = $($res1Res.Data.data.refund_amount) VND, Phat = $($res1Res.Data.data.penalty_amount) VND, ResolvedBy = $($res1Res.Data.data.resolved_by)"
        } else {
            Report-Step "Admin resolve lan 1" $false "Loi: $($res1Res.Raw)"
        }

        # 5.6 EDGE CASE 2: Admin co tinh resolve lai lan 2 (hoac double-click)
        $resDouble = Call-Api -Method "POST" -Path "/api/v1/admin/rentals/disputes/$disputeId/resolve" -Token $adminToken -Body $resolveBody

        if ($resDouble.StatusCode -eq 400) {
            Report-Step "Edge Case 2 - Ngan hoan coc 2 lan: Bi chan voi HTTP 400 DISPUTE_ALREADY_RESOLVED" $true "HTTP 400 BAD REQUEST - Chong double-refund & double-penalty thanh cong!"
        } else {
            Report-Step "Edge Case 2 - Ngan hoan coc 2 lan" $false "StatusCode thuc te: $($resDouble.StatusCode) (Ky vong: 400)"
        }
    }
}

# Clean temp evidence
if (Test-Path "test_evidence.jpg") { Remove-Item "test_evidence.jpg" -Force }

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "             KET QUA KIEM THU LIVE SPRINT 3                      " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Tong so ca kiem thu: $($passCount + $failCount)" -ForegroundColor White
Write-Host "  - DAT (PASS)      : $passCount" -ForegroundColor Green
Write-Host "  - THAT BAI (FAIL) : $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host ">>> CHUC MUNG! TOAN BO CHOT 1 (BACKEND LIVE) & 2 EDGE CASES DA HOAN TAT 100% <<<" -ForegroundColor Green
} else {
    Write-Host ">>> CON LOI CAN KHAC PHUC TRUOC KHI NOP PR CHO KHIEM VA TIN <<<" -ForegroundColor Red
}
Write-Host ""
