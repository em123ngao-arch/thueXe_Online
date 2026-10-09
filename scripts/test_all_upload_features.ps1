# ==============================================================================
# DriveShare - Comprehensive File and Image Upload Test Suite
# Tests: Avatar, CCCD (2-sided), GPLX, Car Photos, Edge Cases, Disk and HTTP Serving
# ==============================================================================

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:8080"
$passCount = 0
$failCount = 0
$testResults = @()

function Record-Result($testName, $passed, $details) {
    if ($passed) {
        $script:passCount++
        $script:testResults += [PSCustomObject]@{
            Test = $testName
            Status = "PASS"
            Details = $details
        }
        Write-Host " [PASS] $testName - $details" -ForegroundColor Green
    } else {
        $script:failCount++
        $script:testResults += [PSCustomObject]@{
            Test = $testName
            Status = "FAIL"
            Details = $details
        }
        Write-Host " [FAIL] $testName - $details" -ForegroundColor Red
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "       BAT DAU KIEM THU TOAN DIEN CAC CHUC NANG UPLOAD FILE      " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 0. Chuan bi file test
# ------------------------------------------------------------------------------
$base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
$bytes = [Convert]::FromBase64String($base64Png)
[IO.File]::WriteAllBytes("test_valid.png", $bytes)
[IO.File]::WriteAllBytes("test_valid.jpg", $bytes)

# Tao file khong dung dinh dang (.txt)
Set-Content -Path "test_invalid.txt" -Value "Day la file van ban khong phai file anh"

# Tao file dung luong lon > 5MB (5.5MB)
$oversizeBytes = New-Object byte[] (5767168)
[IO.File]::WriteAllBytes("test_oversize.png", $oversizeBytes)

# ------------------------------------------------------------------------------
# 1. Dang nhap lay Token cac Role
# ------------------------------------------------------------------------------
Write-Host "`n--- 1. DANG NHAP VA KHOI TAO PHIEN KIEM THU ---" -ForegroundColor Yellow

# Renter Login
$renterLogin = curl.exe -s -X POST "$baseUrl/api/v1/auth/login" -H "Content-Type: application/json" -d '{\"identifier\":\"renter@driveshare.com\",\"password\":\"Renter123@\"}' | ConvertFrom-Json
$renterToken = $renterLogin.data.access_token
if ($renterToken) {
    Record-Result "Auth - Renter Token" $true "Lay access_token thanh cong cho renter@driveshare.com"
} else {
    Record-Result "Auth - Renter Token" $false "Khong lay duoc token renter"
}

# Owner Login
$ownerLogin = curl.exe -s -X POST "$baseUrl/api/v1/auth/login" -H "Content-Type: application/json" -d '{\"identifier\":\"owner@driveshare.com\",\"password\":\"Owner123@\"}' | ConvertFrom-Json
$ownerToken = $ownerLogin.data.access_token
if ($ownerToken) {
    Record-Result "Auth - Owner Token" $true "Lay access_token thanh cong cho owner@driveshare.com"
} else {
    Record-Result "Auth - Owner Token" $false "Khong lay duoc token owner"
}

# ------------------------------------------------------------------------------
# 2. Test Chuc Nang 1: Upload Avatar (POST /api/v1/users/me/avatar)
# ------------------------------------------------------------------------------
Write-Host "`n--- 2. KIEM THU UPLOAD AVATAR ---" -ForegroundColor Yellow

$avatarResJson = curl.exe -s -X POST "$baseUrl/api/v1/users/me/avatar" -H "Authorization: Bearer $renterToken" -F "file=@test_valid.png;type=image/png"
$avatarObj = $avatarResJson | ConvertFrom-Json

$avatarUrl = if ($avatarObj.data.avatar_url) { $avatarObj.data.avatar_url } else { $avatarObj.data.avatarUrl }

if ($avatarObj.success -eq $true -and $avatarUrl -match "/uploads/driveshare/avatars/") {
    Record-Result "Upload Avatar - API Response" $true "Avatar URL hop le: $avatarUrl"
} else {
    Record-Result "Upload Avatar - API Response" $false "Response: $avatarResJson"
}

# Kiem tra file vat ly tren o cung
$avatarFilename = if ($avatarUrl) { Split-Path -Leaf $avatarUrl } else { "" }
$avatarDiskPath = "backend/uploads/driveshare/avatars/$avatarFilename"
if ($avatarFilename -and (Test-Path $avatarDiskPath)) {
    Record-Result "Upload Avatar - Luu tru vat ly (Disk)" $true "File ton tai tai $avatarDiskPath"
} else {
    Record-Result "Upload Avatar - Luu tru vat ly (Disk)" $false "Khong tim thay file tai $avatarDiskPath"
}

# Kiem tra truy xuat HTTP GET tinh
$avatarHttp = if ($avatarUrl) { curl.exe -s -o /dev/null -w "%{http_code}" "$avatarUrl" } else { "400" }
if ($avatarHttp -eq "200") {
    Record-Result "Upload Avatar - Truy xuat HTTP GET" $true "HTTP status 200 OK khi tai anh tu URL"
} else {
    Record-Result "Upload Avatar - Truy xuat HTTP GET" $false "HTTP status $avatarHttp khi tai anh"
}

# ------------------------------------------------------------------------------
# 3. Test Chuc Nang 2: Upload CMND/CCCD 2 Mat (POST /api/v1/users/me/cccd)
# ------------------------------------------------------------------------------
Write-Host "`n--- 3. KIEM THU UPLOAD CCCD 2 MAT ---" -ForegroundColor Yellow

$cccdResJson = curl.exe -s -X POST "$baseUrl/api/v1/users/me/cccd" -H "Authorization: Bearer $renterToken" -F "frontImage=@test_valid.png;type=image/png" -F "backImage=@test_valid.jpg;type=image/jpeg"
$cccdObj = $cccdResJson | ConvertFrom-Json

$frontUrl = if ($cccdObj.data.frontImageUrl) { $cccdObj.data.frontImageUrl } else { $cccdObj.data.idCardFrontUrl }
$backUrl = if ($cccdObj.data.backImageUrl) { $cccdObj.data.backImageUrl } else { $cccdObj.data.idCardBackUrl }
$cccdStatus = $cccdObj.data.verificationStatus

if ($cccdObj.success -eq $true -and $frontUrl -match "/uploads/driveshare/cccd/" -and $backUrl -match "/uploads/driveshare/cccd/" -and $cccdStatus -eq "PENDING") {
    Record-Result "Upload CCCD - API Response" $true "Front: $frontUrl, Back: $backUrl, Status: $cccdStatus"
} else {
    Record-Result "Upload CCCD - API Response" $false "Response: $cccdResJson"
}

# Kiem tra file vat ly mat truoc va mat sau tren o cung
$frontFilename = if ($frontUrl) { Split-Path -Leaf $frontUrl } else { "" }
$backFilename = if ($backUrl) { Split-Path -Leaf $backUrl } else { "" }
$frontDiskPath = "backend/uploads/driveshare/cccd/$frontFilename"
$backDiskPath = "backend/uploads/driveshare/cccd/$backFilename"

if ((Test-Path $frontDiskPath) -and (Test-Path $backDiskPath)) {
    Record-Result "Upload CCCD - Luu tru vat ly (Disk)" $true "Ca 2 mat da duoc luu thanh cong tren dia"
} else {
    Record-Result "Upload CCCD - Luu tru vat ly (Disk)" $false "Khong tim thay file mat truoc hoac mat sau tren dia"
}

# Kiem tra truy xuat HTTP GET cho ca 2 mat
$frontHttp = if ($frontUrl) { curl.exe -s -o /dev/null -w "%{http_code}" "$frontUrl" } else { "400" }
$backHttp = if ($backUrl) { curl.exe -s -o /dev/null -w "%{http_code}" "$backUrl" } else { "400" }
if ($frontHttp -eq "200" -and $backHttp -eq "200") {
    Record-Result "Upload CCCD - Truy xuat HTTP GET" $true "Ca 2 mat deu tra ve HTTP 200 OK"
} else {
    Record-Result "Upload CCCD - Truy xuat HTTP GET" $false "Front HTTP: $frontHttp, Back HTTP: $backHttp"
}

# ------------------------------------------------------------------------------
# 4. Test Chuc Nang 3: Upload Giay Phep Lai Xe GPLX (POST /api/v1/users/me/gplx)
# ------------------------------------------------------------------------------
Write-Host "`n--- 4. KIEM THU UPLOAD GPLX ---" -ForegroundColor Yellow

$gplxResJson = curl.exe -s -X POST "$baseUrl/api/v1/users/me/gplx" -H "Authorization: Bearer $renterToken" -F "licenseImage=@test_valid.png;type=image/png"
$gplxObj = $gplxResJson | ConvertFrom-Json

$gplxUrl = if ($gplxObj.data.licenseImageUrl) { $gplxObj.data.licenseImageUrl } else { $gplxObj.data.driverLicenseUrl }
$gplxStatus = $gplxObj.data.verificationStatus

if ($gplxObj.success -eq $true -and $gplxUrl -match "/uploads/driveshare/gplx/" -and $gplxStatus -eq "PENDING") {
    Record-Result "Upload GPLX - API Response" $true "GPLX URL: $gplxUrl, Status: $gplxStatus"
} else {
    Record-Result "Upload GPLX - API Response" $false "Response: $gplxResJson"
}

# Kiem tra file vat ly tren o cung
$gplxFilename = if ($gplxUrl) { Split-Path -Leaf $gplxUrl } else { "" }
$gplxDiskPath = "backend/uploads/driveshare/gplx/$gplxFilename"
if ($gplxFilename -and (Test-Path $gplxDiskPath)) {
    Record-Result "Upload GPLX - Luu tru vat ly (Disk)" $true "File GPLX luu thanh cong tai $gplxDiskPath"
} else {
    Record-Result "Upload GPLX - Luu tru vat ly (Disk)" $false "Khong tim thay file tai $gplxDiskPath"
}

# Kiem tra truy xuat HTTP GET
$gplxHttp = if ($gplxUrl) { curl.exe -s -o /dev/null -w "%{http_code}" "$gplxUrl" } else { "400" }
if ($gplxHttp -eq "200") {
    Record-Result "Upload GPLX - Truy xuat HTTP GET" $true "HTTP status 200 OK khi tai anh GPLX"
} else {
    Record-Result "Upload GPLX - Truy xuat HTTP GET" $false "HTTP status $gplxHttp khi tai anh GPLX"
}

# ------------------------------------------------------------------------------
# 5. Test Chuc Nang 4: Upload va Quan Ly Anh Xe (POST /api/v1/cars/{carId}/photos)
# ------------------------------------------------------------------------------
Write-Host "`n--- 5. KIEM THU UPLOAD VA QUAN LY ANH XE (OWNER) ---" -ForegroundColor Yellow

# Lay danh sach xe hop le cua Owner dang so huu
$myCarsRes = curl.exe -s -X GET "$baseUrl/api/v1/cars/my-cars" -H "Authorization: Bearer $ownerToken" | ConvertFrom-Json
$carId = $myCarsRes.data.items[0].carId
if (-not $carId) {
    $carId = 3
}
Write-Host "Testing voi xe Car ID: $carId ($($myCarsRes.data.items[0].brand) $($myCarsRes.data.items[0].model))" -ForegroundColor Cyan

# Don dep anh cu cua xe (neu co) de dam bao test bat dau tu trang thai trong
$cleanPhotosRes = curl.exe -s -X GET "$baseUrl/api/v1/cars/$carId/photos" -H "Authorization: Bearer $ownerToken" | ConvertFrom-Json
if ($cleanPhotosRes.data) {
    foreach ($ep in $cleanPhotosRes.data) {
        $epId = if ($ep.image_id) { $ep.image_id } else { $ep.imageId }
        curl.exe -s -X DELETE "$baseUrl/api/v1/cars/$carId/photos/$epId" -H "Authorization: Bearer $ownerToken" | Out-Null
    }
}

# 5.1 Upload anh xe thu nhat (Tu dong lam Thumbnail)
$carPhoto1ResJson = curl.exe -s -X POST "$baseUrl/api/v1/cars/$carId/photos" -H "Authorization: Bearer $ownerToken" -F "file=@test_valid.png;type=image/png"
$carPhoto1Obj = $carPhoto1ResJson | ConvertFrom-Json

$photo1Id = if ($carPhoto1Obj.data.image_id) { $carPhoto1Obj.data.image_id } else { $carPhoto1Obj.data.imageId }
$photo1Url = if ($carPhoto1Obj.data.image_url) { $carPhoto1Obj.data.image_url } else { $carPhoto1Obj.data.imageUrl }
$photo1IsThumb = if ($null -ne $carPhoto1Obj.data.is_thumbnail) { $carPhoto1Obj.data.is_thumbnail } else { $carPhoto1Obj.data.isThumbnail }

if ($carPhoto1Obj.success -eq $true -and $photo1Id -and $photo1Url -match "/uploads/cars/$carId/" -and $photo1IsThumb -eq $true) {
    Record-Result "Upload Car Photo 1 - Thumbnail tu dong" $true "Anh 1 tai len thanh cong (ID: $photo1Id), isThumbnail=$photo1IsThumb"
} else {
    Record-Result "Upload Car Photo 1 - Thumbnail tu dong" $false "Response: $carPhoto1ResJson"
}

# Kiem tra file vat ly anh xe 1
$carPhoto1Filename = if ($photo1Url) { Split-Path -Leaf $photo1Url } else { "" }
$carPhoto1DiskPath = "backend/uploads/cars/$carId/$carPhoto1Filename"
if ($carPhoto1Filename -and (Test-Path $carPhoto1DiskPath)) {
    Record-Result "Upload Car Photo 1 - Luu tru vat ly (Disk)" $true "File xe luu thanh cong tai $carPhoto1DiskPath"
} else {
    Record-Result "Upload Car Photo 1 - Luu tru vat ly (Disk)" $false "Khong tim thay file tai $carPhoto1DiskPath"
}

# Kiem tra truy xuat HTTP GET anh xe 1
$carPhoto1Http = if ($photo1Url) { curl.exe -s -o /dev/null -w "%{http_code}" "$photo1Url" } else { "400" }
if ($carPhoto1Http -eq "200") {
    Record-Result "Upload Car Photo 1 - Truy xuat HTTP GET" $true "HTTP status 200 OK khi tai anh xe tu URL"
} else {
    Record-Result "Upload Car Photo 1 - Truy xuat HTTP GET" $false "HTTP status $carPhoto1Http khi tai anh xe"
}

# 5.2 Upload anh xe thu hai (Anh phu, isThumbnail = false)
$carPhoto2ResJson = curl.exe -s -X POST "$baseUrl/api/v1/cars/$carId/photos" -H "Authorization: Bearer $ownerToken" -F "file=@test_valid.jpg;type=image/jpeg"
$carPhoto2Obj = $carPhoto2ResJson | ConvertFrom-Json

$photo2Id = if ($carPhoto2Obj.data.image_id) { $carPhoto2Obj.data.image_id } else { $carPhoto2Obj.data.imageId }
$photo2Url = if ($carPhoto2Obj.data.image_url) { $carPhoto2Obj.data.image_url } else { $carPhoto2Obj.data.imageUrl }
$photo2IsThumb = if ($null -ne $carPhoto2Obj.data.is_thumbnail) { $carPhoto2Obj.data.is_thumbnail } else { $carPhoto2Obj.data.isThumbnail }

if ($carPhoto2Obj.success -eq $true -and $photo2Id -and $photo2IsThumb -eq $false) {
    Record-Result "Upload Car Photo 2 - Anh phu" $true "Anh 2 tai len thanh cong (ID: $photo2Id), isThumbnail=$photo2IsThumb"
} else {
    Record-Result "Upload Car Photo 2 - Anh phu" $false "Response: $carPhoto2ResJson"
}

# 5.3 Doi anh dai dien (PATCH /api/v1/cars/{carId}/photos/{photoId}/set-primary)
$setPrimaryResJson = curl.exe -s -X PATCH "$baseUrl/api/v1/cars/$carId/photos/$photo2Id/set-primary" -H "Authorization: Bearer $ownerToken"
$setPrimaryObj = $setPrimaryResJson | ConvertFrom-Json
$primaryThumb = if ($null -ne $setPrimaryObj.data.is_thumbnail) { $setPrimaryObj.data.is_thumbnail } else { $setPrimaryObj.data.isThumbnail }

if ($setPrimaryObj.success -eq $true -and $primaryThumb -eq $true) {
    Record-Result "Car Photos - Doi anh dai dien chinh" $true "Anh 2 da duoc nang thanh anh dai dien chinh"
} else {
    Record-Result "Car Photos - Doi anh dai dien chinh" $false "Response: $setPrimaryResJson"
}

# 5.4 Lay danh sach anh xe (GET /api/v1/cars/{carId}/photos)
$listPhotosResJson = curl.exe -s -X GET "$baseUrl/api/v1/cars/$carId/photos" -H "Authorization: Bearer $ownerToken"
$listPhotosObj = $listPhotosResJson | ConvertFrom-Json
$photoCount = if ($listPhotosObj.data) { $listPhotosObj.data.Count } else { 0 }
if ($listPhotosObj.success -eq $true -and $photoCount -ge 2) {
    Record-Result "Car Photos - Xem danh sach anh xe" $true "Tim thay day du cac anh da upload ($photoCount anh)"
} else {
    Record-Result "Car Photos - Xem danh sach anh xe" $false "Response: $listPhotosResJson"
}

# 5.5 Xoa anh xe thu nhat (DELETE /api/v1/cars/{carId}/photos/{photoId})
$deleteResJson = curl.exe -s -X DELETE "$baseUrl/api/v1/cars/$carId/photos/$photo1Id" -H "Authorization: Bearer $ownerToken"
$deleteObj = $deleteResJson | ConvertFrom-Json
if ($deleteObj.success -eq $true) {
    Record-Result "Car Photos - Xoa anh xe" $true "Xoa anh $photo1Id thanh cong"
} else {
    Record-Result "Car Photos - Xoa anh xe" $false "Response: $deleteResJson"
}

# Xac minh lai danh sach sau khi xoa
$listAfterDelete = curl.exe -s -X GET "$baseUrl/api/v1/cars/$carId/photos" -H "Authorization: Bearer $ownerToken" | ConvertFrom-Json
$countAfterDelete = if ($listAfterDelete.data) { $listAfterDelete.data.Count } else { 0 }
if ($countAfterDelete -eq ($photoCount - 1)) {
    Record-Result "Car Photos - Kiem tra sau khi xoa" $true "Danh sach cap nhat chinh xac con $countAfterDelete anh"
} else {
    Record-Result "Car Photos - Kiem tra sau khi xoa" $false "So luong anh sau xoa khong khop: $countAfterDelete"
}

# ------------------------------------------------------------------------------
# 6. Test Rang Buoc va Truong Hop Ngoai Le (Validation and Edge Cases)
# ------------------------------------------------------------------------------
Write-Host "`n--- 6. KIEM THU CAC TRUONG HOP NGOAI LE VA RANG BUOC (EDGE CASES) ---" -ForegroundColor Yellow

# 6.1 Upload file vuot qua dung luong cho phep (> 5MB)
$oversizeResJson = curl.exe -s -X POST "$baseUrl/api/v1/users/me/avatar" -H "Authorization: Bearer $renterToken" -F "file=@test_oversize.png;type=image/png"
$oversizeObj = $oversizeResJson | ConvertFrom-Json

if ($oversizeObj.errorCode -eq "FILE_SIZE_EXCEEDED" -or $oversizeObj.code -eq "FILE_SIZE_EXCEEDED" -or $oversizeResJson -match "FILE_SIZE_EXCEEDED") {
    Record-Result "Validation - Chan file qua dung luong (>5MB)" $true "He thong tu choi chinh xac voi ma loi FILE_SIZE_EXCEEDED"
} else {
    Record-Result "Validation - Chan file qua dung luong (>5MB)" $false "Response: $oversizeResJson"
}

# 6.2 Upload file sai dinh dang (file van ban .txt)
$invalidFmtResJson = curl.exe -s -X POST "$baseUrl/api/v1/users/me/avatar" -H "Authorization: Bearer $renterToken" -F "file=@test_invalid.txt;type=text/plain"
$invalidFmtObj = $invalidFmtResJson | ConvertFrom-Json

if ($invalidFmtObj.errorCode -eq "INVALID_FILE_FORMAT" -or $invalidFmtObj.code -eq "INVALID_FILE_FORMAT" -or $invalidFmtResJson -match "INVALID_FILE_FORMAT") {
    Record-Result "Validation - Chan file sai dinh dang (.txt)" $true "He thong tu choi chinh xac voi ma loi INVALID_FILE_FORMAT"
} else {
    Record-Result "Validation - Chan file sai dinh dang (.txt)" $false "Response: $invalidFmtResJson"
}

# 6.3 Upload CCCD thieu mat sau (Missing CCCD side)
$missingSideResJson = curl.exe -s -X POST "$baseUrl/api/v1/users/me/cccd" -H "Authorization: Bearer $renterToken" -F "frontImage=@test_valid.png;type=image/png"
if ($missingSideResJson -match "MISSING_CCCD_SIDE" -or $missingSideResJson -match "Required part" -or $missingSideResJson -match "400") {
    Record-Result "Validation - Chan CCCD thieu 1 mat" $true "He thong tu choi request khi khong gui du ca 2 mat"
} else {
    Record-Result "Validation - Chan CCCD thieu 1 mat" $false "Response: $missingSideResJson"
}

# 6.4 Upload khong co Token xac thuc (Unauthenticated)
$unauthHttp = curl.exe -s -o /dev/null -w "%{http_code}" -X POST "$baseUrl/api/v1/users/me/avatar" -F "file=@test_valid.png;type=image/png"
if ($unauthHttp -eq "401" -or $unauthHttp -eq "403") {
    Record-Result "Security - Chan upload khi chua xac thuc" $true "HTTP status $unauthHttp (Bi chan thanh cong)"
} else {
    Record-Result "Security - Chan upload khi chua xac thuc" $false "HTTP status $unauthHttp (Khong bi chan)"
}

# 6.5 Khach thue (Renter) co upload anh vao xe cua Chu xe (Access Denied)
$forbiddenCarResJson = curl.exe -s -X POST "$baseUrl/api/v1/cars/$carId/photos" -H "Authorization: Bearer $renterToken" -F "file=@test_valid.png;type=image/png"
if ($forbiddenCarResJson -match "403" -or $forbiddenCarResJson -match "CAR_ACCESS_DENIED" -or $forbiddenCarResJson -match "Access Denied" -or $forbiddenCarResJson -match "FORBIDDEN") {
    Record-Result "Security - Chan Renter upload anh xe cua Owner" $true "Phan quyen RBAC chan thanh cong Renter can thiep xe cua Owner"
} else {
    Record-Result "Security - Chan Renter upload anh xe cua Owner" $false "Response: $forbiddenCarResJson"
}

# ------------------------------------------------------------------------------
# 7. Don dep file tam
# ------------------------------------------------------------------------------
Remove-Item -Force -ErrorAction SilentlyContinue test_valid.png, test_valid.jpg, test_invalid.txt, test_oversize.png

# ------------------------------------------------------------------------------
# 8. Bao cao Tong ket
# ------------------------------------------------------------------------------
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "                BANG TONG KET KET QUA KIEM THU                  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
$testResults | Format-Table -AutoSize

Write-Host "TONG SO TEST: $($passCount + $failCount)" -ForegroundColor White
Write-Host "THANH CONG (PASS): $passCount" -ForegroundColor Green
Write-Host "THAT BAI (FAIL): $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
