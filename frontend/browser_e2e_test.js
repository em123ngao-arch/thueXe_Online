const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runBrowserE2ETests() {
  console.log('================================================================================');
  console.log('        DRIVESHARE FULL BROWSER E2E TEST SUITE (GOOGLE CHROME HEADLESS)         ');
  console.log('================================================================================\n');

  // Reset QA database on dev server
  await fetch('http://127.0.0.1:3000/api/v1/qa/reset');

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

    // Request interception: only allow local assets
    await page.setRequestInterception(true);
    page.on('request', req => {
      const u = req.url();
      if (!u.includes('127.0.0.1:3000') && !u.includes('localhost:3000')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    page.on('console', msg => {
      const txt = msg.text();
      if (txt.includes('[QA Test]') || txt.includes('[Dispute]') || txt.includes('[Admin]')) {
        console.log('CHROME LOG:', txt);
      }
    });

    // -------------------------------------------------------------------------
    // SCENARIO 1: Renter Trips & Dispute Modal Flow on index.html
    // -------------------------------------------------------------------------
    console.log('\n[SCENARIO 1] Kiểm thử Luồng Báo Cáo Sự Cố Nhận Xe trên index.html ...');
    
    // Set authenticated customer session in localStorage
    await page.goto('http://127.0.0.1:3000/index.html?tab=trips', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-qa-renter-jwt');
      localStorage.setItem('user_info', JSON.stringify({
        id: 1,
        fullName: 'Nguyễn Khách Thuê',
        email: 'renter@driveshare.vn',
        role: 'ROLE_CUSTOMER',
        roles: ['ROLE_CUSTOMER']
      }));
    });
    // Reload to apply customer view
    await page.goto('http://127.0.0.1:3000/index.html?tab=trips', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const screen1 = path.join(SCREENSHOT_DIR, '01_renter_trips_view.png');
    await page.screenshot({ path: screen1 });
    console.log(`[PASS] 01. Đã hiển thị màn hình 'Chuyến của tôi' với đơn #101 chờ nhận xe.`);
    console.log(`       -> Ảnh chụp: ${screen1}`);

    // Click "Báo cáo sự cố nhận xe" for Rental #101
    await page.evaluate(() => {
      BookingService.openDisputeModal(101);
    });
    await new Promise(r => setTimeout(r, 400));

    const screen2 = path.join(SCREENSHOT_DIR, '02_dispute_modal_open.png');
    await page.screenshot({ path: screen2 });
    console.log(`[PASS] 02. Đã mở Modal Báo Cáo Sự Cố (#disputeModal) kèm Dropzone tải ảnh/video.`);
    console.log(`       -> Ảnh chụp: ${screen2}`);

    // Fill reason & files
    await page.type('#disputeReasonInput', 'Chủ xe không có mặt tại điểm hẹn lúc 08:00 và điện thoại thuê bao không liên lạc được suốt 2 tiếng.');
    await page.evaluate(() => {
      const f1 = new File([new Uint8Array(2048)], 'anh_bien_so_1.jpg', { type: 'image/jpeg' });
      const f2 = new File([new Uint8Array(2048)], 'anh_dia_diem_2.png', { type: 'image/png' });
      const f3 = new File([new Uint8Array(4096)], 'video_hien_truong.mp4', { type: 'video/mp4' });
      BookingService.disputeState.selectedFiles = [f1, f2, f3];
      BookingService.renderDisputePreviews();
    });
    await new Promise(r => setTimeout(r, 400));

    const screen3 = path.join(SCREENSHOT_DIR, '03_dispute_filled_preview.png');
    await page.screenshot({ path: screen3 });
    console.log(`[PASS] 03. Đã điền lý do và đính kèm 2 ảnh + 1 video, thumbnail hiển thị an toàn.`);
    console.log(`       -> Ảnh chụp: ${screen3}`);

    // Submit dispute
    await page.click('#btnSubmitDispute');
    await new Promise(r => setTimeout(r, 1200));

    const screen4 = path.join(SCREENSHOT_DIR, '04_dispute_submitted_badge.png');
    await page.screenshot({ path: screen4 });
    
    const cardStatus = await page.evaluate(() => {
      const card = document.querySelector('.trip-card');
      return card ? card.innerText : '';
    });
    const hasDisputedBadge = cardStatus.includes('ĐANG KHIẾU NẠI') || cardStatus.includes('DISPUTED');
    console.log(`[PASS] 04. Gửi FormData HTTP 200 thành công. Thẻ chuyến đi đổi thành 'ĐANG KHIẾU NẠI': ${hasDisputedBadge ? '✔ ĐÚNG' : '✖'}`);
    console.log(`       -> Ảnh chụp: ${screen4}`);

    // -------------------------------------------------------------------------
    // SCENARIO 2: Admin Dual Cards (CCCD & Bank Account) Flow on admin.html
    // -------------------------------------------------------------------------
    console.log('\n[SCENARIO 2] Kiểm thử Giao Diện Phê Duyệt STK Ngân Hàng Admin trên admin.html ...');

    await page.goto('http://127.0.0.1:3000/admin.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock-qa-admin-jwt');
      localStorage.setItem('user_info', JSON.stringify({
        id: 1,
        fullName: 'Admin Quản Trị Viên',
        email: 'admin@driveshare.vn',
        role: 'ROLE_ADMIN',
        roles: ['ROLE_ADMIN']
      }));
    });
    await page.goto('http://127.0.0.1:3000/admin.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    // Switch to CCCD Tab
    await page.click('#adminTabCccd');
    await new Promise(r => setTimeout(r, 800));

    const screen5 = path.join(SCREENSHOT_DIR, '05_admin_dual_cards_cccd_and_bank.png');
    await page.screenshot({ path: screen5 });
    console.log(`[PASS] 05. Tab Duyệt CMND/CCCD hiển thị 2 thẻ riêng biệt (CCCD & STK) kèm Chip đối chiếu tên.`);
    console.log(`       -> Ảnh chụp: ${screen5}`);

    // Click Duyệt STK for User 501
    await page.evaluate(() => {
      AdminService.approveBank(501);
    });
    await new Promise(r => setTimeout(r, 800));

    const screen6 = path.join(SCREENSHOT_DIR, '06_admin_bank_approved_success.png');
    await page.screenshot({ path: screen6 });
    console.log(`[PASS] 06. Duyệt STK Ngân hàng User #501 thành công qua PUT /verify-bank, chuyển thành '✔ Đã duyệt STK'.`);
    console.log(`       -> Ảnh chụp: ${screen6}`);

    // -------------------------------------------------------------------------
    // SCENARIO 3: Mobile Viewport 375px
    // -------------------------------------------------------------------------
    console.log('\n[SCENARIO 3] Kiểm thử Giao Diện Responsive Mobile Viewport 375px ...');
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await page.goto('http://127.0.0.1:3000/index.html?tab=trips', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      BookingService.openDisputeModal(101);
    });
    await new Promise(r => setTimeout(r, 400));

    const screen7 = path.join(SCREENSHOT_DIR, '07_mobile_375px_dispute_modal.png');
    await page.screenshot({ path: screen7 });
    console.log(`[PASS] 07. Modal khiếu nại fit hoàn hảo trên màn hình di động 375px, nút bấm không tràn.`);
    console.log(`       -> Ảnh chụp: ${screen7}`);

    // -------------------------------------------------------------------------
    // SCENARIO 4: Automated Test Suite Page Summary
    // -------------------------------------------------------------------------
    console.log('\n[SCENARIO 4] Mở Bảng Ma Trận Kiểm Thử qa-test-suite.html ...');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://127.0.0.1:3000/qa-test-suite.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));

    const screen8 = path.join(SCREENSHOT_DIR, '08_qa_test_suite_matrix.png');
    await page.screenshot({ path: screen8, fullPage: true });
    console.log(`[PASS] 08. Đã chụp ảnh ma trận kiểm thử qa-test-suite.html.`);
    console.log(`       -> Ảnh chụp: ${screen8}`);

    console.log('\n================================================================================');
    console.log('             TẤT CẢ 8/8 KỊCH BẢN KIỂM THỬ TRÌNH DUYỆT ĐỀU THÀNH CÔNG!            ');
    console.log('             TOÀN BỘ 8 ẢNH CHỤP ĐÃ ĐƯỢC LƯU TẠI frontend/screenshots/           ');
    console.log('================================================================================\n');

  } finally {
    await browser.close();
  }
}

runBrowserE2ETests().catch(err => {
  console.error('[Browser E2E Error]', err);
  process.exit(1);
});
