const path = require('path');
const puppeteer = require(path.join(__dirname, '../frontend/node_modules/puppeteer-core'));

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\5cb84c88-a7a5-40e7-9854-f7e843d8b615';

async function capture() {
  console.log('Chụp ảnh bình luận giao việc trên Issue #50...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,1000']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.goto('https://github.com/em123ngao-arch/thueXe_Online/issues/50', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Scroll down to the comment
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 1000));

    const out = path.join(ARTIFACT_DIR, 'issue_50_comment_proof.png');
    await page.screenshot({ path: out });
    console.log('✔ Đã lưu ảnh Issue #50 comment proof:', out);
    await page.close();
  } catch (e) {
    console.error('Lỗi chụp ảnh:', e);
  } finally {
    await browser.close();
  }
}

capture();
