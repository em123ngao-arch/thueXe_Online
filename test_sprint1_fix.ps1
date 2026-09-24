$baseUrl = "http://localhost:8080"
$results = @()

function Record-Result($id, $feature, $expected, $actual, $status, $notes) {
    $script:results += [PSCustomObject]@{
        ID = $id
        Feature = $feature
        Expected = $expected
        Actual = $actual
        Status = $status
        Notes = $notes
    }
}

Write-Host "================ BAT DAU TEST SPRINT 1 FIX ================" -ForegroundColor Cyan

# TC 1.1: Register duplicate email -> 400 EMAIL_EXISTED
try {
    $regBody = @{
        username = "admin_duplicate_test"
        email = "admin@driveshare.com"
        password = "Password123@"
        phone = "0999999999"
        fullName = "Duplicate Admin"
        role = "RENTER"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -ContentType "application/json" -Body $regBody -ErrorAction Stop
    Record-Result "TC-AUTH-01" "Register email trung" "400 EMAIL_EXISTED" "200 Success" "FAILED" "Khong chan email trung"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $err = ""
    if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
    if ($code -eq 400) {
        Record-Result "TC-AUTH-01" "Register email trung" "400 EMAIL_EXISTED" "$code : $err" "PASSED" "Bat loi email trung thanh cong"
    } else {
        Record-Result "TC-AUTH-01" "Register email trung" "400 EMAIL_EXISTED" "$code : $err" "WARNING" "Ma loi: $code"
    }
}

# TC 1.2: Login Admin
$adminToken = $null
try {
    $loginBody = @{ identifier = "admin"; password = "Admin123@" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    $adminToken = $loginRes.data.access_token
    Record-Result "TC-AUTH-02" "Login Admin" "200 + Access Token" "200 + Token received" "PASSED" "Dang nhap thanh cong"
} catch {
    Record-Result "TC-AUTH-02" "Login Admin" "200 + Access Token" "$($_.Exception.Message)" "FAILED" "Khong the dang nhap"
}

# TC 1.3: Login Renter
$renterToken = $null
try {
    $loginBody = @{ identifier = "renter_demo"; password = "Renter123@" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    $renterToken = $loginRes.data.access_token
    Record-Result "TC-AUTH-03" "Login Renter" "200 + Access Token" "200 + Token received" "PASSED" "Dang nhap Renter thanh cong"
} catch {
    Record-Result "TC-AUTH-03" "Login Renter" "200 + Access Token" "$($_.Exception.Message)" "FAILED" "renter_demo login that bai"
}

# TC 1.4: GET /users/me without token -> 401
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/me" -Method GET -ErrorAction Stop
    Record-Result "TC-AUTH-04" "GET /users/me khong token" "401 Unauthorized" "200 OK" "FAILED" "Khong chan route can auth"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Record-Result "TC-AUTH-04" "GET /users/me khong token" "401 Unauthorized" "401 Unauthorized" "PASSED" "Chan dung khi thieu token"
    } else {
        Record-Result "TC-AUTH-04" "GET /users/me khong token" "401 Unauthorized" "$code" "FAILED" "Ma loi khong phai 401"
    }
}

# TC 1.5: Renter call /admin/users -> 403
if ($renterToken) {
    try {
        $headers = @{ Authorization = "Bearer $renterToken" }
        $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users" -Method GET -Headers $headers -ErrorAction Stop
        Record-Result "TC-AUTH-05" "Renter goi /admin/users" "403 Forbidden" "200 OK" "FAILED" "Renter truy cap duoc API Admin"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 403) {
            Record-Result "TC-AUTH-05" "Renter goi /admin/users" "403 Forbidden" "403 Forbidden" "PASSED" "RBAC chan Renter dung"
        } else {
            Record-Result "TC-AUTH-05" "Renter goi /admin/users" "403 Forbidden" "$code" "WARNING" "Ma loi: $code"
        }
    }
} else {
    Record-Result "TC-AUTH-05" "Renter goi /admin/users" "403 Forbidden" "Skipped" "SKIPPED" "Khong co token Renter de test"
}

# TC 2.1: GET /api/v1/users/me with Renter Token
if ($renterToken) {
    try {
        $headers = @{ Authorization = "Bearer $renterToken" }
        $me = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/me" -Method GET -Headers $headers -ErrorAction Stop
        $data = $me.data
        $hasFields = ($null -ne $data.user_id -and $null -ne $data.username -and $null -ne $data.email)
        if ($hasFields) {
            Record-Result "TC-PROF-01" "GET /users/me tra du field" "user_id, username, email..." "Day du fields" "PASSED" "Profile tra du thong tin"
        } else {
            Record-Result "TC-PROF-01" "GET /users/me tra du field" "user_id, username, email..." "Missing fields" "FAILED" "Thieu field co ban"
        }
    } catch {
        Record-Result "TC-PROF-01" "GET /users/me" "200 OK" "$($_.Exception.Message)" "FAILED" "Loi khi goi /users/me"
    }
}

