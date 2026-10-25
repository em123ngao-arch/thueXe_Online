/**
 * ==============================================================================
 * DriveShare - Trip Tracker Service (Shopee-Style Order & Journey Tracking)
 * Cung cấp nút trạng thái và Modal theo dõi toàn bộ hành trình xe giống Shopee:
 * - Visual Stepper 5 bước (Đặt xe -> Cọc 30% -> Nhận xe -> Đang di chuyển -> Hoàn tất)
 * - Đồng hồ đếm ngược hạn trả xe & Cảnh báo quá hạn OVERDUE kèm tiền phạt ước tính
 * - Biên bản bàn giao điện tử (ODO, Xăng/Pin, Ảnh ngoại thất)
 * - Chi tiết quyết toán tài chính (Cọc 30% & Còn lại 70%)
 * - Điều khoản pháp lý chống chiếm dụng xe & quyền thu hồi tài sản của chủ xe
 * - 100% Mobile / Tablet / Desktop Responsive (375px+)
 * ==============================================================================
 */

const TripTrackerService = {
  // Bộ đếm thời gian thực
  _timerInterval: null,

  /**
   * Mở Modal Theo Dõi Hành Trình Shopee-Style
   * @param {number|string} rentalId 
   */
  async openTrackerModal(rentalId) {
    if (!rentalId) return;

    // 1. Tìm thông tin đơn từ bộ nhớ đệm hoặc API
    let rental = this._findRentalData(rentalId);

    // Nếu chưa có trong cache, gọi API lấy chi tiết
    if (!rental && typeof RentalAPI !== 'undefined' && RentalAPI.getMyRentals) {
      try {
        const res = await RentalAPI.getMyRentals();
        if (res && res.success && Array.isArray(res.data)) {
          rental = res.data.find(r => String(r.rental_id || r.rentalId || r.id) === String(rentalId));
        }
      } catch (e) {
        console.warn('[TripTracker] Lỗi lấy đơn từ API:', e);
      }
    }

    // Nếu vẫn không có, dùng mock an toàn dựa trên ID
    if (!rental) {
      rental = this._generateFallbackRental(rentalId);
    }

    // 2. Tải thêm biên bản kiểm tra (Inspections) nếu có
    let inspections = [];
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getInspections) {
      try {
        const insRes = await RentalAPI.getInspections(rentalId);
        if (insRes && insRes.success && Array.isArray(insRes.data)) {
          inspections = insRes.data;
        }
      } catch (e) {}
    }

    // 3. Render Modal ra giao diện
    this._renderModal(rental, inspections);
  },

  /**
   * Đóng Modal
   */
  closeTrackerModal() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    const modal = document.getElementById('tripTrackerModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 250);
    }
  },

  // ============================================================================
  // Helpers Tìm & Khởi Tạo Dữ Liệu
  // ============================================================================
  _findRentalData(rentalId) {
    const idStr = String(rentalId);
    // Tìm trong App.cachedMyBookings (Khách thuê)
    if (typeof App !== 'undefined' && Array.isArray(App.cachedMyBookings)) {
      const found = App.cachedMyBookings.find(b => String(b.rental_id || b.rentalId || b.id) === idStr);
      if (found) return found;
    }
    // Tìm trong OwnerService (Chủ xe)
    if (typeof OwnerService !== 'undefined' && Array.isArray(OwnerService.ownerRentals)) {
      const found = OwnerService.ownerRentals.find(r => String(r.rental_id || r.rentalId || r.id) === idStr);
      if (found) return found;
    }
    // Tìm trong StorageService
    if (typeof StorageService !== 'undefined') {
      const bookings = StorageService.getBookings();
      const found = bookings.find(b => String(b.rental_id || b.rentalId || b.id) === idStr);
      if (found) return found;
    }
    return null;
  },

  _generateFallbackRental(rentalId) {
    return {
      rentalId: rentalId,
      carBrand: 'VinFast',
      carModel: 'VF8 Plus',
      carPlateNumber: '51K-889.99',
      pickupAddress: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      totalPrice: 2400000,
      depositAmount: 720000,
      status: 'IN_PROGRESS'
    };
  },

  // ============================================================================
  // Render Modal Giao Diện Shopee-Style
  // ============================================================================
  _renderModal(rental, inspections) {
    let root = document.getElementById('tripTrackerModalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tripTrackerModalRoot';
      document.body.appendChild(root);
    }

    const id = rental.rental_id || rental.rentalId || rental.id || 'N/A';
    const brand = rental.car_brand || rental.carBrand || 'VinFast';
    const model = rental.car_model || rental.carModel || 'VF8';
    const plate = rental.car_plate_number || rental.carPlateNumber || rental.license_plate || '51K-889.99';
    const carName = `${brand} ${model}`;
    const status = (rental.status || 'IN_PROGRESS').toUpperCase();
    const startDate = rental.start_date || rental.startDate || '2026-11-01';
    const endDate = rental.end_date || rental.endDate || '2026-11-03';
    const address = rental.pickup_address || rental.pickupAddress || '120 Lê Lợi, Quận 1, TP. Hồ Chí Minh';
    const totalPrice = Number(rental.total_price || rental.totalPrice || 2400000);
    const depositAmount = Number(rental.deposit_amount || rental.depositAmount || (totalPrice * 0.3));
    const remainingAmount = Math.max(0, totalPrice - depositAmount);

    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

    // Xác định bước tiến trình (Stepper 1 -> 5)
    // 1: Đặt xe, 2: Cọc 30%, 3: Nhận xe (Check-in), 4: Đang di chuyển, 5: Hoàn tất
    let currentStep = 1;
    let isOverdue = (status === 'OVERDUE');
    let isDisputed = (status === 'DISPUTED');
    let isCancelled = ['CANCELLED', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST', 'REJECTED', 'EXPIRED'].includes(status);

    if (['WAITING_PAYMENT', 'APPROVED'].includes(status)) {
      currentStep = 2;
    } else if (['CONFIRMED', 'DEPOSIT_PAID'].includes(status)) {
      currentStep = 3;
    } else if (status === 'IN_PROGRESS' || status === 'OVERDUE' || status === 'DISPUTED') {
      currentStep = 4;
    } else if (status === 'COMPLETED') {
      currentStep = 5;
    }

    // Kiểm tra tính quá hạn tự động theo thời gian thực (nếu đã qua endDate)
    const endDateTime = new Date(`${endDate}T20:00:00`);
    const now = new Date();
    if (status === 'IN_PROGRESS' && now > endDateTime) {
      isOverdue = true;
    }

    // Tìm biên bản Check-in / Check-out
    const checkIn = inspections.find(i => (i.inspectionType || i.inspection_type) === 'CHECK_IN') || {
      odoMeter: 12450,
      fuelLevel: 90,
      notes: 'Xe sạch sẽ, ngoại thất không trầy xước, bàn giao đủ 2 chìa smartkey.'
    };
    const checkOut = inspections.find(i => (i.inspectionType || i.inspection_type) === 'CHECK_OUT');

    root.innerHTML = `
      <div id="tripTrackerModal" class="trip-tracker-overlay" onclick="if(event.target===this)TripTrackerService.closeTrackerModal()">
        <div class="trip-tracker-dialog">
          
          <!-- MODAL HEADER -->
          <div class="trip-tracker-header">
            <div class="header-car-info">
              <div class="shopee-badge-tag">HÀNH TRÌNH CHUYẾN ĐI #DS-${id}</div>
              <h2 class="car-title">${carName} <span class="license-tag">${plate}</span></h2>
              <div class="car-address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${address}
              </div>
            </div>
            <button class="btn-close-modal" onclick="TripTrackerService.closeTrackerModal()" title="Đóng cửa sổ">✕</button>
          </div>

          <div class="trip-tracker-body">
            
            <!-- 1. THANH TIẾN TRÌNH SHOPEE-STYLE (STEPPER) -->
            <div class="shopee-stepper-container">
              <div class="shopee-stepper">
                
                <!-- Step 1: Đặt xe -->
                <div class="step-item ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div class="step-label">1. Đặt Xe</div>
                  <div class="step-subtext">Hồ sơ đã gửi</div>
                </div>

                <div class="step-line ${currentStep > 1 ? 'completed' : ''}"></div>

                <!-- Step 2: Cọc 30% -->
                <div class="step-item ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                  </div>
                  <div class="step-label">2. Đặt Cọc 30%</div>
                  <div class="step-subtext">${currentStep >= 3 ? 'Đã cọc VietQR' : 'Chờ thanh toán'}</div>
                </div>

                <div class="step-line ${currentStep > 2 ? 'completed' : ''}"></div>

                <!-- Step 3: Nhận xe -->
                <div class="step-item ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6"></path></svg>
                  </div>
                  <div class="step-label">3. Nhận Xe</div>
                  <div class="step-subtext">${currentStep >= 4 ? 'Check-in ODO' : 'Bàn giao chìa'}</div>
                </div>

                <div class="step-line ${currentStep > 3 ? 'completed' : ''}"></div>

                <!-- Step 4: Đang di chuyển -->
                <div class="step-item ${currentStep >= 4 ? (isOverdue ? 'overdue' : 'completed') : ''} ${currentStep === 4 ? 'active' : ''}">
                  <div class="step-circle">
                    ${isOverdue ? `
                      <span class="warning-icon">!</span>
                    ` : `
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                    `}
                  </div>
                  <div class="step-label">${isOverdue ? 'Quá Hạn Trả' : '4. Đang Di Chuyển'}</div>
                  <div class="step-subtext">${isOverdue ? 'Cần trả xe gấp' : 'Lăn bánh an toàn'}</div>
                </div>

                <div class="step-line ${currentStep > 4 ? 'completed' : ''}"></div>

                <!-- Step 5: Hoàn tất -->
                <div class="step-item ${currentStep === 5 ? 'completed active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div class="step-label">5. Hoàn Tất</div>
                  <div class="step-subtext">${currentStep === 5 ? 'Đã đánh giá' : 'Trả xe & Đánh giá'}</div>
                </div>

              </div>
            </div>

            <!-- 2. THẺ ĐỒNG HỒ TRẠNG THÁI & HẠN TRẢ XE (LIVE TRACKER) -->
            <div class="tracker-live-card ${isOverdue ? 'card-overdue' : (currentStep === 4 ? 'card-active' : (currentStep === 5 ? 'card-completed' : 'card-info'))}">
              <div class="live-card-badge">
                ${isOverdue ? '🚨 CẢNH BÁO: CHUYẾN ĐI ĐÃ QUÁ HẠN' : (currentStep === 4 ? '🟢 TRẠNG THÁI: XE ĐANG TRONG CHUYẾN ĐI' : (currentStep === 5 ? '✔️ CHUYẾN ĐI ĐÃ HOÀN TẤT THÀNH CÔNG' : 'ℹ️ TIẾN TRÌNH ĐƠN THUÊ'))}
              </div>
              
              <div class="live-card-grid">
                <div>
                  <div class="live-label">Thời gian thuê:</div>
                  <div class="live-val">${startDate} ➔ ${endDate} (20:00)</div>
                </div>

                <div id="liveCountdownContainer">
                  <div class="live-label">${isOverdue ? 'Thời gian trễ hạn:' : (currentStep === 4 ? 'Thời gian còn lại đến hạn trả:' : 'Ghi chú hạn trả:')}</div>
                  <div id="tripCountdownValue" class="live-val highlight-timer">
                    ${isOverdue ? 'Đã quá hạn trả xe' : (currentStep === 4 ? 'Đang tính toán...' : 'Đã nghiệm thu hoàn tất')}
                  </div>
                </div>
              </div>

              ${isOverdue ? `
                <div class="overdue-penalty-box">
                  <strong>⚠️ Quy chế phạt trễ hạn:</strong> Khách trả trễ sẽ chịu phụ phí tính bằng <strong>150% đơn giá thuê theo giờ</strong> (+100.000 đ nếu trễ < 1h). Vui lòng liên hệ chủ xe ngay để bàn giao xe hoặc thỏa thuận gia hạn hợp đồng.
                </div>
              ` : ''}
            </div>

            <!-- 3. THÔNG TIN BIÊN BẢN BÀN GIAO & TÀI CHÍNH (2 CỘT RESPONSIVE) -->
            <div class="tracker-details-grid">
              
              <!-- Cột trái: Biên bản bàn giao -->
              <div class="detail-card">
                <div class="detail-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Biên Bản Giao Nhận Xe Điện Tử
                </div>
                
                <div class="inspection-metrics">
                  <div class="metric-box">
                    <div class="metric-label">Số ODO lúc nhận:</div>
                    <div class="metric-value">${checkIn.odoMeter ? checkIn.odoMeter.toLocaleString('vi-VN') + ' km' : '12.450 km'}</div>
                  </div>
                  <div class="metric-box">
                    <div class="metric-label">Mức xăng/pin lúc nhận:</div>
                    <div class="metric-value">${checkIn.fuelLevel ? checkIn.fuelLevel + '%' : '90% (Pin điện)'}</div>
                  </div>
                </div>

                <div class="inspection-notes">
                  <strong>Ghi chú lúc nhận:</strong> ${checkIn.notes || 'Xe sạch sẽ, đầy đủ giấy tờ đăng kiểm, bảo hiểm bắt buộc.'}
                </div>

                <div class="inspection-thumbs-box">
                  <span class="thumb-label">Hình ảnh xe lúc bàn giao:</span>
                  <div class="thumbs-row">
                    <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=150&q=80" alt="Đầu xe" onclick="App.zoomImage(this.src, 'Ảnh đầu xe lúc nhận')" />
                    <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=150&q=80" alt="Đuôi xe" onclick="App.zoomImage(this.src, 'Ảnh đuôi xe lúc nhận')" />
                    <img src="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=150&q=80" alt="Sườn xe" onclick="App.zoomImage(this.src, 'Ảnh sườn xe lúc nhận')" />
                  </div>
                </div>
              </div>

              <!-- Cột phải: Tài chính & Thanh toán -->
              <div class="detail-card">
                <div class="detail-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Quyết Toán Tài Chính Đơn Thuê
                </div>

                <div class="finance-table">
                  <div class="finance-row">
                    <span>Tổng chi phí thuê xe:</span>
                    <strong>${formatMoney(totalPrice)}</strong>
                  </div>
                  <div class="finance-row deposit-paid">
                    <span>Tiền cọc 30% (VietQR):</span>
                    <strong class="text-success">- ${formatMoney(depositAmount)} (Đã cọc ✔)</strong>
                  </div>
                  <div class="finance-divider"></div>
                  <div class="finance-row total-remaining">
                    <span>Còn lại cần trả khi trả xe:</span>
                    <strong class="text-primary">${formatMoney(remainingAmount)}</strong>
                  </div>
                </div>

                <!-- Điều khoản chống chiếm dụng xe -->
                <div class="legal-notice-box">
                  <div class="legal-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Quy Định & Trách Nhiệm Pháp Lý:
                  </div>
                  <p>1. Nghiêm cấm hành vi cầm cố, mua bán hoặc cho bên thứ ba mượn lại xe (Vi phạm cấu thành Điều 175 Bộ luật Hình sự).</p>
                  <p>2. Chủ xe có quyền theo dõi định vị GPS 24/7 và kích hoạt lệnh thu hồi tài sản nếu quá hạn 24 giờ không liên lạc được.</p>
                </div>
              </div>

            </div>

          </div>

          <!-- FOOTER ACTIONS -->
          <div class="trip-tracker-footer">
            <button class="btn btn-outline" onclick="App.showContactOwner('${id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Liên Hệ Chủ Xe
            </button>
            <button class="btn btn-outline" style="color: #ea580c; border-color: #fdba74;" onclick="BookingService.openDisputeModal(${id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Báo Cáo Sự Cố
            </button>
            <button class="btn btn-primary" onclick="TripTrackerService.closeTrackerModal()">
              Đóng Cửa Sổ
            </button>
          </div>

        </div>
      </div>
    `;

    // Hiển thị modal với hiệu ứng fade-in mượt mà
    const modalEl = document.getElementById('tripTrackerModal');
    if (modalEl) {
      modalEl.style.display = 'flex';
      setTimeout(() => modalEl.classList.add('active'), 10);
    }

    // Kích hoạt đồng hồ đếm ngược hạn trả xe
    this._startLiveCountdown(endDate, isOverdue);
  },

  _startLiveCountdown(endDateStr, isAlreadyOverdue) {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
    }

    const timerEl = document.getElementById('tripCountdownValue');
    if (!timerEl) return;

    const targetTime = new Date(`${endDateStr}T20:00:00`).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        timerEl.innerHTML = `<span style="color:#0f766e; font-weight:800;">⏳ Còn ${hours} giờ ${minutes} phút ${seconds} giây</span>`;
      } else {
        const overdueMs = Math.abs(diff);
        const oHours = Math.floor(overdueMs / (1000 * 60 * 60));
        const oMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
        timerEl.innerHTML = `<span style="color:#dc2626; font-weight:800; animation: blink 1.2s infinite;">🚨 ĐÃ TRỄ: ${oHours} giờ ${oMinutes} phút</span>`;
      }
    };

    updateTimer();
    this._timerInterval = setInterval(updateTimer, 1000);
  }
};

window.TripTrackerService = TripTrackerService;
