$headers = @{ "Content-Type" = "application/json" }

Write-Host "=== Unblock User 1 (hung_toyota) ==="
$body = '{"status":"active"}'
$res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/1/status" -Method Patch -Body $body -Headers $headers
Write-Host "Response message: $($res.message)"
Write-Host "User 1 status: $($res.data.status)"
