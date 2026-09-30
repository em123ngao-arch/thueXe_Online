/**
 * DRIVESHARE — Owner Module (Clean & Professional, No Emojis)
 * Phân hệ Chủ xe: Đăng ký xe mới, Quản lý đội xe, Duyệt đơn thuê xe từ khách
 * Tích hợp chuẩn REST API Backend Spring Boot (/api/v1/cars) và StorageService Fallback
 */

const OwnerService = {
  // Helper hiển thị thông báo an toàn
  showToast(message, type = 'info') {
    if (typeof toast !== 'undefined' && typeof toast[type] === 'function') {
      toast[type](message);
    } else if (typeof toast !== 'undefined' && typeof toast.show === 'function') {
      toast.show(message, type);
    } else if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      alert(message);
    }
  },

  // Render giao diện Phân hệ Chủ xe
  async renderOwnerPortal(containerId = 'ownerPortalContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const owner = typeof StorageService !== 'undefined' ? StorageService.getCurrentOwner() : { name: 'Chủ xe', phone: '', address: '' };
    
    // Tải danh sách xe từ Backend API (GET /api/v1/cars/my-cars)
    let ownerCars = [];
    if (typeof CarAPI !== 'undefined' && CarAPI.getMyCars) {
      try {
        const res = await CarAPI.getMyCars(0, 50);
        if (res && res.data && Array.isArray(res.data.items)) {
          ownerCars = res.data.items.map(c => ({
            id: c.car_id || c.carId || c.id,
            brand: c.brand,
            model: c.model,
            license_plate: c.plate_number || c.plateNumber || c.license_plate,
            price_per_day: c.price_per_day || c.pricePerDay,
            pickup_address: c.address || c.pickup_address,
            status: c.status,
            image_url: c.thumbnail_url || c.thumbnailUrl || c.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80',
            year: c.year,
            seat_count: c.seats || c.seat_count || 4,
            transmission: c.transmission
          }));
        }
      } catch (err) {
        console.warn('CarAPI.getMyCars fallback to local data:', err);
      }
    }

    if (ownerCars.length === 0 && typeof StorageService !== 'undefined') {
      const allCars = StorageService.getCars();
      ownerCars = allCars.filter(c => c.owner_id === owner?.id || c.ownerId === owner?.id);
    }
    this.ownerCars = ownerCars;

    let ownerBookings = [];
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getOwnerRentals && typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      try {
        const res = await RentalAPI.getOwnerRentals();
        if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
          ownerBookings = res.data;
        }
      } catch (err) {
        console.warn('RentalAPI.getOwnerRentals fallback to local data:', err);
      }
    }

    if (ownerBookings.length === 0 && typeof StorageService !== 'undefined') {
      const allBookings = StorageService.getBookings();
      const myCarIds = ownerCars.map(c => c.id);
      ownerBookings = allBookings.filter(b => myCarIds.includes(b.car_id));
    }
    this.ownerBookings = ownerBookings;

    // Tính tổng tiền cọc và doanh thu tạm tính
    const totalEarnings = ownerBookings
      .filter(b => b.status === 'DEPOSIT_PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.deposit_amount || b.depositAmount || b.rental_amount || 0), 0);

    const formatMoney = (val) => {
      return typeof StorageService !== 'undefined' ? StorageService.formatCurrency(val) : (val?.toLocaleString('vi-VN') + ' đ');
    };

    container.innerHTML = `
      <div class="portal-header">
        <div class="container">
          <div class="portal-title-row">
            <div class="portal-title-group">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#0f766e">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Kênh Quản Lý Chủ Xe
              </h2>
              <div class="portal-subtitle">Chủ xe: <strong>${owner.name || 'Owner'}</strong> · ${owner.phone || 'Chưa cập nhật SĐT'} · ${owner.address || 'Chưa cập nhật địa chỉ'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="OwnerService.showAddCarTab()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Đăng ký xe cho thuê mới
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="portal-tabs">
            <button class="portal-tab-btn active" id="ownerTabCars" onclick="OwnerService.switchOwnerTab('CARS')">
              Danh sách xe (${ownerCars.length})
            </button>
            <button class="portal-tab-btn" id="ownerTabRequests" onclick="OwnerService.switchOwnerTab('REQUESTS')">
              Yêu cầu thuê (${ownerBookings.length})
            </button>
            <button class="portal-tab-btn" id="ownerTabAdd" onclick="OwnerService.switchOwnerTab('ADD')">
              Đăng xe mới
            </button>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Stats Overview -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${ownerCars.length}</div>
              <div class="stat-label">Tổng xe sở hữu</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${ownerCars.filter(c => c.status === 'ACTIVE').length}</div>
              <div class="stat-label">Xe đang hoạt động</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${ownerCars.filter(c => c.status === 'PENDING_REVIEW' || c.status === 'PENDING_APPROVAL' || c.status === 'PENDING').length}</div>
              <div class="stat-label">Xe đang chờ duyệt</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${formatMoney(totalEarnings)}</div>
              <div class="stat-label">Doanh thu tạm tính</div>
            </div>
          </div>
        </div>

        <!-- Tab Content: Danh sách xe -->
        <div id="ownerTabCarsContent">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Đội xe cho thuê của bạn</h3>
              <span class="badge badge-info">${ownerCars.length} xe</span>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Phương tiện</th>
                    <th>Biển số</th>
                    <th>Giá thuê/ngày</th>
                    <th>Địa điểm giao xe</th>
                    <th>Trạng thái duyệt</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  ${ownerCars.length === 0 ? `
                    <tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--slate-500);">Bạn chưa có xe nào. Hãy đăng ký chiếc xe đầu tiên của bạn!</td></tr>
                  ` : ownerCars.map(c => `
                    <tr>
                      <td>
                        <div class="table-car-cell">
                          <img class="table-car-thumb" src="${c.image_url}" alt="${c.brand}" style="cursor: zoom-in;" title="Bấm để phóng to xem ảnh" onclick="OwnerService.zoomImage('${c.image_url}', '${c.brand} ${c.model} (${c.license_plate})')" />
                          <div>
                            <strong>${c.brand} ${c.model}</strong>
                            <div style="font-size: 0.76rem; color: var(--slate-500);">${c.year} · ${c.seat_count} chỗ · ${c.transmission === 'AUTOMATIC' ? 'Số tự động' : 'Số sàn'}</div>
                          </div>
                        </div>
                      </td>
                      <td><strong style="font-family: monospace;">${c.license_plate}</strong></td>
                      <td style="color: var(--primary); font-weight: 700;">${formatMoney(c.price_per_day)}</td>
                      <td style="font-size: 0.84rem;">${c.pickup_address}</td>
                      <td>
                        ${c.status === 'ACTIVE' 
                          ? '<span class="badge badge-success">Đang hoạt động</span>' 
                          : (c.status === 'REJECTED' 
                              ? '<span class="badge badge-danger">Từ chối duyệt</span>' 
                              : '<span class="badge badge-warning">Chờ Admin duyệt</span>')}
                      </td>
                      <td>
                        <div class="table-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
                          <button class="btn btn-outline btn-sm" onclick="OwnerService.viewCarDetail(${c.id})">Chi tiết</button>
                          <button class="btn btn-outline btn-sm" style="color: #7c3aed; border-color: #7c3aed;" onclick="OwnerService.openCalendarModal(${c.id}, '${c.brand} ${c.model}')">Lịch xe</button>
                          <button class="btn btn-outline btn-sm" style="color: #2563eb; border-color: #2563eb;" onclick="OwnerService.openEditCarModal(${c.id})">Sửa xe</button>
                          <button class="btn btn-outline btn-sm" style="color: #0f766e; border-color: #0f766e;" onclick="OwnerService.openPhotosModal(${c.id}, '${c.brand} ${c.model}')">Ảnh xe</button>
                          ${c.status === 'ACTIVE' 
                            ? `<button class="btn btn-outline btn-sm" style="color: #d97706; border-color: #d97706;" title="Ẩn xe khỏi tìm kiếm" onclick="OwnerService.toggleCarStatus(${c.id}, 'ACTIVE', '${c.brand} ${c.model}')">Ẩn xe</button>` 
                            : (c.status === 'INACTIVE' 
                                ? `<button class="btn btn-outline btn-sm" style="color: #059669; border-color: #059669;" title="Mở hiển thị xe" onclick="OwnerService.toggleCarStatus(${c.id}, 'INACTIVE', '${c.brand} ${c.model}')">Hiện xe</button>` 
                                : '')}
                          <button class="btn btn-ghost btn-sm" style="color: #ef4444; border: 1px solid #fecaca;" title="Xóa xe này" onclick="OwnerService.deleteCar(${c.id}, '${c.brand} ${c.model} (${c.license_plate})')">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Content: Yêu cầu thuê -->
        <div id="ownerTabRequestsContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Đơn đặt cọc & Chuyến đi đang diễn ra</h3>
              <span class="badge badge-info">${ownerBookings.length} đơn</span>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Xe cho thuê</th>
                    <th>Khách thuê</th>
                    <th>Thời gian thuê</th>
                    <th>Tiền cọc nhận được</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  ${ownerBookings.length === 0 ? `
                    <tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--slate-500);">Chưa có yêu cầu đặt thuê nào cho các xe của bạn.</td></tr>
                  ` : ownerBookings.map(b => {
                    const id = b.rental_id || b.rentalId || b.id;
                    const carBrand = b.car_brand || b.carBrand || '';
                    const carModel = b.car_model || b.carModel || '';
                    const carName = (carBrand ? `${carBrand} ${carModel}`.trim() : (b.car_name || b.carName)) || 'Xe của bạn';
                    const plate = b.car_plate_number || b.carPlateNumber || b.license_plate || b.plateNumber || '';
                    const renterName = b.renter_full_name || b.renterFullName || b.renter_name || b.renterName || 'Khách thuê';
                    const renterPhone = b.renter_phone || b.renterPhone || '---';
                    const startDate = b.start_date || b.startDate || '';
                    const endDate = b.end_date || b.endDate || '';
                    const totalDays = b.total_days || b.totalDays || 1;
                    const deposit = b.deposit_amount || b.depositAmount || b.rental_amount || 0;
                    const note = b.note || b.trip_purpose || '';
                    
                    let badge = `<span class="badge badge-info">${b.status}</span>`;
                    let action = '<span style="color: var(--slate-400); font-size: 0.8rem;">—</span>';

                    if (b.status === 'PENDING' || b.status === 'PENDING_APPROVAL') {
                      badge = '<span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">Chờ duyệt hồ sơ</span>';
                      action = `
                        <div style="display:flex; gap:4px;">
                          <button class="btn btn-primary btn-xs" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="OwnerService.approveRental(${id})">Duyệt</button>
                          <button class="btn btn-outline-danger btn-xs" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color:var(--danger); border:1px solid var(--danger); background:transparent;" onclick="OwnerService.rejectRentalPrompt(${id})">Từ chối</button>
                        </div>
                      `;
                    } else if (b.status === 'WAITING_PAYMENT' || b.status === 'APPROVED') {
                      badge = '<span class="badge badge-primary" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">Chờ khách cọc (45p)</span>';
                    } else if (b.status === 'ON_HOLD') {
                      badge = '<span class="badge" style="background:#fef9c3; color:#a16207; border:1px solid #fef08a;">Tạm hoãn (Soft Lock)</span>';
                    } else if (b.status === 'CONFIRMED' || b.status === 'DEPOSIT_PAID') {
                      badge = '<span class="badge badge-success">Đã chốt cọc 30%</span>';
                      action = `
                        <button class="btn btn-primary btn-xs" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #059669; border-color: #059669;" onclick="OwnerService.startRental(${id})">
                          Bắt đầu chuyến
                        </button>
                      `;
                    } else if (b.status === 'IN_PROGRESS') {
                      badge = '<span class="badge badge-info">Đang trong chuyến đi</span>';
                      action = `
                        <button class="btn btn-primary btn-xs" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: #2563eb; border-color: #2563eb;" onclick="OwnerService.completeRental(${id})">
                          Hoàn tất chuyến
                        </button>
                      `;
                    } else if (b.status === 'COMPLETED') {
                      badge = '<span class="badge badge-neutral">Đã hoàn thành</span>';
                    } else if (b.status === 'REJECTED') {
                      badge = '<span class="badge badge-danger">Đã từ chối</span>';
                    } else if (b.status === 'WITHDRAWN_BY_GUEST') {
                      badge = '<span class="badge" style="background:#f1f5f9; color:#64748b;">Khách đã rút</span>';
                    } else if (b.status === 'EXPIRED' || b.status === 'AUTO_EXPIRED_NO_HOST_ACTION') {
                      badge = '<span class="badge badge-secondary" style="background:#f1f5f9; color:#94a3b8;">Hết hạn</span>';
                    }

                    return `
                    <tr>
                      <td><span class="booking-code">#${id}</span></td>
                      <td>
                        <strong>${carName}</strong>
                        ${plate ? `<div style="font-size:0.75rem; color:var(--slate-500); font-family:monospace;">${plate}</div>` : ''}
                      </td>
                      <td>
                        <strong>${renterName}</strong><br/>
                        <span style="font-size: 0.76rem; color: var(--slate-500);">${renterPhone}</span>
                        ${note ? `<div style="font-size: 0.73rem; color: #0284c7; margin-top:2px;" title="Mục đích chuyến đi">Lộ trình: ${note}</div>` : ''}
                      </td>
                      <td style="font-size: 0.82rem;">${startDate} &rarr; ${endDate} (${totalDays} ngày)</td>
                      <td style="color: #047857; font-weight: 700;">${formatMoney(deposit)}</td>
                      <td>${badge}</td>
                      <td>${action}</td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Content: Đăng xe mới (Dàn hàng ngang chia row tối ưu diện tích) -->
        <div id="ownerTabAddContent" style="display: none;">
          <div class="form-card" style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--slate-900); margin: 0 0 2px 0;">
                  Đăng ký xe cho thuê mới
                </h3>
                <p style="color: var(--slate-500); font-size: 0.82rem; margin: 0;">
                  Điền thông số phương tiện và tải ảnh thực tế để gửi kiểm duyệt nhanh chóng.
                </p>
              </div>
              <button type="button" class="btn btn-outline btn-sm" style="border-color: #0f766e; color: #0f766e; font-weight: 700; background: #f0fdfa;" onclick="OwnerService.fillSampleCarData()">
                ⚡ Điền dữ liệu mẫu
              </button>
            </div>

            <form id="addCarForm" onsubmit="OwnerService.handleCarSubmit(event)">
              <div class="form-layout-split">
                <!-- CỘT TRÁI (THÔNG SỐ XE - DÀN THEO HÀNG NGANG CHIA ROW) -->
                <div class="form-left-col">
                  <!-- ROW 1 (4 CỘT): Hãng, Dòng, Năm, Biển số -->
                  <div class="form-grid-4">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Hãng xe <span class="required">*</span></label>
                      <select class="form-control" id="newCarBrand" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                        <option value="Toyota">Toyota</option>
                        <option value="VinFast">VinFast</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Kia">Kia</option>
                        <option value="Honda">Honda</option>
                        <option value="Mazda">Mazda</option>
                        <option value="Ford">Ford</option>
                        <option value="Mitsubishi">Mitsubishi</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Dòng xe & Bản <span class="required">*</span></label>
                      <input type="text" class="form-control" id="newCarModel" placeholder="VF3, Camry..." required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;" />
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Năm SX <span class="required">*</span></label>
                      <input type="number" class="form-control" id="newCarYear" min="2016" max="2026" value="2023" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;" />
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <label class="form-label" style="font-size: 0.82rem; margin-bottom: 0;">Biển số <span class="required">*</span></label>
                        <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.7rem; color: #0f766e; padding: 0;" onclick="OwnerService.generateSamplePlate()">Tự tạo</button>
                      </div>
                      <input type="text" class="form-control" id="newCarPlate" placeholder="51A-12345" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem; font-family: monospace; font-weight: 700;" />
                    </div>
                  </div>

                  <!-- ROW 2 (4 CỘT): Số chỗ, Hộp số, Nhiên liệu, Giá thuê -->
                  <div class="form-grid-4">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Số chỗ <span class="required">*</span></label>
                      <select class="form-control" id="newCarSeats" style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                        <option value="4">4 chỗ</option>
                        <option value="5" selected>5 chỗ</option>
                        <option value="7">7 chỗ</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Hộp số <span class="required">*</span></label>
                      <select class="form-control" id="newCarTransmission" style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                        <option value="AUTOMATIC">Tự động (AT)</option>
                        <option value="MANUAL">Số sàn (MT)</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Nhiên liệu <span class="required">*</span></label>
                      <select class="form-control" id="newCarFuel" style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                        <option value="GASOLINE">Xăng</option>
                        <option value="ELECTRIC">Điện</option>
                        <option value="DIESEL">Dầu Diesel</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Giá thuê (đ/ngày) <span class="required">*</span></label>
                      <input type="number" class="form-control" id="newCarPrice" placeholder="800000" step="50000" min="100000" max="10000000" value="800000" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem; font-weight: 700; color: #047857;" />
                    </div>
                  </div>

                  <!-- ROW 3 (2 CỘT): Tỉnh/Thành phố, Địa chỉ -->
                  <div class="form-grid-2" style="margin-bottom: 0.85rem;">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Tỉnh / Thành phố <span class="required">*</span></label>
                      <select class="form-control" id="newCarProvince" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                        <option value="Hồ Chí Minh" selected>TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Bình Dương">Bình Dương</option>
                        <option value="Đồng Nai">Đồng Nai</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Khánh Hòa">Khánh Hòa</option>
                        <option value="Lâm Đồng">Lâm Đồng</option>
                        <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Địa chỉ nhận xe (Vị trí bãi đỗ) <span class="required">*</span></label>
                      <input type="text" class="form-control" id="newCarAddress" placeholder="Số nhà, tên đường, phường/xã, quận/huyện" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;" />
                    </div>
                  </div>

                  <!-- ROW 4: Tiện ích -->
                  <div class="form-group" style="margin-bottom: 0.85rem;">
                    <label class="form-label" style="font-size: 0.82rem; margin-bottom: 6px;">Tiện ích & Trang bị sẵn</label>
                    <div class="checkbox-group-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                      <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="amenity" value="Bản đồ dẫn đường" checked> Bản đồ dẫn đường</label>
                      <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="amenity" value="Camera lùi / 360" checked> Camera lùi / 360</label>
                      <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="amenity" value="Thu phí tự động VETC" checked> Thu phí VETC</label>
                      <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="amenity" value="Apple CarPlay / Android Auto"> Apple CarPlay</label>
                      <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="amenity" value="Cửa sổ trời"> Cửa sổ trời</label>
                      <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="amenity" value="Cảm biến áp suất lốp"> Cảm biến lốp</label>
                    </div>
                  </div>

                  <!-- ROW 5: Mô tả -->
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Mô tả tình trạng xe</label>
                    <textarea class="form-control" id="newCarDesc" rows="2" placeholder="Xe mới bảo dưỡng, máy êm, sạch sẽ..." style="padding: 0.45rem 0.65rem; font-size: 0.85rem;"></textarea>
                  </div>
                </div>

                <!-- CỘT PHẢI (HÌNH ẢNH XE: KÉO THẢ DRAG & DROP + LIVE PREVIEW ZOOM) -->
                <div class="form-right-col" style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <label class="form-label" style="font-size: 0.82rem; margin-bottom: 0;">Hình ảnh xe đại diện <span class="required">*</span></label>
                      <span style="font-size: 0.72rem; color: #0f766e; font-weight: 600;">Hỗ trợ kéo & thả</span>
                    </div>

                    <!-- Drag & Drop Zone -->
                    <div class="upload-dropzone" id="carPhotoDropzone" onclick="document.getElementById('newCarPhotoFile').click()">
                      <input type="file" id="newCarPhotoFile" accept="image/png, image/jpeg, image/jpg, image/webp" style="display: none;" onchange="OwnerService.previewCarPhoto(this)" />
                      
                      <!-- State 1: Placeholder khi chưa chọn ảnh -->
                      <div id="newCarPhotoPlaceholder" style="padding: 1.5rem 0.5rem;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" style="margin-bottom: 6px;">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">Kéo & thả ảnh xe vào đây</div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">hoặc bấm để chọn từ máy tính</div>
                        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 4px;">JPG, PNG, WEBP (Tối đa 5MB)</div>
                      </div>

                      <!-- State 2: Preview Card khi đã có ảnh -->
                      <div id="newCarPhotoPreviewContainer" class="preview-thumbnail-card" style="display: none;" onclick="event.stopPropagation()">
                        <img id="newCarPhotoPreview" src="" alt="Xem trước ảnh xe" style="cursor: zoom-in;" title="Bấm để phóng to xem ảnh" onclick="OwnerService.zoomImage(this.src, 'Ảnh xe xem trước')" />
                        <div class="preview-overlay-actions">
                          <button type="button" class="preview-overlay-btn" onclick="OwnerService.zoomImage(document.getElementById('newCarPhotoPreview').src, 'Ảnh xe xem trước')" title="Phóng to">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                            Phóng to
                          </button>
                          <button type="button" class="preview-overlay-btn btn-remove" onclick="OwnerService.clearCarPhotoPreview()" title="Đổi ảnh khác">
                            Đổi ảnh
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Quick Samples -->
                    <div style="margin-top: 8px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 4px; flex-wrap: wrap;">
                        <span style="font-size: 0.74rem; color: #64748b;">Hoặc chọn ảnh mẫu:</span>
                        <div style="display: flex; gap: 4px;">
                          <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setCarSampleImage('SEDAN')">Sedan</button>
                          <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setCarSampleImage('SUV')">SUV</button>
                          <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setCarSampleImage('EV')">Xe điện</button>
                        </div>
                      </div>
                      <input type="hidden" id="newCarImageUrl" value="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80" />
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.5rem;">
                    <button type="button" class="btn btn-outline btn-sm" style="flex: 1;" onclick="OwnerService.switchOwnerTab('CARS')">Hủy bỏ</button>
                    <button type="submit" class="btn btn-primary btn-sm" style="flex: 2; font-weight: 700;">Gửi xe lên phê duyệt</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.setupDropzone('carPhotoDropzone', 'newCarPhotoFile', (file) => {
        const input = document.getElementById('newCarPhotoFile');
        this.previewCarPhoto(input);
      });
    }, 50);
  },

  // BR: Tự động điền dữ liệu mẫu hợp lệ để test nhanh
  fillSampleCarData() {
    const samples = [
      { brand: 'Toyota', model: 'Camry 2.5Q', seats: '5', trans: 'AUTOMATIC', fuel: 'GASOLINE', price: 900000, img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=80', desc: 'Xe Camry bản cao cấp, ghế da sạch sẽ, bảo dưỡng định kỳ tại hãng.' },
      { brand: 'VinFast', model: 'VF8 Plus', seats: '5', trans: 'AUTOMATIC', fuel: 'ELECTRIC', price: 1000000, img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80', desc: 'Xe điện thông minh VinFast, sạc đầy pin chạy 450km, trang bị ADAS full option.' },
      { brand: 'Ford', model: 'Everest Titanium', seats: '7', trans: 'AUTOMATIC', fuel: 'DIESEL', price: 1300000, img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80', desc: 'SUV 7 chỗ gầm cao, máy dầu khỏe và tiết kiệm, phù hợp đi du lịch gia đình xa.' }
    ];
    const s = samples[Math.floor(Math.random() * samples.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const prefixLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K'][Math.floor(Math.random() * 9)];
    const plate = `51${prefixLetter}-${randomDigits}`;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('newCarBrand', s.brand);
    setVal('newCarModel', s.model);
    setVal('newCarYear', 2023);
    setVal('newCarPlate', plate);
    setVal('newCarSeats', s.seats);
    setVal('newCarTransmission', s.trans);
    setVal('newCarFuel', s.fuel);
    setVal('newCarPrice', s.price);
    setVal('newCarProvince', 'Hồ Chí Minh');
    setVal('newCarAddress', '123 Nguyễn Văn Linh, Phường Tân Phú, Quận 7');
    setVal('newCarImageUrl', s.img);
    setVal('newCarDesc', s.desc);

    const imgPreview = document.getElementById('newCarPhotoPreview');
    const container = document.getElementById('newCarPhotoPreviewContainer');
    const placeholder = document.getElementById('newCarPhotoPlaceholder');
    if (imgPreview) imgPreview.src = s.img;
    if (container) container.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    const msg = `Đã điền thông tin mẫu xe ${s.brand} ${s.model} (Biển: ${plate})!`;
    if (typeof showToast === 'function') showToast(msg, 'info', 2000);
    else if (typeof App !== 'undefined' && App.showToast) App.showToast(msg, 'info');
  },

  // BR: Sinh biển số mẫu chuẩn Việt Nam
  generateSamplePlate() {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const prefixLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K'][Math.floor(Math.random() * 9)];
    const sample = `51${prefixLetter}-${randomDigits}`;
    const el = document.getElementById('newCarPlate');
    if (el) {
      el.value = sample;
      el.focus();
    }
  },

  // BR: Chọn nhanh ảnh mẫu
  setCarSampleImage(type) {
    const images = {
      SEDAN: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=80',
      SUV: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80',
      EV: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80'
    };
    const url = images[type] || images.SEDAN;
    const el = document.getElementById('newCarImageUrl');
    if (el) el.value = url;
    const img = document.getElementById('newCarPhotoPreview');
    const container = document.getElementById('newCarPhotoPreviewContainer');
    const placeholder = document.getElementById('newCarPhotoPlaceholder');
    if (img) img.src = url;
    if (container) container.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  },

  switchOwnerTab(tabName) {
    document.getElementById('ownerTabCars')?.classList.toggle('active', tabName === 'CARS');
    document.getElementById('ownerTabRequests')?.classList.toggle('active', tabName === 'REQUESTS');
    document.getElementById('ownerTabAdd')?.classList.toggle('active', tabName === 'ADD');

    const tabCars = document.getElementById('ownerTabCarsContent');
    const tabRequests = document.getElementById('ownerTabRequestsContent');
    const tabAdd = document.getElementById('ownerTabAddContent');

    if (tabCars) tabCars.style.display = tabName === 'CARS' ? 'block' : 'none';
    if (tabRequests) tabRequests.style.display = tabName === 'REQUESTS' ? 'block' : 'none';
    if (tabAdd) tabAdd.style.display = tabName === 'ADD' ? 'block' : 'none';
  },

  showAddCarTab() {
    this.switchOwnerTab('ADD');
  },

  async handleCarSubmit(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = 'Đang gửi duyệt...';
    }

    try {
      const brand = document.getElementById('newCarBrand').value;
      const model = document.getElementById('newCarModel').value.trim();
      const year = parseInt(document.getElementById('newCarYear').value, 10);
      let plate = document.getElementById('newCarPlate').value.trim().toUpperCase().replace(/\s+/g, '').replace(/\./g, '');
      const seats = parseInt(document.getElementById('newCarSeats').value, 10);
      const transmission = document.getElementById('newCarTransmission').value;
      const fuel = document.getElementById('newCarFuel').value;
      const price = parseFloat(document.getElementById('newCarPrice').value);
      const province = document.getElementById('newCarProvince') ? document.getElementById('newCarProvince').value : 'Hồ Chí Minh';
      const address = document.getElementById('newCarAddress').value.trim();
      let imageUrl = document.getElementById('newCarImageUrl') ? document.getElementById('newCarImageUrl').value.trim() : '';
      const desc = document.getElementById('newCarDesc') ? document.getElementById('newCarDesc').value.trim() : '';

      // Tự động gán ảnh mặc định nếu để trống
      if (!imageUrl || !imageUrl.startsWith('http')) {
        imageUrl = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80';
      }

      // Tự động chuẩn hóa biển số: nếu nhập 51A12345 (thiếu gạch ngang) -> 51A-12345
      if (/^[0-9]{2}[A-Z][0-9]{4,5}$/.test(plate)) {
        plate = plate.slice(0, 3) + '-' + plate.slice(3);
      }

      // Ràng buộc kiểm tra định dạng biển số xe Việt Nam
      const plateRegex = /^[0-9]{2}[A-Z]-[0-9]{4,5}$|^[0-9]{2}[A-Z][0-9]-[0-9]{4}$/;
      if (!plateRegex.test(plate)) {
        const elPlate = document.getElementById('newCarPlate');
        if (elPlate) {
          elPlate.focus();
          elPlate.style.borderColor = '#ef4444';
        }
        throw new Error(`Biển số "${plate}" không hợp lệ! Vui lòng nhập đúng chuẩn Việt Nam (VD: 51A-12345, 30H-99999) hoặc bấm nút "Tạo biển số mẫu".`);
      }

      if (price < 100000 || price > 10000000) {
        throw new Error('Giá thuê phải từ 100.000 VNĐ đến 10.000.000 VNĐ/ngày!');
      }

      const amenities = Array.from(document.querySelectorAll('input[name="amenity"]:checked')).map(cb => cb.value);

      const payload = {
        plateNumber: plate,
        plate_number: plate,
        brand,
        model,
        year,
        seats,
        seat_count: seats,
        transmission,
        fuelType: fuel,
        fuel_type: fuel,
        pricePerDay: price,
        price_per_day: price,
        address: `${address}, ${province}`,
        province,
        features: amenities.join(','),
        description: desc || 'Xe chất lượng cao của chủ xe DriveShare.',
        thumbnailUrl: imageUrl,
        thumbnail_url: imageUrl
      };

      // 1. Gửi lên Backend REST API (POST /api/v1/cars)
      let createdCarId = null;
      if (typeof CarAPI !== 'undefined' && CarAPI.createCar) {
        try {
          const apiRes = await CarAPI.createCar(payload);
          createdCarId = apiRes?.data?.carId || apiRes?.data?.car_id || apiRes?.data?.id;
        } catch (apiErr) {
          console.warn('Backend API createCar trả về lỗi:', apiErr);
          throw apiErr;
        }
      }

      // 1.1 Upload ảnh xe thực tế nếu có chọn file (POST /api/v1/cars/{carId}/photos)
      const photoFile = document.getElementById('newCarPhotoFile')?.files?.[0];
      if (createdCarId && photoFile && typeof CarAPI !== 'undefined' && CarAPI.uploadCarPhoto) {
        try {
          btnSubmit.innerHTML = 'Đang tải ảnh xe lên...';
          const uploadRes = await CarAPI.uploadCarPhoto(createdCarId, photoFile);
          if (uploadRes?.data?.imageUrl) {
            imageUrl = uploadRes.data.imageUrl;
          }
        } catch (uploadErr) {
          console.warn('Lỗi khi upload ảnh xe:', uploadErr);
          this.showToast('Tạo xe thành công nhưng ảnh xe chưa upload được. Bạn có thể thêm ảnh trong phần Quản lý ảnh xe.', 'warning', 3000);
        }
      }

      // 2. Lưu đồng bộ vào Local Storage làm dữ liệu dự phòng
      if (typeof StorageService !== 'undefined') {
        const owner = StorageService.getCurrentOwner();
        StorageService.saveCar({
          owner_id: owner?.id || 2,
          brand,
          model,
          year,
          license_plate: plate,
          seat_count: seats,
          transmission,
          fuel_type: fuel,
          fuel_consumption: fuel === 'ELECTRIC' ? 'Pin 400km / sạc' : '6.5L / 100km',
          price_per_day: price,
          pickup_address: `${address}, ${province}`,
          amenities,
          description: desc || 'Xe chất lượng cao của chủ xe DriveShare.',
          image_url: imageUrl,
          status: 'PENDING',
          owner_name: owner?.name || 'Chủ xe',
          owner_phone: owner?.phone || '',
          owner_avatar: owner?.avatar || ''
        });
      }

      this.showToast(`Đã gửi xe ${brand} ${model} (${plate}) lên hệ thống thành công! Xe đang chờ Admin xét duyệt.`, 'success');
      await this.renderOwnerPortal();
      this.switchOwnerTab('CARS');
    } catch (err) {
      console.error('Lỗi khi đăng ký xe:', err);
      let errMsg = err.message || err.error || 'Không thể đăng ký xe. Vui lòng kiểm tra lại thông tin.';
      if (err.data && err.data.message) errMsg = err.data.message;
      if (errMsg.includes('OWNER_NOT_APPROVED') || errMsg.includes('chưa được duyệt')) {
        errMsg = 'Tài khoản chủ xe của bạn đang CHỜ DUYỆT hồ sơ CCCD/Ngân hàng. Vui lòng đợi Admin phê duyệt tài khoản trước khi đăng xe.';
      } else if (errMsg.includes('CAR_PLATE_DUPLICATE') || errMsg.includes('Biển số')) {
        errMsg = 'Biển số xe này đã tồn tại trên hệ thống! Vui lòng nhập biển số khác.';
      }
      this.showToast(errMsg, 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Gửi xe lên phê duyệt';
      }
    }
  },

  previewCarPhoto(input) {
    const file = input?.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      this.showToast('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP!', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('newCarPhotoPreview');
      const container = document.getElementById('newCarPhotoPreviewContainer');
      const placeholder = document.getElementById('newCarPhotoPlaceholder');
      if (img) img.src = e.target.result;
      if (container) container.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  },

  clearCarPhotoPreview() {
    const input = document.getElementById('newCarPhotoFile');
    if (input) input.value = '';
    const container = document.getElementById('newCarPhotoPreviewContainer');
    if (container) container.style.display = 'none';
    const placeholder = document.getElementById('newCarPhotoPlaceholder');
    if (placeholder) placeholder.style.display = 'block';
    const img = document.getElementById('newCarPhotoPreview');
    if (img) img.src = '';
  },

  setupDropzone(dropzoneId, inputId, onFileCallback) {
    const zone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('drag-over');
      }, false);
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.showToast('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP!', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
        return;
      }

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      if (typeof onFileCallback === 'function') {
        onFileCallback(file);
      }
    }, false);
  },

  zoomImage(src, caption = 'Chi tiết hình ảnh') {
    const modal = document.getElementById('imagePreviewModalOverlay');
    const img = document.getElementById('imagePreviewModalImg');
    const cap = document.getElementById('imagePreviewModalCaption');
    if (!modal || !img || !src) return;
    img.src = src;
    if (cap) cap.innerText = caption;
    modal.classList.add('open');
  },

  // CRP-24: Modal Cập nhật thông tin xe (Update Product — dàn hàng ngang chia row tối ưu diện tích)
  async openEditCarModal(carId) {
    const overlay = document.getElementById('editCarModalOverlay');
    const body = document.getElementById('editCarModalBody');
    const title = document.getElementById('editCarModalTitle');
    if (!overlay || !body) return;

    overlay.classList.add('open');
    body.innerHTML = `
      <div style="text-align: center; padding: 2.5rem;">
        <span class="spinner" style="display: inline-block; width: 28px; height: 28px; border: 3px solid #cbd5e1; border-top-color: #0f766e; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
        <p style="margin-top: 10px; color: var(--slate-600); font-size: 0.9rem;">Đang tải thông tin xe...</p>
      </div>
    `;

    let car = null;
    if (Array.isArray(this.ownerCars)) {
      car = this.ownerCars.find(c => c.id == carId);
    }
    if (!car && typeof CarAPI !== 'undefined' && CarAPI.getPublicCarDetail) {
      try {
        const res = await CarAPI.getPublicCarDetail(carId);
        if (res && res.data) {
          const d = res.data;
          car = {
            id: d.id,
            brand: d.brand,
            model: d.model,
            year: d.year,
            license_plate: d.plateNumber || d.plate_number,
            seat_count: d.seats,
            transmission: d.transmission,
            fuel_type: d.fuelType,
            price_per_day: d.pricePerDay,
            pickup_address: d.address,
            province: d.province,
            features: d.features,
            description: d.description,
            image_url: d.thumbnailUrl
          };
        }
      } catch (e) {
        console.warn('Cannot fetch public car detail:', e);
      }
    }
    if (!car && typeof StorageService !== 'undefined') {
      car = StorageService.getCarById(carId);
    }

    if (!car) {
      body.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
          Không tìm thấy thông tin xe #${carId}. Vui lòng thử lại!
        </div>
      `;
      return;
    }

    if (title) {
      title.innerText = `Cập nhật thông tin xe: ${car.brand} ${car.model} (${car.license_plate})`;
    }

    const currentBrand = car.brand || 'Toyota';
    const currentModel = car.model || '';
    const currentYear = car.year || 2023;
    const currentPlate = car.license_plate || car.plate_number || '';
    const currentSeats = car.seat_count || car.seats || 5;
    const currentTrans = car.transmission || 'AUTOMATIC';
    const currentFuel = car.fuel_type || car.fuelType || 'GASOLINE';
    const currentPrice = car.price_per_day || car.pricePerDay || 800000;
    const currentAddress = (car.pickup_address || car.address || '').replace(/,.*$/, '');
    const currentProvince = car.province || 'Hồ Chí Minh';
    const currentFeatures = car.features || '';
    const currentDesc = car.description || '';
    const currentImg = car.image_url || car.thumbnail_url || car.thumbnailUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80';

    body.innerHTML = `
      <form id="editCarForm" onsubmit="OwnerService.handleCarUpdateSubmit(event, ${carId})">
        <div class="form-layout-split">
          <!-- CỘT TRÁI: DÀN HÀNG NGANG CHIA ROW TỐI ƯU DIỆN TÍCH -->
          <div class="form-left-col">
            <!-- ROW 1 (4 CỘT): Hãng, Dòng, Năm, Biển số -->
            <div class="form-grid-4">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Hãng xe <span class="required">*</span></label>
                <select class="form-control" id="editCarBrand" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                  <option value="Toyota" ${currentBrand === 'Toyota' ? 'selected' : ''}>Toyota</option>
                  <option value="VinFast" ${currentBrand === 'VinFast' ? 'selected' : ''}>VinFast</option>
                  <option value="Hyundai" ${currentBrand === 'Hyundai' ? 'selected' : ''}>Hyundai</option>
                  <option value="Kia" ${currentBrand === 'Kia' ? 'selected' : ''}>Kia</option>
                  <option value="Honda" ${currentBrand === 'Honda' ? 'selected' : ''}>Honda</option>
                  <option value="Mazda" ${currentBrand === 'Mazda' ? 'selected' : ''}>Mazda</option>
                  <option value="Ford" ${currentBrand === 'Ford' ? 'selected' : ''}>Ford</option>
                  <option value="Mitsubishi" ${currentBrand === 'Mitsubishi' ? 'selected' : ''}>Mitsubishi</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Dòng xe <span class="required">*</span></label>
                <input type="text" class="form-control" id="editCarModel" value="${currentModel}" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Năm SX <span class="required">*</span></label>
                <input type="number" class="form-control" id="editCarYear" min="2016" max="2026" value="${currentYear}" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Biển kiểm soát</label>
                <input type="text" class="form-control" id="editCarPlate" value="${currentPlate}" readonly style="padding: 0.45rem 0.65rem; font-size: 0.85rem; font-family: monospace; font-weight: 700; background: #f1f5f9; cursor: not-allowed;" title="Biển số là định danh duy nhất không thể đổi" />
              </div>
            </div>

            <!-- ROW 2 (4 CỘT): Số chỗ, Hộp số, Nhiên liệu, Giá thuê -->
            <div class="form-grid-4">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Số chỗ <span class="required">*</span></label>
                <select class="form-control" id="editCarSeats" style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                  <option value="4" ${currentSeats == 4 ? 'selected' : ''}>4 chỗ</option>
                  <option value="5" ${currentSeats == 5 ? 'selected' : ''}>5 chỗ</option>
                  <option value="7" ${currentSeats == 7 ? 'selected' : ''}>7 chỗ</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Hộp số <span class="required">*</span></label>
                <select class="form-control" id="editCarTransmission" style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                  <option value="AUTOMATIC" ${currentTrans === 'AUTOMATIC' ? 'selected' : ''}>Tự động (AT)</option>
                  <option value="MANUAL" ${currentTrans === 'MANUAL' ? 'selected' : ''}>Số sàn (MT)</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Nhiên liệu <span class="required">*</span></label>
                <select class="form-control" id="editCarFuel" style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                  <option value="GASOLINE" ${currentFuel === 'GASOLINE' ? 'selected' : ''}>Xăng</option>
                  <option value="ELECTRIC" ${currentFuel === 'ELECTRIC' ? 'selected' : ''}>Điện</option>
                  <option value="DIESEL" ${currentFuel === 'DIESEL' ? 'selected' : ''}>Dầu Diesel</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Giá thuê (đ/ngày) <span class="required">*</span></label>
                <input type="number" class="form-control" id="editCarPrice" value="${currentPrice}" step="50000" min="100000" max="10000000" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem; font-weight: 700; color: #047857;" />
              </div>
            </div>

            <!-- ROW 3 (2 CỘT): Tỉnh/Thành phố, Địa chỉ -->
            <div class="form-grid-2" style="margin-bottom: 0.85rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Tỉnh / Thành phố <span class="required">*</span></label>
                <select class="form-control" id="editCarProvince" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">
                  <option value="Hồ Chí Minh" ${currentProvince.includes('Hồ Chí Minh') ? 'selected' : ''}>TP. Hồ Chí Minh</option>
                  <option value="Hà Nội" ${currentProvince.includes('Hà Nội') ? 'selected' : ''}>Hà Nội</option>
                  <option value="Đà Nẵng" ${currentProvince.includes('Đà Nẵng') ? 'selected' : ''}>Đà Nẵng</option>
                  <option value="Bình Dương" ${currentProvince.includes('Bình Dương') ? 'selected' : ''}>Bình Dương</option>
                  <option value="Đồng Nai" ${currentProvince.includes('Đồng Nai') ? 'selected' : ''}>Đồng Nai</option>
                  <option value="Cần Thơ" ${currentProvince.includes('Cần Thơ') ? 'selected' : ''}>Cần Thơ</option>
                  <option value="Hải Phòng" ${currentProvince.includes('Hải Phòng') ? 'selected' : ''}>Hải Phòng</option>
                  <option value="Khánh Hòa" ${currentProvince.includes('Khánh Hòa') ? 'selected' : ''}>Khánh Hòa</option>
                  <option value="Lâm Đồng" ${currentProvince.includes('Lâm Đồng') ? 'selected' : ''}>Lâm Đồng</option>
                  <option value="Bà Rịa - Vũng Tàu" ${currentProvince.includes('Vũng Tàu') ? 'selected' : ''}>Bà Rịa - Vũng Tàu</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Địa chỉ nhận xe <span class="required">*</span></label>
                <input type="text" class="form-control" id="editCarAddress" value="${currentAddress}" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem;" />
              </div>
            </div>

            <!-- ROW 4: Tiện ích -->
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label" style="font-size: 0.82rem; margin-bottom: 6px;">Tiện ích & Trang bị sẵn</label>
              <div class="checkbox-group-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="editAmenity" value="Bản đồ dẫn đường" ${currentFeatures.includes('Bản đồ') ? 'checked' : ''}> Bản đồ dẫn đường</label>
                <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="editAmenity" value="Camera lùi / 360" ${currentFeatures.includes('Camera') ? 'checked' : ''}> Camera lùi / 360</label>
                <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="editAmenity" value="Thu phí tự động VETC" ${currentFeatures.includes('Thu phí') ? 'checked' : ''}> Thu phí VETC</label>
                <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="editAmenity" value="Apple CarPlay / Android Auto" ${currentFeatures.includes('CarPlay') ? 'checked' : ''}> Apple CarPlay</label>
                <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="editAmenity" value="Cửa sổ trời" ${currentFeatures.includes('Cửa sổ') ? 'checked' : ''}> Cửa sổ trời</label>
                <label class="checkbox-label" style="font-size: 0.78rem;"><input type="checkbox" name="editAmenity" value="Cảm biến áp suất lốp" ${currentFeatures.includes('Cảm biến') ? 'checked' : ''}> Cảm biến lốp</label>
              </div>
            </div>

            <!-- ROW 5: Mô tả -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.82rem; margin-bottom: 4px;">Mô tả tình trạng xe</label>
              <textarea class="form-control" id="editCarDesc" rows="2" style="padding: 0.45rem 0.65rem; font-size: 0.85rem;">${currentDesc}</textarea>
            </div>
          </div>

          <!-- CỘT PHẢI: KÉO THẢ ẢNH XE & LIVE PREVIEW -->
          <div class="form-right-col" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" style="font-size: 0.82rem; margin-bottom: 0;">Hình ảnh xe đại diện</label>
                <span style="font-size: 0.72rem; color: #0f766e; font-weight: 600;">Hỗ trợ kéo & thả</span>
              </div>

              <!-- Dropzone -->
              <div class="upload-dropzone" id="editCarPhotoDropzone" onclick="document.getElementById('editCarPhotoFile').click()">
                <input type="file" id="editCarPhotoFile" accept="image/png, image/jpeg, image/jpg, image/webp" style="display: none;" onchange="OwnerService.previewEditCarPhoto(this)" />
                
                <div id="editCarPhotoPreviewContainer" class="preview-thumbnail-card" onclick="event.stopPropagation()">
                  <img id="editCarPhotoPreview" src="${currentImg}" alt="Ảnh xe" style="cursor: zoom-in;" title="Bấm để phóng to xem ảnh" onclick="OwnerService.zoomImage(this.src, '${currentBrand} ${currentModel}')" />
                  <div class="preview-overlay-actions">
                    <button type="button" class="preview-overlay-btn" onclick="OwnerService.zoomImage(document.getElementById('editCarPhotoPreview').src, '${currentBrand} ${currentModel}')" title="Phóng to">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                      Phóng to
                    </button>
                    <button type="button" class="preview-overlay-btn" onclick="document.getElementById('editCarPhotoFile').click()" title="Đổi ảnh">
                      Đổi ảnh
                    </button>
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: #64748b; margin-top: 6px;">Kéo thả ảnh mới vào đây hoặc bấm để thay đổi</div>
              </div>

              <!-- Samples & Hidden URL -->
              <div style="margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 4px; flex-wrap: wrap;">
                  <span style="font-size: 0.74rem; color: #64748b;">Hoặc chọn ảnh mẫu:</span>
                  <div style="display: flex; gap: 4px;">
                    <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setEditCarSampleImage('SEDAN')">Sedan</button>
                    <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setEditCarSampleImage('SUV')">SUV</button>
                    <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setEditCarSampleImage('EV')">Xe điện</button>
                  </div>
                </div>
                <input type="hidden" id="editCarImageUrl" value="${currentImg}" />
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.5rem;">
              <button type="button" class="btn btn-outline btn-sm" style="flex: 1;" onclick="document.getElementById('editCarModalOverlay').classList.remove('open')">Đóng</button>
              <button type="submit" class="btn btn-primary btn-sm" style="flex: 2; font-weight: 700;">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      </form>
    `;

    setTimeout(() => {
      this.setupDropzone('editCarPhotoDropzone', 'editCarPhotoFile', (file) => {
        const input = document.getElementById('editCarPhotoFile');
        this.previewEditCarPhoto(input);
      });
    }, 50);
  },

  previewEditCarPhoto(input) {
    const file = input?.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      this.showToast('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP!', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('editCarPhotoPreview');
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  setEditCarSampleImage(type) {
    const images = {
      SEDAN: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=80',
      SUV: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80',
      EV: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80'
    };
    const url = images[type] || images.SEDAN;
    const el = document.getElementById('editCarImageUrl');
    if (el) el.value = url;
    const img = document.getElementById('editCarPhotoPreview');
    if (img) img.src = url;
  },

  async handleCarUpdateSubmit(e, carId) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = 'Đang lưu thay đổi...';
    }

    try {
      const brand = document.getElementById('editCarBrand').value;
      const model = document.getElementById('editCarModel').value.trim();
      const year = parseInt(document.getElementById('editCarYear').value, 10);
      const seats = parseInt(document.getElementById('editCarSeats').value, 10);
      const transmission = document.getElementById('editCarTransmission').value;
      const fuel = document.getElementById('editCarFuel').value;
      const price = parseFloat(document.getElementById('editCarPrice').value);
      const province = document.getElementById('editCarProvince').value;
      const address = document.getElementById('editCarAddress').value.trim();
      const desc = document.getElementById('editCarDesc').value.trim();
      let imageUrl = document.getElementById('editCarImageUrl').value.trim();

      if (price < 100000 || price > 10000000) {
        throw new Error('Giá thuê phải từ 100.000 VNĐ đến 10.000.000 VNĐ/ngày!');
      }

      const amenities = Array.from(document.querySelectorAll('input[name="editAmenity"]:checked')).map(cb => cb.value);

      const payload = {
        brand,
        model,
        year,
        seats,
        transmission,
        fuelType: fuel,
        pricePerDay: price,
        address: `${address}, ${province}`,
        province,
        features: amenities.join(','),
        description: desc,
        thumbnailUrl: imageUrl
      };

      // 1. Gửi API PUT /api/v1/cars/{carId}
      if (typeof CarAPI !== 'undefined' && CarAPI.updateCar) {
        await CarAPI.updateCar(carId, payload);
      }

      // 1.1 Upload ảnh xe nếu có file mới
      const photoFile = document.getElementById('editCarPhotoFile')?.files?.[0];
      if (photoFile && typeof CarAPI !== 'undefined' && CarAPI.uploadCarPhoto) {
        try {
          btnSubmit.innerHTML = 'Đang tải ảnh xe mới...';
          const uploadRes = await CarAPI.uploadCarPhoto(carId, photoFile);
          if (uploadRes?.data?.imageUrl) {
            imageUrl = uploadRes.data.imageUrl;
          }
        } catch (uploadErr) {
          console.warn('Lỗi upload ảnh xe mới:', uploadErr);
        }
      }

      // 2. Cập nhật dữ liệu dự phòng Local Storage
      if (typeof StorageService !== 'undefined') {
        StorageService.updateCar(carId, {
          brand,
          model,
          year,
          seat_count: seats,
          transmission,
          fuel_type: fuel,
          price_per_day: price,
          pickup_address: `${address}, ${province}`,
          amenities,
          description: desc,
          image_url: imageUrl
        });
      }

      document.getElementById('editCarModalOverlay')?.classList.remove('open');
      this.showToast(`Cập nhật thông tin xe ${brand} ${model} thành công!`, 'success');
      await this.renderOwnerPortal();
    } catch (err) {
      console.error('Lỗi cập nhật xe:', err);
      this.showToast(err.message || 'Cập nhật xe thất bại. Vui lòng thử lại!', 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Lưu thay đổi';
      }
    }
  },

  // CRP-33: Quản lý thư viện ảnh xe của Owner
  async openPhotosModal(carId, carTitle = '') {
    const overlay = document.getElementById('carPhotosModalOverlay');
    const body = document.getElementById('carPhotosModalBody');
    const title = document.getElementById('carPhotosModalTitle');
    if (!overlay || !body) return;

    if (title) title.innerText = `Quản lý hình ảnh xe: ${carTitle || '#' + carId}`;
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <span class="spinner" style="display: inline-block; width: 24px; height: 24px; border: 3px solid #cbd5e1; border-top-color: #0f766e; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
        <p style="margin-top: 8px; color: var(--slate-600);">Đang tải danh sách hình ảnh...</p>
      </div>
    `;
    overlay.classList.add('open');

    try {
      let photos = [];
      if (typeof CarAPI !== 'undefined' && CarAPI.getCarPhotos) {
        const res = await CarAPI.getCarPhotos(carId);
        if (res && res.data && Array.isArray(res.data)) {
          photos = res.data;
        }
      }

      body.innerHTML = `
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: var(--slate-800);">Danh sách ảnh (${photos.length}/10 ảnh)</strong>
            <label class="btn btn-primary btn-sm" style="margin-bottom: 0; cursor: pointer; ${photos.length >= 10 ? 'opacity: 0.5; pointer-events: none;' : ''}">
              + Thêm ảnh mới
              <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" style="display: none;" onchange="OwnerService.handleUploadAdditionalPhoto(${carId}, this, '${carTitle}')" />
            </label>
          </div>
          <p style="font-size: 0.8rem; color: var(--slate-500); margin: 0;">Mỗi xe có tối đa 10 ảnh, dung lượng tối đa 5MB/ảnh. Bấm "Đặt làm đại diện" để chọn ảnh hiển thị chính.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; max-height: 380px; overflow-y: auto; padding: 4px;">
          ${photos.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--slate-500); background: #f8fafc; border-radius: 8px;">
              Xe này chưa có hình ảnh nào được tải lên máy chủ. Hãy tải lên tấm ảnh đầu tiên!
            </div>
          ` : photos.map(p => {
            const imgUrl = p.imageUrl || p.image_url || '';
            const imgId = p.imageId || p.image_id || p.id;
            const isThumb = p.isThumbnail || p.is_thumbnail || false;
            return `
            <div style="position: relative; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <img src="${imgUrl}" alt="Ảnh xe" style="width: 100%; height: 110px; object-fit: cover; cursor: zoom-in;" title="Bấm để phóng to xem ảnh" onclick="OwnerService.zoomImage('${imgUrl}', '${carTitle}')" />
              ${isThumb ? `
                <span style="position: absolute; top: 6px; left: 6px; background: #0f766e; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                  Đại diện
                </span>
              ` : ''}
              <div style="padding: 6px; display: flex; flex-direction: column; gap: 4px;">
                ${!isThumb ? `
                  <button class="btn btn-outline btn-xs" style="font-size: 11px; padding: 2px 6px;" onclick="OwnerService.setPrimaryPhoto(${carId}, ${imgId}, '${carTitle}')">
                    Đặt làm đại diện
                  </button>
                ` : `
                  <span style="font-size: 11px; color: #0f766e; font-weight: 600; text-align: center; padding: 2px;">Ảnh chính</span>
                `}
                <button class="btn btn-ghost btn-xs" style="font-size: 11px; color: #ef4444; padding: 2px 6px;" onclick="OwnerService.deleteCarPhoto(${carId}, ${imgId}, '${carTitle}')">
                  Xóa ảnh
                </button>
              </div>
            </div>
          `}).join('')}
        </div>
      `;
    } catch (err) {
      console.error('Lỗi khi tải ảnh xe:', err);
      body.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
          Không thể tải danh sách ảnh xe. Vui lòng thử lại sau!
        </div>
      `;
    }
  },

  async handleUploadAdditionalPhoto(carId, input, carTitle = '') {
    const file = input?.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      this.showToast('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP!', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      return;
    }

    this.showToast('Đang tải ảnh xe lên...', 'info', 1500);
    try {
      await CarAPI.uploadCarPhoto(carId, file);
      this.showToast('Tải ảnh xe lên thành công!', 'success');
      await this.openPhotosModal(carId, carTitle);
      await this.renderOwnerPortal();
    } catch (err) {
      console.error('Lỗi khi upload ảnh:', err);
      this.showToast(err?.message || 'Tải ảnh thất bại!', 'error');
    }
  },

  async setPrimaryPhoto(carId, photoId, carTitle = '') {
    try {
      await CarAPI.setCarThumbnail(carId, photoId);
      this.showToast('Đã đặt làm ảnh đại diện thành công!', 'success');
      await this.openPhotosModal(carId, carTitle);
      await this.renderOwnerPortal();
    } catch (err) {
      console.error('Lỗi khi đặt ảnh đại diện:', err);
      this.showToast(err?.message || 'Thao tác thất bại!', 'error');
    }
  },

  async deleteCarPhoto(carId, photoId, carTitle = '') {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này không?')) return;
    try {
      await CarAPI.deleteCarPhoto(carId, photoId);
      this.showToast('Đã xóa hình ảnh thành công!', 'success');
      await this.openPhotosModal(carId, carTitle);
      await this.renderOwnerPortal();
    } catch (err) {
      console.error('Lỗi khi xóa ảnh:', err);
      this.showToast(err?.message || 'Xóa ảnh thất bại!', 'error');
    }
  },

  // =====================================================================
  // CRP-40 — Quản lý Lịch Xe & Chặn Ngày Bận (Owner Blackout Dates)
  // =====================================================================

  async openCalendarModal(carId, carTitle = '') {
    const overlay = document.getElementById('carCalendarModalOverlay');
    const body = document.getElementById('carCalendarModalBody');
    const title = document.getElementById('carCalendarModalTitle');
    if (!overlay || !body) return;

    if (title) title.innerText = `Lịch Xe & Quản Lý Ngày Bận: ${carTitle || '#' + carId}`;
    body.innerHTML = `
      <div style="text-align: center; padding: 2.5rem;">
        <span class="spinner" style="display: inline-block; width: 28px; height: 28px; border: 3px solid #cbd5e1; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
        <p style="margin-top: 10px; color: var(--slate-600); font-weight: 600;">Đang đồng bộ dữ liệu lịch xe...</p>
      </div>
    `;
    overlay.classList.add('open');

    let calendarData = null;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Thử gọi API Backend: GET /api/v1/cars/{id}/calendar
    if (typeof CarAPI !== 'undefined' && CarAPI.getCarCalendar) {
      try {
        const res = await CarAPI.getCarCalendar(carId, todayStr);
        if (res && (res.code === 200 || res.success) && res.data) {
          calendarData = res.data;
        }
      } catch (err) {
        console.warn('CarAPI.getCarCalendar fallback to local data:', err);
      }
    }

    // 2. Fallback sang LocalStorage nếu backend chưa có hoặc offline
    if (!calendarData) {
      const myBookings = (typeof StorageService !== 'undefined' ? StorageService.getBookings() : [])
        .filter(b => String(b.car_id || b.carId) === String(carId) && ['CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS', 'APPROVED', 'WAITING_PAYMENT'].includes(b.status));

      const myBlocks = typeof StorageService !== 'undefined' ? StorageService.getCalendarBlocks(carId) : [];

      const items = [];
      const unavailableSet = new Set();

      myBookings.forEach(b => {
        const s = b.start_date || b.startDate;
        const e = b.end_date || b.endDate;
        items.push({
          type: 'RENTAL',
          referenceId: b.id || b.booking_id,
          startDate: s,
          endDate: e,
          title: `Đơn #${b.id || b.booking_id} (${b.renter_name || b.renterFullName || 'Khách thuê'})`,
          status: b.status,
          note: b.note || b.trip_purpose || ''
        });
        if (s && e) {
          let cur = new Date(s);
          const end = new Date(e);
          while (cur <= end) {
            unavailableSet.add(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
          }
        }
      });

      myBlocks.forEach(b => {
        items.push({
          type: 'OWNER_BLOCK',
          referenceId: b.blockId,
          startDate: b.startDate,
          endDate: b.endDate,
          title: 'Chủ xe chặn lịch',
          status: 'BLOCKED',
          note: b.reason || 'Bảo dưỡng / Đi việc riêng'
        });
        if (b.startDate && b.endDate) {
          let cur = new Date(b.startDate);
          const end = new Date(b.endDate);
          while (cur <= end) {
            unavailableSet.add(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
          }
        }
      });

      calendarData = {
        carId,
        brand: carTitle,
        model: '',
        plateNumber: '',
        items,
        unavailableDates: Array.from(unavailableSet).sort()
      };
    }

    this.renderCalendarModalView(carId, carTitle, calendarData);
  },

  renderCalendarModalView(carId, carTitle, data) {
    const body = document.getElementById('carCalendarModalBody');
    if (!body) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const items = data.items || [];
    const rentalItems = items.filter(i => i.type === 'RENTAL');
    const blockItems = items.filter(i => i.type === 'OWNER_BLOCK');
    const unavailableCount = (data.unavailableDates || []).length;

    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        
        <!-- THỐNG KÊ NHANH TRẠNG THÁI LỊCH XE -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #166534; text-transform: uppercase;">Mặc định khả dụng</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #15803d; margin-top: 2px;">Rảnh 24/7</div>
            <div style="font-size: 0.73rem; color: #166534; margin-top: 2px;">Sẵn sàng nhận khách mọi ngày trừ ngày bận</div>
          </div>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px 16px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #9a3412; text-transform: uppercase;">Đơn khách đã thuê</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #c2410c; margin-top: 2px;">${rentalItems.length} chuyến đi</div>
            <div style="font-size: 0.73rem; color: #9a3412; margin-top: 2px;">Tự động khóa theo đơn đã duyệt/cọc</div>
          </div>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 12px 16px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #5b21b6; text-transform: uppercase;">Chủ xe tự chặn bận</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #7c3aed; margin-top: 2px;">${blockItems.length} đợt chặn</div>
            <div style="font-size: 0.73rem; color: #5b21b6; margin-top: 2px;">Xe bảo dưỡng, đăng kiểm hoặc việc riêng</div>
          </div>
        </div>

        <!-- FORM CHỦ XE CHẶN LỊCH BẬN MỚI (BLACKOUT DATE) -->
        <div style="background: #faf5ff; border: 1.5px dashed #c084fc; border-radius: 12px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="color: #6b21a8; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Chủ động chặn ngày bận (Khóa xe tạm thời)
              </strong>
              <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #7e22ce;">
                Khi bạn chặn ngày, khách hàng tìm kiếm trong khoảng thời gian này sẽ <strong>không thấy xe xuất hiện</strong>.
              </p>
            </div>
          </div>

          <form onsubmit="OwnerService.handleCreateCalendarBlock(event, ${carId}, '${carTitle}')" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) 140px; gap: 10px; align-items: flex-end;">
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: #4c1d95; margin-bottom: 4px; display: block;">Từ ngày <span style="color:#ef4444;">*</span></label>
              <input type="date" id="blockStartDate" class="form-control" min="${todayStr}" value="${todayStr}" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem; border-color: #d8b4fe;" />
            </div>
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: #4c1d95; margin-bottom: 4px; display: block;">Đến ngày <span style="color:#ef4444;">*</span></label>
              <input type="date" id="blockEndDate" class="form-control" min="${todayStr}" value="${todayStr}" required style="padding: 0.45rem 0.65rem; font-size: 0.85rem; border-color: #d8b4fe;" />
            </div>
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: #4c1d95; margin-bottom: 4px; display: block;">Lý do chặn bận</label>
              <select id="blockReasonSelect" class="form-control" style="padding: 0.45rem 0.65rem; font-size: 0.85rem; border-color: #d8b4fe;" onchange="document.getElementById('blockReasonCustom').style.display = this.value === 'CUSTOM' ? 'block' : 'none'">
                <option value="Bảo dưỡng xe định kỳ">Bảo dưỡng xe định kỳ</option>
                <option value="Đi việc gia đình / Về quê">Đi việc gia đình / Về quê</option>
                <option value="Đưa xe đi đăng kiểm định kỳ">Đưa xe đi đăng kiểm định kỳ</option>
                <option value="Nghỉ lễ / Tạm ngưng cho thuê">Nghỉ lễ / Tạm ngưng cho thuê</option>
                <option value="CUSTOM">Lý do khác...</option>
              </select>
              <input type="text" id="blockReasonCustom" class="form-control" placeholder="Nhập lý do cụ thể..." style="display: none; margin-top: 4px; padding: 0.45rem 0.65rem; font-size: 0.85rem; border-color: #d8b4fe;" />
            </div>
            <div>
              <button type="submit" id="btnSubmitBlock" class="btn btn-primary" style="width: 100%; padding: 0.5rem 0.75rem; font-size: 0.85rem; font-weight: 700; background: #7c3aed; border-color: #7c3aed;">
                Khóa ngày bận
              </button>
            </div>
          </form>
        </div>

        <!-- DANH SÁCH CHI TIẾT CÁC NGÀY BẬN & ĐƠN THUÊ -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: var(--slate-800); font-size: 0.95rem;">
              Danh sách đơn thuê & Các đợt chặn lịch (${items.length})
            </strong>
            <span style="font-size: 0.78rem; color: var(--slate-500);">
              Tổng cộng <strong>${unavailableCount}</strong> ngày đã có lịch
            </span>
          </div>

          <div style="max-height: 290px; overflow-y: auto; border: 1px solid var(--slate-200); border-radius: 8px; background: #fff;">
            ${items.length === 0 ? `
              <div style="text-align: center; padding: 2.5rem; color: var(--slate-500); background: #f8fafc;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.8" style="margin-bottom: 6px;">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                <div style="font-weight: 700; color: #166534; font-size: 0.92rem;">Xe đang hoàn toàn rảnh mọi ngày!</div>
                <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 2px;">Chưa có đơn thuê nào và chưa bị chặn lịch. Khách hàng có thể tìm và đặt xe bất kỳ lúc nào.</div>
              </div>
            ` : `
              <table class="custom-table" style="font-size: 0.84rem; margin-bottom: 0;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 8px 12px;">Phân loại</th>
                    <th style="padding: 8px 12px;">Khoảng thời gian</th>
                    <th style="padding: 8px 12px;">Chi tiết & Ghi chú</th>
                    <th style="padding: 8px 12px;">Trạng thái</th>
                    <th style="padding: 8px 12px; text-align: right;">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => {
                    const isRental = item.type === 'RENTAL';
                    return `
                      <tr>
                        <td style="padding: 10px 12px;">
                          ${isRental ? `
                            <span class="badge" style="background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; font-weight: 700;">
                              Đơn thuê xe
                            </span>
                          ` : `
                            <span class="badge" style="background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; font-weight: 700;">
                              Chủ xe chặn
                            </span>
                          `}
                        </td>
                        <td style="padding: 10px 12px;">
                          <strong style="color: var(--slate-900);">${item.startDate}</strong> &rarr; <strong style="color: var(--slate-900);">${item.endDate}</strong>
                        </td>
                        <td style="padding: 10px 12px;">
                          <div style="font-weight: 600; color: var(--slate-800);">${item.title}</div>
                          ${item.note ? `<div style="font-size: 0.74rem; color: var(--slate-500); margin-top: 2px;">${item.note}</div>` : ''}
                        </td>
                        <td style="padding: 10px 12px;">
                          ${isRental ? `
                            <span class="badge badge-success" style="font-size: 0.72rem;">${item.status}</span>
                          ` : `
                            <span class="badge" style="background: #ede9fe; color: #6d28d9; font-size: 0.72rem;">Đang khóa xe</span>
                          `}
                        </td>
                        <td style="padding: 10px 12px; text-align: right;">
                          ${!isRental ? `
                            <button class="btn btn-ghost btn-xs" style="color: #ef4444; border: 1px solid #fecaca; background: #fff; font-size: 0.75rem; padding: 3px 8px;" onclick="OwnerService.handleDeleteCalendarBlock(${carId}, ${item.referenceId}, '${carTitle}')">
                              Mở khóa ngày này
                            </button>
                          ` : `
                            <span style="font-size: 0.75rem; color: var(--slate-400);">Theo đơn khách</span>
                          `}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>

      </div>
    `;
  },

  async handleCreateCalendarBlock(event, carId, carTitle) {
    if (event) event.preventDefault();
    const startInput = document.getElementById('blockStartDate');
    const endInput = document.getElementById('blockEndDate');
    const selectReason = document.getElementById('blockReasonSelect');
    const customReason = document.getElementById('blockReasonCustom');
    const btnSubmit = document.getElementById('btnSubmitBlock');

    if (!startInput || !endInput) return;
    const startDate = startInput.value;
    const endDate = endInput.value;
    let reason = selectReason?.value === 'CUSTOM' ? (customReason?.value || 'Chủ xe bận') : (selectReason?.value || 'Chủ xe bận / Bảo dưỡng');

    if (!startDate || !endDate) {
      this.showToast('Vui lòng chọn ngày bắt đầu và kết thúc!', 'error');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      this.showToast('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!', 'error');
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Đang khóa...';
    }

    try {
      let success = false;
      if (typeof CarAPI !== 'undefined' && CarAPI.addCalendarBlock) {
        try {
          const res = await CarAPI.addCalendarBlock(carId, { startDate, endDate, reason });
          if (res && (res.code === 200 || res.code === 201 || res.success)) {
            success = true;
          }
        } catch (apiErr) {
          console.warn('Lỗi gọi CarAPI.addCalendarBlock:', apiErr);
          const errMsg = apiErr?.message || (typeof apiErr === 'string' ? apiErr : 'Không thể chặn lịch vì trùng với đơn thuê xe');
          this.showToast(errMsg, 'error');
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Khóa ngày bận';
          }
          return;
        }
      }

      // Lưu dự phòng LocalStorage
      if (typeof StorageService !== 'undefined') {
        StorageService.saveCalendarBlock({ carId, startDate, endDate, reason });
      }

      this.showToast(`Đã chặn ngày bận từ ${startDate} đến ${endDate} thành công!`, 'success');
      await this.openCalendarModal(carId, carTitle);
    } catch (err) {
      console.error('Lỗi khi chặn ngày bận:', err);
      this.showToast(err.message || 'Thao tác thất bại!', 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Khóa ngày bận';
      }
    }
  },

  async handleDeleteCalendarBlock(carId, blockId, carTitle) {
    if (!confirm('Bạn có chắc muốn mở khóa ngày bận này để xe có thể cho thuê trở lại không?')) {
      return;
    }

    try {
      if (typeof CarAPI !== 'undefined' && CarAPI.removeCalendarBlock) {
        try {
          await CarAPI.removeCalendarBlock(carId, blockId);
        } catch (apiErr) {
          console.warn('Lỗi gọi CarAPI.removeCalendarBlock:', apiErr);
        }
      }

      if (typeof StorageService !== 'undefined') {
        StorageService.deleteCalendarBlock(blockId);
      }

      this.showToast('Đã mở khóa ngày bận thành công!', 'success');
      await this.openCalendarModal(carId, carTitle);
    } catch (err) {
      console.error('Lỗi khi mở khóa ngày bận:', err);
      this.showToast(err.message || 'Thao tác thất bại!', 'error');
    }
  },

  async viewCarDetail(carId) {
    const overlay = document.getElementById('carDetailModalOverlay');
    const body = document.getElementById('carDetailModalBody');
    const title = document.getElementById('carDetailModalTitle');
    if (!overlay || !body) return;

    overlay.classList.add('open');
    if (title) title.innerText = `Chi tiết phương tiện #${carId}`;
    body.innerHTML = `
      <div style="text-align: center; padding: 2.5rem;">
        <span class="spinner" style="display: inline-block; width: 28px; height: 28px; border: 3px solid #cbd5e1; border-top-color: #0f766e; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
        <p style="margin-top: 10px; color: var(--slate-600); font-size: 0.9rem;">Đang tải thông tin chi tiết xe...</p>
      </div>
    `;

    let car = null;
    if (typeof CarAPI !== 'undefined' && CarAPI.getPublicCarDetail) {
      try {
        const res = await CarAPI.getPublicCarDetail(carId);
        if (res && res.data) {
          car = res.data;
        }
      } catch (e) {
        console.warn('Cannot fetch public car detail via API, checking ownerCars or Storage:', e);
      }
    }

    if (!car && Array.isArray(this.ownerCars)) {
      const c = this.ownerCars.find(item => item.id == carId);
      if (c) {
        car = {
          id: c.id,
          brand: c.brand,
          model: c.model,
          year: c.year,
          plateNumber: c.license_plate,
          seats: c.seat_count,
          transmission: c.transmission,
          fuelType: c.fuel_type,
          pricePerDay: c.price_per_day,
          address: c.pickup_address,
          province: c.province || 'Hồ Chí Minh',
          description: c.description,
          features: c.features,
          thumbnailUrl: c.image_url,
          status: c.status
        };
      }
    }

    if (!car && typeof StorageService !== 'undefined') {
      const local = StorageService.getCarById(carId);
      if (local) {
        car = {
          id: local.id,
          brand: local.brand,
          model: local.model,
          year: local.year,
          plateNumber: local.license_plate,
          seats: local.seat_count,
          transmission: local.transmission,
          fuelType: local.fuel_type,
          pricePerDay: local.price_per_day,
          address: local.pickup_address,
          province: local.province || 'Hồ Chí Minh',
          description: local.description,
          features: local.features,
          thumbnailUrl: local.image_url,
          status: local.status
        };
      }
    }

    if (!car) {
      body.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
          Không tìm thấy thông tin chi tiết của phương tiện này.
        </div>
      `;
      return;
    }

    if (title) title.innerText = `${car.brand} ${car.model} (${car.year || ''})`;

    if (typeof RenderService !== 'undefined' && RenderService.renderCarDetail) {
      body.innerHTML = RenderService.renderCarDetail(car);
    } else {
      const img = car.thumbnailUrl || car.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80';
      const formatCurrency = (amt) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0);
      body.innerHTML = `
        <div style="padding: 0.5rem;">
          <img src="${img}" alt="${car.brand}" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" />
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.9rem; margin-bottom: 1rem;">
            <div><strong>Hãng & Dòng:</strong> ${car.brand} ${car.model}</div>
            <div><strong>Biển số:</strong> <span style="font-family: monospace; font-weight: 700;">${car.plateNumber || car.license_plate || 'Chưa cập nhật'}</span></div>
            <div><strong>Năm SX:</strong> ${car.year || '2023'}</div>
            <div><strong>Số chỗ:</strong> ${car.seats || car.seat_count || 5} chỗ</div>
            <div><strong>Hộp số:</strong> ${car.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'}</div>
            <div><strong>Nhiên liệu:</strong> ${car.fuelType === 'ELECTRIC' ? 'Điện' : (car.fuelType === 'DIESEL' ? 'Dầu' : 'Xăng')}</div>
            <div><strong>Giá thuê:</strong> <span style="color: #047857; font-weight: 700;">${formatCurrency(car.pricePerDay || car.price_per_day)}</span>/ngày</div>
            <div><strong>Trạng thái:</strong> ${car.status || 'ACTIVE'}</div>
          </div>
          <div style="margin-bottom: 0.75rem;">
            <strong>Địa chỉ nhận xe:</strong> ${car.address || car.pickup_address || 'TP. Hồ Chí Minh'}
          </div>
          <div style="margin-bottom: 0.75rem;">
            <strong>Tiện nghi:</strong> ${car.features || 'Bản đồ, Camera lùi, Thu phí tự động'}
          </div>
          <div>
            <strong>Mô tả:</strong> ${car.description || 'Xe đẹp, bảo dưỡng định kỳ.'}
          </div>
        </div>
      `;
    }
  },

  // CRP-32: Chủ xe bật/tắt kích hoạt trạng thái xe (ACTIVE <-> INACTIVE)
  async toggleCarStatus(carId, currentStatus, carName = 'xe') {
    const isCurrentlyActive = currentStatus === 'ACTIVE';
    const actionText = isCurrentlyActive ? 'TẮT KÍCH HOẠT (ẨN XE)' : 'KÍCH HOẠT (MỞ XE CHO THUÊ)';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

    if (!confirm(`Bạn có chắc muốn ${actionText} cho ${carName}?\n\n- Nếu tắt: Xe sẽ bị ẩn khỏi danh sách tìm kiếm của khách hàng.\n- Nếu bật: Xe sẽ xuất hiện để khách thuê có thể đặt xe.`)) {
      return;
    }

    try {
      if (typeof CarAPI !== 'undefined' && CarAPI.updateCarStatus) {
        await CarAPI.updateCarStatus(carId, newStatus);
      } else if (typeof StorageService !== 'undefined') {
        const c = StorageService.getCarById(carId);
        if (c) {
          c.status = newStatus;
          StorageService.save();
        }
      }
      this.showToast(`Đã chuyển trạng thái ${carName} sang ${newStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ẩn'} thành công!`, 'success');
      await this.renderOwnerPortal();
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái xe:', err);
      this.showToast(err.message || 'Không thể thay đổi trạng thái xe. Vui lòng thử lại!', 'error');
    }
  },

  // CRP-32: Chủ sở hữu xóa xe (Soft Delete)
  async deleteCar(carId, carName = 'xe') {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA ${carName} không?\n\nLưu ý: Thao tác này sẽ gỡ bỏ xe khỏi danh mục xe cho thuê của bạn. Xe đang có chuyến đi hoạt động sẽ không thể xóa.`)) {
      return;
    }

    try {
      if (typeof CarAPI !== 'undefined' && CarAPI.deleteCar) {
        await CarAPI.deleteCar(carId);
      } else if (typeof StorageService !== 'undefined') {
        let cars = StorageService.getCars();
        cars = cars.filter(c => c.id != carId);
        StorageService.setCars(cars);
      }
      this.showToast(`Đã xóa ${carName} thành công!`, 'success');
      await this.renderOwnerPortal();
    } catch (err) {
      console.error('Lỗi khi xóa xe:', err);
      let errMsg = err.message || err.error || 'Xóa xe thất bại. Vui lòng thử lại!';
      if (err.data && err.data.message) errMsg = err.data.message;
      this.showToast(errMsg, 'error');
    }
  },

  completeBooking(bookingId) {
    if (typeof StorageService !== 'undefined') {
      StorageService.updateBookingStatus(bookingId, 'COMPLETED');
    }
    this.showToast(`Chuyến đi #${bookingId} đã kết thúc thành công!`, 'success');
    this.renderOwnerPortal();
    this.switchOwnerTab('REQUESTS');
  },

  async approveRental(rentalId) {
    if (!confirm(`Bạn có chắc muốn duyệt cho khách thuê yêu cầu #${rentalId} không?\n\nLưu ý: Hệ thống sẽ kích hoạt Soft Lock 45 phút để khách tiến hành đặt cọc 30%. Các đơn trùng lịch khác sẽ tạm hoãn.`)) {
      return;
    }
    if (typeof RentalAPI !== 'undefined' && RentalAPI.approveRental) {
      try {
        const res = await RentalAPI.approveRental(rentalId);
        if (res && res.success) {
          this.showToast(`Đã duyệt yêu cầu #${rentalId} thành công! Kích hoạt giữ chỗ 45 phút.`, 'success');
          await this.renderOwnerPortal();
          this.switchOwnerTab('REQUESTS');
          return;
        }
      } catch (err) {
        console.warn('Lỗi approveRental API:', err);
      }
    }
    this.showToast(`Yêu cầu #${rentalId} đã được duyệt! (Chờ thanh toán cọc trong 45 phút)`, 'info');
  },

  async rejectRentalPrompt(rentalId) {
    const reason = prompt(`Nhập lý do từ chối yêu cầu thuê #${rentalId}:`, 'Xe bận lịch đột xuất');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Vui lòng cung cấp lý do từ chối!');
      return;
    }
    if (typeof RentalAPI !== 'undefined' && RentalAPI.rejectRental) {
      try {
        const res = await RentalAPI.rejectRental(rentalId, reason.trim());
        if (res && res.success) {
          this.showToast(`Đã từ chối yêu cầu #${rentalId}.`, 'warning');
          await this.renderOwnerPortal();
          this.switchOwnerTab('REQUESTS');
          return;
        }
      } catch (err) {
        console.warn('Lỗi rejectRental API:', err);
      }
    }
    this.showToast(`Đã ghi nhận từ chối yêu cầu #${rentalId}.`, 'info');
  },

  async startRental(rentalId) {
    if (!confirm(`Xác nhận bắt đầu chuyến đi cho đơn #${rentalId} (Bàn giao xe cho khách thuê)?`)) {
      return;
    }
    if (typeof RentalAPI !== 'undefined' && RentalAPI.startRental) {
      try {
        const res = await RentalAPI.startRental(rentalId);
        if (res && res.success) {
          this.showToast(`Chuyến đi #${rentalId} đã bắt đầu! Trạng thái: IN_PROGRESS.`, 'success');
          await this.renderOwnerPortal();
          this.switchOwnerTab('REQUESTS');
          return;
        }
      } catch (err) {
        console.warn('Lỗi startRental API:', err);
      }
    }
    this.showToast(`Bắt đầu chuyến đi #${rentalId}.`, 'info');
  },

  async completeRental(rentalId) {
    if (!confirm(`Xác nhận hoàn tất chuyến đi cho đơn #${rentalId} (Khách đã bàn giao lại xe an toàn)?`)) {
      return;
    }
    if (typeof RentalAPI !== 'undefined' && RentalAPI.completeRental) {
      try {
        const res = await RentalAPI.completeRental(rentalId);
        if (res && res.success) {
          this.showToast(`Chuyến đi #${rentalId} đã hoàn tất thành công! Trạng thái: COMPLETED.`, 'success');
          await this.renderOwnerPortal();
          this.switchOwnerTab('REQUESTS');
          return;
        }
      } catch (err) {
        console.warn('Lỗi completeRental API:', err);
      }
    }
    this.showToast(`Hoàn tất chuyến đi #${rentalId}.`, 'info');
  }
};
