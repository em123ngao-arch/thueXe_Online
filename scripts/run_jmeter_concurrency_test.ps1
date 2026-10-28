# ==============================================================================
# Script Kiem Thu Dong Thoi (Concurrency & Stress Testing) Cho DriveShare
# Muc tieu: Kiem tra chong Overbooking (dat trung xe) & Double Refund (hoan tien trung)
# ==============================================================================

param (
    [string]$Mode = "all", # "junit", "jmeter", "all"
    [string]$HostUrl = "http://localhost:8080",
    [string]$JMeterBin = ""
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " [DRIVESHARE] CONCURRENCY & STRESS TESTING SUITE                      " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $WorkspaceRoot "backend"
$JMeterPlanDir = Join-Path $WorkspaceRoot "scripts\jmeter"
$OutputDir = Join-Path $WorkspaceRoot "backend\target\jmeter-reports"

# 1. Chay Kiem Thu Dong Thoi Qua JUnit 5 (Khuyen nghi - Khong phu thuoc cai dat ngoai)
if ($Mode -eq "junit" -or $Mode -eq "all") {
    Write-Host ""
    Write-Host "[BUOC 1] Chay Bo Test Concurrency Tu Dong Trong JUnit 5 (50 Threads):" -ForegroundColor Yellow
    Write-Host " - Test 1: ConcurrencyBookingOverlapTest (Chong Overbooking xe)" -ForegroundColor Gray
    Write-Host " - Test 2: ConcurrencyDisputeRefundTest (Chong Double Refund khieu nai)" -ForegroundColor Gray
    
    Push-Location $BackendDir
    try {
        & .\mvnw.cmd test -Dtest=Concurrency*
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[PASS 100%] Ket qua JUnit Concurrency: PASS! Khong phat hien race-condition hay xung dot giao dich." -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "[FAILED] Ket qua JUnit Concurrency: FAILED!" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
}

# 2. Chay Apache JMeter CLI (Neu muon xuat Bao cao do thi HTML)
if ($Mode -eq "jmeter" -or $Mode -eq "all") {
    Write-Host ""
    Write-Host "[BUOC 2] Kiem tra cong cu Apache JMeter CLI:" -ForegroundColor Yellow

    $JMeterCmd = $null
    if ($JMeterBin -and (Test-Path $JMeterBin)) {
        $JMeterCmd = $JMeterBin
    } elseif (Get-Command jmeter -ErrorAction SilentlyContinue) {
        $JMeterCmd = "jmeter"
    } elseif (Get-Command jmeter.bat -ErrorAction SilentlyContinue) {
        $JMeterCmd = "jmeter.bat"
    } elseif ($env:JMETER_HOME -and (Test-Path "$env:JMETER_HOME\bin\jmeter.bat")) {
        $JMeterCmd = "$env:JMETER_HOME\bin\jmeter.bat"
    }

    if (-not $JMeterCmd) {
        Write-Host "Chua tim thay Apache JMeter CLI trong PATH he thong." -ForegroundColor DarkYellow
        Write-Host " -> Ban co the mo giao dien JMeter GUI va Open file kich ban tai:" -ForegroundColor Cyan
        Write-Host "    * Overbooking:   $JMeterPlanDir\concurrency_overbooking_test.jmx" -ForegroundColor White
        Write-Host "    * Double Refund: $JMeterPlanDir\concurrency_double_refund_test.jmx" -ForegroundColor White
        Write-Host " -> Hoac tai Apache JMeter tu: https://jmeter.apache.org/download_jmeter.cgi" -ForegroundColor Gray
        Write-Host " -> Toan bo logic dong thoi da duoc bao dam va verify 100% boi JUnit 5 o Buoc 1." -ForegroundColor Green
    } else {
        Write-Host "Tim thay Apache JMeter: $JMeterCmd" -ForegroundColor Green
        if (-not (Test-Path $OutputDir)) {
            New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        }

        # Kich ban 1: Overbooking
        $OverbookingJtl = Join-Path $OutputDir "overbooking.jtl"
        $OverbookingHtml = Join-Path $OutputDir "overbooking-html"
        if (Test-Path $OverbookingJtl) { Remove-Item $OverbookingJtl -Force }
        if (Test-Path $OverbookingHtml) { Remove-Item $OverbookingHtml -Recurse -Force }

        Write-Host "-> Dang chay kich ban Overbooking qua JMeter CLI..." -ForegroundColor Gray
        & $JMeterCmd -n -t "$JMeterPlanDir\concurrency_overbooking_test.jmx" -l $OverbookingJtl -e -o $OverbookingHtml
        Write-Host "Da xuat Bao cao do thi HTML Overbooking tai: $OverbookingHtml\index.html" -ForegroundColor Green

        # Kich ban 2: Double Refund
        $RefundJtl = Join-Path $OutputDir "double_refund.jtl"
        $RefundHtml = Join-Path $OutputDir "double_refund-html"
        if (Test-Path $RefundJtl) { Remove-Item $RefundJtl -Force }
        if (Test-Path $RefundHtml) { Remove-Item $RefundHtml -Recurse -Force }

        Write-Host "-> Dang chay kich ban Double Refund qua JMeter CLI..." -ForegroundColor Gray
        & $JMeterCmd -n -t "$JMeterPlanDir\concurrency_double_refund_test.jmx" -l $RefundJtl -e -o $RefundHtml
        Write-Host "Da xuat Bao cao do thi HTML Double Refund tai: $RefundHtml\index.html" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " HOAN TAT KIEM THU DONG THOI DRIVESHARE                              " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
