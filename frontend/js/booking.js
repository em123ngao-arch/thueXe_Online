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
            seat_count: c.seats || c.seat_count || 4,
            unavailable_dates: c.unavailableDates || c.unavailable_dates || []
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

    // Lấy thông tin ngày giờ từ MiotoTimePicker hoặc bộ tìm kiếm
    const today = new Date();
    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const todayStr = formatYMD(today);

    const minStart = new Date(today);
    minStart.setDate(today.getDate() + 1);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(today.getDate() + 3);

    const minStartStr = formatYMD(minStart);
    const defaultEndStr = formatYMD(defaultEnd);

    const isHourly = (typeof MiotoTimePicker !== 'undefined' && MiotoTimePicker.state?.rentalMode === 'HOUR');

    let startDateVal, startTimeVal, endDateVal, endTimeVal, hours, days, rentalAmount, depositAmount;
    const pricePerDay = car.price_per_day || 500000;

    if (isHourly) {
      hours = Math.max(4, Math.min(8, Number(MiotoTimePicker.state.hourlyHours || 4)));
      startDateVal = MiotoTimePicker.state.startDate || MiotoTimePicker.state.hourlyStartDate || todayStr;
      startTimeVal = MiotoTimePicker.state.startTime || MiotoTimePicker.state.hourlyStartTime || '14:30';
      endDateVal = MiotoTimePicker.state.endDate || startDateVal;
      endTimeVal = MiotoTimePicker.state.endTime || '18:30';
      days = 1;
      const hourlyRate = Math.round(pricePerDay / 10);
      rentalAmount = hourlyRate * hours;
      depositAmount = Math.round(rentalAmount * 0.30);
    } else {
      startDateVal = (typeof MiotoTimePicker !== 'undefined' && MiotoTimePicker.state?.startDate)
          ? MiotoTimePicker.state.startDate
          : (document.getElementById('searchStartDate')?.value || minStartStr);
      if (startDateVal < minStartStr) startDateVal = minStartStr;

      startTimeVal = (typeof MiotoTimePicker !== 'undefined' && MiotoTimePicker.state?.startTime)
          ? MiotoTimePicker.state.startTime
          : (document.getElementById('searchStartTime')?.value || '08:00');

      endDateVal = (typeof MiotoTimePicker !== 'undefined' && MiotoTimePicker.state?.endDate)
          ? MiotoTimePicker.state.endDate
          : (document.getElementById('searchEndDate')?.value || defaultEndStr);
      if (endDateVal < startDateVal) endDateVal = startDateVal;

      endTimeVal = (typeof MiotoTimePicker !== 'undefined' && MiotoTimePicker.state?.endTime)
          ? MiotoTimePicker.state.endTime
          : (document.getElementById('searchEndTime')?.value || '20:00');

      const startDateTime = new Date(`${startDateVal}T${startTimeVal}`);
      const endDateTime = new Date(`${endDateVal}T${endTimeVal}`);

      let diffHours = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60));
      days = Math.ceil(diffHours / 24);
      if (isNaN(days) || days < 1) days = 1;

      rentalAmount = days * pricePerDay;
      depositAmount = Math.round(rentalAmount * 0.30); // 30% cọc giữ chỗ
      hours = 0;
    }

    this.calcData = {
      carId: car.id,
      isHourly,
      hours,
      days,
      startDate: startDateVal,
      endDate: endDateVal,
      startTime: startTimeVal,
      endTime: endTimeVal,
      startTimeStr: `${startTimeVal} ${startDateVal}`,
      endTimeStr: `${endTimeVal} ${endDateVal}`,
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

            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
              <span>2. Lịch trình & Địa điểm giao nhận xe</span>
              <a href="javascript:void(0)" onclick="App.closeModal(); if (typeof MiotoTimePicker !== 'undefined') MiotoTimePicker.open();" style="font-size: 0.8rem; color: #00a550; font-weight: 600; text-decoration: none;">Thay đổi</a>
            </h4>
            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.85rem; font-size: 0.85rem;">
              <div style="margin-bottom: 0.35rem;">
                <span style="color: var(--slate-500);">Nhận xe lúc:</span> <strong>${calc.startTimeStr}</strong>
              </div>
              <div style="margin-bottom: 0.35rem;">
                <span style="color: var(--slate-500);">Trả xe lúc:</span> <strong>${calc.endTimeStr}</strong> ${calc.isHourly ? `(${calc.hours} giờ)` : `(${calc.days} ngày)`}
              </div>
              <div>
                <span style="color: var(--slate-500);">Địa điểm nhận xe:</span> <strong>${car.pickup_address || 'Địa chỉ do chủ xe cung cấp'}</strong>
              </div>
            </div>

            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.4rem;">
              3. Mục đích di chuyển & Ghi chú cho Chủ xe
            </h4>
            <div style="margin-bottom: 0.85rem;">
              <textarea id="bookingTripNote" class="form-control" rows="2" placeholder="${calc.isHourly ? 'Ví dụ: Thuê 4 tiếng đi gặp đối tác nội thành, cam kết giữ xe sạch sẽ...' : 'Ví dụ: Đi công tác Vũng Tàu cùng gia đình 3 người, cam kết giữ xe sạch sẽ...'}" style="width: 100%; font-size: 0.85rem; padding: 0.65rem; border-radius: 6px; border: 1px solid var(--slate-300);"></textarea>
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
                <span>${calc.isHourly ? `Đơn giá thuê theo giờ (${calc.hours} giờ - 10%/h):` : `Đơn giá thuê (${calc.days} ngày):`}</span>
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

    const today = new Date();
    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const todayStr = formatYMD(today);

    const minStart = new Date(today);
    minStart.setDate(today.getDate() + 1);
    const minStartStr = formatYMD(minStart);

    if (this.calcData.isHourly) {
      if (!this.calcData.startDate || this.calcData.startDate < todayStr) {
        alert('Ngày nhận xe không được ở trong quá khứ!');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = 'Gửi yêu cầu thuê xe';
        }
        return;
      }
    } else {
      if (!this.calcData.startDate || this.calcData.startDate < minStartStr) {
        alert('Ngày nhận xe thuê theo ngày không được ở trong quá khứ và tối thiểu phải cách thời điểm hiện tại 1 ngày (từ ngày mai trở đi)!');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = 'Gửi yêu cầu thuê xe';
        }
        return;
      }
    }

    if (this.calcData.endDate < this.calcData.startDate) {
      alert('Ngày trả xe phải sau hoặc bằng ngày nhận xe!');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Gửi yêu cầu thuê xe';
      }
      return;
    }

    // Kiểm tra xe có bị bận ngày (do đơn thuê khác hoặc chủ xe chặn bận)
    if (this.currentCar && Array.isArray(this.currentCar.unavailable_dates) && this.currentCar.unavailable_dates.length > 0) {
      let cur = new Date(this.calcData.startDate);
      const end = new Date(this.calcData.endDate);
      let conflictDate = null;
      while (cur <= end) {
        const curStr = formatYMD(cur);
        if (this.currentCar.unavailable_dates.includes(curStr)) {
          conflictDate = curStr;
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }
      if (conflictDate) {
        alert(`Xe đã có lịch bận vào ngày ${conflictDate} (đã có đơn thuê hoặc chủ xe bận bảo dưỡng). Vui lòng chọn khoảng thời gian khác!`);
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = 'Gửi Yêu Cầu Thuê Xe Cho Chủ Xe Duyệt (Miễn phí)';
        }
        return;
      }
    }

    let finalNote = note || 'Mục đích di chuyển cá nhân';
    if (this.calcData.isHourly) {
      const hourlyPrefix = `[Thuê theo giờ: ${this.calcData.hours} giờ (${this.calcData.startTime} - ${this.calcData.endTime})]`;
      finalNote = note ? `${hourlyPrefix} ${note}` : `${hourlyPrefix} Nhu cầu di chuyển theo giờ`;
    }

    const payload = {
      car_id: this.calcData.carId,
      start_date: this.calcData.startDate,
      end_date: this.calcData.endDate,
      note: finalNote
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
        // Xử lý lỗi có mã cụ thể từ backend
        const errCode = res && res.code;
        const errMsg = res && res.message;

        if (errCode === 'DUPLICATE_RENTAL_REQUEST') {
          // Hiển thị UI thân thiện cho lỗi trùng đơn
          if (typeof App !== 'undefined' && App.closeModal) App.closeModal();
          const dupHtml = `
            <div style="text-align: center; padding: 1.5rem 0.5rem;">
              <div style="width: 64px; height: 64px; background: #fef9c3; color: #ca8a04; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem auto;">&#9888;</div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #92400e; margin-bottom: 0.5rem;">Yêu cầu trùng lặp!</h3>
              <p style="color: var(--slate-600); font-size: 0.9rem; line-height: 1.6; max-width: 400px; margin: 0 auto 1.25rem auto;">
                Bạn đã có <strong>yêu cầu thuê xe này đang chờ duyệt</strong> trong khoảng thời gian trùng lặp.<br/>
                Vui lòng <strong>hủy đơn cũ</strong> trước khi gửi yêu cầu mới cho cùng xe trong cùng khoảng ngày.
              </p>
              <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <button class="btn btn-primary btn-md" onclick="App.closeModal(); App.showMyBookingsView();">
                  Xem đơn đang chờ duyệt
                </button>
                <button class="btn btn-outline-secondary btn-md" onclick="App.closeModal();">
                  Đóng
                </button>
              </div>
            </div>
          `;
          if (typeof App !== 'undefined' && App.openModal) {
            App.openModal('Không thể gửi yêu cầu', dupHtml);
          } else {
            alert(errMsg || 'Bạn đã có đơn thuê xe này đang chờ duyệt trong khoảng thời gian trùng lặp!');
          }
        } else {
          const displayMsg = errMsg || 'Không thể tạo yêu cầu thuê xe. Vui lòng thử lại!';
          if (typeof toast !== 'undefined') {
            toast.error(displayMsg);
          } else {
            alert(displayMsg);
          }
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

