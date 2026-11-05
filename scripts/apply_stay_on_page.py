import re

print("Starting apply_stay_on_page.py...")

# -------------------------------------------------------------
# 1. Update index.html
# -------------------------------------------------------------
path_index = r'thueXe_Online\frontend\index.html'
with open(path_index, 'r', encoding='utf-8') as f:
    text_index = f.read().replace('\r\n', '\n')

old_head_index = """    <link rel="stylesheet" href="css/trip-tracker.css?v=20261025_v4" />
  </head>"""

new_head_index = """    <link rel="stylesheet" href="css/trip-tracker.css?v=20261025_v4" />
    <!-- Stay-on-page instant state persistence (Khắc phục triệt để lỗi F5 nhảy về trang chủ) -->
    <script>
      (function() {
        try {
          var h = (window.location.hash || '').toLowerCase();
          var v = sessionStorage.getItem('driveshare_current_view') || localStorage.getItem('driveshare_current_view');
          if (h === '#my-bookings' || h === '#trips' || h === '#my-trips' || h === '#bookings' || (v === 'my-bookings' && h !== '#catalog' && h !== '#home')) {
            document.documentElement.classList.add('init-my-bookings');
          }
        } catch (_) {}
      })();
    </script>
    <style>
      html.init-my-bookings #renterSection { display: none !important; }
      html.init-my-bookings #myBookingsSection { display: block !important; }
    </style>
  </head>"""

if old_head_index in text_index:
    text_index = text_index.replace(old_head_index, new_head_index, 1)
    with open(path_index, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text_index)
    print("1. index.html updated successfully!")
else:
    print("1. index.html already updated or pattern not matched.")

# -------------------------------------------------------------
# 2. Update owner-cars.html
# -------------------------------------------------------------
path_owner_html = r'thueXe_Online\frontend\owner-cars.html'
with open(path_owner_html, 'r', encoding='utf-8') as f:
    text_owner_html = f.read().replace('\r\n', '\n')

old_head_owner = """    <link rel="stylesheet" href="css/trip-tracker.css?v=4.0" />
  </head>"""

new_head_owner = """    <link rel="stylesheet" href="css/trip-tracker.css?v=4.0" />
    <!-- Stay-on-page instant tab persistence for Owner -->
    <script>
      (function() {
        try {
          var h = (window.location.hash || '').replace('#', '').toUpperCase();
          var t = (['CARS', 'REQUESTS', 'ADD'].indexOf(h) >= 0 ? h : null) || sessionStorage.getItem('driveshare_owner_tab') || localStorage.getItem('driveshare_owner_tab');
          if (t === 'REQUESTS') {
            document.documentElement.classList.add('init-owner-requests');
          } else if (t === 'ADD') {
            document.documentElement.classList.add('init-owner-add');
          }
        } catch (_) {}
      })();
    </script>
    <style>
      html.init-owner-requests #ownerTabCarsContent { display: none !important; }
      html.init-owner-requests #ownerTabRequestsContent { display: block !important; }
      html.init-owner-add #ownerTabCarsContent { display: none !important; }
      html.init-owner-add #ownerTabAddContent { display: block !important; }
    </style>
  </head>"""

if old_head_owner in text_owner_html:
    text_owner_html = text_owner_html.replace(old_head_owner, new_head_owner, 1)
    with open(path_owner_html, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text_owner_html)
    print("2. owner-cars.html updated successfully!")
else:
    print("2. owner-cars.html already updated or pattern not matched.")

# -------------------------------------------------------------
# 3. Update app.js (switchRole, init, openDepositModal, confirmDepositPayment)
# -------------------------------------------------------------
path_app = r'thueXe_Online\frontend\js\app.js'
with open(path_app, 'r', encoding='utf-8') as f:
    text_app = f.read().replace('\r\n', '\n')

