/**
 * DRIVESHARE — Mioto-Style Date & Time Picker Component
 * Bám sát 100% mẫu giao diện website Mioto:
 * - Tab 1: "Thuê ngày" (Range Picker lịch 2 tháng, tối thiểu cách 1 ngày)
 *   Khung chọn giờ nhận và trả xe nằm chuẩn chỉnh ở DƯỚI lịch (Full Width)
 *   Tương tác chọn ngày mượt mà, không giật lag, không bị nuốt sự kiện click
 * - Tab 2: "Thuê giờ" (Tối thiểu 4h, tối đa 8h, tính toán kết thúc và giá chuẩn xác)
 */

const MiotoTimePicker = {
  // Trạng thái hiện tại
  state: {
    rentalMode: 'DAY', // 'DAY' | 'HOUR'

    // Phân hệ Thuê ngày
    startDate: '', // 'YYYY-MM-DD'
    endDate: '',   // 'YYYY-MM-DD'
    startTime: '08:00',
    endTime: '20:00',
    currentMonth: new Date(), // Tháng hiển thị bên trái
    selectingState: 'DONE',    // 'START' | 'END' | 'DONE'
    hoverDate: null,

    // Phân hệ Thuê giờ (tối thiểu 4h, tối đa 8h)
    hourlyStartDate: '', // 'YYYY-MM-DD'
    hourlyStartTime: '14:30', // 'HH:mm'
    hourlyHours: 4, // 4, 5, 6, 7, 8

    // Danh sách ngày bận của xe cụ thể (nếu mở từ modal đặt xe)
    disabledDates: [],
    onSelectCallback: null
  },

  // Khởi tạo component
  init() {
    this._initDefaultDates();
    this._injectModalHtml();
    this._bindTriggers();
    this._updateSearchDisplay();
  },

  // Thiết lập ngày giờ mặc định cho cả Thuê ngày và Thuê giờ
  _initDefaultDates() {
    const today = new Date();

    // 1. Thuê ngày: Ngày nhận tối thiểu cách 1 ngày (từ ngày mai)
    const minStart = new Date(today);
    minStart.setDate(today.getDate() + 1);

    const defaultEnd = new Date(today);
    defaultEnd.setDate(today.getDate() + 3);

    this.state.startDate = this.formatDateYMD(minStart);
    this.state.endDate = this.formatDateYMD(defaultEnd);
    this.state.currentMonth = new Date(minStart.getFullYear(), minStart.getMonth(), 1);

    // 2. Thuê giờ: Cho phép thuê từ hôm nay
    this.state.hourlyStartDate = this.formatDateYMD(today);
    let curH = today.getHours();
    let curM = today.getMinutes();
    let nextM = curM < 30 ? 30 : 0;
    let nextH = (curM < 30 ? curH : curH + 1) + 1;

    if (nextH > 21) {
      // Nếu quá muộn trong ngày, chuyển sang 08:00 sáng mai
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      this.state.hourlyStartDate = this.formatDateYMD(tomorrow);
      this.state.hourlyStartTime = '08:00';
    } else {
      this.state.hourlyStartTime = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
    }
    this.state.hourlyHours = 4;

    this._syncToHiddenInputs();
  },

  // Định dạng Date -> YYYY-MM-DD
  formatDateYMD(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Parse YYYY-MM-DD -> Date object
  parseYMD(str) {
    if (!str) return new Date();
    const parts = str.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  },

  // Lấy thứ trong tuần tiếng Việt
  getVnDayOfWeek(date) {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  },

  // Định dạng ngày hiển thị tiếng Việt ngắn: 'T4, 30/09'
  formatVnShort(ymdStr) {
    if (!ymdStr) return '';
    const d = this.parseYMD(ymdStr);
    const dayOfWeek = this.getVnDayOfWeek(d);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${dayOfWeek}, ${day}/${month}`;
  },

  // Định dạng ngày đầy đủ trên thanh tìm kiếm: '08:00, 30/09/2026'
  formatSearchDisplay(ymdStr, timeStr) {
    if (!ymdStr) return '';
    const d = this.parseYMD(ymdStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${timeStr || '08:00'}, ${day}/${month}/${year}`;
  },

  // Cập nhật text hiển thị trên thanh tìm kiếm
  _updateSearchDisplay() {
    const startDisplayEl = document.getElementById('displayStartDate');
    const endDisplayEl = document.getElementById('displayEndDate');

    if (this.state.rentalMode === 'HOUR') {
      const sD = this.parseYMD(this.state.startDate);
      const sDay = String(sD.getDate()).padStart(2, '0');
      const sMonth = String(sD.getMonth() + 1).padStart(2, '0');
      const sYear = sD.getFullYear();

      const eD = this.parseYMD(this.state.endDate);
      const eDay = String(eD.getDate()).padStart(2, '0');
      const eMonth = String(eD.getMonth() + 1).padStart(2, '0');
      const eYear = eD.getFullYear();

      if (startDisplayEl) {
        startDisplayEl.innerText = `${this.state.startTime}, ${sDay}/${sMonth}/${sYear}`;
      }
      if (endDisplayEl) {
        endDisplayEl.innerText = `${this.state.endTime}, ${eDay}/${eMonth}/${eYear} (${this.state.hourlyHours}h)`;
      }
    } else {
      if (startDisplayEl) {
        startDisplayEl.innerText = this.formatSearchDisplay(this.state.startDate, this.state.startTime);
      }
      if (endDisplayEl) {
        endDisplayEl.innerText = this.formatSearchDisplay(this.state.endDate, this.state.endTime);
      }
    }

    this._syncToHiddenInputs();
  },

  // Đồng bộ sang hidden inputs cho backend và search API
  _syncToHiddenInputs() {
    const startInput = document.getElementById('searchStartDate');
    const startTimeInput = document.getElementById('searchStartTime');
    const endInput = document.getElementById('searchEndDate');
    const endTimeInput = document.getElementById('searchEndTime');

    if (startInput) startInput.value = this.state.startDate;
    if (startTimeInput) startTimeInput.value = this.state.startTime;
    if (endInput) endInput.value = this.state.endDate;
    if (endTimeInput) endTimeInput.value = this.state.endTime;
  },

  // Gắn sự kiện click mở popup
  _bindTriggers() {
    const btnStart = document.getElementById('btnTriggerDatePickerStart');
    const btnEnd = document.getElementById('btnTriggerDatePickerEnd');

    if (btnStart) {
      btnStart.addEventListener('click', () => this.open());
    }
    if (btnEnd) {
      btnEnd.addEventListener('click', () => this.open());
    }
  },

  // Mở Modal (hỗ trợ options: disabledDates, onSelect, startDate, endDate...)
  open(options = null) {
    const overlay = document.getElementById('miotoTimeOverlay');
    if (!overlay) return;

    if (options && typeof options === 'object') {
      this.state.disabledDates = Array.isArray(options.disabledDates) ? options.disabledDates : [];
      this.state.onSelectCallback = typeof options.onSelect === 'function' ? options.onSelect : null;
      if (options.startDate) this.state.startDate = options.startDate;
      if (options.endDate) this.state.endDate = options.endDate;
      if (options.startTime) this.state.startTime = options.startTime;
      if (options.endTime) this.state.endTime = options.endTime;
    } else {
      this.state.disabledDates = [];
      this.state.onSelectCallback = null;
    }

    if (this.state.rentalMode === 'HOUR') {
      this.switchTab('HOUR');
    } else {
      this.switchTab('DAY');
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  // Đóng Modal
  close() {
    const overlay = document.getElementById('miotoTimeOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // Chuyển tab "Thuê ngày" <-> "Thuê giờ"
  switchTab(tab) {
    this.state.rentalMode = tab;
    const tabDay = document.getElementById('tabRentalDay');
    const tabHour = document.getElementById('tabRentalHour');
    const dailyContent = document.getElementById('miotoDailyContent');
    const hourlyContent = document.getElementById('miotoHourlyContent');

    if (tab === 'HOUR') {
      if (tabDay) tabDay.classList.remove('active');
      if (tabHour) tabHour.classList.add('active');
      if (dailyContent) dailyContent.style.display = 'none';
      if (hourlyContent) hourlyContent.style.display = 'flex';
      this._renderHourlyView();
    } else {
      if (tabHour) tabHour.classList.remove('active');
      if (tabDay) tabDay.classList.add('active');
      if (hourlyContent) hourlyContent.style.display = 'none';
      if (dailyContent) dailyContent.style.display = 'flex';

      if (this.state.startDate) {
        const s = this.parseYMD(this.state.startDate);
        this.state.currentMonth = new Date(s.getFullYear(), s.getMonth(), 1);
      }
      this._renderCalendar();
      this._renderTimeSelects();
      this._updateModalSummary();
    }
  },

  /* ==========================================================================
     PHÂN HỆ 1: THUÊ NGÀY (DAILY RENTAL)
     ========================================================================== */

  // Chuyển tháng trên lịch (-1 hoặc +1)
  changeMonth(delta) {
    const cur = this.state.currentMonth;
    const today = new Date();
    const minStartMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + delta, 1);
    if (nextMonth < minStartMonth) return; // Không cho lùi về tháng trong quá khứ

    this.state.currentMonth = nextMonth;
    this._renderCalendar();
  },

  // Vẽ lưới lịch (2 tháng side-by-side)
  _renderCalendar() {
    const container = document.getElementById('miotoMonthsContainer');
    if (!container) return;

    const m1 = this.state.currentMonth;
    const m2 = new Date(m1.getFullYear(), m1.getMonth() + 1, 1);

    container.innerHTML = `
      ${this._renderSingleMonthHtml(m1)}
      ${this._renderSingleMonthHtml(m2)}
    `;

    // Cập nhật nút lùi tháng (nếu đang ở tháng hiện tại thì disable nút <)
    const btnPrev = document.getElementById('btnMiotoPrevMonth');
    if (btnPrev) {
      const today = new Date();
      const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      btnPrev.disabled = (m1.getFullYear() === minMonth.getFullYear() && m1.getMonth() === minMonth.getMonth());
    }
  },

  // HTML cho 1 tháng
  _renderSingleMonthHtml(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthName = `Tháng ${month + 1}`;

    const today = new Date();
    const todayYMD = this.formatDateYMD(today);

    // Ngày tối thiểu có thể chọn = ngày mai (tối thiểu cách 1 ngày)
    const minStart = new Date(today);
    minStart.setDate(today.getDate() + 1);
    const minStartYMD = this.formatDateYMD(minStart);

    // Số ngày trong tháng
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Thứ của ngày mùng 1 (0: CN, 1: T2, ..., 6: T7). Đổi thành T2=0, ..., CN=6
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

    let cellsHtml = '';

    // Ô trống đầu tháng
    for (let i = 0; i < firstDayIndex; i++) {
      cellsHtml += `<div class="mioto-day-cell empty"></div>`;
    }

    const { startDate, endDate } = this.state;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayYMD = this.formatDateYMD(dayDate);

      const isPast = dayYMD < minStartYMD;
      const isBusy = Array.isArray(this.state.disabledDates) && this.state.disabledDates.includes(dayYMD);
      const isDisabled = isPast || isBusy;
      const isToday = dayYMD === todayYMD;

      const isStart = startDate && dayYMD === startDate;
      const isEnd = endDate && dayYMD === endDate;

      let isInRange = false;
      if (startDate && endDate && startDate < endDate) {
        isInRange = dayYMD > startDate && dayYMD < endDate;
      }

      let classNames = ['mioto-day-cell'];
      if (isPast) classNames.push('disabled');
      if (isBusy) classNames.push('disabled', 'busy-booked');
      if (isToday) classNames.push('today');
      if (isStart) classNames.push('selected', 'range-start');
      if (isEnd) classNames.push('selected', 'range-end');
      if (isInRange) classNames.push('in-range');

      const titleAttr = isBusy ? 'title="Xe đã có lịch bận (đã cọc hoặc bảo dưỡng)"' : '';
      const clickAttr = !isDisabled ? `onclick="MiotoTimePicker.onDateClick('${dayYMD}')"` : '';
      const hoverAttr = !isDisabled ? `onmouseenter="MiotoTimePicker.onDateHover('${dayYMD}')"` : '';

      cellsHtml += `
        <div class="${classNames.join(' ')}" ${titleAttr} ${clickAttr} ${hoverAttr} data-date="${dayYMD}">
          <span>${day}</span>
        </div>
      `;
    }

    return `
      <div class="mioto-month-box">
        <div class="mioto-month-title">${monthName}</div>
        <div class="mioto-weekdays">
          <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
        </div>
        <div class="mioto-days">
          ${cellsHtml}
        </div>
      </div>
    `;
  },

  // Sự kiện khi click vào một ngày trên lịch (chạy mượt, không lỗi click)
  onDateClick(ymd) {
    if (!this.state.startDate || (this.state.startDate && this.state.endDate)) {
      // 1. Click lần 1: Bắt đầu chọn khoảng ngày mới (chọn ngày nhận)
      this.state.startDate = ymd;
      this.state.endDate = null;
      this.state.hoverDate = null;
      this.state.selectingState = 'END';
    } else if (this.state.startDate && !this.state.endDate) {
      if (ymd >= this.state.startDate) {
        // Kiểm tra xem khoảng giữa [startDate, ymd] có chứa ngày bận không
        let hasConflict = false;
        if (Array.isArray(this.state.disabledDates) && this.state.disabledDates.length > 0) {
          let cur = new Date(this.state.startDate);
          const end = new Date(ymd);
          while (cur <= end) {
            const curYMD = this.formatDateYMD(cur);
            if (this.state.disabledDates.includes(curYMD)) {
              hasConflict = true;
              break;
            }
            cur.setDate(cur.getDate() + 1);
          }
        }

        if (hasConflict) {
          // Bắt đầu khoảng mới từ ymd nếu ymd không bận
          this.state.startDate = ymd;
          this.state.endDate = null;
          this.state.hoverDate = null;
          this.state.selectingState = 'END';
        } else {
          // 2. Click lần 2: Chọn ngày trả hợp lệ
          this.state.endDate = ymd;
          this.state.hoverDate = null;
          this.state.selectingState = 'DONE';
        }
      } else {
        // Nếu click ngày trước ngày nhận -> Đổi thành ngày nhận mới
        this.state.startDate = ymd;
        this.state.endDate = null;
        this.state.hoverDate = null;
        this.state.selectingState = 'END';
      }
    }

    this._renderCalendar();
    this._validateTimes();
    this._updateModalSummary();
  },

  // Sự kiện hover khi đang chọn ngày kết thúc (TỐI ƯU: Chỉ cập nhật class DOM, TUYỆT ĐỐI không render lại DOM)
  onDateHover(hoverYmd) {
    if (!this.state.startDate || this.state.endDate) return;
    this.state.hoverDate = hoverYmd;

    const start = this.state.startDate;
    const cells = document.querySelectorAll('.mioto-day-cell[data-date]');
    cells.forEach(cell => {
      const d = cell.getAttribute('data-date');
      if (!d) return;

      if (hoverYmd >= start) {
        if (d > start && d < hoverYmd) {
          cell.classList.add('in-range');
          cell.classList.remove('hover-end');
        } else if (d === hoverYmd && d !== start) {
          cell.classList.remove('in-range');
          cell.classList.add('hover-end');
        } else if (d !== start) {
          cell.classList.remove('in-range', 'hover-end');
        }
      } else {
        if (d !== start) {
          cell.classList.remove('in-range', 'hover-end');
        }
      }
    });
  },

  // Khi rời chuột khỏi lịch khi chưa chọn xong ngày trả
  onCalendarMouseLeave() {
    if (!this.state.startDate || this.state.endDate) return;
    this.state.hoverDate = null;
    const cells = document.querySelectorAll('.mioto-day-cell[data-date]');
    cells.forEach(cell => {
      if (cell.getAttribute('data-date') !== this.state.startDate) {
        cell.classList.remove('in-range', 'hover-end');
      }
    });
  },

  // Tạo các mốc giờ trong dropdown (30 phút 1 mốc: 00:00 -> 23:30)
  _generateTimeOptions() {
    let options = '';
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        options += `<option value="${timeStr}">${timeStr}</option>`;
      }
    }
    return options;
  },

  // Vẽ các ô chọn giờ nhận và giờ trả
  _renderTimeSelects() {
    const selectStart = document.getElementById('miotoSelectStartTime');
    const selectEnd = document.getElementById('miotoSelectEndTime');

    if (selectStart && selectEnd) {
      const opts = this._generateTimeOptions();
      selectStart.innerHTML = opts;
      selectEnd.innerHTML = opts;

      selectStart.value = this.state.startTime;
      selectEnd.value = this.state.endTime;

      selectStart.onchange = (e) => {
        this.state.startTime = e.target.value;
        this._validateTimes();
        this._updateModalSummary();
      };

      selectEnd.onchange = (e) => {
        this.state.endTime = e.target.value;
        this._validateTimes();
        this._updateModalSummary();
      };
    }
  },

  // Ràng buộc giờ nhận & trả xe
  _validateTimes() {
    const { startDate, endDate, startTime, endTime } = this.state;
    const btnApply = document.getElementById('btnMiotoApply');

    if (!startDate || !endDate) {
      if (btnApply) btnApply.disabled = true;
      return;
    }

    // Nếu cùng 1 ngày, giờ trả phải sau giờ nhận ít nhất 2 tiếng
    if (startDate === endDate) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      if (endMinutes < startMinutes + 120) {
        const newEndMinutes = Math.min(23 * 60 + 30, startMinutes + 120);
        const nh = Math.floor(newEndMinutes / 60);
        const nm = newEndMinutes % 60;
        this.state.endTime = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
        const selectEnd = document.getElementById('miotoSelectEndTime');
        if (selectEnd) selectEnd.value = this.state.endTime;
      }
    }

    if (btnApply) btnApply.disabled = false;
  },

  // Tính số ngày & giờ thuê
  calculateDuration() {
    const { startDate, endDate, startTime, endTime } = this.state;
    if (!startDate || !endDate) return { days: 0, hours: 0, text: 'Chưa chọn đủ ngày' };

    const startDt = new Date(`${startDate}T${startTime}`);
    const endDt = new Date(`${endDate}T${endTime}`);

    const diffMs = endDt - startDt;
    if (diffMs <= 0) return { days: 1, hours: 0, text: '1 ngày' };

    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    let text = '';
    if (days > 0 && hours > 0) {
      text = `${days} ngày ${hours} giờ`;
    } else if (days > 0) {
      text = `${days} ngày`;
    } else {
      text = `${hours} giờ (tính 1 ngày)`;
    }

    return { days: days || 1, hours, text };
  },

  // Cập nhật text tóm tắt ở thanh đáy modal (Footer) cho Thuê ngày
  _updateModalSummary() {
    if (this.state.rentalMode === 'HOUR') {
      this._updateHourlySummary();
      return;
    }

    const summaryDatetimeEl = document.getElementById('miotoSummaryDatetime');
    const summaryDurationEl = document.getElementById('miotoSummaryDuration');
    const btnApply = document.getElementById('btnMiotoApply');

    const { startDate, endDate, startTime, endTime } = this.state;

    if (!startDate) {
      if (summaryDatetimeEl) summaryDatetimeEl.innerText = 'Vui lòng chọn ngày nhận xe';
      if (summaryDurationEl) summaryDurationEl.innerHTML = '';
      if (btnApply) btnApply.disabled = true;
      return;
    }

    if (!endDate) {
      const startVn = this.formatVnShort(startDate);
      if (summaryDatetimeEl) summaryDatetimeEl.innerText = `${startTime} ${startVn} – Chọn ngày trả xe`;
      if (summaryDurationEl) summaryDurationEl.innerHTML = `Vui lòng chọn ngày trả xe`;
      if (btnApply) btnApply.disabled = true;
      return;
    }

    const startVn = this.formatVnShort(startDate);
    const endVn = this.formatVnShort(endDate);
    const duration = this.calculateDuration();

    if (summaryDatetimeEl) {
      summaryDatetimeEl.innerText = `${startTime} ${startVn} - ${endTime} ${endVn}`;
    }
    if (summaryDurationEl) {
      summaryDurationEl.innerHTML = `Thời gian thuê: <strong>${duration.text}</strong> ⓘ`;
    }
    if (btnApply) {
      btnApply.disabled = false;
    }
  },

  /* ==========================================================================
     PHÂN HỆ 2: THUÊ GIỜ (HOURLY RENTAL: TỐI THIỂU 4H, TỐI ĐA 8H)
     ========================================================================== */

  // Vẽ giao diện phân hệ Thuê giờ
  _renderHourlyView() {
    this._renderHourlyDateSelect();
    this._renderHourlyTimeSelect();
    this._renderHourlyOptions();
    this._updateHourlySummary();
  },

  // Dropdown Ngày bắt đầu (từ hôm nay đến 30 ngày tới)
  _renderHourlyDateSelect() {
    const selectEl = document.getElementById('miotoHourlyDateSelect');
    if (!selectEl) return;

    const today = new Date();
    let opts = '';
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const ymd = this.formatDateYMD(d);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let label = `${day}/${month}/${year}`;
      if (i === 0) label += ' (Hôm nay)';
      else if (i === 1) label += ' (Ngày mai)';
      else label += ` (${this.getVnDayOfWeek(d)})`;
      opts += `<option value="${ymd}" ${ymd === this.state.hourlyStartDate ? 'selected' : ''}>${label}</option>`;
    }
    selectEl.innerHTML = opts;
    selectEl.value = this.state.hourlyStartDate;
  },

  // Dropdown Giờ nhận xe (06:00 -> 22:00)
  _renderHourlyTimeSelect() {
    const selectEl = document.getElementById('miotoHourlyTimeSelect');
    if (!selectEl) return;

    const todayYMD = this.formatDateYMD(new Date());
    const isToday = this.state.hourlyStartDate === todayYMD;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let opts = '';
    let firstValidTime = null;
    let currentFound = false;

    for (let h = 6; h <= 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        const totalM = h * 60 + m;
        // Nếu chọn hôm nay, loại bỏ giờ trong quá khứ hoặc dưới 15 phút
        if (isToday && totalM < nowMinutes + 15) {
          continue;
        }
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (!firstValidTime) firstValidTime = timeStr;
        if (timeStr === this.state.hourlyStartTime) currentFound = true;
        opts += `<option value="${timeStr}">${timeStr}</option>`;
      }
    }

    if (!currentFound && firstValidTime) {
      this.state.hourlyStartTime = firstValidTime;
    }

    selectEl.innerHTML = opts;
    selectEl.value = this.state.hourlyStartTime;
  },

  onHourlyDateChange(val) {
    this.state.hourlyStartDate = val;
    this._renderHourlyTimeSelect();
    this._renderHourlyOptions();
    this._updateHourlySummary();
  },

  onHourlyTimeChange(val) {
    this.state.hourlyStartTime = val;
    this._renderHourlyOptions();
    this._updateHourlySummary();
  },

  setHourlyHours(h) {
    this.state.hourlyHours = Math.max(4, Math.min(8, Number(h)));
    this._renderHourlyOptions();
    this._updateHourlySummary();
  },

  // Tính thời điểm kết thúc cho gói X giờ
  _calculateHourlyEndTime(hours) {
    const startDt = new Date(`${this.state.hourlyStartDate}T${this.state.hourlyStartTime}`);
    const endDt = new Date(startDt.getTime() + hours * 3600000);
    const endH = String(endDt.getHours()).padStart(2, '0');
    const endM = String(endDt.getMinutes()).padStart(2, '0');
    const endDay = String(endDt.getDate()).padStart(2, '0');
    const endMonth = String(endDt.getMonth() + 1).padStart(2, '0');
    const endYear = endDt.getFullYear();
    const endDayOfWeek = this.getVnDayOfWeek(endDt);

    return {
      dateObj: endDt,
      timeStr: `${endH}:${endM}`,
      dateYmd: `${endYear}-${endMonth}-${endDay}`,
      dayMonth: `${endDay}/${endMonth}`,
      fullDateStr: `${endDay}/${endMonth}/${endYear}`,
      dayOfWeek: endDayOfWeek
    };
  },

  // Vẽ danh sách tùy chọn 4h - 8h (tối thiểu 4h, tối đa 8h theo yêu cầu)
  _renderHourlyOptions() {
    const summaryEl = document.getElementById('miotoHourlyDurationSummary');
    const listEl = document.getElementById('miotoHourlyOptionsList');
    if (!listEl) return;

    const currentEnd = this._calculateHourlyEndTime(this.state.hourlyHours);
    if (summaryEl) {
      summaryEl.innerHTML = `
        <span class="mioto-hourly-summary-text">
          <strong>${this.state.hourlyHours} giờ</strong>
          <span class="mioto-hourly-end-sub">(kết thúc: ${currentEnd.timeStr} ${currentEnd.fullDateStr})</span>
        </span>
        <svg class="mioto-hourly-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      `;
    }

    // Các mốc giờ từ 4h đến 8h
    const hourOptions = [4, 5, 6, 7, 8];
    let html = '';
    hourOptions.forEach(h => {
      const calc = this._calculateHourlyEndTime(h);
      const isSelected = this.state.hourlyHours === h;
      html += `
        <div class="mioto-hourly-radio-item ${isSelected ? 'selected' : ''}" onclick="MiotoTimePicker.setHourlyHours(${h})">
          <div class="mioto-radio-circle ${isSelected ? 'checked' : ''}">
            <span class="mioto-radio-dot"></span>
          </div>
          <div class="mioto-hourly-radio-text">
            <span class="mioto-hourly-hour-bold">${h} giờ</span>
            <span class="mioto-hourly-end-hint">(kết thúc: ${calc.timeStr} ${calc.fullDateStr})</span>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  },

  // Cập nhật Footer khi ở chế độ Thuê giờ
  _updateHourlySummary() {
    const summaryDatetimeEl = document.getElementById('miotoSummaryDatetime');
    const summaryDurationEl = document.getElementById('miotoSummaryDuration');
    const btnApply = document.getElementById('btnMiotoApply');

    const sD = this.parseYMD(this.state.hourlyStartDate);
    const sDayOfWeek = this.getVnDayOfWeek(sD);
    const sDay = String(sD.getDate()).padStart(2, '0');
    const sMonth = String(sD.getMonth() + 1).padStart(2, '0');

    const endCalc = this._calculateHourlyEndTime(this.state.hourlyHours);

    if (summaryDatetimeEl) {
      summaryDatetimeEl.innerText = `${this.state.hourlyStartTime} ${sDayOfWeek}, ${sDay}/${sMonth} - ${endCalc.timeStr} ${endCalc.dayOfWeek}, ${endCalc.dayMonth}`;
    }
    if (summaryDurationEl) {
      summaryDurationEl.innerHTML = `Thời gian thuê: <strong>${this.state.hourlyHours} giờ</strong> <span class="mioto-info-tooltip" title="Cho thuê xe tự lái theo giờ: tối thiểu 4h, tối đa 8h">ⓘ</span>`;
    }
    if (btnApply) {
      btnApply.disabled = false;
    }
  },

  /* ==========================================================================
     HOÀN TẤT & ĐỒNG BỘ (APPLY)
     ========================================================================== */

  // Khi bấm "Tiếp tục"
  apply() {
    if (this.state.rentalMode === 'HOUR') {
      const endCalc = this._calculateHourlyEndTime(this.state.hourlyHours);
      this.state.startDate = this.state.hourlyStartDate;
      this.state.endDate = endCalc.dateYmd;
      this.state.startTime = this.state.hourlyStartTime;
      this.state.endTime = endCalc.timeStr;

      const startDisplayEl = document.getElementById('displayStartDate');
      const endDisplayEl = document.getElementById('displayEndDate');

      const sD = this.parseYMD(this.state.startDate);
      const sDay = String(sD.getDate()).padStart(2, '0');
      const sMonth = String(sD.getMonth() + 1).padStart(2, '0');
      const sYear = sD.getFullYear();

      if (startDisplayEl) {
        startDisplayEl.innerText = `${this.state.startTime}, ${sDay}/${sMonth}/${sYear}`;
      }
      if (endDisplayEl) {
        endDisplayEl.innerText = `${this.state.endTime}, ${endCalc.fullDateStr} (${this.state.hourlyHours}h)`;
      }

      this._syncToHiddenInputs();
      this.close();

      // Kích hoạt cập nhật bộ lọc nếu App có sẵn
      if (typeof App !== 'undefined' && App.currentFilters) {
        App.currentFilters.startDate = this.state.startDate;
        App.currentFilters.endDate = this.state.endDate;
        if (typeof App.applyFilters === 'function') {
          App.applyFilters();
        }
      }
      return;
    }

    // Thuê ngày
    if (!this.state.startDate || !this.state.endDate) {
      alert('Vui lòng chọn cả ngày nhận và ngày trả xe!');
      return;
    }

    this._updateSearchDisplay();
    this.close();

    if (typeof this.state.onSelectCallback === 'function') {
      this.state.onSelectCallback({
        startDate: this.state.startDate,
        endDate: this.state.endDate,
        startTime: this.state.startTime,
        endTime: this.state.endTime,
        isHourly: false
      });
      return;
    }

    if (typeof App !== 'undefined' && App.currentFilters) {
      App.currentFilters.startDate = this.state.startDate;
      App.currentFilters.endDate = this.state.endDate;
      if (typeof App.applyFilters === 'function') {
        App.applyFilters();
      }
    }
  },

  // Chèn HTML Modal vào trang
  _injectModalHtml() {
    if (document.getElementById('miotoTimeOverlay')) return;

    const modalHtml = `
      <div class="mioto-modal-overlay" id="miotoTimeOverlay" onclick="if(event.target === this) MiotoTimePicker.close()">
        <div class="mioto-modal">
          <!-- Header -->
          <div class="mioto-modal-header">
            <h3 class="mioto-modal-title">Thời gian</h3>
            <button type="button" class="mioto-modal-close" onclick="MiotoTimePicker.close()" aria-label="Đóng">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Tabs (Thuê ngày / Thuê giờ) -->
          <div class="mioto-tabs">
            <button type="button" class="mioto-tab active" id="tabRentalDay" onclick="MiotoTimePicker.switchTab('DAY')">Thuê ngày</button>
            <button type="button" class="mioto-tab" id="tabRentalHour" onclick="MiotoTimePicker.switchTab('HOUR')">Thuê giờ</button>
          </div>

          <!-- Body -->
          <div class="mioto-modal-body">
            <!-- PHÂN HỆ 1: THUÊ NGÀY (Cấu trúc khối dọc chuẩn mực) -->
            <div id="miotoDailyContent" class="mioto-daily-content">
              <!-- Calendar Card: 100% width, 2 tháng side-by-side -->
              <div class="mioto-calendar-card">
                <div class="mioto-calendar-nav">
                  <button type="button" id="btnMiotoPrevMonth" onclick="MiotoTimePicker.changeMonth(-1)" title="Tháng trước">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <button type="button" id="btnMiotoNextMonth" onclick="MiotoTimePicker.changeMonth(1)" title="Tháng sau">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                </div>

                <!-- 2 Months Grid -->
                <div class="mioto-months-grid" id="miotoMonthsContainer" onmouseleave="MiotoTimePicker.onCalendarMouseLeave()"></div>
              </div>

              <!-- Time Selectors: LUÔN NẰM DƯỚI LỊCH (Full Width) -->
              <div class="mioto-time-selectors">
                <div class="mioto-time-box">
                  <div class="mioto-time-label">Nhận xe</div>
                  <select id="miotoSelectStartTime" class="mioto-time-select"></select>
                </div>

                <div class="mioto-time-arrow">&rarr;</div>

                <div class="mioto-time-box">
                  <div class="mioto-time-label">Trả xe</div>
                  <select id="miotoSelectEndTime" class="mioto-time-select"></select>
                </div>
              </div>
            </div>

            <!-- PHÂN HỆ 2: THUÊ GIỜ (TỐI THIỂU 4H - TỐI ĐA 8H) -->
            <div id="miotoHourlyContent" class="mioto-hourly-content" style="display: none;">
              <!-- Row 1: Ngày bắt đầu & Giờ nhận xe -->
              <div class="mioto-hourly-inputs-row">
                <div class="mioto-hourly-card">
                  <div class="mioto-hourly-card-label">Ngày bắt đầu</div>
                  <div class="mioto-hourly-select-wrap">
                    <select id="miotoHourlyDateSelect" class="mioto-hourly-select" onchange="MiotoTimePicker.onHourlyDateChange(this.value)"></select>
                    <svg class="mioto-hourly-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>

                <div class="mioto-hourly-card">
                  <div class="mioto-hourly-card-label">Giờ nhận xe</div>
                  <div class="mioto-hourly-select-wrap">
                    <select id="miotoHourlyTimeSelect" class="mioto-hourly-select" onchange="MiotoTimePicker.onHourlyTimeChange(this.value)"></select>
                    <svg class="mioto-hourly-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <!-- Row 2: Thời gian thuê (4h -> 8h) -->
              <div class="mioto-hourly-duration-card">
                <div class="mioto-hourly-duration-header">
                  <div class="mioto-hourly-card-label">Thời gian thuê</div>
                  <div class="mioto-hourly-selected-display" id="miotoHourlyDurationSummary">
                    <!-- Render động -->
                  </div>
                </div>
                
                <div class="mioto-hourly-options-list" id="miotoHourlyOptionsList">
                  <!-- 4 giờ, 5 giờ, 6 giờ, 7 giờ, 8 giờ items -->
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Bar -->
          <div class="mioto-modal-footer">
            <div class="mioto-footer-summary">
              <div class="mioto-summary-datetime" id="miotoSummaryDatetime">--:-- - --:--</div>
              <div class="mioto-summary-duration" id="miotoSummaryDuration">Thời gian thuê: --</div>
            </div>
            <button type="button" class="mioto-btn-apply" id="btnMiotoApply" onclick="MiotoTimePicker.apply()">
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
};

// Đảm bảo gắn vào window toàn cục
window.MiotoTimePicker = MiotoTimePicker;

// Tự động khởi chạy khi trang sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MiotoTimePicker.init());
} else {
  MiotoTimePicker.init();
}
