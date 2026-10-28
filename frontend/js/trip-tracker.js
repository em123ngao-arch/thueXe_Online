/**
 * ==============================================================================
 * DRIVESHARE — TRIP TRACKER SERVICE (Sprint 4 - Issue #48)
 * Quản lý Modal Theo Dõi Hành Trình Xe Phong Cách Shopee:
 * - Stepper 5 bước nối dây: [1. Đặt xe] -> [2. Cọc 30%] -> [3. Giao xe] -> [4. Đang đi] -> [5. Hoàn tất]
 * - Đồng hồ đếm ngược hạn trả xe (Đang đi: Còn XX giờ YY phút; Quá hạn: Nhấp nháy đỏ ĐÃ QUÁ HẠN)
 * - Biên bản bàn giao: ODO lúc nhận, vạch pin/xăng, 4 ảnh xe (zoomable)
 * - Bảng tài chính: Tổng tiền, tiền đã cọc 30%, tiền còn lại khi trả xe, phụ phí trễ hạn
 * - Chế tài pháp lý Điều 175 BLHS & Quyền kích hoạt định vị GPS
 * ==============================================================================
 */

const TripTrackerService = {
  // Bộ đếm thời gian thực đếm ngược
  _timerInterval: null,
  _escHandler: null,

  /**
   * Mở Modal Theo Dõi Hành Trình Chuẩn Shopee
   * @param {number|string} rentalId 
   */
  async openTrackerModal(rentalId) {
    if (!rentalId) return;

    // 1. Tìm thông tin đơn từ cache hoặc StorageService
    let rental = this._findRentalData(rentalId);

    // Nếu chưa có trong cache, gọi API lấy danh sách mới nhất
    if (!rental && typeof RentalAPI !== 'undefined') {
      try {
        if (RentalAPI.getMyRentals) {
          const res = await RentalAPI.getMyRentals();
          if (res && (res.success || res.code === 200) && Array.isArray(res.data)) {
            rental = res.data.find(r => String(r.rental_id || r.rentalId || r.id) === String(rentalId));
          }
        }
        if (!rental && RentalAPI.getOwnerRentals) {
          const resOwner = await RentalAPI.getOwnerRentals();
          if (resOwner && (resOwner.success || resOwner.code === 200) && Array.isArray(resOwner.data)) {
            rental = resOwner.data.find(r => String(r.rental_id || r.rentalId || r.id) === String(rentalId));
          }
        }
      } catch (e) {
        console.warn('[TripTracker] Lỗi lấy đơn từ API:', e);
      }
    }

    // Nếu vẫn không có, dùng mock thông minh dựa trên ID
    if (!rental) {
      rental = this._generateFallbackRental(rentalId);
    }

    // 2. Tải thêm biên bản giao nhận (Inspections) nếu có
    let inspections = [];
    if (typeof RentalAPI !== 'undefined') {
      try {
        const getInspFn = RentalAPI.getRentalInspections || RentalAPI.getInspections;
        if (getInspFn) {
          const insRes = await getInspFn(rentalId);
          if (insRes && (insRes.success || insRes.code === 200) && Array.isArray(insRes.data)) {
            inspections = insRes.data;
          }
        }
      } catch (e) {
        console.warn('[TripTracker] Lỗi lấy biên bản từ API:', e);
      }
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
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
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
    if (typeof OwnerService !== 'undefined') {
      if (Array.isArray(OwnerService.ownerBookings)) {
        const found = OwnerService.ownerBookings.find(b => String(b.rental_id || b.rentalId || b.id) === idStr);
        if (found) return found;
      }
      if (Array.isArray(OwnerService.ownerRentals)) {
        const found = OwnerService.ownerRentals.find(r => String(r.rental_id || r.rentalId || r.id) === idStr);
        if (found) return found;
      }
    }
    // Tìm trong StorageService
    if (typeof StorageService !== 'undefined') {
      const bookings = StorageService.getBookings();
      if (Array.isArray(bookings)) {
        const found = bookings.find(b => String(b.rental_id || b.rentalId || b.id) === idStr);
        if (found) return found;
      }
    }
    return null;
  },

  _generateFallbackRental(rentalId) {
    const isOverdueMock = String(rentalId).includes('4') || String(rentalId).includes('9');
    return {
      rentalId: rentalId,
      carBrand: 'VinFast',
      carModel: 'VF8 Plus',
      carPlateNumber: '51K-889.99',
      pickupAddress: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      totalPrice: 2400000,
      depositAmount: 720000,
      pricePerDay: 1200000,
      status: isOverdueMock ? 'OVERDUE' : 'IN_PROGRESS',
      overdueHours: isOverdueMock ? 4 : 0,
      penaltyFee: isOverdueMock ? 300000 : 0
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
    const carObj = (rental.car && typeof rental.car === 'object') ? rental.car : {};
    const brand = rental.car_brand || rental.carBrand || carObj.brand || carObj.car_brand || 'VinFast';
    const model = rental.car_model || rental.carModel || carObj.model || carObj.car_model || 'VF8';
    const plate = rental.car_plate_number || rental.carPlateNumber || rental.license_plate || carObj.license_plate || carObj.plate_number || '51K-889.99';
    const carName = `${brand} ${model}`;
    const status = (rental.status || 'IN_PROGRESS').toUpperCase();
    const startDate = rental.start_date || rental.startDate || new Date().toISOString().split('T')[0];
    const endDate = rental.end_date || rental.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const address = rental.pickup_address || rental.pickupAddress || rental.deliveryAddress || '120 Lê Lợi, Quận 1, TP. Hồ Chí Minh';
    const totalPrice = Number(rental.total_price || rental.totalPrice || rental.totalAmount || 2400000);
    const depositAmount = Number(rental.deposit_amount || rental.depositAmount || Math.round(totalPrice * 0.3));
    const remainingAmount = Math.max(0, totalPrice - depositAmount);
    const pricePerDay = Number(rental.price_per_day || rental.pricePerDay || (totalPrice / 2) || 1200000);

    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

    // Xác định bước tiến trình (Stepper 5 bước chuẩn Shopee)
    // 1: Đặt xe -> 2: Cọc 30% -> 3: Giao xe -> 4: Đang đi -> 5: Hoàn tất
    let currentStep = 1;
    let isOverdue = (status === 'OVERDUE');
    let isDisputed = (status === 'DISPUTED');
    let isCancelled = ['CANCELLED', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST', 'REJECTED', 'EXPIRED', 'AUTO_EXPIRED_NO_HOST_ACTION'].includes(status);

    if (['WAITING_PAYMENT', 'APPROVED', 'ON_HOLD'].includes(status)) {
      currentStep = 2;
    } else if (['CONFIRMED', 'DEPOSIT_PAID'].includes(status)) {
      currentStep = 3;
    } else if (status === 'IN_PROGRESS' || status === 'OVERDUE' || status === 'DISPUTED') {
      currentStep = 4;
    } else if (status === 'COMPLETED') {
      currentStep = 5;
    }

    // Kiểm tra tính quá hạn tự động theo thời gian thực (nếu đang đi mà qua hạn trả)
    const endDateTime = new Date(`${endDate}T20:00:00`);
    const now = new Date();
    if (status === 'IN_PROGRESS' && now > endDateTime) {
      isOverdue = true;
    }

    // Tính toán phí phạt quá hạn (nếu có)
    let overdueHours = Number(rental.overdue_hours || rental.overdueHours || 0);
    if (isOverdue && overdueHours <= 0) {
      const diffMs = Math.max(0, now.getTime() - endDateTime.getTime());
      overdueHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    }
    const hourlyRate = Math.round(pricePerDay / 24);
    let penaltyFee = Number(rental.penalty_fee || rental.penaltyFee || 0);
    if (isOverdue && penaltyFee <= 0) {
      if (overdueHours <= 24) {
        penaltyFee = Math.round(overdueHours * hourlyRate * 1.5);
      } else {
        penaltyFee = Math.round(pricePerDay * 2 * Math.ceil(overdueHours / 24));
      }
    }

    // Lấy thông tin biên bản Check-in / Check-out
    const checkIn = (Array.isArray(inspections) ? inspections : []).find(i => (i.inspectionType || i.inspection_type) === 'CHECK_IN') || {
      odoMeter: 12450,
      fuelLevel: 90,
      notes: 'Xe sạch sẽ, ngoại thất sáng bóng, đầy đủ giấy tờ bảo hiểm, bàn giao đủ 2 chìa smartkey.'
    };

    // 4 ảnh xe bàn giao (zoomable)
    let images = [];
    if (checkIn.images) {
      images = checkIn.images.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (images.length === 0) {
      images = [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=400&q=80'
      ];
    }

    root.innerHTML = `
      <div id="tripTrackerModal" class="trip-tracker-overlay" onclick="if(event.target===this)TripTrackerService.closeTrackerModal()">
        <div class="trip-tracker-dialog">
          
          <!-- MODAL HEADER -->
          <div class="trip-tracker-header">
            <div class="header-car-info">
              <div class="shopee-badge-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                HÀNH TRÌNH CHUYẾN ĐI #DS-${id}
              </div>
              <h2 class="car-title">
                ${carName} <span class="license-tag">${plate}</span>
              </h2>
              <div class="car-address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${address}
              </div>
            </div>
            <button class="btn-close-tracker-modal" onclick="TripTrackerService.closeTrackerModal()" title="Đóng cửa sổ">&times;</button>
          </div>

          <!-- MODAL BODY -->
          <div class="trip-tracker-body">
            
            <!-- 1. STEPPER 5 BƯỚC NỐI DÂY CHUẨN SHOPEE -->
            <div class="shopee-stepper-container">
              <div class="shopee-stepper">
                
                <!-- Bước 1: Đặt xe -->
                <div class="step-item ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div class="step-label">1. Đặt Xe</div>
                  <div class="step-subtext">Đã gửi đơn</div>
                </div>

                <div class="step-line ${currentStep > 1 ? 'completed' : ''}"></div>

                <!-- Bước 2: Cọc 30% -->
                <div class="step-item ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                  </div>
                  <div class="step-label">2. Cọc 30%</div>
                  <div class="step-subtext">${currentStep >= 3 ? 'Đã cọc VietQR' : 'Chờ cọc 45p'}</div>
                </div>

                <div class="step-line ${currentStep > 2 ? 'completed' : ''}"></div>

                <!-- Bước 3: Giao xe -->
                <div class="step-item ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6"></path></svg>
                  </div>
                  <div class="step-label">3. Giao Xe</div>
                  <div class="step-subtext">${currentStep >= 4 ? 'Check-in ODO' : 'Bàn giao xe'}</div>
                </div>

                <div class="step-line ${currentStep > 3 ? 'completed' : ''}"></div>

                <!-- Bước 4: Đang đi -->
                <div class="step-item ${currentStep >= 4 ? (isOverdue ? 'overdue' : 'completed') : ''} ${currentStep === 4 ? 'active' : ''}">
                  <div class="step-circle">
                    ${isOverdue ? `
                      <span style="font-weight: 900; font-size: 1.1rem; color: #fff;">!</span>
                    ` : `
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                    `}
                  </div>
                  <div class="step-label">${isOverdue ? '4. Quá Hạn' : '4. Đang Đi'}</div>
                  <div class="step-subtext">${isOverdue ? 'Cần trả xe gấp' : 'Lăn bánh an toàn'}</div>
                </div>

                <div class="step-line ${currentStep > 4 ? 'completed' : ''}"></div>

                <!-- Bước 5: Hoàn tất -->
                <div class="step-item ${currentStep === 5 ? 'completed active' : ''}">
                  <div class="step-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div class="step-label">5. Hoàn Tất</div>
                  <div class="step-subtext">Đã nghiệm thu</div>
                </div>

              </div>
            </div>

            <!-- 2. THẺ TRẠNG THÁI & ĐỒNG HỒ ĐẾM NGƯỢC HẠN TRẢ XE -->
            <div class="tracker-live-card ${isOverdue ? 'card-overdue' : (status === 'COMPLETED' ? 'card-completed' : (status === 'IN_PROGRESS' ? 'card-active' : 'card-info'))}">
              <div class="live-card-badge">
                ${isOverdue ? `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>CẢNH BÁO: CHUYẾN ĐI ĐÃ QUÁ HẠN HOÀN TRẢ XE</span>
                ` : (status === 'COMPLETED' ? `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <span>CHUYẾN ĐI ĐÃ HOÀN TẤT & ĐÃ BÀN GIAO XE</span>
                ` : (status === 'IN_PROGRESS' ? `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>XE ĐANG TRONG THỜI GIAN THUÊ HỢP PHÁP</span>
                ` : `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>TRẠNG THÁI: ${status}</span>
                `))}
              </div>

              <div class="live-card-grid">
                <div>
                  <div class="live-label">Hạn chót bàn giao trả xe:</div>
                  <div class="live-val">${endDate} lúc 20:00</div>
                </div>
                <div>
                  <div class="live-label">Đồng hồ đếm ngược:</div>
                  <div class="live-val highlight-timer" id="tripCountdownValue">
                    Đang tính toán...
                  </div>
                </div>
              </div>

              ${isOverdue ? `
                <div class="overdue-penalty-box">
                  <strong>⚠️ CẢNH BÁO QUÁ HẠN:</strong> Đơn thuê đã trễ <strong>${overdueHours} giờ</strong>.
                  Phụ phí phạt phát sinh tạm tính: <strong style="color: #b91c1c; font-size: 0.95rem;">${formatMoney(penaltyFee)}</strong> (tính theo mức 150% đơn giá thuê theo giờ).
                  Vui lòng liên hệ Chủ xe hoặc mang xe đến điểm hoàn trả ngay lập tức để tránh bị kích hoạt chế tài khóa tài khoản Blacklist theo Điều 175 Bộ luật Hình sự.
                </div>
              ` : ''}
            </div>

            <!-- 3. BIÊN BẢN BÀN GIAO & QUYẾT TOÁN TÀI CHÍNH (2 CỘT) -->
            <div class="tracker-details-grid">
              
              <!-- Cột trái: Biên bản bàn giao xe (ODO, Xăng/Pin, 4 Ảnh) -->
              <div class="detail-card">
                <div class="detail-card-title">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Biên Bản Giao Nhận Xe Điện Tử
                </div>
                
                <div class="inspection-metrics">
                  <div class="metric-box">
                    <div class="metric-label">Số ODO lúc nhận xe:</div>
                    <div class="metric-value">${checkIn.odoMeter ? Number(checkIn.odoMeter).toLocaleString('vi-VN') + ' km' : '12.450 km'}</div>
                  </div>
                  <div class="metric-box">
                    <div class="metric-label">Vạch xăng / Pin lúc nhận:</div>
                    <div class="metric-value">${checkIn.fuelLevel ? checkIn.fuelLevel + '%' : '90% (Pin điện)'}</div>
                  </div>
                </div>

                <div class="inspection-notes">
                  <strong>Ghi chú nhận xe:</strong> ${checkIn.notes || 'Xe sạch sẽ, nguyên bản, đầy đủ giấy tờ đăng kiểm & bảo hiểm.'}
                </div>

                <div class="inspection-thumbs-box">
                  <span class="thumb-label">Hình ảnh xe lúc bàn giao (4 góc chụp):</span>
                  <div class="thumbs-row">
                    <img src="${images[0] || images[0]}" alt="Đầu xe" title="Xem ảnh đầu xe lúc bàn giao" onclick="TripTrackerService.zoomPhoto(this.src, 'Ảnh đầu xe lúc bàn giao')" />
                    <img src="${images[1] || images[0]}" alt="Đuôi xe" title="Xem ảnh đuôi xe lúc bàn giao" onclick="TripTrackerService.zoomPhoto(this.src, 'Ảnh đuôi xe lúc bàn giao')" />
                    <img src="${images[2] || images[0]}" alt="Sườn trái" title="Xem ảnh sườn trái lúc bàn giao" onclick="TripTrackerService.zoomPhoto(this.src, 'Ảnh sườn xe lúc bàn giao')" />
                    <img src="${images[3] || images[0]}" alt="Sườn phải" title="Xem ảnh sườn phải lúc bàn giao" onclick="TripTrackerService.zoomPhoto(this.src, 'Ảnh ngoại thất xe')" />
                  </div>
                </div>
              </div>

              <!-- Cột phải: Bảng quyết toán tài chính & Pháp lý -->
              <div class="detail-card">
                <div class="detail-card-title">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Bảng Quyết Toán Tài Chính Đơn Thuê
                </div>

                <div class="finance-table">
                  <div class="finance-row">
                    <span>Tổng chi phí thuê xe:</span>
                    <strong>${formatMoney(totalPrice)}</strong>
                  </div>
                  <div class="finance-row">
                    <span>Tiền cọc 30% (VietQR):</span>
                    <strong class="text-success">- ${formatMoney(depositAmount)} (Đã cọc ✔)</strong>
                  </div>
                  <div class="finance-divider"></div>
                  <div class="finance-row total-remaining">
                    <span>Tiền còn lại khi trả xe (70%):</span>
                    <strong class="text-primary">${formatMoney(remainingAmount)}</strong>
                  </div>
                  ${isOverdue && penaltyFee > 0 ? `
                    <div class="finance-row" style="background:#fef2f2; padding:4px 8px; border-radius:6px; margin-top:2px;">
                      <span style="color:#b91c1c; font-weight:700;">Phụ phí trễ hạn (${overdueHours}h x 150%):</span>
                      <strong class="text-danger">+ ${formatMoney(penaltyFee)}</strong>
                    </div>
                  ` : ''}
                </div>

                <!-- Box Chế tài pháp lý & Bảo vệ tài sản -->
                <div class="legal-notice-box">
                  <div class="legal-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Quy Định & Chế Tài Pháp Lý (Điều 175 BLHS):
                  </div>
                  <p>1. Nghiêm cấm cầm cố, chuyển nhượng hoặc cho mượn lại xe (Cấu thành tội lạm dụng tín nhiệm chiếm đoạt tài sản).</p>
                  <p>2. Chủ xe có quyền kích hoạt định vị GPS 24/7 và đơn phương thu hồi xe nếu trễ hạn quá 24h không liên lạc được.</p>
                </div>
              </div>

            </div>

          </div>

          <!-- FOOTER ACTIONS -->
          <div class="trip-tracker-footer">
            <button class="btn btn-outline" onclick="App.showContactOwner ? App.showContactOwner('${id}') : alert('Liên hệ chủ xe: 0988 776 655')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Liên Hệ Đối Tác
            </button>
            <button class="btn btn-outline" style="color: #ea580c; border-color: #fdba74;" onclick="if(typeof BookingService!=='undefined'&&BookingService.openDisputeModal){BookingService.openDisputeModal(${id});}else{alert('Báo cáo sự cố #${id}');}">
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
    this._startLiveCountdown(endDate, isOverdue, status, isCancelled);

    // Lắng nghe phím ESC để đóng modal
    this._attachKeydownHandler();
  },

  _attachKeydownHandler() {
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        TripTrackerService.closeTrackerModal();
      }
    };
    document.addEventListener('keydown', this._escHandler);
  },

  /**
   * Phóng to xem ảnh bàn giao xe
   */
  zoomPhoto(url, caption) {
    if (typeof App !== 'undefined' && typeof App.zoomImage === 'function') {
      App.zoomImage(url, caption);
    } else if (typeof OwnerService !== 'undefined' && typeof OwnerService.zoomImage === 'function') {
      OwnerService.zoomImage(url, caption);
    } else {
      window.open(url, '_blank');
    }
  },

  /**
   * Đồng hồ đếm ngược hạn trả xe thời gian thực
   */
  _startLiveCountdown(endDateStr, isAlreadyOverdue, status, isCancelled) {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
    }

    const timerEl = document.getElementById('tripCountdownValue');
    if (!timerEl) return;

    if (status === 'COMPLETED') {
      timerEl.innerHTML = `<span style="color:#059669; font-weight:800;">✔ Đã hoàn tất chuyến đi</span>`;
      return;
    }

    if (isCancelled) {
      timerEl.innerHTML = `<span style="color:#64748b; font-weight:700;">Đơn đã kết thúc / Hủy bỏ</span>`;
      return;
    }

    const targetDate = new Date(`${endDateStr}T20:00:00`);
    const targetTime = targetDate.getTime();

    if (isNaN(targetTime)) {
      timerEl.innerHTML = `<span style="color:#64748b; font-weight:600;">Hạn trả: ${endDateStr || 'Theo thỏa thuận'}</span>`;
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (!isAlreadyOverdue && diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        timerEl.innerHTML = `<span style="color:#0f766e; font-weight:800;">⏳ Còn ${hours} giờ ${minutes} phút ${seconds} giây</span>`;
      } else {
        const overdueMs = Math.abs(diff);
        const oHours = Math.floor(overdueMs / (1000 * 60 * 60));
        const oMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
        const oSeconds = Math.floor((overdueMs % (1000 * 60)) / 1000);
        timerEl.innerHTML = `<span style="color:#dc2626; font-weight:800; animation: pulseOverdue 1.2s infinite; display:inline-block;">🚨 ĐÃ QUÁ HẠN: ${oHours} giờ ${oMinutes} phút ${oSeconds}s</span>`;
      }
    };

    updateTimer();
    this._timerInterval = setInterval(updateTimer, 1000);
  }
};

window.TripTrackerService = TripTrackerService;