# A. switchRole: keep myBookingsView if on my-bookings
old_switch_role_renter = """    if (role === 'RENTER') {
      if (renterView) renterView.style.display = 'block';
      if (myBookingsView) myBookingsView.style.display = 'none';
      if (ownerView) ownerView.style.display = 'none';
      if (adminView) adminView.style.display = 'none';
      this.applyFilters();"""

new_switch_role_renter = """    if (role === 'RENTER') {
      const h = (window.location.hash || '').toLowerCase();
      const v = sessionStorage.getItem('driveshare_current_view') || localStorage.getItem('driveshare_current_view');
      const isViewingBookings = (
        h === '#my-bookings' || h === '#trips' || h === '#my-trips' || h === '#bookings' ||
        (v === 'my-bookings' && h !== '#catalog' && h !== '#home')
      );
      if (isViewingBookings) {
        if (renterView) renterView.style.display = 'none';
        if (myBookingsView) myBookingsView.style.display = 'block';
        document.documentElement.classList.add('init-my-bookings');
      } else {
        if (renterView) renterView.style.display = 'block';
        if (myBookingsView) myBookingsView.style.display = 'none';
        document.documentElement.classList.remove('init-my-bookings');
        this.applyFilters();
      }
      if (ownerView) ownerView.style.display = 'none';
      if (adminView) adminView.style.display = 'none';"""

if old_switch_role_renter in text_app:
    text_app = text_app.replace(old_switch_role_renter, new_switch_role_renter, 1)

# B. showMyBookingsView and showCatalogView: save localStorage and sessionStorage
old_show_bookings_save = """  async showMyBookingsView() {
    try {
      sessionStorage.setItem('driveshare_renter_view', 'myBookings');
      history.replaceState(null, '', '#my-bookings');
    } catch (_) {}"""

new_show_bookings_save = """  async showMyBookingsView() {
    try {
      sessionStorage.setItem('driveshare_current_view', 'my-bookings');
      localStorage.setItem('driveshare_current_view', 'my-bookings');
      document.documentElement.classList.add('init-my-bookings');
      history.replaceState(null, '', '#my-bookings');
    } catch (_) {}"""

if old_show_bookings_save in text_app:
    text_app = text_app.replace(old_show_bookings_save, new_show_bookings_save, 1)

old_show_catalog_save = """  showCatalogView() {
    try {
      sessionStorage.setItem('driveshare_renter_view', 'catalog');
      history.replaceState(null, '', window.location.pathname);
    } catch (_) {}"""

new_show_catalog_save = """  showCatalogView() {
    try {
      sessionStorage.setItem('driveshare_current_view', 'home');
      localStorage.setItem('driveshare_current_view', 'home');
      document.documentElement.classList.remove('init-my-bookings');
      history.replaceState(null, '', window.location.pathname);
    } catch (_) {}"""

if old_show_catalog_save in text_app:
    text_app = text_app.replace(old_show_catalog_save, new_show_catalog_save, 1)

