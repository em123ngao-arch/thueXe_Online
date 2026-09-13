/**
 * DRIVESHARE — Staff / Admin Module (Clean & Professional, No Emojis)
 * Quản trị & Vận hành: Duyệt xe mới đăng, Duyệt Giấy phép lái xe (GPLX), Giám sát đơn toàn sàn
 */

const AdminService = {
  renderAdminPortal(containerId = 'adminPortalContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const allCars = StorageService.getCars();
    const pendingCars = allCars.filter(c => c.status === 'PENDING_APPROVAL');
    const allRenters = StorageService.getRenters();
    const pendingLicenses = allRenters.filter(r => r.license_status === 'PENDING');
    const allBookings = StorageService.getBookings();

    container.innerHTML = `
      <div class="portal-header">
        <div class="container">
          <div class="portal-title-row">
            <div class="portal-title-group">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#0f766e">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Kênh Quản Trị & Thẩm Định (Staff / Admin)
              </h2>
              <div class="portal-subtitle">Nhân viên trực hệ thống: <strong>admin_tin (ROLE_STAFF)</strong> · driveshare_admin_db</div>
            </div>
            <span class="badge badge-primary">Quyền hạn: Thẩm định & Giám sát</span>
          </div>

          <!-- Tabs -->
          <div class="portal-tabs">
            <button class="portal-tab-btn active" id="adminTabCars" onclick="AdminService.switchTab('CARS')">
              Duyệt xe mới đăng (${pendingCars.length})
            </button>
            <button class="portal-tab-btn" id="adminTabLicenses" onclick="AdminService.switchTab('LICENSES')">
              Xác minh bằng lái GPLX (${pendingLicenses.length})
            </button>
            <button class="portal-tab-btn" id="adminTabBookings" onclick="AdminService.switchTab('BOOKINGS')">
              Toàn bộ đơn đặt xe (${allBookings.length})
            </button>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Stats Row -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${pendingCars.length}</div>
              <div class="stat-label">Xe chờ kiểm duyệt</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${pendingLicenses.length}</div>
              <div class="stat-label">GPLX chờ xác thực</div>
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
              <div class="stat-value">${allCars.filter(c => c.status === 'ACTIVE').length}</div>
              <div class="stat-label">Tổng xe đang hoạt động</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value">${allBookings.length}</div>
              <div class="stat-label">Tổng lượt giao dịch</div>
            </div>
          </div>
        </div>

        <!-- Tab Content 1: Duyệt xe mới đăng -->
        <div id="adminTabCarsContent">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Danh sách xe chờ phê duyệt xuất bản</h3>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Thông tin xe</th>
                    <th>Biển số</th>
                    <th>Chủ xe</th>
                    <th>Giá đề xuất</th>
                    <th>Địa điểm đón</th>
                    <th>Thẩm định & Quyết định</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingCars.length === 0 ? `
                    <tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--slate-500);">
                      Hệ thống đã xử lý hết mọi xe chờ duyệt. Hiện không có yêu cầu nào tồn đọng.
                    </td></tr>
                  ` : pendingCars.map(c => `
                    <tr>
                      <td>
                        <div class="table-car-cell">
                          <img class="table-car-thumb" src="${c.image_url}" alt="${c.brand}" />
                          <div>
                            <strong>${c.brand} ${c.model}</strong>
                            <div style="font-size: 0.76rem; color: var(--slate-500);">${c.year} · ${c.seat_count} chỗ · ${c.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'}</div>
                          </div>
                        </div>
                      </td>
                      <td><strong style="font-family: monospace;">${c.license_plate}</strong></td>
                      <td>${c.owner_name}</td>
                      <td style="color: var(--primary); font-weight: 700;">${StorageService.formatCurrency(c.price_per_day)}</td>
                      <td style="font-size: 0.82rem; max-width: 180px;">${c.pickup_address}</td>
                      <td>
                        <div class="table-actions">
                          <button class="btn btn-outline btn-sm" onclick="App.openCarDetailModal(${c.id})">Chi tiết</button>
                          <button class="btn btn-primary btn-sm" onclick="AdminService.approveCar(${c.id})">Duyệt xe</button>
                          <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="AdminService.rejectCar(${c.id})">Từ chối</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Content 2: Xác minh bằng lái GPLX -->
        <div id="adminTabLicensesContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Hồ sơ Giấy phép lái xe (GPLX) gửi xác thực</h3>
            </div>
            <div style="padding: 1.15rem;">
              ${allRenters.map(r => `
                <div class="license-card">
                  <img class="license-thumb" src="${r.license_image}" alt="GPLX ${r.name}" />
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.3rem; flex-wrap: wrap;">
                      <h4 style="font-size: 1rem; font-weight: 700;">${r.name}</h4>
                      <span class="badge ${r.license_status === 'APPROVED' ? 'badge-success' : (r.license_status === 'PENDING' ? 'badge-warning' : 'badge-danger')}">
                        ${r.license_status === 'APPROVED' ? 'Đã duyệt hợp lệ' : (r.license_status === 'PENDING' ? 'Chờ xác thực' : 'Bị từ chối')}
                      </span>
                    </div>
                    <div style="font-size: 0.82rem; color: var(--slate-600); margin-bottom: 0.2rem;">
                      Số GPLX: <strong style="font-family: monospace;">${r.license_number || 'Chưa cung cấp'}</strong>
                    </div>
                    <div style="font-size: 0.82rem; color: var(--slate-500);">
                      SĐT: ${r.phone} · Email: ${r.email}
                    </div>
                  </div>
                  <div>
                    ${r.license_status === 'PENDING' ? `
                      <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
                        <button class="btn btn-primary btn-sm" onclick="AdminService.approveLicense(${r.id})">Phê duyệt GPLX</button>
                        <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="AdminService.rejectLicense(${r.id})">Yêu cầu chụp lại</button>
                      </div>
                    ` : `
                      <span style="color: var(--slate-400); font-size: 0.82rem;">Đã hoàn thành xác minh</span>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Tab Content 3: Toàn bộ đơn đặt xe -->
        <div id="adminTabBookingsContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Toàn bộ giao dịch trên hệ thống DriveShare</h3>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Phương tiện</th>
                    <th>Khách thuê</th>
                    <th>Lịch trình thuê</th>
                    <th>Tổng tiền</th>
                    <th>Tiền cọc (30%)</th>
                    <th>Trạng thái đơn</th>
                  </tr>
                </thead>
                <tbody>
                  ${allBookings.map(b => `
                    <tr>
                      <td><span class="booking-code">#${b.id}</span></td>
                      <td><strong>${b.car_name}</strong><br/><span style="font-size: 0.76rem; color: var(--slate-500);">${b.car_plate}</span></td>
                      <td>${b.renter_name}<br/><span style="font-size: 0.76rem; color: var(--slate-500);">${b.renter_phone}</span></td>
                      <td style="font-size: 0.8rem;">${b.start_time} <br/>đến ${b.end_time} (${b.total_days} ngày)</td>
                      <td style="font-weight: 700;">${StorageService.formatCurrency(b.total_amount)}</td>
                      <td style="color: var(--primary); font-weight: 700;">${StorageService.formatCurrency(b.deposit_amount)}</td>
                      <td>
                        ${b.status === 'DEPOSIT_PAID' ? '<span class="badge badge-success">Đã cọc 30%</span>' : (b.status === 'COMPLETED' ? '<span class="badge badge-neutral">Đã hoàn thành</span>' : `<span class="badge badge-warning">${b.status}</span>`)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  switchTab(tabName) {
    document.getElementById('adminTabCars')?.classList.toggle('active', tabName === 'CARS');
    document.getElementById('adminTabLicenses')?.classList.toggle('active', tabName === 'LICENSES');
    document.getElementById('adminTabBookings')?.classList.toggle('active', tabName === 'BOOKINGS');

    const tabCars = document.getElementById('adminTabCarsContent');
    const tabLicenses = document.getElementById('adminTabLicensesContent');
    const tabBookings = document.getElementById('adminTabBookingsContent');

    if (tabCars) tabCars.style.display = tabName === 'CARS' ? 'block' : 'none';
    if (tabLicenses) tabLicenses.style.display = tabName === 'LICENSES' ? 'block' : 'none';
    if (tabBookings) tabBookings.style.display = tabName === 'BOOKINGS' ? 'block' : 'none';
  },

  approveCar(carId) {
    StorageService.updateCarStatus(carId, 'ACTIVE');
    App.showToast(`Đã duyệt xe #${carId}! Xe đã xuất hiện trên trang tìm kiếm.`, 'success');
    this.renderAdminPortal();
  },

  rejectCar(carId) {
    StorageService.updateCarStatus(carId, 'REJECTED', 'Ảnh cavet hoặc hình ảnh xe chưa đạt yêu cầu.');
    App.showToast(`Đã từ chối xe #${carId}.`, 'error');
    this.renderAdminPortal();
  },

  approveLicense(renterId) {
    StorageService.updateRenterLicense(renterId, 'APPROVED');
    App.showToast(`Đã xác minh GPLX hợp lệ cho khách thuê #${renterId}!`, 'success');
    this.renderAdminPortal();
    this.switchTab('LICENSES');
  },

  rejectLicense(renterId) {
    StorageService.updateRenterLicense(renterId, 'REJECTED');
    App.showToast(`Đã yêu cầu khách thuê #${renterId} chụp lại GPLX.`, 'error');
    this.renderAdminPortal();
    this.switchTab('LICENSES');
  }
};
