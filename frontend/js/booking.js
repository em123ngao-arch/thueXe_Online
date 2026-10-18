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
      if (typeof toast !== 'undefined') {
        toast.warning('Vui lòng đăng nhập trước khi gửi yêu cầu thuê xe!');
      } else {
        alert('Vui lòng đăng nhập trước khi gửi yêu cầu thuê xe!');
      }
      setTimeout(() => {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      }, 700);
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
            unavailable_dates: c.unavailableDates || c.unavailable_dates || [],
            has_driver_service: Boolean(c.hasDriverService ?? c.has_driver_service ?? true),
            driver_fee_per_day: Number(c.driverFeePerDay || c.driver_fee_per_day || 300000)
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
    let isAutoAdjusted = false;
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

      // Tự động tìm ngày trống gần nhất nếu ngày ban đầu trùng lịch bận (Decision 2 Grill-Me)
      const unavailableDates = Array.isArray(car.unavailable_dates) ? car.unavailable_dates : [];
      if (unavailableDates.length > 0) {
        const conflict = this.checkDateConflict(startDateVal, endDateVal, unavailableDates);
        if (conflict) {
          const desiredDays = Math.max(2, days || 2);
          const earliest = this.findEarliestAvailableDates(unavailableDates, desiredDays);
          startDateVal = earliest.startDate;
          endDateVal = earliest.endDate;
          isAutoAdjusted = true;

          const newStartDateTime = new Date(`${startDateVal}T${startTimeVal}`);
          const newEndDateTime = new Date(`${endDateVal}T${endTimeVal}`);
          let newDiffHours = Math.ceil((newEndDateTime - newStartDateTime) / (1000 * 60 * 60));
          days = Math.ceil(newDiffHours / 24);
          if (isNaN(days) || days < 1) days = 1;
        }
      }

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
      baseRentalAmount: rentalAmount,
      hasDriverService: car.has_driver_service ?? true,
      driverFeePerDay: car.driver_fee_per_day || 300000,
      withDriver: false,
      totalDriverFee: 0,
      rentalAmount,
      depositAmount,
      isAutoAdjusted
    };

    this.renderBookingModal();
  },

  // Chauffeur Service (Sprint 3): Bật/tắt dịch vụ kèm tài xế
  toggleDriverService(withDriver) {
    if (!this.calcData) return;
    this.calcData.withDriver = Boolean(withDriver);
    const baseRental = this.calcData.baseRentalAmount || (this.calcData.days * this.calcData.pricePerDay);

    if (this.calcData.withDriver) {
      // Phụ phí tài xế theo ngày
      this.calcData.totalDriverFee = (this.calcData.days || 1) * (this.calcData.driverFeePerDay || 300000);
    } else {
      this.calcData.totalDriverFee = 0;
    }

    this.calcData.rentalAmount = baseRental + this.calcData.totalDriverFee;
    this.calcData.depositAmount = Math.round(this.calcData.rentalAmount * 0.30);
    this.renderBookingModal();
  },

  // Kiểm tra xung đột ngày với unavailable_dates
  checkDateConflict(startDate, endDate, unavailableDates = []) {
    if (!unavailableDates || unavailableDates.length === 0 || !startDate || !endDate) return null;
    let cur = new Date(startDate);
    const end = new Date(endDate);
    const formatYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    while (cur <= end) {
      const curStr = formatYMD(cur);
      if (unavailableDates.includes(curStr)) {
        return curStr;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return null;
  },

  // Thuật toán tìm khoảng ngày trống khả dụng gần nhất (Decision 2 Grill-Me)
  findEarliestAvailableDates(unavailableDates = [], desiredDays = 2) {
    const today = new Date();
    let start = new Date(today);
    start.setDate(today.getDate() + 1);

    const formatYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Tìm kiếm trong 60 ngày tiếp theo
    for (let offset = 0; offset < 60; offset++) {
      let candidateStart = new Date(start);
      candidateStart.setDate(start.getDate() + offset);

      let isConflict = false;
      for (let d = 0; d < desiredDays; d++) {
        let checkDay = new Date(candidateStart);
        checkDay.setDate(candidateStart.getDate() + d);
        let checkStr = formatYMD(checkDay);
        if (unavailableDates.includes(checkStr)) {
          isConflict = true;
          break;
        }
      }

      if (!isConflict) {
        let candidateEnd = new Date(candidateStart);
        candidateEnd.setDate(candidateStart.getDate() + desiredDays);
        return {
          startDate: formatYMD(candidateStart),
          endDate: formatYMD(candidateEnd)
        };
      }
    }

    let fallbackEnd = new Date(start);
    fallbackEnd.setDate(start.getDate() + desiredDays);
    return {
      startDate: formatYMD(start),
      endDate: formatYMD(fallbackEnd)
    };
  },

  // Định dạng các khoảng ngày bận trực quan (VD: 02/10 - 05/10)
  formatBusyRanges(dates = []) {
    if (!dates || dates.length === 0) return 'Không có';
    const sorted = [...dates].sort();
    const todayStr = new Date().toISOString().slice(0, 10);
    const upcoming = sorted.filter(d => d >= todayStr);
    if (upcoming.length === 0) return 'Không có lịch bận sắp tới';

    const ranges = [];
    let start = upcoming[0];
    let prev = upcoming[0];

    for (let i = 1; i < upcoming.length; i++) {
      const cur = upcoming[i];
      const prevDate = new Date(prev);
      prevDate.setDate(prevDate.getDate() + 1);
      const nextExpected = prevDate.toISOString().slice(0, 10);

      if (cur === nextExpected) {
        prev = cur;
      } else {
        ranges.push(start === prev ? start.slice(5) : `${start.slice(5)} - ${prev.slice(5)}`);
        start = cur;
        prev = cur;
      }
    }
    ranges.push(start === prev ? start.slice(5) : `${start.slice(5)} - ${prev.slice(5)}`);
    return ranges.map(r => r.replace(/-/g, '/')).join(', ');
  },

  // Mở bộ chọn lịch có làm mờ ngày bận (Decision 3 Grill-Me)
  openSchedulePicker() {
    if (typeof MiotoTimePicker === 'undefined') return;
    if (typeof App !== 'undefined' && App.closeModal) {
      App.closeModal();
    }
    MiotoTimePicker.open({
      startDate: this.calcData?.startDate,
      endDate: this.calcData?.endDate,
      startTime: this.calcData?.startTime,
      endTime: this.calcData?.endTime,
      disabledDates: this.currentCar?.unavailable_dates || [],
      onSelect: (selected) => {
        this.updateSchedule(selected);
      }
    });
  },

  // Cập nhật lịch sau khi người dùng chọn ngày từ MiotoTimePicker
  updateSchedule(selected) {
    if (!selected || !this.calcData) return;
    const pricePerDay = this.calcData.pricePerDay;
    const startDateVal = selected.startDate;
    const endDateVal = selected.endDate;
    const startTimeVal = selected.startTime || this.calcData.startTime;
    const endTimeVal = selected.endTime || this.calcData.endTime;

    const startDateTime = new Date(`${startDateVal}T${startTimeVal}`);
    const endDateTime = new Date(`${endDateVal}T${endTimeVal}`);
    let diffHours = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60));
    let days = Math.ceil(diffHours / 24);
    if (isNaN(days) || days < 1) days = 1;
    const rentalAmount = days * pricePerDay;
    const depositAmount = Math.round(rentalAmount * 0.30);

    this.calcData.startDate = startDateVal;
    this.calcData.endDate = endDateVal;
    this.calcData.startTime = startTimeVal;
    this.calcData.endTime = endTimeVal;
    this.calcData.startTimeStr = `${startTimeVal} ${startDateVal}`;
    this.calcData.endTimeStr = `${endTimeVal} ${endDateVal}`;
    this.calcData.days = days;
    this.calcData.rentalAmount = rentalAmount;
    this.calcData.depositAmount = depositAmount;
    this.calcData.isAutoAdjusted = false;

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

    const conflictDate = this.checkDateConflict(calc.startDate, calc.endDate, car.unavailable_dates);
    const busyRangesStr = this.formatBusyRanges(car.unavailable_dates);

    let conflictAlertHtml = '';
    if (conflictDate) {
      conflictAlertHtml = `
        <div class="booking-conflict-alert" style="margin-top: 0.65rem; background: #fef2f2; border: 1.5px solid #f87171; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.82rem; color: #991b1b; display: flex; align-items: flex-start; gap: 0.5rem; line-height: 1.4;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="flex-shrink: 0; margin-top: 1px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <div>
            <strong>Khoảng ngày không khả dụng:</strong> Xe đã có lịch bận vào ngày <strong>${conflictDate}</strong> (đã có đơn cọc hoặc xe bảo dưỡng). Vui lòng bấm <strong><a href="javascript:void(0)" onclick="BookingService.openSchedulePicker()" style="color: #b91c1c; text-decoration: underline; font-weight: 700;">"Thay đổi"</a></strong> để chọn khoảng ngày trống khác.
          </div>
        </div>
      `;
    }

    let autoAdjustHtml = '';
    if (calc.isAutoAdjusted) {
      autoAdjustHtml = `
        <div class="booking-autoadjust-alert" style="margin-top: 0.5rem; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.8rem; color: #065f46; display: flex; align-items: center; gap: 0.45rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="flex-shrink: 0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span>Đã tự động chọn khoảng ngày trống gần nhất cho bạn (<strong>${calc.startDate} → ${calc.endDate}</strong>) do xe đã có lịch bận trước đó.</span>
        </div>
      `;
    }

    let busySummaryHtml = '';
    if (car.unavailable_dates && car.unavailable_dates.length > 0) {
      busySummaryHtml = `
        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0;"></span>
          <span>Lịch bận của xe: <strong style="color: #b91c1c;">${busyRangesStr}</strong></span>
        </div>
      `;
    }

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
                ${calc.withDriver ? `
                  <span class="badge" style="background:#e0e7ff; color:#3730a3; font-weight:700; font-size:0.75rem; padding: 2px 8px; border-radius: 999px;">Miễn GPLX (Có tài xế)</span>
                ` : `
                  <span class="badge badge-success" style="background:#dcfce7; color:#166534; font-weight:700; font-size:0.75rem; padding: 2px 8px; border-radius: 999px;">Bắt buộc · Đã xác minh (B2)</span>
                `}
              </div>
              ${calc.withDriver ? `
                <div style="margin-top: 0.35rem; font-size: 0.75rem; color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; padding: 4px 8px; border-radius: 4px;">
                  ✓ Bạn đã chọn gói kèm tài xế riêng nên không cần nộp giấy phép lái xe và miễn ký quỹ thế chấp.
                </div>
              ` : ''}
            </div>

            <!-- Tùy chọn Có Tài Xế (Chauffeur Service Sprint 3) -->
            <div style="background: ${calc.withDriver ? '#f0fdfa' : '#f8fafc'}; border: 1.5px solid ${calc.withDriver ? '#0d9488' : '#e2e8f0'}; border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.85rem; transition: all 0.2s ease;">
              <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; user-select: none; margin: 0;">
                <input type="checkbox" id="chkWithDriver" style="width: 19px; height: 19px; margin-top: 2px; accent-color: #0f766e; cursor: pointer;"
                  ${calc.withDriver ? 'checked' : ''}
                  onchange="BookingService.toggleDriverService(this.checked)"
                />
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: #0f172a; font-size: 0.88rem;">Kèm tài xế riêng chuyên nghiệp</strong>
                    <span class="badge" style="background: #ccfbf1; color: #0f766e; font-weight: 700; font-size: 0.76rem;">+${formatMoney(calc.driverFeePerDay || 300000)}/ngày</span>
                  </div>
                  <div style="color: #64748b; font-size: 0.78rem; margin-top: 3px; line-height: 1.4;">
                    Tài xế nhiều năm kinh nghiệm, thông thạo đường xá. <strong>Tự động miễn yêu cầu nộp bằng lái GPLX</strong> và miễn thế chấp tài sản.
                  </div>
                </div>
              </label>
            </div>

            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
              <span>2. Lịch trình & Địa điểm giao nhận xe</span>
              <a href="javascript:void(0)" onclick="BookingService.openSchedulePicker()" style="font-size: 0.8rem; color: #00a550; font-weight: 600; text-decoration: none;">Thay đổi</a>
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
              ${busySummaryHtml}
              ${autoAdjustHtml}
              ${conflictAlertHtml}
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
                <span>${calc.isHourly ? `Tiền thuê xe (${calc.hours} giờ):` : `Tiền thuê xe (${calc.days} ngày):`}</span>
                <span>${formatMoney(calc.baseRentalAmount || (calc.days * calc.pricePerDay))}</span>
              </div>
              ${calc.withDriver ? `
              <div class="calc-row" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: #0f766e; font-weight: 700;">
                <span>Phụ phí tài xế riêng (${calc.days} ngày):</span>
                <span>+${formatMoney(calc.totalDriverFee)}</span>
              </div>
              ` : ''}
              <div class="calc-row total" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem; font-weight: 700; border-top: 1px dashed var(--slate-300); padding-top: 0.5rem;">
                <span>Tổng giá trị gói thuê:</span>
                <span style="color: #0f172a; font-size: 1.05rem;">${formatMoney(calc.rentalAmount)}</span>
              </div>
              <div class="calc-row deposit-highlight" style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 800; color: #047857; background: #d1fae5; padding: 0.5rem; border-radius: 4px;">
                <span>Cọc giữ chỗ 30% (sau khi duyệt):</span>
                <span>${formatMoney(calc.depositAmount)}</span>
              </div>
            </div>

            ${conflictDate ? `
              <button id="btnSubmitBooking" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 800; font-size: 0.92rem; background: #94a3b8; border-color: #94a3b8; cursor: not-allowed;" disabled title="Xe đã có lịch bận trong khoảng thời gian này">
                Xe Không Khả Dụng Trong Khoảng Này
              </button>
            ` : `
              <button id="btnSubmitBooking" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 800; font-size: 1rem; background: #0f766e; border-color: #0f766e;" onclick="BookingService.submitBookingRequest()">
                Gửi Yêu Cầu Thuê Xe Cho Chủ Xe Duyệt (Miễn phí)
              </button>
            `}
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
    const conflictDate = this.checkDateConflict(this.calcData.startDate, this.calcData.endDate, this.currentCar?.unavailable_dates);
    if (conflictDate) {
      if (typeof toast !== 'undefined') {
        toast.error(`Xe đã có lịch bận vào ngày ${conflictDate}. Vui lòng bấm Thay đổi để chọn ngày khác!`);
      }
      this.renderBookingModal();
      return;
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
      note: finalNote,
      with_driver: Boolean(this.calcData.withDriver)
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
        const errCode = res && (res.code || res.errorCode);
        const errMsg = res && res.message;

        if (errCode === 'KYC_NOT_VERIFIED') {
          if (typeof App !== 'undefined' && App.closeModal) App.closeModal();
          const kycHtml = `
            <div style="text-align: center; padding: 1.5rem 0.5rem;">
              <div style="width: 64px; height: 64px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem auto;">&#10006;</div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #991b1b; margin-bottom: 0.5rem;">Hồ sơ chưa được phê duyệt</h3>
              <p style="color: var(--slate-600); font-size: 0.9rem; line-height: 1.6; max-width: 400px; margin: 0 auto 1.25rem auto;">
                ${errMsg || 'Giấy tờ tùy thân (CCCD) hoặc Giấy phép lái xe (GPLX) của bạn chưa được duyệt hoặc bị từ chối. Vui lòng kiểm tra trạng thái tại trang cá nhân.'}
              </p>
              <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <button class="btn btn-primary btn-md" onclick="window.location.href='profile.html'">
                  Đến trang Hồ sơ
                </button>
                <button class="btn btn-outline-secondary btn-md" onclick="App.closeModal();">
                  Đóng
                </button>
              </div>
            </div>
          `;
          if (typeof App !== 'undefined' && App.openModal) {
            App.openModal('Yêu cầu xác thực hồ sơ', kycHtml);
          } else {
            alert(errMsg || 'Giấy tờ của bạn chưa được duyệt. Vui lòng cập nhật hồ sơ!');
          }
        } else if (errCode === 'DUPLICATE_RENTAL_REQUEST') {
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
  },

  // =========================================================================
  // SPRINT 3 FIX (ISSUE #39): MODAL KHIẾU NẠI SỰ CỐ NHẬN XE (DISPUTE NO-SHOW)
  // =========================================================================

  disputeState: {
    rentalId: null,
    reason: '',
    images: [], // Tối đa 3 File
    video: null, // Tối đa 1 File, <= 50MB
    isSubmitting: false
  },

  showDisputeToast(message, type = 'info') {
    if (typeof Toast !== 'undefined' && typeof Toast[type] === 'function') {
      Toast[type](message);
    } else if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
      Toast.show(message, type);
    } else if (typeof toast !== 'undefined' && typeof toast[type] === 'function') {
      toast[type](message);
    } else if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(message, type);
    } else if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`[Dispute Toast ${type}] ${message}`);
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Mở Modal Khiếu Nại Sự Cố Nhận Xe (Chủ xe vắng mặt / không bàn giao xe)
   * @param {number|string} rentalId
   */
  openDisputeModal(rentalId) {
    if (!rentalId) {
      this.showDisputeToast('Không xác định được mã đơn chuyến đi!', 'error');
      return;
    }

    // Reset state khi mở modal mới
    this.disputeState = {
      rentalId: rentalId,
      reason: '',
      images: [],
      video: null,
      isSubmitting: false
    };

    // Tìm thông tin chuyến đi trong cache để hiển thị tiêu đề thân thiện
    let tripInfo = null;
    if (typeof App !== 'undefined' && Array.isArray(App.cachedMyBookings)) {
      tripInfo = App.cachedMyBookings.find(b => (b.rental_id || b.rentalId || b.id) == rentalId);
    }
    const carName = tripInfo ? (tripInfo.car_brand ? `${tripInfo.car_brand} ${tripInfo.car_model || ''}` : (tripInfo.carBrand ? `${tripInfo.carBrand} ${tripInfo.carModel || ''}` : tripInfo.car_name)) : `Chuyến đi #${rentalId}`;
    const plate = tripInfo ? (tripInfo.car_plate_number || tripInfo.carPlateNumber || tripInfo.license_plate || '') : '';

    const modalHtml = `
      <div class="dispute-modal-container" style="padding: 0.25rem 0; font-family: inherit;">
        <!-- Banner cảnh báo & hướng dẫn -->
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; display: flex; gap: 10px; align-items: flex-start;">
          <div style="color: #ea580c; flex-shrink: 0; margin-top: 2px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div style="font-size: 0.85rem; color: #9a3412; line-height: 1.45;">
            <strong>Bảo vệ quyền lợi khách thuê:</strong> Nếu bạn đã đến điểm hẹn đúng giờ nhưng chủ xe không giao xe hoặc không liên lạc được, hãy gửi biên bản khiếu nại kèm ảnh/video tại điểm hẹn. DriveShare sẽ xử lý hoàn 100% cọc và phạt chủ xe vi phạm.
          </div>
        </div>

        <!-- Thông tin tóm tắt chuyến đi -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Phương tiện thuê</div>
            <strong style="color: #0f172a; font-size: 0.95rem;">${this.escapeHtml(carName)}</strong>
            ${plate ? `<span style="font-family: monospace; font-size: 0.82rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${this.escapeHtml(plate)}</span>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Mã đơn thuê</div>
            <span style="font-weight: 700; color: #0f766e;">#${rentalId}</span>
          </div>
        </div>

        <!-- Form nhập lý do -->
        <div class="form-group" style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label for="disputeReasonInput" style="font-size: 0.86rem; font-weight: 700; color: #1e293b;">
              Lý do khiếu nại <span style="color: #ef4444;">*</span> <span style="font-size: 0.75rem; font-weight: 400; color: #64748b;">(Tối thiểu 10 ký tự)</span>
            </label>
            <span id="disputeReasonCounter" style="font-size: 0.75rem; color: #64748b;">0 / 1000 ký tự</span>
          </div>
          <textarea
            id="disputeReasonInput"
            class="form-control"
            rows="3"
            maxlength="1000"
            placeholder="Ví dụ: Tôi đã có mặt tại điểm hẹn lúc 08:00 sáng nhưng chủ xe không xuất hiện. Đã gọi 3 cuộc điện thoại lúc 08:05, 08:15 nhưng máy bận và không có người nghe máy..."
            style="width: 100%; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 0.88rem; box-sizing: border-box; line-height: 1.45; resize: vertical;"
            oninput="BookingService.handleDisputeReasonInput(this.value)"
          ></textarea>
          <div id="disputeReasonError" style="color: #ef4444; font-size: 0.78rem; font-weight: 600; margin-top: 4px; display: none;"></div>
        </div>

        <!-- Dropzone tải ảnh và video bằng chứng -->
        <div class="form-group" style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 0.86rem; font-weight: 700; color: #1e293b;">
              Bằng chứng tại điểm hẹn <span style="color: #ef4444;">*</span>
            </label>
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Tối đa 3 ảnh & 1 video (tối đa 50MB)</span>
          </div>

          <!-- Dropzone Container -->
          <div
            id="disputeDropzone"
            class="dispute-dropzone"
            onclick="document.getElementById('disputeFileInput').click()"
            ondragover="BookingService.handleDisputeDragOver(event)"
            ondragleave="BookingService.handleDisputeDragLeave(event)"
            ondrop="BookingService.handleDisputeDrop(event)"
            style="border: 2px dashed #0f766e; border-radius: 10px; background: #f0fdfa; padding: 18px 14px; text-align: center; cursor: pointer; transition: all 0.2s ease;"
          >
            <!-- Xử lý triệt để lỗi bubbling: onclick='event.stopPropagation()' -->
            <input
              type="file"
              id="disputeFileInput"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
              multiple
              style="display: none;"
              onclick="event.stopPropagation()"
              onchange="BookingService.handleDisputeFileInput(event)"
            />
            <div style="color: #0f766e; margin-bottom: 6px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div style="font-size: 0.88rem; font-weight: 700; color: #0f766e; margin-bottom: 3px;">
              Kéo thả hoặc nhấp để tải ảnh & clip video bằng chứng
            </div>
            <div style="font-size: 0.75rem; color: #64748b;">
              Hỗ trợ JPG, PNG, WEBP (tối đa 10MB/ảnh) và MP4, MOV (tối đa 50MB)
            </div>
          </div>
        </div>

        <!-- Danh sách file preview trực quan -->
        <div id="disputeFilePreviewList" style="margin-bottom: 16px;">
          <!-- Được render động qua BookingService.renderDisputePreviews() -->
        </div>

        <!-- Nút hành động modal -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          <button
            type="button"
            class="btn btn-outline btn-md"
            onclick="App.closeModal()"
            style="font-weight: 600; padding: 0.5rem 1rem;"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            id="btnSubmitDispute"
            class="btn btn-primary btn-md"
            onclick="BookingService.submitDispute()"
            style="background: #ea580c; border-color: #ea580c; font-weight: 700; padding: 0.5rem 1.25rem; display: inline-flex; align-items: center; gap: 6px;"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Gửi khiếu nại sự cố
          </button>
        </div>
      </div>
    `;

    if (typeof App !== 'undefined' && App.openModal) {
      App.openModal(`Báo cáo sự cố nhận xe — Đơn #${rentalId}`, modalHtml);
    } else {
      let sandbox = document.getElementById('testSandbox');
      if (!sandbox) {
        sandbox = document.createElement('div');
        sandbox.id = 'testSandbox';
        document.body.appendChild(sandbox);
      }
      sandbox.style.display = 'block';
      sandbox.innerHTML = `<div id="disputeModal">${modalHtml}</div>`;
    }
  },

  handleDisputeReasonInput(val) {
    this.disputeState.reason = val || '';
    const counter = document.getElementById('disputeReasonCounter');
    if (counter) {
      counter.textContent = `${this.disputeState.reason.length} / 1000 ký tự`;
      if (this.disputeState.reason.length >= 10) {
        counter.style.color = '#059669';
      } else {
        counter.style.color = '#64748b';
      }
    }
    const err = document.getElementById('disputeReasonError');
    if (err && this.disputeState.reason.length >= 10) {
      err.style.display = 'none';
    }
  },

  handleDisputeDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('disputeDropzone');
    if (dropzone) {
      dropzone.style.borderColor = '#059669';
      dropzone.style.backgroundColor = '#ecfdf5';
    }
  },

  handleDisputeDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('disputeDropzone');
    if (dropzone) {
      dropzone.style.borderColor = '#0f766e';
      dropzone.style.backgroundColor = '#f0fdfa';
    }
  },

  handleDisputeDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handleDisputeDragLeave(e);
    if (e.dataTransfer && e.dataTransfer.files) {
      this.handleDisputeFileSelect(e.dataTransfer.files);
    }
  },

  handleDisputeFileInput(e) {
    // TC-T04: Nếu người dùng mở file picker rồi bấm "Cancel" (files rỗng)
    // Giữ nguyên file cũ, không reset trắng màn hình
    if (!e.target || !e.target.files || e.target.files.length === 0) {
      return;
    }
    this.handleDisputeFileSelect(e.target.files);
    // Reset value input để chọn lại file cùng tên nếu cần
    e.target.value = '';
  },

  /**
   * Xử lý và kiểm tra danh sách file được chọn
   * Kiểm tra kích thước video <= 50MB (TC-T03)
   * Kiểm tra định dạng an toàn (TC-T08)
   * Giới hạn tối đa 3 ảnh và 1 video
   */
  handleDisputeFileSelect(fileList) {
    const files = Array.from(fileList);
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (TC-T03)
    const MAX_IMG_SIZE = 10 * 1024 * 1024;  // 10MB

    for (const file of files) {
      const type = (file.type || '').toLowerCase();
      const name = (file.name || '').toLowerCase();

      // TC-T08: Kiểm tra đuôi file nguy hiểm hoặc không hợp lệ
      const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.jar', '.vbs', '.msi', '.zip', '.rar', '.tar', '.txt'];
      const hasDangerousExt = dangerousExts.some(ext => name.endsWith(ext));
      const isVideo = type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm');
      const isImage = type.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');

      if (hasDangerousExt || (!isVideo && !isImage)) {
        this.showDisputeToast(`Định dạng file "${this.escapeHtml(file.name)}" không hợp lệ! Vui lòng chỉ chọn ảnh (JPG, PNG, WEBP) hoặc video (MP4, MOV).`, 'error');
        continue;
      }

      // Xử lý file Video
      if (isVideo) {
        // TC-T03: Chặn file lớn tại trình duyệt trước khi gửi
        if (file.size > MAX_VIDEO_SIZE) {
          this.showDisputeToast('Video vượt quá 50MB, vui lòng chọn clip ngắn hơn', 'error');
          continue;
        }

        // Tối đa 1 video clip
        if (this.disputeState.video) {
          this.showDisputeToast('Chỉ được chọn tối đa 1 video clip bằng chứng!', 'warning');
          continue;
        }

        this.disputeState.video = file;
        this.showDisputeToast(`Đã đính kèm video clip: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'success');
        continue;
      }

      // Xử lý file Ảnh
      if (isImage) {
        if (file.size > MAX_IMG_SIZE) {
          this.showDisputeToast(`Ảnh "${file.name}" vượt quá 10MB! Vui lòng chọn ảnh có dung lượng nhỏ hơn.`, 'warning');
          continue;
        }

        // Tối đa 3 ảnh
        if (this.disputeState.images.length >= 3) {
          this.showDisputeToast('Chỉ được chọn tối đa 3 ảnh bằng chứng!', 'warning');
          continue;
        }

        this.disputeState.images.push(file);
      }
    }

    this.renderDisputePreviews();
  },

  removeDisputeImage(index) {
    if (this.disputeState.images[index]) {
      this.disputeState.images.splice(index, 1);
      this.renderDisputePreviews();
    }
  },

  removeDisputeVideo() {
    this.disputeState.video = null;
    this.renderDisputePreviews();
  },

  /**
   * Render danh sách các file bằng chứng đã chọn trực quan
   */
  renderDisputePreviews() {
    const container = document.getElementById('disputeFilePreviewList') || document.getElementById('disputePreviews');
    if (!container) return;

    let images = this.disputeState.images || [];
    let video = this.disputeState.video;

    // Fallback to selectedFiles if images is empty (e.g. in test suites)
    if (images.length === 0 && !video && Array.isArray(this.disputeState.selectedFiles) && this.disputeState.selectedFiles.length > 0) {
      images = this.disputeState.selectedFiles.filter(f => !(f.type && f.type.startsWith('video/')) && !(f.name && f.name.endsWith('.mp4')));
      video = this.disputeState.selectedFiles.find(f => (f.type && f.type.startsWith('video/')) || (f.name && f.name.endsWith('.mp4'))) || null;
    }

    if (images.length === 0 && !video) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px;">
        Đã chọn: ${images.length} / 3 ảnh, ${video ? '1 / 1 video' : '0 / 1 video'}
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start;">
    `;

    // Render ảnh
    images.forEach((file, idx) => {
      let previewUrl = '';
      try { previewUrl = URL.createObjectURL(file); } catch (e) {}
      const sizeKb = Math.round(file.size / 1024);
      const safeName = this.escapeHtml(file.name || (`Ảnh #${idx + 1}`));
      html += `
        <div style="position: relative; width: 100px; height: 95px; border-radius: 8px; border: 1.5px solid #cbd5e1; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center;">
          <img src="${previewUrl}" alt="Ảnh bằng chứng ${idx + 1}" style="width: 100%; height: 70px; object-fit: cover;" />
          <div style="font-size: 0.68rem; color: #64748b; padding: 2px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${safeName}">
            ${safeName} (${sizeKb} KB)
          </div>
          <button
            type="button"
            onclick="BookingService.removeDisputeImage(${idx})"
            title="Gỡ ảnh này"
            style="position: absolute; top: 3px; right: 3px; background: rgba(239, 68, 68, 0.9); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px; font-weight: bold; line-height: 1;"
          >&times;</button>
        </div>
      `;
    });

    // Render video
    if (video) {
      const sizeMb = (video.size / (1024 * 1024)).toFixed(1);
      const safeVideoName = this.escapeHtml(video.name || 'video_clip.mp4');
      html += `
        <div style="position: relative; min-width: 170px; height: 95px; border-radius: 8px; border: 1.5px solid #0f766e; background: #f0fdfa; padding: 8px 10px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            <strong style="font-size: 0.8rem; color: #0f766e;">Clip bằng chứng</strong>
          </div>
          <div style="font-size: 0.72rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;" title="${safeVideoName}">
            ${safeVideoName}
          </div>
          <div style="font-size: 0.68rem; color: #059669; font-weight: 600;">
            Dung lượng: ${sizeMb} MB (&le; 50MB ✔)
          </div>
          <button
            type="button"
            onclick="BookingService.removeDisputeVideo()"
            title="Gỡ video này"
            style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px; font-weight: bold; line-height: 1;"
          >&times;</button>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  },

  /**
   * Gửi khiếu nại sự cố nhận xe lên Server
   * TC-T01: Happy Path
   * TC-T02: Chặn Double-Click / Spam 5 lần liên tiếp
   * TC-T05: Hỗ trợ an toàn Emoji 😄🔥, tiếng Việt có dấu, chặn XSS
   * TC-T07: Chặn gửi khi thiếu lý do hoặc bằng chứng
   */
  async submitDispute() {
    const btn = document.getElementById('btnSubmitDispute');
    const reasonInput = document.getElementById('disputeReasonInput') || document.getElementById('disputeReason');
    const reasonErr = document.getElementById('disputeReasonError');
    const reason = reasonInput ? reasonInput.value.trim() : this.disputeState.reason.trim();

    // TC-T02: Ngay lần click đầu tiên, khóa nút disabled ngay lập tức
    if (this.disputeState.isSubmitting) {
      console.warn('[Dispute] Bị chặn double-click spam!');
      return;
    }
    this.disputeState.isSubmitting = true;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px;"></span>
        Đang gửi khiếu nại...
      `;
    }

    const resetSubmitBtn = () => {
      this.disputeState.isSubmitting = false;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          Gửi khiếu nại sự cố
        `;
      }
    };

    // TC-T07: Kiểm tra độ dài lý do >= 10 ký tự
    if (!reason || reason.length < 10) {
      if (reasonErr) {
        reasonErr.textContent = 'Vui lòng nhập lý do khiếu nại chi tiết tối thiểu 10 ký tự!';
        reasonErr.style.display = 'block';
      }
      this.showDisputeToast('Vui lòng nhập lý do khiếu nại chi tiết (tối thiểu 10 ký tự)!', 'warning');
      resetSubmitBtn();
      return;
    }

    // TC-T07: Kiểm tra bằng chứng (phải có ít nhất 1 ảnh hoặc 1 video)
    const allFiles = [
      ...(this.disputeState.selectedFiles || []),
      ...(this.disputeState.images || []),
      ...(this.disputeState.video ? [this.disputeState.video] : [])
    ];
    const uniqueFiles = Array.from(new Set(allFiles));

    if (uniqueFiles.length === 0) {
      this.showDisputeToast('Vui lòng cung cấp ít nhất 1 ảnh hoặc 1 video làm bằng chứng tại điểm hẹn!', 'warning');
      resetSubmitBtn();
      return;
    }

    // Đóng gói FormData gửi lên server (Multipart/form-data chuẩn)
    const formData = new FormData();
    formData.append('reason', reason);
    uniqueFiles.forEach(f => {
      formData.append('files', f);
      formData.append('evidenceFiles', f);
    });

    const rentalId = this.disputeState.rentalId;

    try {
      let res = null;
      if (typeof RentalAPI !== 'undefined' && RentalAPI.reportNoShow) {
        res = await RentalAPI.reportNoShow(rentalId, formData);
      } else {
        const headers = (typeof getAuthHeaders === 'function') ? getAuthHeaders() : {};
        delete headers['Content-Type'];
        delete headers['content-type'];
        const apiBase = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL : 'http://localhost:3000/api/v1';
        const response = await fetch(`${apiBase}/rentals/${rentalId}/report-no-show`, {
          method: 'POST',
          headers,
          body: formData
        });
        const json = await response.json().catch(() => null);
        res = {
          success: response.ok,
          data: json?.data || json,
          message: json?.message
        };
      }

      if (res && res.success) {
        // Cập nhật trạng thái đơn trong cache chuyến đi thành DISPUTED
        if (typeof App !== 'undefined' && Array.isArray(App.cachedMyBookings)) {
          const trip = App.cachedMyBookings.find(b => (b.rental_id || b.rentalId || b.id) == rentalId);
          if (trip) {
            trip.status = 'DISPUTED';
            trip.dispute_reason = reason;
          }
        }
        if (typeof StorageService !== 'undefined') {
          const bks = StorageService.getBookings();
          const target = bks.find(b => (b.rental_id || b.rentalId || b.id) == rentalId);
          if (target) {
            target.status = 'DISPUTED';
            target.dispute_reason = reason;
            localStorage.setItem('driveshare_bookings', JSON.stringify(bks));
          }
        }

        // Đóng modal & thông báo thành công
        if (typeof App !== 'undefined' && App.closeModal) {
          App.closeModal();
        }

        this.showDisputeToast('Đã gửi khiếu nại sự cố nhận xe thành công! DriveShare sẽ xử lý trong 24h.', 'success');

        // Render lại danh sách chuyến đi -> Hiển thị ngay Badge "ĐANG KHIẾU NẠI" (TC-T01 Happy Path)
        if (typeof App !== 'undefined' && App.showMyBookingsView) {
          App.showMyBookingsView();
        }
      } else {
        const errMsg = res?.message || 'Không thể gửi báo cáo sự cố nhận xe. Vui lòng thử lại!';
        this.showDisputeToast(errMsg, 'error');
        resetSubmitBtn();
      }
    } catch (err) {
      console.error('[Dispute] Lỗi gửi khiếu nại:', err);
      this.showDisputeToast('Lỗi kết nối khi gửi khiếu nại sự cố. Vui lòng thử lại!', 'error');
      resetSubmitBtn();
    }
  },

  /**
   * Xem chi tiết khiếu nại của chuyến đi đang tranh chấp
   */
  viewDisputeDetails(rentalId) {
    let trip = null;
    if (typeof App !== 'undefined' && Array.isArray(App.cachedMyBookings)) {
      trip = App.cachedMyBookings.find(b => (b.rental_id || b.rentalId || b.id) == rentalId);
    }
    const reason = trip?.dispute_reason || 'Chủ xe không có mặt tại điểm hẹn bàn giao xe và không liên lạc được.';

    const html = `
      <div style="padding: 0.5rem 0;">
        <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge badge-danger" style="font-weight: 800;">ĐANG KHIẾU NẠI</span>
            <strong style="color: #991b1b;">Đơn thuê #${rentalId}</strong>
          </div>
          <p style="color: #7f1d1d; font-size: 0.88rem; margin: 0; line-height: 1.45;">
            Hồ sơ khiếu nại đang được Đội ngũ Vận hành DriveShare đối chiếu nhật ký cuộc gọi và bằng chứng hình ảnh.
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">
            Nội dung lý do đã gửi
          </div>
          <div style="font-size: 0.88rem; color: #1e293b; line-height: 1.5;">
            ${this.escapeHtml(reason)}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal()">Đóng</button>
        </div>
      </div>
    `;

    if (typeof App !== 'undefined' && App.openModal) {
      App.openModal(`Chi tiết khiếu nại #${rentalId}`, html);
    }
  }
};

// Expose toàn cục để gọi từ mọi view
if (typeof window !== 'undefined') {
  window.BookingService = BookingService;
}


