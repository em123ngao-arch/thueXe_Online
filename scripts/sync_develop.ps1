# ==============================================================================
# Script Dong Bo Nhanh Hien Tai Voi develop (DriveShare Team Git Helper)
# Huong dan su dung: Chay .\scripts\sync_develop.ps1 truoc khi bat dau code moi ngay
# ==============================================================================

Write-Host "=== DANG DONG BO VOI NHANH DEVELOP MOI NHAT ===" -ForegroundColor Cyan

# 1. Kiem tra xem co code dang sua do khong
$status = git status --porcelain
$hasStash = $false

if ($status) {
    Write-Host "[1/4] Phat hien code dang sua do, tam thoi cat vao Git Stash..." -ForegroundColor Yellow
    git stash push -m "Auto-stash truoc khi sync develop"
    $hasStash = $true
} else {
    Write-Host "[1/4] Thu muc lam viec sach se." -ForegroundColor Green
}

# 2. Lay code moi nhat tu GitHub
Write-Host "[2/4] Dang keo code moi nhat tu origin/develop ve..." -ForegroundColor Yellow
git fetch origin develop

# 3. Gop origin/develop vao nhanh hien tai
$currentBranch = (git branch --show-current)
Write-Host "[3/4] Dang gop code moi vao nhanh [$currentBranch]..." -ForegroundColor Yellow
git merge origin/develop --no-edit

if ($LASTEXITCODE -ne 0) {
    Write-Host "CANH BAO: Co xung dot (Merge Conflict)! Vui long mo file va giai quyet xung dot truoc khi tiep tuc." -ForegroundColor Red
    exit 1
}

# 4. Khoi phuc lai code dang sua do
if ($hasStash) {
    Write-Host "[4/4] Dang lay lai code dang sua do tu Git Stash..." -ForegroundColor Yellow
    git stash pop
} else {
    Write-Host "[4/4] Khong co code tam." -ForegroundColor Green
}

Write-Host "`n>>> DONG BO THANH CONG! Nhanh [$currentBranch] da san sang de lam viec! <<<" -ForegroundColor Green
