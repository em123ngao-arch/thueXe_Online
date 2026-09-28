/**
 * DRIVESHARE — Booking Module (Clean & Professional, No Emojis)
 * Triển khai theo Đặc tả Nghiệp vụ v2.0.0 (Giai đoạn 1: Gửi yêu cầu đặt xe Multi-Request)
 * Tích hợp chuẩn REST API Spring Boot: POST /api/v1/rentals & PUT /api/v1/rentals/{id}/cancel
 */

const BookingService = {
  currentCar: null,
  calcData: null,

  // 1. Khởi động luồng đặt xe
  async startBookingFlow(carId) {
    // Guard: kiểm tra carId hợp lệ trước khi thực hiện bất kỳ thẩm vấn nào
    if (!carId || carId === 'undefined' || carId === 'null' || isNaN(Number(carId))) {
      console.error('[BookingService] startBookingFlow gọi với carId không hợp lệ:', carId);
      if (typeof toast !== 'undefined') {
        toast.error('Không xác định được xe. Vui lòng thử lại!');
      }
      return;
    }
    const validCarId = Number(carId);

    // Kiểm tra đăng nhập
    const token = typeof TokenService !== 'undefined' ? TokenService.getToken() : localStorage.getItem('access_token');
    if (!token) {
      if (typeof App !== 'undefined' && App.openModalAuth) {
        App.openModalAuth();
      }
      if (typeof toast !== 'undefined') {
        toast.warning('Vui lòng đăng nhập trước khi gửi yêu cầu thuê xe!');
      } else {
        alert('Vui lòng đăng nhập trước khi gửi yêu cầu thuê xe!');
      }
      return;
    }

    // Lấy thông tin xe từ CarAPI (GET /public/cars/{carId}) - trả CarDetailResponse (camelCase)
    let car = null;
    if (typeof CarAPI !== 'undefined' && CarAPI.getPublicCarDetail) {
      try {
        const res = await CarAPI.getPublicCarDetail(validCarId);
        if (res && res.data) {
          const c = res.data;
          // CarDetailResponse trả camelCase: carId, pricePerDay, plateNumberMasked, thumbnailUrl...
          car = {
            id: c.carId || c.car_id || c.id,
            brand: c.brand,
            model: c.model,
            license_plate: c.plateNumberMasked || c.plate_number_masked || c.plateNumber || c.plate_number || c.license_plate,
            price_per_day: Number(c.pricePerDay || c.price_per_day || 0),
            pickup_address: c.address || c.pickup_address,
            image_url: c.thumbnailUrl || c.thumbnail_url || c.image_url
              || (c.images && c.images.length > 0 ? (c.images[0].imageUrl || c.images[0].image_url) : '')
              || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80',
            year: c.year,
            seat_count: c.seats || c.seat_count || 4
          };
        }
      } catch (err) {
        console.warn('[BookingService] getPublicCarDetail fallback to local storage:', err);
      }
    }

    if (!car && typeof StorageService !== 'undefined') {
      car = StorageService.getCarById(validCarId);
    }

    if (!car) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Không tìm thấy thông tin xe!', 'error');
      }
      return;
    }

    this.currentCar = car;

    // Lấy thông tin ngày giờ từ bộ tìm kiếm hoặc mặc định
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() + 1);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(today.getDate() + 3);

    const formatDateInput = (d) => d.toISOString().split('T')[0];

    const startDateVal = document.getElementById('searchStartDate')?.value || formatDateInput(defaultStart);
    const startTimeVal = document.getElementById('searchStartTime')?.value || '08:00';
    const endDateVal = document.getElementById('searchEndDate')?.value || formatDateInput(defaultEnd);
    const endTimeVal = document.getElementById('searchEndTime')?.value || '20:00';

    const startDateTime = new Date(`${startDateVal}T${startTimeVal}`);
    const endDateTime = new Date(`${endDateVal}T${endTimeVal}`);

    let days = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));
    if (isNaN(days) || days < 1) days = 1;

    const pricePerDay = car.price_per_day || 500000;
    const rentalAmount = days * pricePerDay;
    const depositAmount = Math.round(rentalAmount * 0.30); // 30% cọc giữ chỗ

    this.calcData = {
      carId: car.id,
      days,
      startDate: startDateVal,
      endDate: endDateVal,
      startTimeStr: `${startDateVal} ${startTimeVal}`,
      endTimeStr: `${endDateVal} ${endTimeVal}`,
      pricePerDay,
      rentalAmount,
      depositAmount
    };

    this.renderBookingModal();
  },

  // 2. Hiển thị modal xác nhận yêu cầu thuê xe (Giai đoạn 1: Duyệt hồ sơ trước — Chưa thanh toán)
  renderBookingModal() {
    const car = this.currentCar;
    const calc = this.calcData;
    const formatMoney = (v) => typeof StorageService !== 'undefined' ? StorageService.formatCurrency(v) : (v?.toLocaleString('vi-VN') + ' đ');

    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const renterName = user ? (user.fullName || user.full_name || user.username || 'Lê Hoàng Nam') : 'Lê Hoàng Nam';
    const renterPhone = user ? (user.phone || user.phoneNumber || '0988 776 655') : '0988 776 655';

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
          <div>
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.5rem;">
              1. Thông tin người thuê xe (Gửi Chủ xe thẩm định)
            </h4>
            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.85rem; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                <span style="color: var(--slate-500);">Họ và tên:</span>
                <strong style="color: var(--slate-900);">${renterName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                <span style="color: var(--slate-500);">Số điện thoại:</span>
                <strong style="color: var(--slate-900);">${renterPhone}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--slate-500);">Bằng lái xe (GPLX):</span>
                <span class="badge badge-success" style="background:#dcfce7; color:#166534; font-weight:700; font-size:0.75rem; padding: 2px 8px; border-radius: 999px;">Đã xác minh (B2)</span>
              </div>
            </div>

            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.5rem;">
              2. Lịch trình & Địa điểm giao nhận xe
            </h4>
            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.85rem; font-size: 0.85rem;">
              <div style="margin-bottom: 0.35rem;">
                <span style="color: var(--slate-500);">Nhận xe lúc:</span> <strong>${calc.startTimeStr}</strong>
              </div>
              <div style="margin-bottom: 0.35rem;">
                <span style="color: var(--slate-500);">Trả xe lúc:</span> <strong>${calc.endTimeStr}</strong> (${calc.days} ngày)
              </div>
              <div>
                <span style="color: var(--slate-500);">Địa điểm nhận xe:</span> <strong>${car.pickup_address || 'Địa chỉ do chủ xe cung cấp'}</strong>
              </div>
            </div>

            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.4rem;">
              3. Mục đích di chuyển & Ghi chú cho Chủ xe
            </h4>
            <div style="margin-bottom: 0.85rem;">
              <textarea id="bookingTripNote" class="form-control" rows="2" placeholder="Ví dụ: Đi công tác Vũng Tàu cùng gia đình 3 người, cam kết giữ xe sạch sẽ..." style="width: 100%; font-size: 0.85rem; padding: 0.65rem; border-radius: 6px; border: 1px solid var(--slate-300);"></textarea>
            </div>

            <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.82rem; color: #166534; line-height: 1.5;">
              <strong style="display: block; margin-bottom: 0.25rem;">QUY TRÌNH "DUYỆT HỒ SƠ TRƯỚC — CỌC SAU":</strong>
              Quý khách gửi yêu cầu thuê <strong>hoàn toàn miễn phí</strong>. Chưa phải thanh toán tiền ở bước này. Sau khi Chủ xe duyệt hồ sơ, bạn sẽ có <strong>45 phút giữ chỗ (Soft Lock)</strong> để thanh toán cọc 30% qua VietQR.
            </div>
          </div>

          <div>
            <!-- Chi tiết chi phí dự kiến -->
            <div class="calc-card" style="margin-bottom: 1.15rem; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 1rem;">
              <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.85rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--slate-200);">
                <img src="${car.image_url}" alt="${car.brand}" style="width: 65px; height: 48px; border-radius: var(--radius-sm); object-fit: cover;" />
                <div>
                  <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-900); margin: 0;">${car.brand} ${car.model}</h4>
                  <div style="font-size: 0.78rem; color: var(--slate-500);">${car.license_plate} · ${car.seat_count || 4} chỗ</div>
                </div>
              </div>

              <div class="calc-row" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
                <span>Đơn giá thuê (${calc.days} ngày):</span>
                <span>${formatMoney(calc.rentalAmount)}</span>
              </div>
              <div class="calc-row total" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem; font-weight: 700; border-top: 1px dashed var(--slate-300); padding-top: 0.5rem;">
                <span>Tổng giá trị gói thuê:</span>
                <span>${formatMoney(calc.rentalAmount)}</span>
              </div>
              <div class="calc-row deposit-highlight" style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 800; color: #047857; background: #d1fae5; padding: 0.5rem; border-radius: 4px;">
                <span>Cọc giữ chỗ 30% (sau khi duyệt):</span>
                <span>${formatMoney(calc.depositAmount)}</span>
              </div>
            </div>

            <button id="btnSubmitBooking" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 800; font-size: 1rem; background: #0f766e; border-color: #0f766e;" onclick="BookingService.submitBookingRequest()">
              Gửi Yêu Cầu Thuê Xe Cho Chủ Xe Duyệt (Miễn phí)
            </button>
            <div style="text-align: center; margin-top: 0.5rem;">
              <small style="color: var(--slate-500); font-size: 0.75rem;">
                Chủ xe sẽ phản hồi trong tối đa 60 phút. Bạn có thể rút đơn bất cứ lúc nào.
              </small>
            </div>
          </div>
        </div>
      </div>
    `;

    if (typeof App !== 'undefined' && App.openModal) {
      App.openModal('Xác nhận thông tin & Gửi yêu cầu thuê xe', contentHtml);
    }
  },

  // 3. Khách gửi yêu cầu thuê xe thực tế vào Backend Spring Boot (POST /api/v1/rentals)
  async submitBookingRequest() {
    const btn = document.getElementById('btnSubmitBooking');
    const noteInput = document.getElementById('bookingTripNote');
    const note = noteInput ? noteInput.value.trim() : '';

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Đang gửi yêu cầu...';
    }

    const payload = {
      car_id: this.calcData.carId,
      start_date: this.calcData.startDate,
      end_date: this.calcData.endDate,
      note: note || 'Mục đích di chuyển cá nhân'
    };

    try {
      const res = await RentalAPI.createRental(payload);

      if (res && res.success && res.data) {
        const rental = res.data;
        const rentalId = rental.rental_id || rental.rentalId;

        if (typeof App !== 'undefined' && App.closeModal) {
          App.closeModal();
        }

        const successHtml = `
          <div style="text-align: center; padding: 1.5rem 0.5rem;">
            <div style="width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem auto;">&#10003;</div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #166534; margin-bottom: 0.5rem;">Gửi Yêu Cầu Thuê Xe Thành Công!</h3>
            <p style="color: var(--slate-600); font-size: 0.9rem; line-height: 1.5; max-width: 420px; margin: 0 auto 1.25rem auto;">
              Mã đơn thuê của bạn là <strong>#${rentalId}</strong>. Đơn đang ở trạng thái <strong>Chờ chủ xe duyệt (PENDING_APPROVAL)</strong>. Bạn sẽ nhận được thông báo để đặt cọc 30% ngay khi Chủ xe đồng ý.
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <button class="btn btn-primary btn-md" onclick="App.closeModal(); App.showMyBookingsView();">
                Xem Chuyến đi của tôi
              </button>
            </div>
          </div>
        `;

        if (typeof App !== 'undefined' && App.openModal) {
          App.openModal('Thông báo đặt xe', successHtml);
        } else if (typeof toast !== 'undefined') {
          toast.success(`Gửi yêu cầu thuê xe #${rentalId} thành công!`);
        }
      } else {
        const errMsg = res.message || 'Không thể tạo yêu cầu thuê xe. Vui lòng thử lại!';
        if (typeof toast !== 'undefined') {
          toast.error(errMsg);
        } else {
          alert(errMsg);
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Gửi yêu cầu thuê xe tới Chủ xe';
        }
      }
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu thuê xe:', err);
      if (typeof toast !== 'undefined') {
        toast.error('Lỗi kết nối tới máy chủ. Vui lòng thử lại sau!');
      } else {
        alert('Lỗi kết nối tới máy chủ. Vui lòng thử lại sau!');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Gửi yêu cầu thuê xe tới Chủ xe';
      }
    }
  },

  // 4. Khách thuê rút lại yêu cầu thuê khi đang chờ duyệt (PUT /api/v1/rentals/{id}/cancel -> WITHDRAWN_BY_GUEST)
  async cancelBooking(rentalId) {
    if (!confirm(`Bạn có chắc chắn muốn rút lại yêu cầu thuê xe #${rentalId} không?`)) {
      return;
    }

    try {
      const res = await RentalAPI.cancelRental(rentalId);
      if (res && res.success) {
        if (typeof toast !== 'undefined') {
          toast.success(`Đã rút yêu cầu thuê xe #${rentalId} thành công!`);
        } else {
          alert(`Đã rút yêu cầu thuê xe #${rentalId} thành công!`);
        }
        if (typeof App !== 'undefined' && App.showMyBookingsView) {
          App.showMyBookingsView();
        }
      } else {
        const msg = res.message || 'Không thể rút yêu cầu thuê xe.';
        if (typeof toast !== 'undefined') {
          toast.error(msg);
        } else {
          alert(msg);
        }
      }
    } catch (err) {
      console.error('Lỗi khi rút đơn thuê:', err);
      if (typeof toast !== 'undefined') {
        toast.error('Lỗi kết nối khi hủy đơn!');
      }
    }
  }
};