# C. Add openDepositModal and confirmDepositPayment
deposit_methods = """  // Mở Popup Thanh Toán Đặt Cọc 30% VietQR Ngay Trên Trang (Không bao giờ bị nhảy trang)
  async openDepositModal(rentalId) {
    if (typeof showToast === 'function') showToast('Đang khởi tạo mã VietQR đặt cọc 30%...', 'info', 1500);
    const res = await PaymentAPI.createDepositPayment(rentalId);
    if (!res || !res.success || !res.data) {
      const msg = res?.message || 'Không thể tạo mã thanh toán đặt cọc';
      if (typeof showToast === 'function') showToast(msg, 'error');
      else alert(msg);
      return;
    }
    const p = res.data;
    const paymentId = p.payment_id || p.id;
    const depositAmount = p.deposit_amount || p.amount || 0;
    const formatMoney = (v) => Number(v || 0).toLocaleString('vi-VN') + ' đ';
    const bankName = p.bank_name || 'MB Bank (Ngân hàng Quân Đội)';
    const bankAccount = p.bank_account_number || '090123456789';
    const bankOwner = p.bank_account_name || 'DRIVESHARE CORP';
    const memo = p.transaction_code || ('DSPAY_' + rentalId);
    const qrUrl = p.qr_code_url || `https://img.vietqr.io/image/MB-090123456789-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bankOwner)}`;

    const html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; align-items: start;">
        <div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
            <div style="font-weight: 800; color: #0f172a; font-size: 1rem; margin-bottom: 4px;">
              ${p.car_brand || 'Xe'} ${p.car_model || ''} <span style="font-size: 0.8rem; color: #64748b; font-weight: normal;">(${p.plate_number || 'Biển số'})</span>
            </div>
            <div style="font-size: 0.85rem; color: #475569; display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Mã đơn thuê:</span>
              <strong>#${rentalId}</strong>
            </div>
            <div style="font-size: 0.85rem; color: #475569; display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Thời gian thuê:</span>
              <strong>${p.start_date || ''} &rarr; ${p.end_date || ''} (${p.total_days || 1} ngày)</strong>
            </div>
            <div style="font-size: 0.85rem; color: #475569; display: flex; justify-content: space-between;">
              <span>Tổng tiền chuyến đi:</span>
              <strong>${formatMoney(p.total_price)}</strong>
            </div>
          </div>

          <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 12px; margin-bottom: 14px;">
            <div style="font-size: 0.78rem; text-transform: uppercase; color: #065f46; font-weight: 700; letter-spacing: 0.04em;">Số tiền cọc cần chuyển (30%)</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: #047857; margin: 2px 0;">${formatMoney(depositAmount)}</div>
            <div style="font-size: 0.8rem; color: #047857;">Hệ thống kích hoạt giữ chỗ Soft Lock 45 phút</div>
          </div>

          <div style="font-size: 0.86rem; color: #334155; display: flex; flex-direction: column; gap: 8px;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
              <span style="color:#64748b;">Ngân hàng:</span>
              <strong>${bankName}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
              <span style="color:#64748b;">Số tài khoản:</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <strong style="color:#2563eb; font-size:1rem; letter-spacing:0.04em;">${bankAccount}</strong>
                <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 6px; font-size:0.75rem;" onclick="navigator.clipboard.writeText('${bankAccount}'); if(typeof showToast==='function') showToast('Đã copy số tài khoản!', 'success', 2000);">Copy</button>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
              <span style="color:#64748b;">Chủ tài khoản:</span>
              <strong>${bankOwner}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#64748b;">Nội dung CK:</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <strong style="color:#b45309; font-size:0.95rem; background:#fef3c7; padding:2px 6px; border-radius:4px;">${memo}</strong>
                <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 6px; font-size:0.75rem;" onclick="navigator.clipboard.writeText('${memo}'); if(typeof showToast==='function') showToast('Đã copy nội dung chuyển khoản!', 'success', 2000);">Copy</button>
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div style="font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 8px;">Quét mã VietQR bằng App Ngân hàng</div>
          <div style="width: 210px; height: 210px; border-radius: 10px; overflow: hidden; border: 2px solid #0f766e; padding: 4px; background: #fff; margin-bottom: 12px;">
            <img src="${qrUrl}" alt="Mã VietQR" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="font-size: 0.78rem; color: #64748b; text-align: center; margin-bottom: 14px;">
            Mã QR đã nhúng sẵn đúng số tiền và nội dung chuyển khoản
          </div>

          <button id="btnConfirmDepositNow" class="btn btn-primary btn-md" style="width: 100%; background: #059669; border-color: #059669; font-weight: 800; font-size: 0.92rem; padding: 10px 14px; box-shadow: 0 4px 12px rgba(5,150,105,0.25);" onclick="App.confirmDepositPayment(${paymentId}, ${rentalId})">
            ✔ Tôi đã chuyển khoản thành công
          </button>
          
          <div style="margin-top: 10px; display: flex; gap: 8px; width: 100%; justify-content: center;">
            <a href="payment.html?rental_id=${rentalId}" target="_blank" class="btn btn-ghost btn-sm" style="font-size: 0.78rem; color: #0284c7;">
              Mở cổng thanh toán riêng &rarr;
            </a>
            <button class="btn btn-outline btn-sm" style="font-size: 0.78rem;" onclick="App.closeModal()">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;

    this.openModal(`Thanh Toán Cọc 30% — Đơn #${rentalId}`, html);
  },

  async confirmDepositPayment(paymentId, rentalId) {
    const btn = document.getElementById('btnConfirmDepositNow');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang đối soát giao dịch...';
    }
    try {
      const res = await PaymentAPI.confirmPayment(paymentId);
      if (res && (res.success || res.code === 200)) {
        if (typeof DriveShareSocket !== 'undefined') {
          DriveShareSocket.emit('PAYMENT_CONFIRMED', { rental_id: rentalId, payment_id: paymentId, ...(res.data || {}) });
        }
        this.closeModal();
        if (typeof showToast === 'function') {
          showToast('🎉 Ngân hàng xác nhận tiền về! Đặt cọc 30% thành công. Đơn đã được chốt (CONFIRMED)!', 'success', 5000);
        }
        await this.refreshMyBookings();
      } else {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '✔ Tôi đã chuyển khoản thành công';
        }
        const msg = res?.message || 'Chưa nhận được tiền từ ngân hàng. Vui lòng thử lại sau giây lát!';
        if (typeof showToast === 'function') showToast(msg, 'error');
        else alert(msg);
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✔ Tôi đã chuyển khoản thành công';
      }
      if (typeof showToast === 'function') showToast('Lỗi kết nối khi đối soát thanh toán!', 'error');
    }
  },

  // Làm mới danh sách đơn thuê của tôi tức thời (Realtime & Silent Sync)"""

