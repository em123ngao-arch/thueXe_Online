# Script Reset Du Lieu Upload
Write-Host "=== DANG RESET DU LIEU UPLOAD ===" -ForegroundColor Cyan

# 1. Don dep thu muc uploads
if (Test-Path 'backend/uploads') {
    Remove-Item -Recurse -Force 'backend/uploads/*' -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path 'backend/uploads/driveshare/avatars' | Out-Null
New-Item -ItemType Directory -Force -Path 'backend/uploads/driveshare/cccd' | Out-Null
New-Item -ItemType Directory -Force -Path 'backend/uploads/driveshare/gplx' | Out-Null
New-Item -ItemType Directory -Force -Path 'backend/uploads/cars' | Out-Null
Write-Host "[1/2] Da don sach va tao khung thu muc uploads sach se." -ForegroundColor Green

# 2. Reset du lieu anh trong PostgreSQL
$sqlQuery = "UPDATE users SET avatar_url = NULL WHERE email IN ('renter@driveshare.com', 'owner@driveshare.com'); UPDATE renter_profiles SET id_card_front_url = NULL, id_card_back_url = NULL, license_front_url = NULL, license_verification_status = NULL, verification_status = NULL; UPDATE owner_profiles SET id_card_front_url = NULL, id_card_back_url = NULL, verification_status = NULL; DELETE FROM car_images;"

docker exec driveshare-postgres psql -U postgres -d driveshare_db -c $sqlQuery
Write-Host "[2/2] Da reset du lieu anh trong PostgreSQL ve trang thai ban dau!" -ForegroundColor Green

Write-Host "`n>>> RESET DU LIEU UPLOAD HOAN TAT! SAN SANG DE TEST! <<<" -ForegroundColor Green
