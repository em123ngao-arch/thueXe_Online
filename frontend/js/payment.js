/**
 * DRIVESHARE — Payment Module (Chí Tín: CRP-51, CRP-52, CRP-53)
 * Xử lý giao diện thanh toán cọc VietQR 30%, kết nối API Backend & trạng thái đơn thuê
 */

const PaymentUI = {
  currentPayment: null,
  currentRental: null,
  pollTimer: null,
  countdownTimer: null,
  remainingSeconds: 900, // 15 phút

  async init() {
    const params = new URLSearchParams(window.location.search);
    const rentalId = params.get('rental_id') || params.get('id');
    const paymentId = params.get('payment_id');

    const container = document.getElementById('paymentContainer');
    if (!container) return;

    if (paymentId) {
      await this.loadPaymentById(paymentId);
    } else if (rentalId) {
      await this.initDepositForRental(rentalId);
    } else {
      this.renderRentalSelector();
    }
  },

  async initDepositForRental(rentalId) {
    this.renderLoading('Đang tạo mã thanh toán VietQR cọc 30%...');

    // Gọi API Backend: POST /api/v1/rentals/{id}/payment
    const res = await PaymentAPI.createDepositPayment(rentalId);
    if (res.success && res.data) {
      this.currentPayment = res.data;
      this.renderPaymentView(this.currentPayment);
      this.startCountdown();
      this.startPolling(this.currentPayment.payment_id);
    } else {
      // Fallback kiểm tra dữ liệu local nếu backend chưa có đơn này
      const localBooking = (typeof StorageService !== 'undefined') ? StorageService.getBookingById(rentalId) : null;
      if (localBooking) {
        this.currentPayment = {
          payment_id: 'LOCAL-' + Date.now(),
          rental_id: rentalId,
          deposit_amount: localBooking.deposit_amount || (localBooking.total_amount * 0.3),
          amount: localBooking.deposit_amount || (localBooking.total_amount * 0.3),
          payment_type: 'DEPOSIT',
          payment_method: 'VIETQR',
          status: 'PENDING',
          payment_status: 'PENDING',
          rental_status: 'APPROVED',
          transaction_code: 'DSPAY_' + rentalId + '_' + Date.now(),
          qr_code_url: `https://img.vietqr.io/image/MB-090123456789-compact2.png?amount=${localBooking.deposit_amount || Math.round(localBooking.total_amount * 0.3)}&addInfo=DSPAY_${rentalId}&accountName=DRIVESHARE%20CORP`,
          car_brand: localBooking.car_name ? localBooking.car_name.split(' ')[0] : 'VinFast',
          car_model: localBooking.car_name ? localBooking.car_name.split(' ').slice(1).join(' ') : 'VF8',
          plate_number: localBooking.car_plate || '51K-999.88',
          total_price: localBooking.total_amount || 2400000,
          total_days: localBooking.total_days || 2,
          start_date: localBooking.start_time || '2026-09-25',
          end_date: localBooking.end_time || '2026-09-27',
          bank_name: 'MB Bank (Ngân hàng Quân Đội)',
          bank_account_number: '090123456789',
          bank_account_name: 'DRIVESHARE CORP'
        };
        this.renderPaymentView(this.currentPayment);
        this.startCountdown();
      } else {
        this.renderError(res.message || 'Không tìm thấy thông tin đơn thuê hoặc đơn chưa được duyệt (APPROVED).');
      }
    }
  },

  async loadPaymentById(paymentId) {
    this.renderLoading('Đang tải thông tin giao dịch thanh toán...');
    const res = await PaymentAPI.getPayment(paymentId);
    if (res.success && res.data) {
      this.currentPayment = res.data;
      this.renderPaymentView(this.currentPayment);
      if (this.currentPayment.status === 'PENDING') {
        this.startCountdown();
        this.startPolling(paymentId);
      }
    } else {
      this.renderError(res.message || 'Không tìm thấy giao dịch thanh toán');
    }
  },

  renderLoading(msg = 'Đang tải...') {
    const container = document.getElementById('paymentContainer');
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="margin: 0 auto 1.5rem auto; width: 44px; height: 44px; border: 3px solid var(--slate-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <h3 style="font-size: 1.15rem; color: var(--slate-800); font-weight: 700;">${msg}</h3>
        <p style="color: var(--slate-500); font-size: 0.88rem; margin-top: 0.5rem;">Vui lòng giữ nguyên màn hình trong giây lát</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  },

  renderError(msg) {
    const container = document.getElementById('paymentContainer');
    container.innerHTML = `
      <div style="max-width: 520px; margin: 3rem auto; background: var(--white); border-radius: var(--radius-lg); padding: 2.5rem 2rem; text-align: center; box-shadow: var(--shadow-md); border: 1px solid var(--slate-200);">
        <div style="width: 64px; height: 64px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto; font-size: 1.8rem; font-weight: bold;">!</div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin-bottom: 0.5rem;">Không thể mở thanh toán</h3>
        <p style="color: var(--slate-600); font-size: 0.92rem; margin-bottom: 1.5rem; line-height: 1.5;">${msg}</p>
        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          <a href="index.html" class="btn btn-outline btn-md">Về trang chủ</a>
          <button onclick="PaymentUI.renderRentalSelector()" class="btn btn-primary btn-md">Chọn đơn thuê khác</button>
        </div>
      </div>
    `;
  },

  renderRentalSelector() {
    const container = document.getElementById('paymentContainer');
    const bookings = (typeof StorageService !== 'undefined') ? StorageService.getBookings() : [];
    
    let optionsHtml = '';
    if (bookings && bookings.length > 0) {
      optionsHtml = bookings.map(b => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--slate-200); border-radius: var(--radius-md); margin-bottom: 0.75rem; background: var(--slate-50); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--slate-200)'">
          <div>
            <div style="font-weight: 700; color: var(--slate-900); font-size: 0.95rem;">${b.car_name || 'Xe cho thuê'} (#${b.id})</div>
            <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.2rem;">Thời gian: ${b.start_time} - ${b.end_time}</div>
            <div style="font-size: 0.85rem; color: var(--primary); font-weight: 600; margin-top: 0.25rem;">Tiền cọc 30%: ${this.formatMoney(b.deposit_amount || (b.total_amount * 0.3))}</div>
          </div>
          <a href="payment.html?rental_id=${b.id}" class="btn btn-primary btn-sm">Thanh toán ngay</a>
        </div>
      `).join('');
    } else {
      optionsHtml = `
        <div style="text-align: center; padding: 2rem; color: var(--slate-500);">
          <p>Chưa có đơn thuê nào được lưu trên máy của bạn.</p>
          <p style="margin-top: 0.5rem; font-size: 0.85rem;">Bạn có thể nhập ID đơn thuê thực tế từ Backend bên dưới:</p>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="max-width: 580px; margin: 3rem auto; background: var(--white); border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-md); border: 1px solid var(--slate-200);">
        <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--slate-900); margin-bottom: 0.5rem; text-align: center;">Thanh Toán Cọc Đơn Thuê Xe</h2>
        <p style="color: var(--slate-500); font-size: 0.88rem; text-align: center; margin-bottom: 1.5rem;">Vui lòng chọn hoặc nhập mã đơn thuê đã được duyệt (APPROVED) để đặt cọc</p>

        <div style="margin-bottom: 1.5rem;">
          ${optionsHtml}
        </div>

        <div style="border-top: 1px dashed var(--slate-200); padding-top: 1.25rem;">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--slate-700); margin-bottom: 0.4rem;">Hoặc nhập mã đơn thuê (Rental ID Backend):</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="number" id="manualRentalIdInput" class="form-control" placeholder="Ví dụ: 1" style="flex: 1;" />
            <button class="btn btn-primary" onclick="PaymentUI.goToManualRental()">Mở VietQR</button>
          </div>
        </div>
      </div>
    `;
  },

  goToManualRental() {
    const val = document.getElementById('manualRentalIdInput')?.value;
    if (!val || val.trim() === '') {
      if (typeof showToast === 'function') showToast('Vui lòng nhập ID đơn thuê', 'warning');
      return;
    }
    window.location.search = `?rental_id=${encodeURIComponent(val.trim())}`;
  },

  renderPaymentView(p) {
    const container = document.getElementById('paymentContainer');
    const depositAmount = p.deposit_amount || p.amount || 0;
    const isCompleted = p.status === 'SUCCESS';
    const isFailed = p.status === 'FAILED';
    const isCancelled = p.status === 'CANCELLED';

    let statusBadge = `<span class="badge badge-warning" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">Đang chờ thanh toán cọc</span>`;
    if (isCompleted) {
      statusBadge = `<span class="badge badge-success" style="font-size: 0.82rem; padding: 0.35rem 0.75rem; background: #10b981; color: white;">Đã đặt cọc thành công (CONFIRMED)</span>`;
    } else if (isFailed) {
      statusBadge = `<span class="badge badge-danger" style="font-size: 0.82rem; padding: 0.35rem 0.75rem; background: #ef4444; color: white;">Giao dịch thất bại</span>`;
    } else if (isCancelled) {
      statusBadge = `<span class="badge" style="font-size: 0.82rem; padding: 0.35rem 0.75rem; background: #94a3b8; color: white;">Giao dịch đã hủy</span>`;
    }

    const bankName = p.bank_name || 'MB Bank (Ngân hàng Quân Đội)';
    const bankAccount = p.bank_account_number || '090123456789';
    const bankOwner = p.bank_account_name || 'DRIVESHARE CORP';
    const memo = p.transaction_code || `DSPAY_${p.rental_id}`;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.75rem; max-width: 980px; margin: 2rem auto;">
        
        <!-- CỘT 1: THÔNG TIN CHUYẾN ĐI & TIỀN CỌC -->
        <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.5rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); height: fit-content;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--slate-900); margin: 0;">Thông Tin Đơn Thuê</h3>
            <div>${statusBadge}</div>
          </div>

          <!-- Thông tin xe -->
          <div style="display: flex; gap: 0.9rem; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--slate-200); margin-bottom: 1.15rem;">
            <div style="width: 70px; height: 50px; border-radius: var(--radius-sm); background: var(--slate-100); display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${p.thumbnail_url 
                ? `<img src="${p.thumbnail_url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Xe" />` 
                : `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--slate-400)" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`}
            </div>
            <div>
              <div style="font-weight: 800; color: var(--slate-900); font-size: 1rem;">${p.car_brand || 'Xe'} ${p.car_model || ''}</div>
              <div style="font-size: 0.8rem; color: var(--slate-500);">${p.plate_number || 'Biển số xe'}</div>
            </div>
          </div>

          <!-- Chi tiết bảng giá -->
          <div style="display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.88rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; color: var(--slate-600);">
              <span>Mã đơn thuê (Rental ID):</span>
              <strong style="color: var(--slate-900);">#${p.rental_id}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--slate-600);">
              <span>Thời gian thuê:</span>
              <strong style="color: var(--slate-900);">${p.start_date || 'Bắt đầu'} &rarr; ${p.end_date || 'Kết thúc'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--slate-600);">
              <span>Tổng số ngày:</span>
              <strong style="color: var(--slate-900);">${p.total_days || 1} ngày</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--slate-600); padding-top: 0.5rem; border-top: 1px dashed var(--slate-200);">
              <span>Tổng chi phí chuyến đi:</span>
              <strong style="color: var(--slate-900); font-size: 0.95rem;">${this.formatMoney(p.total_price || (depositAmount / 0.3))}</strong>
            </div>
          </div>

          <!-- Highlight tiền cọc 30% -->
          <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1.5px solid #a7f3d0; border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.82rem; color: #065f46; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
              Tiền cọc giữ chỗ cần thanh toán (30%)
            </div>
            <div style="font-size: 1.6rem; font-weight: 900; color: #047857; margin-top: 0.25rem;">
              ${this.formatMoney(depositAmount)}
            </div>
            <div style="font-size: 0.78rem; color: #065f46; margin-top: 0.35rem; line-height: 1.4;">
              Khoản cọc 30% được giữ an toàn bởi hệ thống DriveShare Escrow. 70% còn lại quý khách thanh toán cho chủ xe khi nhận bàn giao xe.
            </div>
          </div>

          <!-- Đồng hồ đếm ngược -->
          ${!isCompleted && !isFailed && !isCancelled ? `
            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.75rem; text-align: center; font-size: 0.85rem; color: var(--slate-600);">
              Mã QR thanh toán hết hạn trong: <strong id="countdownText" style="color: #dc2626; font-size: 1rem;">15:00</strong>
            </div>
          ` : ''}
        </div>

        <!-- CỘT 2: CỔNG QUÉT MÃ VIETQR CHÍNH HÃNG -->
        <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.5rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; text-align: center;">
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--slate-100);">
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--slate-900); display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: #2563eb; color: white; border-radius: 4px; padding: 2px 6px; font-size: 0.75rem;">NAPAS 247</span>
              VietQR Pro Thanh Toán Cọc
            </div>
            <span style="font-size: 0.78rem; color: var(--slate-400);">Mã: #${p.payment_id}</span>
          </div>

          ${isCompleted ? `
            <div style="margin: 2rem 0; text-align: center;">
              <div style="width: 80px; height: 80px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.25rem auto;">&#10003;</div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: #166534; margin-bottom: 0.4rem;">Thanh Toán Cọc Hoàn Tất!</h3>
              <p style="color: var(--slate-600); font-size: 0.92rem; max-width: 360px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
                Đơn thuê #${p.rental_id} đã chính thức được chuyển sang trạng thái <strong>CONFIRMED</strong> (Đã giữ chỗ). Chủ xe sẽ liên hệ bàn giao xe theo lịch hẹn.
              </p>
              <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <a href="index.html" class="btn btn-primary btn-md">Xem danh sách chuyến đi</a>
              </div>
            </div>
          ` : `
            <!-- Khung mã QR Code -->
            <div style="background: #ffffff; padding: 0.75rem; border: 2px solid var(--slate-200); border-radius: var(--radius-md); box-shadow: var(--shadow-md); margin-bottom: 1.25rem; max-width: 260px; width: 100%;">
              <img src="${p.qr_code_url}" alt="VietQR DriveShare" style="width: 100%; height: auto; border-radius: 6px; display: block;" />
            </div>

            <!-- Bảng thông tin chuyển khoản kèm nút Copy -->
            <div style="width: 100%; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.85rem; text-align: left;">
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                <span style="color: var(--slate-500);">Ngân hàng:</span>
                <strong style="color: var(--slate-900);">${bankName}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                <span style="color: var(--slate-500);">Số tài khoản:</span>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <strong style="color: #2563eb; font-size: 0.95rem;">${bankAccount}</strong>
                  <button class="btn btn-ghost btn-xs" onclick="PaymentUI.copyText('${bankAccount}', 'Đã copy số tài khoản!')" style="padding: 2px 6px; font-size: 0.75rem;">Copy</button>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                <span style="color: var(--slate-500);">Tên người nhận:</span>
                <strong style="color: var(--slate-900);">${bankOwner}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                <span style="color: var(--slate-500);">Số tiền cọc:</span>
                <strong style="color: #059669; font-size: 1rem;">${this.formatMoney(depositAmount)}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--slate-500);">Nội dung chuyển khoản:</span>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <strong style="color: #dc2626; font-size: 0.92rem;">${memo}</strong>
                  <button class="btn btn-ghost btn-xs" onclick="PaymentUI.copyText('${memo}', 'Đã copy nội dung chuyển khoản!')" style="padding: 2px 6px; font-size: 0.75rem;">Copy</button>
                </div>
              </div>
            </div>

            <!-- Các nút thao tác kết quả thanh toán (CRP-52, CRP-53) -->
            <div style="width: 100%; display: flex; flex-direction: column; gap: 0.65rem;">
              <button class="btn btn-primary btn-lg" onclick="PaymentUI.handleConfirmPayment(${p.payment_id})" style="width: 100%; font-weight: 700; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
                Tôi đã chuyển khoản thành công
              </button>

              <div style="display: flex; gap: 0.5rem; justify-content: center;">
                <button class="btn btn-outline btn-sm" onclick="PaymentUI.handleCancelPayment(${p.payment_id})" style="flex: 1; font-size: 0.8rem;">
                  Hủy giao dịch
                </button>
                <button class="btn btn-ghost btn-sm" onclick="PaymentUI.handleFailPayment(${p.payment_id})" style="flex: 1; font-size: 0.8rem; color: #ef4444;">
                  Thử mô phỏng lỗi
                </button>
              </div>
            </div>
          `}

        </div>
      </div>
    `;
  },

  async handleConfirmPayment(paymentId) {
    if (typeof showToast === 'function') showToast('Đang đối soát giao dịch VietQR...', 'info');

    const res = await PaymentAPI.confirmPayment(paymentId);
    if (res.success && res.data) {
      this.currentPayment = res.data;
      this.stopTimers();
      
      // Đồng bộ local storage nếu có
      if (typeof StorageService !== 'undefined') {
        const rentalId = this.currentPayment.rental_id;
        const local = StorageService.getBookingById(rentalId);
        if (local) {
          local.status = 'CONFIRMED';
          local.deposit_status = 'PAID';
          StorageService.updateBooking(local);
        }
      }

      if (typeof showToast === 'function') {
        showToast('Xác nhận đặt cọc thành công! Đơn thuê đã được CONFIRMED.', 'success', 3500);
      }
      this.renderPaymentView(this.currentPayment);
    } else {
      if (typeof showToast === 'function') {
        showToast(res.message || 'Chưa nhận được giao dịch. Vui lòng thử lại sau giây lát!', 'error');
      }
    }
  },

  async handleCancelPayment(paymentId) {
    if (!confirm('Bạn có chắc muốn hủy giao dịch thanh toán này?')) return;
    
    const res = await PaymentAPI.cancelPayment(paymentId, 'Khách thuê chủ động hủy');
    if (res.success && res.data) {
      this.currentPayment = res.data;
      this.stopTimers();
      if (typeof showToast === 'function') showToast('Giao dịch đã được hủy', 'info');
      this.renderPaymentView(this.currentPayment);
    } else {
      if (typeof showToast === 'function') showToast(res.message || 'Lỗi khi hủy giao dịch', 'error');
    }
  },

  async handleFailPayment(paymentId) {
    const res = await PaymentAPI.failPayment(paymentId, 'Mô phỏng lỗi ngân hàng');
    if (res.success && res.data) {
      this.currentPayment = res.data;
      this.stopTimers();
      if (typeof showToast === 'function') showToast('Đã mô phỏng thanh toán thất bại (FAILED)', 'warning');
      this.renderPaymentView(this.currentPayment);
    } else {
      if (typeof showToast === 'function') showToast(res.message || 'Lỗi xử lý', 'error');
    }
  },

  startCountdown() {
    clearInterval(this.countdownTimer);
    this.remainingSeconds = 900;
    this.countdownTimer = setInterval(() => {
      this.remainingSeconds--;
      const el = document.getElementById('countdownText');
      if (el) {
        const m = Math.floor(this.remainingSeconds / 60);
        const s = this.remainingSeconds % 60;
        el.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      if (this.remainingSeconds <= 0) {
        clearInterval(this.countdownTimer);
        if (typeof showToast === 'function') showToast('Mã QR thanh toán đã hết hạn, vui lòng tạo lại!', 'warning');
      }
    }, 1000);
  },

  startPolling(paymentId) {
    clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      if (!paymentId || paymentId.toString().startsWith('LOCAL-')) return;
      const res = await PaymentAPI.getPayment(paymentId);
      if (res.success && res.data && res.data.status === 'SUCCESS') {
        this.currentPayment = res.data;
        this.stopTimers();
        if (typeof showToast === 'function') {
          showToast('Hệ thống tự động phát hiện chuyển khoản thành công!', 'success', 3500);
        }
        this.renderPaymentView(this.currentPayment);
      }
    }, 5000);
  },

  stopTimers() {
    clearInterval(this.pollTimer);
    clearInterval(this.countdownTimer);
  },

  copyText(text, toastMsg) {
    navigator.clipboard.writeText(text).then(() => {
      if (typeof showToast === 'function') {
        showToast(toastMsg, 'success', 2000);
      } else {
        alert(toastMsg);
      }
    }).catch(() => {
      prompt('Nhấn Ctrl+C để sao chép:', text);
    });
  },

  formatMoney(num) {
    if (!num) return '0 ₫';
    return Number(num).toLocaleString('vi-VN') + ' ₫';
  }
};
