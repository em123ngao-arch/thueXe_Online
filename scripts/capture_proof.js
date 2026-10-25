const path = require('path');
const puppeteer = require(path.join(__dirname, '../frontend/node_modules/puppeteer-core'));
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\5cb84c88-a7a5-40e7-9854-f7e843d8b615';

async function capture() {
  console.log('Khởi động Chrome để chụp ảnh bằng chứng...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,900']
  });

  try {
    // 1. Chụp trang GitHub Issues
    console.log('[1/2] Đang chụp trang GitHub Issues: https://github.com/em123ngao-arch/thueXe_Online/issues');
    const page1 = await browser.newPage();
    await page1.setViewport({ width: 1280, height: 900 });
    await page1.goto('https://github.com/em123ngao-arch/thueXe_Online/issues', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const out1 = path.join(ARTIFACT_DIR, 'github_issues_proof.png');
    await page1.screenshot({ path: out1 });
    console.log('✔ Đã lưu ảnh GitHub Issues:', out1);
    await page1.close();

    // 2. Chụp trang Modal Điều khoản an toàn (Điều 175 BLHS)
    console.log('[2/2] Đang chụp Modal Điều Khoản Pháp Lý trên frontend local...');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1280, height: 900 });
    const localUrl = 'file:///' + path.resolve(__dirname, '../frontend/index.html').replace(/\\/g, '/');
    await page2.goto(localUrl, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Kích hoạt mở modal
    await page2.evaluate(() => {
      const el = document.getElementById('legalTermsModalOverlay');
      if (el) {
        el.style.display = 'flex';
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.classList.add('open');
      }
    });
    await new Promise(r => setTimeout(r, 1200));
    const out2 = path.join(ARTIFACT_DIR, 'legal_terms_modal_proof.png');
    await page2.screenshot({ path: out2 });
    console.log('✔ Đã lưu ảnh Modal Điều Khoản:', out2);
    await page2.close();

    console.log('HOÀN TẤT CHỤP ẢNH BẰNG CHỨNG!');
  } catch (err) {
    console.error('Lỗi khi chụp ảnh:', err);
  } finally {
    await browser.close();
  }
}

capture();
