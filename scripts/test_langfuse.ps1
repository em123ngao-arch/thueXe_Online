# Script kiem thu Langfuse Tracing tren Windows PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "KIEM THU KET NOI LANGFUSE OBSERVABILITY & TRACING" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Kiem tra Backend cong 8080
$backendUrl = "http://localhost:8080/api/v1"
Write-Host "`n[1] Kiem tra ket noi Backend ($backendUrl)..." -ForegroundColor White

try {
    $statusRes = Invoke-RestMethod -Uri "$backendUrl/chat/langfuse-status" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Backend dang chay! Trang thai Langfuse:" -ForegroundColor Green
    $statusRes.data | Format-List
} catch {
    Write-Host "[CANH BAO] Chua phat hien Backend chay o cong 8080!" -ForegroundColor Red
    Write-Host "Huong dan bat Backend: mo Terminal moi va chay:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  .\mvnw.cmd spring-boot:run" -ForegroundColor Yellow
    exit 1
}

# 2. Gui mot Trace mau len Langfuse Cloud
Write-Host "`n[2] Gui mot Trace mau len Langfuse Dashboard..." -ForegroundColor White

$bodyObj = @{
    prompt = "Khach hoi: Toi muon thue xe 7 cho di du lich Da Lat 3 ngay gia duoi 1 trieu, tinh tien coc giup toi"
    reply = "Da chao anh/chi! Em goi y xe Mitsubishi Xpander 2023 (7 cho, so tu dong) gia 850.000 d/ngay. Tong 3 ngay la 2.550.000 d. Tien coc giu xe 30% qua VietQR la 765.000 d. Con lai 1.785.000 d thanh toan khi nhan xe a!"
}
$jsonBody = $bodyObj | ConvertTo-Json -Compress

try {
    $traceRes = Invoke-RestMethod -Uri "$backendUrl/chat/langfuse-test-trace" `
        -Method Post `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonBody)) `
        -ContentType "application/json; charset=utf-8" `
        -TimeoutSec 10 `
        -ErrorAction Stop

    Write-Host "[THANH CONG] GUI TRACE THANH CONG LEN CLOUD LANGFUSE!" -ForegroundColor Green
    Write-Host "   - Trace ID: $($traceRes.data)" -ForegroundColor Cyan
    Write-Host "   - Thong bao: $($traceRes.message)" -ForegroundColor Gray
    Write-Host "`n[HUONG DAN] HAY MO TRINH DUYET VAO: https://cloud.langfuse.com" -ForegroundColor Yellow
    Write-Host "   Vao muc Traces -> ban se thay Trace ID $($traceRes.data) xuat hien ngay lap tuc!" -ForegroundColor White
} catch {
    Write-Host "[LOI] Gap loi khi gui trace: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