# TC 2.2: PUT /api/v1/users/me update info
if ($renterToken) {
    try {
        $headers = @{ Authorization = "Bearer $renterToken" }
        $updateBody = @{
            phone = "0912345678"
            address = "123 Duong Test, Quan 1, TP.HCM"
        } | ConvertTo-Json
        $updRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/me" -Method PUT -Headers $headers -ContentType "application/json" -Body $updateBody -ErrorAction Stop
        Record-Result "TC-PROF-02" "PUT /users/me cap nhat SDT, dia chi" "200 OK" "Updated successfully" "PASSED" "Cap nhat thanh cong"
    } catch {
        $err = ""
        if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
        Record-Result "TC-PROF-02" "PUT /users/me cap nhat" "200 OK" "$($_.Exception.Message)" "FAILED" "$err"
    }
}

# TC 2.3: POST /api/v1/users/me/cccd missing side -> 400
if ($renterToken) {
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $headers = @{
            Authorization = "Bearer $renterToken"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes("--$boundary`r`nContent-Disposition: form-data; name=`"frontImage`"; filename=`"front.jpg`"`r`nContent-Type: image/jpeg`r`n`r`nfake-content`r`n--$boundary--`r`n")
        $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/me/cccd" -Method POST -Headers $headers -Body $bodyBytes -ErrorAction Stop
        Record-Result "TC-PROF-03" "Upload CCCD thieu 1 mat" "400 MISSING_CCCD_SIDE" "200 OK" "FAILED" "Khong kiem tra thieu mat CCCD"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $err = ""
        if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
        if ($code -eq 400) {
            Record-Result "TC-PROF-03" "Upload CCCD thieu 1 mat" "400 MISSING_CCCD_SIDE" "$code : $err" "PASSED" "Bat loi thieu mat CCCD dung"
        } else {
            Record-Result "TC-PROF-03" "Upload CCCD thieu 1 mat" "400 MISSING_CCCD_SIDE" "$code : $err" "WARNING" "Ma phan hoi: $code"
        }
    }
}

# TC 3: ADMIN API TESTS
if ($adminToken) {
    $headers = @{ Authorization = "Bearer $adminToken" }
    
    # TC 3.1: GET /api/v1/admin/users?role=RENTER
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users?role=RENTER" -Method GET -Headers $headers -ErrorAction Stop
        Record-Result "TC-ADM-01" "Admin loc user role=RENTER" "200 + List Renter" "200 OK" "PASSED" "Loc danh sach Renter thanh cong"
    } catch {
        $err = ""
        if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
        Record-Result "TC-ADM-01" "Admin loc role=RENTER" "200 OK" "$($_.Exception.Message)" "FAILED" "$err"
    }
    
    # TC 3.2: GET /api/v1/admin/users?role=OWNER
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users?role=OWNER" -Method GET -Headers $headers -ErrorAction Stop
        Record-Result "TC-ADM-02" "Admin loc user role=OWNER" "200 + List Owner" "200 OK" "PASSED" "Loc danh sach Owner thanh cong"
    } catch {
        $err = ""
        if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
        Record-Result "TC-ADM-02" "Admin loc role=OWNER" "200 OK" "$($_.Exception.Message)" "FAILED" "$err"
    }
    
    # TC 3.3: GET /api/v1/admin/users/pending-cccd
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users/pending-cccd" -Method GET -Headers $headers -ErrorAction Stop
        Record-Result "TC-ADM-03" "Admin xem pending CCCD" "200 + List pending" "200 OK" "PASSED" "API pending-cccd hoat dong"
    } catch {
        $err = ""
        if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
        Record-Result "TC-ADM-03" "Admin xem pending CCCD" "200 OK" "$($_.Exception.Message)" "FAILED" "$err"
    }
    
    # TC 3.4: GET /api/v1/admin/cars/pending
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/cars/pending" -Method GET -Headers $headers -ErrorAction Stop
        Record-Result "TC-ADM-04" "Admin xem danh sach xe pending" "200 + List pending cars" "200 OK" "PASSED" "API cars/pending hoat dong"
    } catch {
        $err = ""
        if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
        Record-Result "TC-ADM-04" "Admin xem xe pending" "200 OK" "$($_.Exception.Message)" "FAILED" "$err"
    }
}

# TC 4.1: GET /api/v1/public/cars
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/public/cars" -Method GET -ErrorAction Stop
    $cars = $res.data
    $hasPending = $false
    if ($cars) {
        foreach ($c in $cars) {
            if ($c.status -eq "PENDING") { $hasPending = $true; break }
        }
    }
    if ($hasPending) {
        Record-Result "TC-CAR-01" "Public cars khong tra xe PENDING" "Chi xe ACTIVE" "Co xe PENDING" "FAILED" "Xe PENDING bi lo ra ngoai"
    } else {
        Record-Result "TC-CAR-01" "Public cars khong tra xe PENDING" "Chi xe ACTIVE" "Khong co xe PENDING" "PASSED" "Chi tra xe ACTIVE dung BR-04-2"
    }
} catch {
    $err = ""
    if ($_.ErrorDetails) { $err = $_.ErrorDetails.Message } else { $err = $_.Exception.Message }
    Record-Result "TC-CAR-01" "Public cars" "200 OK" "$($_.Exception.Message)" "FAILED" "$err"
}

Write-Host "`n================ KET QUA TEST CHI TIET ================" -ForegroundColor Cyan
$results | Format-Table -AutoSize -Property ID, Feature, Expected, Actual, Status, Notes
