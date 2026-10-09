# Script test upload file avatar
$loginBody = '{"identifier":"renter@driveshare.com","password":"Renter123@"}'
$loginRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = $loginRes.data.access_token
Write-Host "1. Da dang nhap thanh cong, co token!"

# Tao 1 file anh png 1x1 hop le
$base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
$bytes = [Convert]::FromBase64String($base64Png)
[IO.File]::WriteAllBytes("sample_avatar.png", $bytes)
Write-Host "2. Da tao file sample_avatar.png"

# Upload avatar len backend
$uploadJson = curl.exe -s -X POST "http://localhost:8080/api/v1/users/me/avatar" -H "Authorization: Bearer $token" -F "file=@sample_avatar.png;type=image/png"
Write-Host "3. Ket qua upload:" $uploadJson

# Parse URL anh tra ve
$jsonObj = $uploadJson | ConvertFrom-Json
$avatarUrl = $jsonObj.data.avatar_url
Write-Host "4. URL anh tra ve:" $avatarUrl

# Kiem tra tai lai file anh xem co HTTP 200 khong
if ($avatarUrl) {
    $download = curl.exe -s -I $avatarUrl
    Write-Host "5. Header HTTP khi tai anh:"
    Write-Host $download
}

Remove-Item -Force sample_avatar.png