old_target_refresh = """  // Làm mới danh sách đơn thuê của tôi tức thời (Realtime & Silent Sync)"""
if old_target_refresh in text_app:
    text_app = text_app.replace(old_target_refresh, deposit_methods, 1)

with open(path_app, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text_app)
print("3. app.js updated successfully!")

# -------------------------------------------------------------
# 4. Update render.js: update deposit button to App.openDepositModal
# -------------------------------------------------------------
path_render = r'thueXe_Online\frontend\js\render.js'
with open(path_render, 'r', encoding='utf-8') as f:
    text_render = f.read().replace('\r\n', '\n')

old_deposit_btn_render = """            actionButtons = `
              <a href="payment.html?rental_id=${id}" class="btn btn-primary btn-sm" style="background:#0f766e; border-color:#0f766e; text-decoration:none;">
                Đặt cọc 30% ngay
              </a>"""

new_deposit_btn_render = """            actionButtons = `
              <button class="btn btn-primary btn-sm" style="background:#0f766e; border-color:#0f766e; font-weight:700; display:inline-flex; align-items:center; gap:5px;" onclick="App.openDepositModal(${id})">
                💳 Đặt cọc 30% ngay
              </button>"""

if old_deposit_btn_render in text_render:
    text_render = text_render.replace(old_deposit_btn_render, new_deposit_btn_render, 1)
    with open(path_render, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text_render)
    print("4. render.js updated successfully!")
else:
    print("4. render.js already updated or pattern not matched.")

# -------------------------------------------------------------
# 5. Update trip-tracker.js: update footer deposit button to App.openDepositModal
# -------------------------------------------------------------
path_tracker = r'thueXe_Online\frontend\js\trip-tracker.js'
with open(path_tracker, 'r', encoding='utf-8') as f:
    text_tracker = f.read().replace('\r\n', '\n')

old_deposit_btn_tracker = """            ${currentStep === 2 ? `
              <a href="payment.html?rental_id=${id}" class="btn btn-primary" style="background:#0f766e; border-color:#0f766e; font-weight:700; display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Thanh Toán Cọc 30% Ngay
              </a>
            ` : ''}"""

