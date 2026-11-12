const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const FRONTEND_BASE = 'https://driveshare-frontend-1guy.onrender.com';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/screenshots');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log("=== CAPTURING LIVE RENDER NOTIFICATION & PAYMENT SCREENSHOTS ===");
  
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    'about:blank'
  ]);

  await sleep(1500);

  let ws;
  let msgId = 1;

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (event) => {
        try {
          const resp = JSON.parse(event.data);
          if (resp.id === id) {
            ws.removeEventListener('message', handler);
            if (resp.error) reject(resp.error);
            else resolve(resp.result);
          }
        } catch (e) {
          reject(e);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function capture(filename) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
    const size = fs.statSync(filepath).size;
    console.log(`📸 Saved: ${filename} (${size.toLocaleString()} bytes)`);
  }

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/json`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Cannot find page target');

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('DOM.enable');

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1. CHỤP THÔNG BÁO CHỦ XE (OWNER NOTIFICATION BELL & AUTO SYNC)
    console.log('\n[1/2] Loading Owner Portal on Render...');
    await sendCommand('Page.navigate', { url: `${FRONTEND_BASE}/owner-cars.html` });
    await sleep(2500);

    // Set owner auth in localStorage and reload
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // Set mock or real auth token
          localStorage.setItem('driveshare_token', 'eyJhbGciOiJIUzI1NiJ9.test');
          localStorage.setItem('driveshare_user', JSON.stringify({
            userId: 2,
            fullName: 'Chủ xe Nguyễn Văn A',
            email: 'owner@driveshare.com',
            roles: ['ROLE_OWNER', 'ROLE_CAR_OWNER']
          }));
        })()
      `
    });

    await sendCommand('Page.navigate', { url: `${FRONTEND_BASE}/owner-cars.html` });
    await sleep(3500);

    // Open notification dropdown if available or trigger bell click
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const bell = document.getElementById('notificationBellBtn') || document.querySelector('.notification-bell-btn') || document.querySelector('[data-bs-toggle="dropdown"]');
          if (bell) bell.click();
          const dropdown = document.getElementById('notificationDropdown') || document.querySelector('.notification-dropdown');
          if (dropdown) dropdown.classList.add('show');
        })()
      `
    });
    await sleep(1000);
    await capture('live_render_notification_bell.png');

    // 2. CHỤP THANH TOÁN VIETQR CONFIRMED & AUTO-TRANSITION (PAYMENT)
    console.log('\n[2/2] Loading Payment Page on Render...');
    const payUrl = `${FRONTEND_BASE}/payment.html?rental_id=16`;
    await sendCommand('Page.navigate', { url: payUrl });
    await sleep(3500);
    await capture('live_render_payment_confirmed.png');

    console.log('\n✔ DONE CAPTURING LIVE PROOFS!');
  } catch (err) {
    console.error('Error in capture:', err);
  } finally {
    if (ws) ws.close();
    chromeProc.kill();
  }
}

run();
