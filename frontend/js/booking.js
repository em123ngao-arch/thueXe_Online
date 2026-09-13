/**
 * DRIVESHARE — Booking Module (Clean & Professional, No Emojis)
 * Xử lý luồng đặt xe, tính toán tiền cọc 30%, quét mã VietQR và lưu trữ đơn thuê
 */

const BookingService = {
  currentCar: null,
  calcData: null,

  // Bắt đầu luồng đặt xe
  startBookingFlow(carId) {
    const car = StorageService.getCarById(carId);
    if (!car) {
      App.showToast('Không tìm thấy thông tin xe!', 'error');
      return;
    }

    this.currentCar = car;
    
    // Lấy thông tin ngày giờ từ bộ tìm kiếm hoặc mặc định 3 ngày
    const startDateVal = document.getElementById('searchStartDate')?.value || '2026-09-15';
    const startTimeVal = document.getElementById('searchStartTime')?.value || '08:00';
    const endDateVal = document.getElementById('searchEndDate')?.value || '2026-09-17';
    const endTimeVal = document.getElementById('searchEndTime')?.value || '20:00';

    const startDateTime = new Date(`${startDateVal}T${startTimeVal}`);
    const endDateTime = new Date(`${endDateVal}T${endTimeVal}`);
    
    let days = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));
    if (isNaN(days) || days < 1) days = 1;

    const rentalAmount = days * car.price_per_day;
    const insuranceFee = days * INITIAL_DATA.configs.insurance_fee_per_day; // 100k/ngày
    const totalAmount = rentalAmount + insuranceFee;
    const depositAmount = Math.round(totalAmount * INITIAL_DATA.configs.deposit_rate); // 30%

    this.calcData = {
      days,
      startDate: `${startDateVal} ${startTimeVal}`,
      endDate: `${endDateVal} ${endTimeVal}`,
      rentalAmount,
      insuranceFee,
      totalAmount,
      depositAmount
    };

    this.renderBookingModal();
  },

  // Hiển thị modal đặt xe & chuẩn bị thanh toán
  renderBookingModal() {
    const car = this.currentCar;
    const calc = this.calcData;
    const renter = StorageService.getCurrentRenter();

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
          <div>
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.75rem;">
              1. Thông tin người thuê xe
            </h4>
            
            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.45rem; font-size: 0.88rem;">
                <span style="color: var(--slate-500);">Họ và tên:</span>
                <strong style="color: var(--slate-900);">${renter.name}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.45rem; font-size: 0.88rem;">
                <span style="color: var(--slate-500);">Số điện thoại:</span>
                <strong style="color: var(--slate-900);">${renter.phone}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem;">
                <span style="color: var(--slate-500);">Bằng lái xe (GPLX):</span>
                <span class="badge ${renter.license_status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">
                  ${renter.license_status === 'APPROVED' ? 'Đã xác minh (B2)' : 'Chờ xác minh'}
                </span>
              </div>
            </div>

            <h4 style="font-size: 1rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.75rem;">
              2. Lịch trình & Địa điểm giao xe
            </h4>
            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 1rem; font-size: 0.85rem;">
              <div style="margin-bottom: 0.45rem;">
                <span style="color: var(--slate-500);">Nhận xe lúc:</span> <strong>${calc.startDate}</strong>
              </div>
              <div style="margin-bottom: 0.45rem;">
                <span style="color: var(--slate-500);">Trả xe lúc:</span> <strong>${calc.endDate}</strong> (${calc.days} ngày)
              </div>
              <div>
                <span style="color: var(--slate-500);">Địa điểm nhận:</span> <strong>${car.pickup_address}</strong>
              </div>
            </div>

            <div style="background: var(--primary-light); border: 1px solid var(--primary-subtle); border-radius: var(--radius-md); padding: 0.8rem; font-size: 0.8rem; color: var(--primary); line-height: 1.5;">
              <strong>Chính sách cọc giữ chỗ:</strong> Quý khách chỉ cần thanh toán trước <strong>30% tiền cọc (${StorageService.formatCurrency(calc.depositAmount)})</strong> để khóa lịch xe. 70% còn lại thanh toán khi nhận xe.
            </div>
          </div>

          <div>
            <!-- Chi tiết thanh toán -->
            <div class="calc-card" style="margin-bottom: 1.15rem;">
              <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.85rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--slate-200);">
                <img src="${car.image_url}" alt="${car.brand}" style="width: 60px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;" />
                <div>
                  <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--slate-900);">${car.brand} ${car.model}</h4>
                  <div style="font-size: 0.76rem; color: var(--slate-500);">${car.license_plate}</div>
                </div>
              </div>

              <div class="calc-row">
                <span>Đơn giá thuê (${calc.days} ngày):</span>
                <span>${StorageService.formatCurrency(calc.rentalAmount)}</span>
              </div>
              <div class="calc-row">
                <span>Bảo hiểm chuyến đi MIC:</span>
                <span>${StorageService.formatCurrency(calc.insuranceFee)}</span>
              </div>
              <div class="calc-row total">
                <span>Tổng giá trị đơn:</span>
                <span>${StorageService.formatCurrency(calc.totalAmount)}</span>
              </div>
              <div class="calc-row deposit-highlight">
                <span>Số tiền cọc cần trả (30%):</span>
                <span>${StorageService.formatCurrency(calc.depositAmount)}</span>
              </div>
            </div>

            <button class="btn btn-primary btn-lg" style="width: 100%;" onclick="BookingService.openVietQRPayment()">
              Thanh toán cọc qua VietQR
            </button>
          </div>
        </div>
      </div>
    `;

    App.openModal('Xác nhận thông tin & Đặt xe', contentHtml);
  },

  // Mở bước Quét mã VietQR Chuyển khoản
  openVietQRPayment() {
    const car = this.currentCar;
    const calc = this.calcData;
    const tempOrderId = 'BK-' + Math.floor(10000 + Math.random() * 90000);
    const bankInfo = INITIAL_DATA.configs.bank_info;
    const transferNote = `COC ${tempOrderId} 0988776655`;

    // Sinh link VietQR chuẩn thực tế
    const qrUrl = `https://img.vietqr.io/image/MB-090123456789-compact2.png?amount=${calc.depositAmount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(bankInfo.account_name)}`;

    const qrHtml = `
      <div style="text-align: center;">
        <p style="font-size: 0.88rem; color: var(--slate-600); margin-bottom: 1.15rem;">
          Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, VPBank, MoMo...) và quét mã QR bên dưới để thanh toán giữ chỗ 30%.
        </p>

        <div class="vietqr-card">
          <div style="font-size: 0.82rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
            CỔNG THANH TOÁN VIETQR PRO
          </div>

          <div class="qr-code-img-box">
            <img src="${qrUrl}" alt="VietQR DriveShare" />
          </div>

          <div class="payment-info-box">
            <div class="payment-info-row">
              <span class="label">Ngân hàng thụ hưởng:</span>
              <span class="value">MB Bank</span>
            </div>
            <div class="payment-info-row">
              <span class="label">Số tài khoản:</span>
              <span class="value">${bankInfo.account_number}</span>
            </div>
            <div class="payment-info-row">
              <span class="label">Tên người nhận:</span>
              <span class="value">${bankInfo.account_name}</span>
            </div>
            <div class="payment-info-row">
              <span class="label">Số tiền cọc (30%):</span>
              <span class="value" style="color: #6ee7b7; font-size: 1rem;">${StorageService.formatCurrency(calc.depositAmount)}</span>
            </div>
            <div class="payment-info-row">
              <span class="label">Nội dung chuyển:</span>
              <span class="value" style="color: #fde047;">${transferNote}</span>
            </div>
          </div>

          <div style="font-size: 0.74rem; opacity: 0.85;">
            Hệ thống tự động kiểm tra giao dịch và xác nhận trực tiếp.
          </div>
        </div>

        <div style="margin-top: 1.35rem; display: flex; gap: 0.65rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal()">Để thanh toán sau</button>
          <button class="btn btn-primary btn-sm" onclick="BookingService.confirmPaymentSuccess('${tempOrderId}')">
            Xác nhận đã chuyển khoản thành công
          </button>
        </div>
      </div>
    `;

    App.openModal(`Thanh toán cọc giữ chỗ #${tempOrderId}`, qrHtml);
  },

  // Xác nhận thanh toán thành công
  confirmPaymentSuccess(orderId) {
    const car = this.currentCar;
    const calc = this.calcData;
    const renter = StorageService.getCurrentRenter();

    const newBooking = StorageService.createBooking({
      id: orderId,
      renter_id: renter.id,
      renter_name: renter.name,
      renter_phone: renter.phone,
      car_id: car.id,
      car_name: `${car.brand} ${car.model}`,
      car_plate: car.license_plate,
      car_image: car.image_url,
      pickup_address: car.pickup_address,
      start_time: calc.startDate,
      end_time: calc.endDate,
      total_days: calc.days,
      price_per_day: car.price_per_day,
      rental_amount: calc.rentalAmount,
      insurance_fee: calc.insuranceFee,
      total_amount: calc.totalAmount,
      deposit_amount: calc.depositAmount,
      deposit_status: 'PAID',
      status: 'DEPOSIT_PAID',
      payment_method: 'VIETQR'
    });

    App.closeModal();
    App.showToast(`Đặt cọc xe ${car.brand} ${car.model} thành công! Mã đơn: ${orderId}`, 'success');
    
    // Cập nhật số lượng đơn trên navbar
    App.updateBookingCountBadge();

    // Chuyển sang màn hình "Chuyến của tôi"
    setTimeout(() => {
      App.switchRole('RENTER');
      App.showMyBookingsView();
    }, 500);
  }
};
