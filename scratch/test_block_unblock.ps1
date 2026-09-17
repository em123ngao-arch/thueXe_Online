$headers = @{ "Content-Type" = "application/json" }

Write-Host "=== TEST 1: Block Renter (user 4: nam_renter) ==="
$body1 = '{"status":"locked","reason":"Vi pham dieu khoan dich vu"}'
$res1 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/4/status" -Method Patch -Body $body1 -Headers $headers
Write-Host "Status code response message: $($res1.message)"
Write-Host "User 4 status: $($res1.data.status)"

Write-Host "`n=== TEST 2: Block Approved Owner (user 1: hung_toyota) ==="
$body2 = '{"status":"locked","reason":"Gian lan trong giao dich"}'
$res2 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/1/status" -Method Patch -Body $body2 -Headers $headers
Write-Host "Status code response message: $($res2.message)"
Write-Host "User 1 status: $($res2.data.status)"

Write-Host "`n=== TEST 3: Unblock Renter (user 4: nam_renter) ==="
$body3 = '{"status":"active"}'
$res3 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/4/status" -Method Patch -Body $body3 -Headers $headers
Write-Host "Status code response message: $($res3.message)"
Write-Host "User 4 status: $($res3.data.status)"

Write-Host "`n=== TEST 4: Verify in Database & Audit Trail ==="
