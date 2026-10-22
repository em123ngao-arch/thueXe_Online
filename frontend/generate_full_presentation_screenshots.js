const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function generateScreenshots() {
  console.log('================================================================================');
  console.log('   DRIVESHARE AUTOMATED PRESENTATION SCREENSHOT CAPTURE (PUPPETEER-CORE)        ');
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
    // 1. Homepage
    console.log('[1/6] Capturing 01_homepage_overview.png ...');
    const page1 = await browser.newPage();
    await page1.setViewport({ width: 1280, height: 900 });
    await page1.goto('http://127.0.0.1:3000/index.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page1.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage_overview.png') });
    await page1.close();

    // 2. Login Page with 1-click Demo buttons
    console.log('[2/6] Capturing 02_login_page_demo_buttons.png ...');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1280, height: 900 });
    await page2.goto('http://127.0.0.1:3000/login.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page2.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_page_demo_buttons.png') });
    await page2.close();

    // 3. Owner Cars Dashboard
    console.log('[3/6] Capturing 03_owner_cars_dashboard.png ...');
    const page3 = await browser.newPage();
    await page3.setViewport({ width: 1280, height: 900 });
    await page3.evaluateOnNewDocument(() => {
      localStorage.setItem('access_token', 'mock-owner-token');
      localStorage.setItem('ds_access_token', 'mock-owner-token');
      localStorage.setItem('user_info', JSON.stringify({
        id: 2,
        fullName: 'Trần Văn Chủ Xe (Demo)',
        email: 'owner@driveshare.com',
        role: 'ROLE_OWNER',
        roles: ['ROLE_OWNER']
      }));
    });
    await page3.goto('http://127.0.0.1:3000/owner-cars.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page3.screenshot({ path: path.join(SCREENSHOT_DIR, '03_owner_cars_dashboard.png') });
    await page3.close();

    // 4. Owner Earnings & Wallet
    console.log('[4/6] Capturing 04_owner_earnings_wallet.png ...');
    const page4 = await browser.newPage();
    await page4.setViewport({ width: 1280, height: 900 });
    await page4.evaluateOnNewDocument(() => {
      localStorage.setItem('access_token', 'mock-owner-token');
      localStorage.setItem('ds_access_token', 'mock-owner-token');
      localStorage.setItem('user_info', JSON.stringify({
        id: 2,
        fullName: 'Trần Văn Chủ Xe (Demo)',
        email: 'owner@driveshare.com',
        role: 'ROLE_OWNER',
        roles: ['ROLE_OWNER']
      }));
    });
    await page4.goto('http://127.0.0.1:3000/owner-earnings.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page4.screenshot({ path: path.join(SCREENSHOT_DIR, '04_owner_earnings_wallet.png') });
    await page4.close();

    // 5. Admin Portal
    console.log('[5/6] Capturing 05_admin_portal_overview.png ...');
    const page5 = await browser.newPage();
    await page5.setViewport({ width: 1280, height: 900 });
    await page5.evaluateOnNewDocument(() => {
      localStorage.setItem('access_token', 'mock-admin-token');
      localStorage.setItem('ds_access_token', 'mock-admin-token');
      localStorage.setItem('user_info', JSON.stringify({
        id: 1,
        fullName: 'Nguyễn Quản Trị Viên (Admin)',
        email: 'admin@driveshare.com',
        role: 'ROLE_ADMIN',
        roles: ['ROLE_ADMIN']
      }));
    });
    await page5.goto('http://127.0.0.1:3000/admin.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page5.screenshot({ path: path.join(SCREENSHOT_DIR, '05_admin_portal_overview.png') });
    await page5.close();

    // 6. Live Cloud on Render
    console.log('[6/6] Capturing 06_render_cloud_live_homepage.png ...');
    const page6 = await browser.newPage();
    await page6.setViewport({ width: 1280, height: 900 });
    try {
      await page6.goto('https://driveshare-frontend.onrender.com', { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));
      await page6.screenshot({ path: path.join(SCREENSHOT_DIR, '06_render_cloud_live_homepage.png') });
      console.log('Successfully captured Render cloud live screenshot!');
    } catch (err) {
      console.warn('Render screenshot capture timeout/warning:', err.message);
    }
    await page6.close();

    console.log('\nAll presentation screenshots captured successfully in frontend/screenshots/ !');
  } finally {
    await browser.close();
  }
}

generateScreenshots().catch(console.error);