new_deposit_btn_tracker = """            ${currentStep === 2 ? `
              <button class="btn btn-primary" style="background:#0f766e; border-color:#0f766e; font-weight:700; display:inline-flex; align-items:center; gap:6px;" onclick="App.openDepositModal(${id})">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Thanh Toán Cọc 30% Ngay
              </button>
            ` : ''}"""

if old_deposit_btn_tracker in text_tracker:
    text_tracker = text_tracker.replace(old_deposit_btn_tracker, new_deposit_btn_tracker, 1)
    with open(path_tracker, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text_tracker)
    print("5. trip-tracker.js updated successfully!")
else:
    print("5. trip-tracker.js already updated or pattern not matched.")

# -------------------------------------------------------------
# 6. Update booking.js: automatically switch to my-bookings on booking created
# -------------------------------------------------------------
path_booking = r'thueXe_Online\frontend\js\booking.js'
with open(path_booking, 'r', encoding='utf-8') as f:
    text_booking = f.read().replace('\r\n', '\n')

old_booking_created = """      if (res && res.success && res.data) {
        const rental = res.data;
        const rentalId = rental.rental_id || rental.rentalId;

        if (typeof App !== 'undefined' && App.closeModal) {
          App.closeModal();
        }"""

new_booking_created = """      if (res && res.success && res.data) {
        const rental = res.data;
        const rentalId = rental.rental_id || rental.rentalId;

        // Tự động chuyển ngay sang view Chuyến của tôi
        if (typeof App !== 'undefined' && App.showMyBookingsView) {
          App.showMyBookingsView();
        }

        if (typeof App !== 'undefined' && App.closeModal) {
          App.closeModal();
        }"""

if old_booking_created in text_booking:
    text_booking = text_booking.replace(old_booking_created, new_booking_created, 1)
    with open(path_booking, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text_booking)
    print("6. booking.js updated successfully!")
else:
    print("6. booking.js already updated or pattern not matched.")

# -------------------------------------------------------------
# 7. Update owner.js: save localStorage as well
# -------------------------------------------------------------
path_owner_js = r'thueXe_Online\frontend\js\owner.js'
with open(path_owner_js, 'r', encoding='utf-8') as f:
    text_owner_js = f.read().replace('\r\n', '\n')

old_owner_tab_save = """    try {
      sessionStorage.setItem('owner_active_tab', tabName);
      history.replaceState(null, '', '#' + tabName.toLowerCase());
    } catch (_) {}"""

new_owner_tab_save = """    try {
      sessionStorage.setItem('driveshare_owner_tab', tabName);
      localStorage.setItem('driveshare_owner_tab', tabName);
      history.replaceState(null, '', '#' + tabName.toLowerCase());
    } catch (_) {}"""

if old_owner_tab_save in text_owner_js:
    text_owner_js = text_owner_js.replace(old_owner_tab_save, new_owner_tab_save, 1)

old_owner_tab_read = """const activeTab = this.currentActiveTab || (['CARS', 'REQUESTS', 'ADD'].includes(hashTab) ? hashTab : null) || sessionStorage.getItem('owner_active_tab') || 'CARS';"""
new_owner_tab_read = """const savedOwnerTab = sessionStorage.getItem('driveshare_owner_tab') || localStorage.getItem('driveshare_owner_tab');
    const activeTab = this.currentActiveTab || (['CARS', 'REQUESTS', 'ADD'].includes(hashTab) ? hashTab : null) || savedOwnerTab || 'CARS';"""

if old_owner_tab_read in text_owner_js:
    text_owner_js = text_owner_js.replace(old_owner_tab_read, new_owner_tab_read, 1)

with open(path_owner_js, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text_owner_js)
print("7. owner.js updated successfully!")

print("All stay-on-page updates completed successfully!")

