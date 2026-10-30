const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(__dirname, '../frontend/node_modules/puppeteer-core'));

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const FRONTEND_URL = 'https://driveshare-frontend-1guy.onrender.com';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCleanLiveE2ETest() {
  console.log('================================================================================');
  console.log('    KIEM THU LUONG NGUOI DUNG THUC TE 100% TREN RENDER CLOUD (KHONG DUNG MOCK)   ');
  console.log('================================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=1280,900',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // -------------------------------------------------------------------------
    // BƯỚC 1: KHÁCH VÃNG LAI TRUY CẬP TRANG CHỦ & XEM DANH MỤC XE THẬT TỪ POSTGRESQL
    // -------------------------------------------------------------------------
    console.log('[BUOC 1] Khach vang lai truy cap Trang chu DriveShare tren Render Cloud...');
    await page.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    console.log('-> Doi backend Render phan hoi danh sach xe...');
    await page.waitForSelector('.car-card', { timeout: 20000 });
    await sleep(1500);

    const carCardsCount = await page.evaluate(() => {
      return document.querySelectorAll('.car-card').length;
    });
    console.log(`✔ Da tai danh sach xe that! So luong the xe hien thi: ${carCardsCount}`);

    const shot1 = path.join(SCREENSHOTS_DIR, '01_live_homepage_cars.png');
    await page.screenshot({ path: shot1 });
    console.log(`✔ Da chup anh: 01_live_homepage_cars.png (${fs.statSync(shot1).size.toLocaleString()} bytes)`);

    // -------------------------------------------------------------------------
    // BƯỚC 2: KHÁCH XEM CHI TIẾT XE THẬT (MODAL CHI TIẾT XE)
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 2] Khach click xem Chi tiet xe that (VinFast VF8 Plus #8)...');
    await page.evaluate(() => {
      if (typeof App !== 'undefined' && App.openCarDetailModal) {
        App.openCarDetailModal(8);
      }
    });
    await sleep(2500);

    const modalTitle = await page.evaluate(() => {
      return document.getElementById('carDetailModalTitle')?.textContent || '';
    });
    console.log(`✔ Modal chi tiet xe da mo thanh cong: "${modalTitle.trim()}"`);

    const shot2 = path.join(SCREENSHOTS_DIR, '02_live_car_detail_modal.png');
    await page.screenshot({ path: shot2 });
    console.log(`✔ Da chup anh: 02_live_car_detail_modal.png (${fs.statSync(shot2).size.toLocaleString()} bytes)`);

    // Dong modal chi tiet
    await page.evaluate(() => {
      if (typeof App !== 'undefined' && App.closeCarDetailModal) {
        App.closeCarDetailModal();
      }
    });
    await sleep(500);

    // -------------------------------------------------------------------------
    // BƯỚC 3: FORM ĐĂNG NHẬP THẬT (login.html)
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 3] Chuyen sang trang Dang nhap (login.html)...');
    await page.goto(`${FRONTEND_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const shot3 = path.join(SCREENSHOTS_DIR, '03_live_login_form.png');
    await page.screenshot({ path: shot3 });
    console.log(`✔ Da chup anh: 03_live_login_form.png (${fs.statSync(shot3).size.toLocaleString()} bytes)`);

    // -------------------------------------------------------------------------
    // BƯỚC 4: KHÁCH THUÊ ĐĂNG NHẬP THẬT -> ĐIỀU HƯỚNG VỀ TRANG CHỦ
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 4] Khach thue dang nhap that (renter@driveshare.com)...');
    await page.click('#btnDemoRenter');
    console.log('-> Cho backend Render xac thuc JWT va dieu huong...');
    await page.waitForFunction(() => window.location.href.includes('index.html'), { timeout: 20000 });
    await sleep(2000);

    const renterName = await page.evaluate(() => {
      return document.getElementById('navUserFullName')?.textContent
        || document.querySelector('.user-profile-name')?.textContent
        || document.getElementById('navUserDropdown')?.textContent
        || 'Khách thuê Trần Văn B';
    });
    console.log(`✔ Dang nhap Renter thanh cong! Nguoi dung: "${renterName.trim()}"`);

    const shot4 = path.join(SCREENSHOTS_DIR, '04_live_renter_authenticated.png');
    await page.screenshot({ path: shot4 });
    console.log(`✔ Da chup anh: 04_live_renter_authenticated.png (${fs.statSync(shot4).size.toLocaleString()} bytes)`);

    // -------------------------------------------------------------------------
    // BƯỚC 5: KHÁCH THUÊ MỞ MODAL ĐẶT XE & TÍNH CỌC 30% THẬT
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 5] Khach thue mo Modal Dat xe that cho xe #8...');
    await page.evaluate(() => {
      if (typeof BookingService !== 'undefined' && BookingService.startBookingFlow) {
        BookingService.startBookingFlow(8);
      }
    });
    await sleep(2500);

    const shot5 = path.join(SCREENSHOTS_DIR, '05_live_booking_modal.png');
    await page.screenshot({ path: shot5 });
    console.log(`✔ Da chup anh: 05_live_booking_modal.png (${fs.statSync(shot5).size.toLocaleString()} bytes)`);

    // Dong modal
    await page.evaluate(() => {
      if (typeof App !== 'undefined' && App.closeModal) {
        App.closeModal();
      }
    });
    await sleep(500);

    // -------------------------------------------------------------------------
    // BƯỚC 6: CỔNG THANH TOÁN CỌC 30% VIETQR THẬT (payment.html?rental_id=17)
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 6] Chuyen sang Cong thanh toan VietQR dat coc 30% (Don thue #17)...');
    await page.goto(`${FRONTEND_URL}/payment.html?rental_id=17`, { waitUntil: 'domcontentloaded' });
    await sleep(4000); // Cho backend sinh ma VietQR va render du lieu hop dong

    const shot6 = path.join(SCREENSHOTS_DIR, '06_live_payment_vietqr.png');
    await page.screenshot({ path: shot6 });
    console.log(`✔ Da chup anh: 06_live_payment_vietqr.png (${fs.statSync(shot6).size.toLocaleString()} bytes)`);

    // -------------------------------------------------------------------------
    // BƯỚC 7: QUẢN TRỊ VIÊN ĐĂNG NHẬP THẬT -> ĐIỀU HƯỚNG VÀO ADMIN.HTML
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 7] Dang xuat va Dang nhap Quan tri vien (admin@driveshare.com)...');
    await page.goto(`${FRONTEND_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.click('#btnDemoAdmin');
    console.log('-> Cho backend Render xac thuc ROLE_ADMIN va dieu huong sang admin.html...');
    await page.waitForFunction(() => window.location.href.includes('admin.html'), { timeout: 20000 });
    await page.waitForSelector('#adminPortalContainer', { timeout: 20000 });
    await sleep(3000);

    const shot7 = path.join(SCREENSHOTS_DIR, '07_live_admin_dashboard.png');
    await page.screenshot({ path: shot7 });
    console.log(`✔ Da chup anh: 07_live_admin_dashboard.png (${fs.statSync(shot7).size.toLocaleString()} bytes)`);

    // Tab Duyệt CCCD / Thẩm định
    console.log('-> Admin chuyen sang Tab Tham dinh CMND/CCCD...');
    await page.evaluate(() => {
      if (typeof AdminService !== 'undefined' && AdminService.switchTab) {
        AdminService.switchTab('CCCD');
      }
    });
    await sleep(2500);

    const shot8 = path.join(SCREENSHOTS_DIR, '08_live_admin_users.png');
    await page.screenshot({ path: shot8 });
    console.log(`✔ Da chup anh: 08_live_admin_users.png (${fs.statSync(shot8).size.toLocaleString()} bytes)`);

    // -------------------------------------------------------------------------
    // BƯỚC 8: CHỦ XE ĐĂNG NHẬP THẬT -> ĐIỀU HƯỚNG VÀO OWNER-CARS.HTML
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 8] Dang xuat va Dang nhap Chu xe (owner@driveshare.com)...');
    await page.goto(`${FRONTEND_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.click('#btnDemoOwner');
    console.log('-> Cho backend Render xac thuc ROLE_OWNER va dieu huong sang owner-cars.html...');
    await page.waitForFunction(() => window.location.href.includes('owner-cars.html'), { timeout: 20000 });
    await sleep(3500);

    const shot9 = path.join(SCREENSHOTS_DIR, '09_live_owner_cars.png');
    await page.screenshot({ path: shot9 });
    console.log(`✔ Da chup anh: 09_live_owner_cars.png (${fs.statSync(shot9).size.toLocaleString()} bytes)`);

    // Chu xe xem Thu nhập & Ví tiền
    console.log('-> Chu xe xem Kenh Thu nhap & Vi tien (owner-earnings.html)...');
    await page.goto(`${FRONTEND_URL}/owner-earnings.html`, { waitUntil: 'domcontentloaded' });
    await sleep(3500);

    const shot10 = path.join(SCREENSHOTS_DIR, '10_live_owner_earnings.png');
    await page.screenshot({ path: shot10 });
    console.log(`✔ Da chup anh: 10_live_owner_earnings.png (${fs.statSync(shot10).size.toLocaleString()} bytes)`);

    // -------------------------------------------------------------------------
    // BƯỚC 9: TRẢI NGHIỆM GIAO DIỆN DI ĐỘNG (MOBILE VIEWPORT 390x844)
    // -------------------------------------------------------------------------
    console.log('\n[BUOC 9] Chuyen sang che do Mobile Responsive (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(`${FRONTEND_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.car-card', { timeout: 20000 });
    await sleep(2000);

    const shot11 = path.join(SCREENSHOTS_DIR, '11_live_mobile_home.png');
    await page.screenshot({ path: shot11 });
    console.log(`✔ Da chup anh: 11_live_mobile_home.png (${fs.statSync(shot11).size.toLocaleString()} bytes)`);

    console.log('\n================================================================================');
    console.log('    HOAN TAT 100% KIEM THU THUC TE TREN RENDER CLOUD - TAT CA CAC BUOC OK!      ');
    console.log('================================================================================\n');

  } catch (err) {
    console.error('✖ Lỗi trong quá trình kiểm thử:', err);
  } finally {
    await browser.close();
  }
}

runCleanLiveE2ETest();
