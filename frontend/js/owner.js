/**
 * DRIVESHARE — Owner Module (Clean & Professional, No Emojis)
 * Phân hệ Chủ xe: Đăng ký xe mới, Quản lý đội xe, Duyệt đơn thuê xe từ khách
 * Tích hợp chuẩn REST API Backend Spring Boot (/api/v1/cars) và StorageService Fallback
 */

const OwnerService = {
  // Helper hiển thị thông báo an toàn
  showToast(message, type = 'info', duration = 3000) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type, duration);
    } else if (typeof showToast === 'function') {
      showToast(message, type, duration);
    } else if (typeof toast !== 'undefined' && typeof toast[type] === 'function') {
      toast[type](message);
    } else if (typeof toast !== 'undefined' && typeof toast.show === 'function') {
      toast.show(message, type);
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

    const formatDateVN = (dStr) => {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dStr;
    };

    // Quản lý tab đang hiển thị
    const activeTab = this.currentActiveTab || 'CARS';

    // Bộ lọc thông minh tab yêu cầu thuê (ALL, PENDING, ACTIVE, HISTORY) và theo xe
    const currentRentalTab = this.rentalFilterTab || 'ALL';
    const currentRentalCarId = this.rentalFilterCarId || 'ALL';

    const isPending = (s) => s === 'PENDING' || s === 'PENDING_APPROVAL';
    const isActiveRental = (s) => ['WAITING_PAYMENT', 'APPROVED', 'ON_HOLD', 'CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS'].includes(s);
    const isHistory = (s) => ['COMPLETED', 'REJECTED', 'WITHDRAWN_BY_GUEST', 'EXPIRED', 'AUTO_EXPIRED_NO_HOST_ACTION'].includes(s);

    const pendingCount = ownerBookings.filter(b => isPending(b.status)).length;
    const activeCount = ownerBookings.filter(b => isActiveRental(b.status)).length;
    const historyCount = ownerBookings.filter(b => isHistory(b.status)).length;

    // Lọc danh sách theo Tab và theo Xe
    const filteredBookings = ownerBookings.filter(b => {
      if (currentRentalTab === 'PENDING' && !isPending(b.status)) return false;
      if (currentRentalTab === 'ACTIVE' && !isActiveRental(b.status)) return false;
      if (currentRentalTab === 'HISTORY' && !isHistory(b.status)) return false;

      if (currentRentalCarId !== 'ALL') {
        const bCarId = b.car_id || b.carId;
        if (bCarId != currentRentalCarId) return false;
      }
      return true;
    });

    // Nhóm các đơn thuê theo từng Phương Tiện (Asset-Centric Grouping)
    const carGroupsMap = new Map();
    filteredBookings.forEach(b => {
      const cId = b.car_id || b.carId || ('plate_' + (b.car_plate_number || b.license_plate || 'unknown'));
      if (!carGroupsMap.has(cId)) {
        const matchedCar = ownerCars.find(c => c.id == cId);
        carGroupsMap.set(cId, {
          car: matchedCar || {
            id: cId,
            brand: b.car_brand || b.carBrand || '',
            model: b.car_model || b.carModel || b.car_name || b.carName || 'Xe của bạn',
            license_plate: b.car_plate_number || b.carPlateNumber || b.license_plate || '',
            image_url: b.car_image_url || b.carImageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80',
            price_per_day: b.price_per_day || b.pricePerDay || 0
          },
          bookings: []
        });
      }
      carGroupsMap.get(cId).bookings.push(b);
    });

    // Sắp xếp đơn trong mỗi xe: Ưu tiên đơn chờ duyệt (PENDING) lên đầu
    carGroupsMap.forEach(group => {
      group.bookings.sort((a, b) => {
        const aPending = isPending(a.status) ? 1 : 0;
        const bPending = isPending(b.status) ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        return (b.rental_id || b.rentalId || b.id) - (a.rental_id || a.rentalId || a.id);
      });
    });

    const carGroupsList = Array.from(carGroupsMap.values());

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
            <button class="portal-tab-btn ${activeTab === 'CARS' ? 'active' : ''}" id="ownerTabCars" onclick="OwnerService.switchOwnerTab('CARS')">
              Danh sách xe (${ownerCars.length})
            </button>
            <button class="portal-tab-btn ${activeTab === 'REQUESTS' ? 'active' : ''}" id="ownerTabRequests" onclick="OwnerService.switchOwnerTab('REQUESTS')">
              Yêu cầu thuê (${ownerBookings.length})
            </button>
            <button class="portal-tab-btn ${activeTab === 'ADD' ? 'active' : ''}" id="ownerTabAdd" onclick="OwnerService.switchOwnerTab('ADD')">
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
        <div id="ownerTabCarsContent" style="display: ${activeTab === 'CARS' ? 'block' : 'none'};">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Đội xe cho thuê của bạn</h3>
              <span class="badge badge-info">${ownerCars.length} xe</span>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th style="min-width: 220px;">Phương tiện</th>
                    <th style="width: 140px; text-align: center;">Biển số</th>
                    <th style="width: 130px;">Giá thuê/ngày</th>
                    <th>Địa điểm giao xe</th>
                    <th style="width: 175px; text-align: center;">Trạng thái</th>
                    <th style="width: 180px; text-align: center;">Thao tác</th>
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
                            <strong style="cursor: pointer; color: var(--slate-900);" title="Bấm để xem chi tiết xe" onclick="OwnerService.viewCarDetail(${c.id})">${c.brand} ${c.model}</strong>
                            <div style="font-size: 0.76rem; color: var(--slate-500);">${c.year} · ${c.seat_count} chỗ · ${c.transmission === 'AUTOMATIC' ? 'Số tự động' : 'Số sàn'}</div>
                          </div>
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <span class="vn-license-plate" title="Biển số đăng ký">${c.license_plate}</span>
                      </td>
                      <td style="color: var(--primary); font-weight: 700; white-space: nowrap;">${formatMoney(c.price_per_day)}</td>
                      <td style="font-size: 0.84rem;">${c.pickup_address}</td>
                      <td style="text-align: center; white-space: nowrap;">
                        ${c.status === 'ACTIVE' || c.status === 'INACTIVE' ? `
                          <div class="bmw-gear-selector ${c.status === 'ACTIVE' ? 'gear-drive' : 'gear-park'}"
                               onclick="OwnerService.toggleCarStatus(${c.id}, '${c.status}', '${c.brand} ${c.model}')"
                               title="${c.status === 'ACTIVE' ? 'Cần số điện tử: Đang vào số [D] (Drive - Sẵn sàng nhận khách). Bấm để về số [P] (Park - Tạm ẩn)' : 'Cần số điện tử: Đang ở số [P] (Park - Tạm ẩn). Bấm để gạt vào số [D] (Drive - Nhận khách)'}">
                            
                            <!-- Cần số điện tử dáng BMW Joystick cao cấp -->
                            <div class="bmw-shifter-box">
                              <svg class="bmw-shifter-graphic" viewBox="0 0 44 48" width="32" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <linearGradient id="metalGrad_${c.id}" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="#ffffff"/>
                                    <stop offset="35%" stop-color="#cbd5e1"/>
                                    <stop offset="70%" stop-color="#94a3b8"/>
                                    <stop offset="100%" stop-color="#475569"/>
                                  </linearGradient>
                                  <linearGradient id="pianoBlack_${c.id}" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#1e293b"/>
                                    <stop offset="100%" stop-color="#020617"/>
                                  </linearGradient>
                                  <linearGradient id="glassReflection_${c.id}" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
                                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
                                  </linearGradient>
                                </defs>
                                <ellipse cx="22" cy="42" rx="16" ry="5" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
                                <ellipse cx="22" cy="42" rx="12" ry="3.2" fill="#020617"/>
                                <g class="shifter-lever-group">
                                  <path d="M19 32 L20 41 L24 41 L25 32 Z" fill="url(#metalGrad_${c.id})" stroke="#64748b" stroke-width="0.6"/>
                                  <path d="M14 11 C14 6 18 4 24 4 C29 4 32 7 32 12 C32 18 29 28 26 33 C25 34 21 34 19 32 C16 27 14 18 14 11 Z" fill="url(#metalGrad_${c.id})" stroke="#334155" stroke-width="0.8"/>
                                  <path d="M17 11 C17 8 20 6.5 24 6.5 C27.5 6.5 29.5 8.5 29.5 12 C29.5 16 27.5 23 25 28 C24 30 22 30 20.5 28 C18.5 23 17 16 17 11 Z" fill="url(#pianoBlack_${c.id})" stroke="#0f172a" stroke-width="0.5"/>
                                  <path d="M18 10 C18 8 20 7 23 7 C20 12 19 19 18 24 C17.8 19 17.8 13 18 10 Z" fill="url(#glassReflection_${c.id})"/>
                                  <rect class="bmw-p-button" x="19" y="3.2" width="9" height="4.5" rx="1.8" stroke="#475569" stroke-width="0.6"/>
                                  <text class="bmw-p-text" x="23.5" y="6.8" font-size="3.2" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" text-anchor="middle">P</text>
                                  <text x="23.5" y="12" font-size="3.2" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" text-anchor="middle" fill="#64748b">R</text>
                                  <text x="23.5" y="17" font-size="3.2" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" text-anchor="middle" fill="#64748b">N</text>
                                  <text class="bmw-d-letter" x="24.5" y="23" font-size="3.8" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" text-anchor="middle">D</text>
                                  <circle class="bmw-d-led" cx="19.5" cy="21.8" r="1.3"/>
                                </g>
                              </svg>
                            </div>

                            <!-- Màn hình điện tử Taplo hiển thị số (Cluster LCD) -->
                            <div class="bmw-cluster-lcd">
                              <div class="lcd-gear-badge ${c.status === 'ACTIVE' ? 'drive' : 'park'}">
                                ${c.status === 'ACTIVE' ? 'D' : 'P'}
                              </div>
                              <div class="lcd-status-info">
                                <span class="lcd-title">${c.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'TẠM ẨN'}</span>
                                <span class="lcd-subtitle">${c.status === 'ACTIVE' ? 'Sẵn sàng chạy' : 'Đang đỗ xe'}</span>
                              </div>
                            </div>

                          </div>
                        ` : (c.status === 'REJECTED' 
                              ? '<span class="badge badge-danger">Từ chối duyệt</span>' 
                              : '<span class="badge badge-warning">Chờ Admin duyệt</span>')}
                      </td>
                      <td style="text-align: center;">
                        <div class="table-actions" style="justify-content: center; gap: 8px;">
                          <!-- 1. Nút Lịch xe: Thao tác thường nhật chính -->
                          <button class="btn btn-outline btn-sm" style="color: #7c3aed; border-color: #c4b5fd; background: #faf5ff; font-weight: 600; padding: 5px 12px; border-radius: 6px;" title="Quản lý lịch xe & chặn ngày bận" onclick="OwnerService.openCalendarModal(${c.id})">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; vertical-align: -1px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Lịch xe
                          </button>

                          <!-- 2. Nút Chỉnh sửa: Trung tâm quản lý thông số, bộ ảnh và xe -->
                          <button class="btn btn-outline btn-sm" style="color: #0284c7; border-color: #bae6fd; background: #f0f9ff; font-weight: 600; padding: 5px 12px; border-radius: 6px;" title="Chỉnh sửa thông số, tiện ích, ảnh xe" onclick="OwnerService.openEditCarModal(${c.id})">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right: 4px; vertical-align: -1px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Chỉnh sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Content: Yêu cầu thuê (Gom nhóm theo từng xe & Cảnh báo trùng lịch) -->
        <div id="ownerTabRequestsContent" style="display: ${activeTab === 'REQUESTS' ? 'block' : 'none'};">
          <!-- 1. Thanh Lọc Trạng Thái & Chọn Xe Thông Minh -->
          <div class="rental-filter-header">
            <div class="rental-status-tabs">
              <button type="button" class="rental-tab-pill ${currentRentalTab === 'ALL' ? 'active' : ''}" onclick="OwnerService.setRentalFilterTab('ALL')">
                Tất cả (${ownerBookings.length})
              </button>
              <button type="button" class="rental-tab-pill ${currentRentalTab === 'PENDING' ? 'active' : ''}" onclick="OwnerService.setRentalFilterTab('PENDING')">
                <span class="tab-indicator red"></span> Cần duyệt (${pendingCount})
              </button>
              <button type="button" class="rental-tab-pill ${currentRentalTab === 'ACTIVE' ? 'active' : ''}" onclick="OwnerService.setRentalFilterTab('ACTIVE')">
                <span class="tab-indicator green"></span> Đang hoạt động (${activeCount})
              </button>
              <button type="button" class="rental-tab-pill ${currentRentalTab === 'HISTORY' ? 'active' : ''}" onclick="OwnerService.setRentalFilterTab('HISTORY')">
                <span class="tab-indicator gray"></span> Lịch sử & Đã hủy (${historyCount})
              </button>
            </div>

            <div class="rental-car-filter" style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Lọc theo xe:</span>
              <select class="form-control" style="font-size: 0.82rem; padding: 5px 10px; border-radius: 8px; width: auto; min-width: 190px;" onchange="OwnerService.setRentalFilterCar(this.value)">
                <option value="ALL">Tất cả phương tiện (${ownerCars.length} xe)</option>
                ${ownerCars.map(c => `
                  <option value="${c.id}" ${currentRentalCarId == c.id ? 'selected' : ''}>
                    ${c.brand} ${c.model} (${c.license_plate})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- 2. Danh Sách Thẻ Xe (Mỗi xe là 1 Card chứa các đơn của riêng xe đó) -->
          ${carGroupsList.length === 0 ? `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center; padding: 3rem 1.5rem; color: var(--slate-500);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom: 8px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <div style="font-weight: 700; color: #334155; font-size: 1rem;">Không có yêu cầu thuê nào</div>
              <div style="font-size: 0.84rem; color: #64748b; margin-top: 4px;">Không tìm thấy đơn đặt thuê nào phù hợp với bộ lọc đã chọn.</div>
            </div>
          ` : carGroupsList.map(({ car, bookings }) => {
            const carPending = bookings.filter(b => isPending(b.status));
            const carActive = bookings.filter(b => isActiveRental(b.status));
            const conflictsMap = this.detectDateConflicts(bookings);

            return `
            <div class="car-rental-group-card">
              <!-- Header Thẻ Xe -->
              <div class="car-rental-card-header">
                <div class="car-header-left">
                  <img src="${car.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80'}" class="car-header-thumb" alt="${car.brand}" style="cursor: zoom-in;" onclick="OwnerService.zoomImage(this.src, '${car.brand} ${car.model}')" title="Phóng to ảnh xe" />
                  <div>
                    <div class="car-header-title">
                      <strong style="font-size: 1.02rem;">${car.brand} ${car.model}</strong>
                      ${car.license_plate ? `<span class="vn-license-plate">${car.license_plate}</span>` : ''}
                    </div>
                    <div class="car-header-subtitle">
                      Giá niêm yết: <strong style="color: var(--primary);">${formatMoney(car.price_per_day)}/ngày</strong> · <strong>${bookings.length}</strong> đơn trong danh mục
                    </div>
                  </div>
                </div>

                <div class="car-header-right">
                  ${carPending.length > 0 ? `
                    <span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight: 700; font-size: 0.78rem;">
                      ⚡ ${carPending.length} đơn cần duyệt
                    </span>
                  ` : ''}
                  ${carActive.length > 0 ? `
                    <span class="badge badge-success" style="font-size: 0.78rem;">
                      🟢 ${carActive.length} đơn đang chạy
                    </span>
                  ` : ''}
                  <button type="button" class="btn btn-outline btn-xs" style="color: #7c3aed; border-color: #c4b5fd; background: #faf5ff; font-weight: 600; padding: 4px 10px;" onclick="OwnerService.openCalendarModal(${car.id})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 3px; vertical-align: -1px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Xem lịch xe
                  </button>
                </div>
              </div>

              <!-- Bảng Đơn Thuê Của Xe Này -->
              <div class="table-responsive">
                <table class="custom-table" style="margin-bottom: 0;">
                  <thead>
                    <tr>
                      <th style="width: 80px;">Mã đơn</th>
                      <th style="min-width: 190px;">Khách thuê</th>
                      <th style="min-width: 240px;">Thời gian thuê</th>
                      <th style="width: 140px;">Tiền cọc (30%)</th>
                      <th style="width: 150px; text-align: center;">Trạng thái</th>
                      <th style="width: 150px; text-align: center;">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bookings.map(b => {
                      const id = b.rental_id || b.rentalId || b.id;
                      const renterName = b.renter_full_name || b.renterFullName || b.renter_name || b.renterName || 'Khách thuê';
                      const renterPhone = b.renter_phone || b.renterPhone || '---';
                      const startDate = b.start_date || b.startDate || '';
                      const endDate = b.end_date || b.endDate || '';
                      const totalDays = b.total_days || b.totalDays || 1;
                      const deposit = b.deposit_amount || b.depositAmount || b.rental_amount || 0;
                      const note = b.note || b.trip_purpose || '';
                      const initial = renterName.trim().charAt(0).toUpperCase() || 'K';
                      
                      const conflictList = conflictsMap.get(id) || [];
                      const hasConflict = conflictList.length > 0;

                      let badge = `<span class="badge badge-info">${b.status}</span>`;
                      let action = '<span style="color: var(--slate-400); font-size: 0.8rem;">—</span>';

                      if (b.status === 'PENDING' || b.status === 'PENDING_APPROVAL') {
                        badge = '<span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:700;">Chờ duyệt hồ sơ</span>';
                        action = `
                          <div style="display:flex; gap:6px; justify-content:center;">
                            <button class="btn btn-primary btn-sm" style="background:#0f766e; border-color:#0f766e; font-weight:700; padding:4px 10px; font-size: 0.78rem;" onclick="OwnerService.approveRental(${id})">Duyệt</button>
                            <button class="btn btn-outline btn-sm" style="color:#ef4444; border-color:#fecaca; background:#fff5f5; font-weight:600; padding:4px 10px; font-size: 0.78rem;" onclick="OwnerService.rejectRentalPrompt(${id})">Từ chối</button>
                          </div>
                        `;
                      } else if (b.status === 'WAITING_PAYMENT' || b.status === 'APPROVED') {
                        badge = '<span class="badge badge-primary" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-weight:700;">Chờ khách cọc (45p)</span>';
                      } else if (b.status === 'ON_HOLD') {
                        badge = '<span class="badge" style="background:#fef9c3; color:#a16207; border:1px solid #fef08a; font-weight:700;">Tạm hoãn (Soft Lock)</span>';
                      } else if (b.status === 'CONFIRMED' || b.status === 'DEPOSIT_PAID') {
                        badge = '<span class="badge badge-success" style="font-weight:700;">Đã chốt cọc 30%</span>';
                        action = `
                          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                            <button class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 0.78rem; background: #059669; border-color: #059669; font-weight:700; display: inline-flex; align-items: center; gap: 4px;" onclick="OwnerService.openCheckInModal(${id})">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              Check-in Bàn giao
                            </button>
                          </div>
                        `;
                      } else if (b.status === 'IN_PROGRESS') {
                        badge = '<span class="badge badge-info" style="font-weight:700;">Đang trong chuyến đi</span>';
                        action = `
                          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                            <button class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 0.78rem; background: #2563eb; border-color: #2563eb; font-weight:700; display: inline-flex; align-items: center; gap: 4px;" onclick="OwnerService.openCheckOutModal(${id})">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                              Check-out Nghiệm thu
                            </button>
                            <button class="btn btn-ghost btn-xs" style="color: #0f766e; font-size: 0.72rem; text-decoration: underline;" onclick="OwnerService.viewInspections(${id})">
                              Xem biên bản giao
                            </button>
                          </div>
                        `;
                      } else if (b.status === 'COMPLETED') {
                        badge = '<span class="badge badge-neutral">Đã hoàn thành</span>';
                        action = `
                          <button class="btn btn-outline btn-xs" style="color: #0f766e; border-color: #99f6e4; font-size: 0.73rem; font-weight: 600;" onclick="OwnerService.viewInspections(${id})">
                            Xem biên bản xe
                          </button>
                        `;
                      } else if (b.status === 'REJECTED') {
                        badge = '<span class="badge badge-danger">Đã từ chối</span>';
                      } else if (b.status === 'WITHDRAWN_BY_GUEST') {
                        badge = '<span class="badge" style="background:#f1f5f9; color:#64748b;">Khách đã rút</span>';
                      } else if (b.status === 'EXPIRED' || b.status === 'AUTO_EXPIRED_NO_HOST_ACTION') {
                        badge = '<span class="badge badge-secondary" style="background:#f1f5f9; color:#94a3b8;">Hết hạn</span>';
                      }

                      return `
                      <tr ${hasConflict ? 'style="background: #fffdf5;"' : ''}>
                        <td><span class="booking-code" style="font-weight: 800;">#${id}</span></td>
                        <td>
                          <div class="renter-cell">
                            <div class="renter-avatar-circle">${initial}</div>
                            <div>
                              <strong style="color: #0f172a; font-size: 0.88rem;">${renterName}</strong>
                              <div style="font-size: 0.76rem; color: var(--slate-500);">${renterPhone}</div>
                              ${note ? `<div style="font-size: 0.72rem; color: #0284c7; margin-top: 1px;" title="Mục đích">Lộ trình: ${note}</div>` : ''}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="rental-date-badge">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span>${formatDateVN(startDate)} &rarr; ${formatDateVN(endDate)}</span>
                            <span class="rental-date-days">(${totalDays} ngày)</span>
                          </div>
                          ${hasConflict ? `
                            <div class="conflict-alert-tag" title="Khoảng thời gian thuê của đơn này bị trùng với đơn khác cùng xe">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                              Trùng lịch với đơn #${conflictList.join(', #')} · Chỉ duyệt 1 đơn
                            </div>
                          ` : ''}
                        </td>
                        <td style="color: #047857; font-weight: 800; font-size: 0.9rem; white-space: nowrap;">
                          ${formatMoney(deposit)}
                        </td>
                        <td style="text-align: center; white-space: nowrap;">${badge}</td>
                        <td style="text-align: center; white-space: nowrap;">${action}</td>
                      </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            `;
          }).join('')}
        </div>

        <!-- Tab Content: Đăng xe mới (Dàn hàng ngang chia row tối ưu diện tích) -->
        <div id="ownerTabAddContent" style="display: ${activeTab === 'ADD' ? 'block' : 'none'};">
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

  // Phát hiện các đơn thuê trùng lịch trên cùng 1 xe
  detectDateConflicts(bookings) {
    const conflictsMap = new Map();
    if (!Array.isArray(bookings) || bookings.length < 2) return conflictsMap;

    const activeStatuses = [
      'PENDING', 'PENDING_APPROVAL', 'WAITING_PAYMENT', 
      'APPROVED', 'ON_HOLD', 'CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS'
    ];

    const validBookings = bookings.filter(b => activeStatuses.includes(b.status));

    for (let i = 0; i < validBookings.length; i++) {
      const b1 = validBookings[i];
      const id1 = b1.rental_id || b1.rentalId || b1.id;
      const start1 = b1.start_date || b1.startDate;
      const end1 = b1.end_date || b1.endDate;

      if (!start1 || !end1) continue;

      for (let j = i + 1; j < validBookings.length; j++) {
        const b2 = validBookings[j];
        const id2 = b2.rental_id || b2.rentalId || b2.id;
        const start2 = b2.start_date || b2.startDate;
        const end2 = b2.end_date || b2.endDate;

        if (!start2 || !end2) continue;

        // Trùng lịch: start1 <= end2 && end1 >= start2
        if (start1 <= end2 && end1 >= start2) {
          if (!conflictsMap.has(id1)) conflictsMap.set(id1, []);
          if (!conflictsMap.has(id2)) conflictsMap.set(id2, []);
          if (!conflictsMap.get(id1).includes(id2)) conflictsMap.get(id1).push(id2);
          if (!conflictsMap.get(id2).includes(id1)) conflictsMap.get(id2).push(id1);
        }
      }
    }

    return conflictsMap;
  },

  // Bộ lọc Tab Yêu cầu thuê: ALL, PENDING, ACTIVE, HISTORY
  setRentalFilterTab(tab) {
    this.rentalFilterTab = tab;
    this.currentActiveTab = 'REQUESTS';
    this.renderOwnerPortal();
  },

  // Bộ lọc Xe trong Yêu cầu thuê: ALL hoặc carId
  setRentalFilterCar(carId) {
    this.rentalFilterCarId = carId;
    this.currentActiveTab = 'REQUESTS';
    this.renderOwnerPortal();
  },

  switchOwnerTab(tabName) {
    this.currentActiveTab = tabName;
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

              <!-- Thẻ liên kết Quản lý Bộ sưu tập ảnh xe -->
              <div style="margin-top: 10px; padding: 10px 12px; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; font-size: 0.82rem; color: #0f766e; display: flex; align-items: center; gap: 5px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    Bộ sưu tập ảnh xe
                  </div>
                  <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Tải lên tối đa 10 ảnh các góc</div>
                </div>
                <button type="button" class="btn btn-outline btn-xs" style="color: #0f766e; border-color: #0f766e; background: #ffffff; font-weight: 600; padding: 4px 10px;" onclick="OwnerService.openPhotosModal(${carId}, '${currentBrand} ${currentModel}')">
                  Quản lý ảnh
                </button>
              </div>
            </div>

            <!-- Action Buttons: Danger Zone (Xóa xe) & Lưu thay đổi -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; gap: 8px;">
              <button type="button" class="btn btn-ghost btn-xs" style="color: #ef4444; border: 1px solid #fecaca; background: #fff5f5; font-size: 0.76rem; padding: 5px 8px; border-radius: 6px;" title="Xóa phương tiện này" onclick="document.getElementById('editCarModalOverlay').classList.remove('open'); OwnerService.deleteCar(${carId}, '${currentBrand} ${currentModel}')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px; vertical-align: -1px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Xóa xe
              </button>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('editCarModalOverlay').classList.remove('open')">Đóng</button>
                <button type="submit" class="btn btn-primary btn-sm" style="font-weight: 700;">Lưu thay đổi</button>
              </div>
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

    if (!carTitle && Array.isArray(this.ownerCars)) {
      const c = this.ownerCars.find(item => item.id == carId);
      if (c) carTitle = `${c.brand} ${c.model}`;
    }

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

    if (!carTitle && Array.isArray(this.ownerCars)) {
      const c = this.ownerCars.find(item => item.id == carId);
      if (c) carTitle = `${c.brand} ${c.model}`;
    }

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

    // 1. Tìm thông tin trong danh sách xe của Owner để lấy biển số thật không bị mask
    const ownerCar = Array.isArray(this.ownerCars) ? this.ownerCars.find(item => item.id == carId) : null;
    const localCar = (!ownerCar && typeof StorageService !== 'undefined') ? StorageService.getCarById(carId) : null;
    const baseCar = ownerCar || localCar;

    let publicDetail = null;
    if (typeof CarAPI !== 'undefined' && CarAPI.getPublicCarDetail) {
      try {
        const res = await CarAPI.getPublicCarDetail(carId);
        if (res && res.data) {
          publicDetail = res.data;
        }
      } catch (e) {
        console.warn('Cannot fetch public car detail via API, fallback to owner data:', e);
      }
    }

    if (!baseCar && !publicDetail) {
      body.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
          Không tìm thấy thông tin chi tiết của phương tiện này.
        </div>
      `;
      return;
    }

    // Gộp dữ liệu: ưu tiên biển số thật của Owner, kèm gallery từ public API
    const realPlate = baseCar?.license_plate || baseCar?.plate_number || publicDetail?.plateNumber || 'Chưa cập nhật';
    const brand = baseCar?.brand || publicDetail?.brand || 'Xe';
    const model = baseCar?.model || publicDetail?.model || '';
    const year = baseCar?.year || publicDetail?.year || 2023;
    const status = baseCar?.status || publicDetail?.status || 'ACTIVE';
    const pricePerDay = Number(baseCar?.price_per_day || publicDetail?.pricePerDay || 0);
    const depositAmount = Math.round(pricePerDay * 0.3);
    const seats = baseCar?.seat_count || publicDetail?.seats || 5;
    const transmission = baseCar?.transmission || publicDetail?.transmission || 'AUTOMATIC';
    const transText = transmission === 'AUTOMATIC' ? 'Số tự động' : 'Số sàn';
    const fuelType = baseCar?.fuel_type || publicDetail?.fuelType || 'GASOLINE';
    const fuelText = fuelType === 'ELECTRIC' ? 'Xe điện (EV)' : (fuelType === 'DIESEL' ? 'Dầu Diesel' : 'Xăng');
    const address = baseCar?.pickup_address || publicDetail?.address || 'TP. Hồ Chí Minh';
    const province = baseCar?.province || publicDetail?.province || 'Hồ Chí Minh';
    const description = baseCar?.description || publicDetail?.description || '';
    const features = baseCar?.features || publicDetail?.features || 'GPS, Camera lùi, Thu phí tự động VETC';
    const mainImg = baseCar?.image_url || publicDetail?.thumbnailUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80';
    const images = Array.isArray(publicDetail?.images) ? publicDetail.images : [];

    if (title) title.innerText = `${brand} ${model} (${year})`;

    const formatCurrency = (amt) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0);

    let statusBadge = '<span class="badge badge-success">Đang hoạt động</span>';
    if (status === 'INACTIVE') {
      statusBadge = '<span class="badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">Tạm ẩn khỏi tìm kiếm</span>';
    } else if (status === 'REJECTED') {
      statusBadge = '<span class="badge badge-danger">Từ chối duyệt</span>';
    } else if (status === 'PENDING' || status === 'PENDING_APPROVAL') {
      statusBadge = '<span class="badge badge-warning">Chờ Admin duyệt</span>';
    }

    // Gallery thumbnails
    let galleryHtml = '';
    if (images.length > 1) {
      const thumbs = images.map(img => `
        <img src="${img.imageUrl || img.image_url}" alt="Thumbnail" style="height: 60px; width: 85px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#0f766e'" onmouseout="this.style.borderColor='transparent'" onclick="document.getElementById('ownerDetailMainImage').src='${img.imageUrl || img.image_url}'" />
      `).join('');
      galleryHtml = `
        <div style="display: flex; gap: 8px; overflow-x: auto; padding: 6px 0;">
          ${thumbs}
        </div>
      `;
    }

    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.15rem;">
        
        <!-- Ảnh đại diện và gallery -->
        <div>
          <img id="ownerDetailMainImage" src="${mainImg}" alt="${brand} ${model}" style="width: 100%; max-height: 290px; object-fit: cover; border-radius: 10px; border: 1px solid #e2e8f0;" />
          ${galleryHtml}
        </div>

        <!-- Header thông tin chính -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.85rem;">
          <div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
              ${brand} ${model} (${year})
            </h3>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <span style="font-family: monospace; font-size: 0.95rem; font-weight: 800; background: #f8fafc; color: #1e293b; padding: 3px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                ${realPlate}
              </span>
              ${statusBadge}
              <span style="font-size: 0.85rem; color: #64748b;">Khu vực: <strong>${province}</strong></span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.78rem; color: #64748b; text-transform: uppercase; font-weight: 600;">Giá cho thuê</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #047857;">${formatCurrency(pricePerDay)}/ngày</div>
            <div style="font-size: 0.8rem; color: #0284c7; font-weight: 600;">Cọc 30%: ${formatCurrency(depositAmount)}</div>
          </div>
        </div>

        <!-- Thông số kỹ thuật -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Số chỗ ngồi</div>
            <div style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 2px;">${seats} chỗ</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Hộp số</div>
            <div style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 2px;">${transText}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Nhiên liệu</div>
            <div style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 2px;">${fuelText}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Năm sản xuất</div>
            <div style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 2px;">${year}</div>
          </div>
        </div>

        <!-- Chi tiết địa chỉ, tiện nghi, mô tả -->
        <div style="font-size: 0.88rem; color: #334155; line-height: 1.6; display: flex; flex-direction: column; gap: 8px;">
          <div><strong style="color: #0f172a;">Địa chỉ giao xe:</strong> ${address}</div>
          <div><strong style="color: #0f172a;">Trang bị & Tiện nghi:</strong> ${features}</div>
          ${description ? `<div><strong style="color: #0f172a;">Mô tả từ bạn:</strong> ${description}</div>` : ''}
        </div>

        <!-- Cụm nút quản trị dành riêng cho Chủ xe (KHÔNG CÓ NÚT ĐẶT XE CỦA KHÁCH) -->
        <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-outline btn-sm" style="color: #7c3aed; border-color: #7c3aed;" onclick="document.getElementById('carDetailModalOverlay').classList.remove('open'); OwnerService.openCalendarModal(${carId})">
            Lịch xe & Chặn ngày
          </button>
          <button class="btn btn-outline btn-sm" style="color: #0f766e; border-color: #0f766e;" onclick="document.getElementById('carDetailModalOverlay').classList.remove('open'); OwnerService.openPhotosModal(${carId})">
            Quản lý ảnh xe
          </button>
          <button class="btn btn-primary btn-sm" style="background: #2563eb; border-color: #2563eb;" onclick="document.getElementById('carDetailModalOverlay').classList.remove('open'); OwnerService.openEditCarModal(${carId})">
            Sửa thông tin xe
          </button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('carDetailModalOverlay').classList.remove('open')">
            Đóng
          </button>
        </div>

      </div>
    `;
  },

  // CRP-32: Chủ xe bật/tắt kích hoạt trạng thái xe (ACTIVE <-> INACTIVE)
  async toggleCarStatus(carId, currentStatus = null, carName = null) {
    const car = Array.isArray(this.ownerCars) ? this.ownerCars.find(c => c.id == carId) : null;
    const resolvedStatus = currentStatus || car?.status || 'ACTIVE';
    const resolvedName = carName || (car ? `${car.brand} ${car.model}` : `xe #${carId}`);

    const isCurrentlyActive = resolvedStatus === 'ACTIVE';
    const actionText = isCurrentlyActive ? 'VỀ SỐ [P] (TẠM ẨN KHỎI TÌM KIẾM)' : 'VÀO SỐ [D] (MỞ XE NHẬN KHÁCH)';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

    if (!confirm(`Xác nhận gạt cần số: ${actionText} cho ${resolvedName}?\n\n- Số P (Park): Xe tạm dừng hoạt động, ẩn khỏi tìm kiếm khách thuê.\n- Số D (Drive): Xe sẵn sàng lăn bánh đón khách thuê.`)) {
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
      this.showToast(`Đã gạt cần số sang ${newStatus === 'ACTIVE' ? '[D] (Hoạt động)' : '[P] (Tạm ẩn)'} cho ${resolvedName}!`, 'success');
      await this.renderOwnerPortal();
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái xe:', err);
      let errMsg = err.message || err.error || 'Không thể thay đổi trạng thái xe. Vui lòng thử lại!';
      if (err.data && err.data.message) errMsg = err.data.message;
      this.showToast(errMsg, 'error');
    }
  },

  // CRP-32: Chủ sở hữu xóa xe (Soft Delete)
  async deleteCar(carId, carName = null) {
    const car = Array.isArray(this.ownerCars) ? this.ownerCars.find(c => c.id == carId) : null;
    const resolvedName = carName || (car ? `${car.brand} ${car.model} (${car.license_plate || ''})` : `xe #${carId}`);

    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA ${resolvedName} không?\n\nLưu ý: Thao tác này sẽ gỡ bỏ xe khỏi danh mục xe cho thuê của bạn. Xe đang có chuyến đi hoạt động sẽ không thể xóa.`)) {
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
      this.showToast(`Đã xóa ${resolvedName} thành công!`, 'success');
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

  // Modal container dùng chung cho các phân hệ của Chủ xe
  showModal(title, bodyHtml, maxWidth = '680px') {
    let overlay = document.getElementById('ownerDynamicModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ownerDynamicModalOverlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-dialog" id="ownerDynamicModalDialog" style="max-width: ${maxWidth}; width: 95%; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title" id="ownerDynamicModalTitle">${title}</h3>
            <button class="modal-close-btn" onclick="OwnerService.closeModal()">&times;</button>
          </div>
          <div class="modal-body" id="ownerDynamicModalBody">${bodyHtml}</div>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      document.getElementById('ownerDynamicModalTitle').textContent = title;
      document.getElementById('ownerDynamicModalBody').innerHTML = bodyHtml;
      document.getElementById('ownerDynamicModalDialog').style.maxWidth = maxWidth;
    }
    overlay.classList.add('open');
  },

  closeModal() {
    const overlay = document.getElementById('ownerDynamicModalOverlay');
    if (overlay) overlay.classList.remove('open');
  },

  // ─────────────────────────────────────────────────────────────
  // SPRINT 3 - NHIỆM VỤ 2: MODAL BÀN GIAO XE (CHECK-IN CHO CHỦ XE)
  // ─────────────────────────────────────────────────────────────
  openCheckInModal(rentalId) {
    const b = (this.ownerBookings || []).find(x => (x.rental_id || x.rentalId || x.id) == rentalId) || {};
    const c = (this.ownerCars || []).find(x => x.id == (b.car_id || b.carId)) || {};
    const renterName = b.renter_full_name || b.renterFullName || b.renter_name || b.renterName || 'Khách thuê';
    const carName = c.brand ? `${c.brand} ${c.model}` : (b.car_model || b.carModel || 'Xe cho thuê');
    const plate = c.license_plate || b.car_plate_number || b.license_plate || '---';

    const html = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Header tóm tắt đơn thuê -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">ĐƠN THUÊ XE #${rentalId}</div>
            <strong style="font-size: 1.05rem; color: #0f172a;">${carName}</strong>
            <span class="vn-license-plate" style="margin-left: 6px;">${plate}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: #64748b;">Khách thuê: <strong style="color: #0f172a;">${renterName}</strong></div>
            <span class="badge badge-success" style="font-size: 0.75rem; font-weight: 700;">Đã cọc 30% VietQR</span>
          </div>
        </div>

        <p style="font-size: 0.85rem; color: #475569; margin: 0; line-height: 1.5;">
          Vui lòng ghi nhận chỉ số thực tế của xe lúc giao và chụp 4 góc ngoại quan để bảo vệ quyền lợi đối chiếu khi nhận lại xe.
        </p>

        <!-- Form Check-in -->
        <form id="formCheckIn" onsubmit="event.preventDefault(); OwnerService.submitCheckIn(${rentalId});" style="display: flex; flex-direction: column; gap: 14px;">
          
          <!-- 1. Số ODO (km) -->
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-weight: 700; color: #1e293b; display: flex; justify-content: space-between;">
              <span>1. Số ODO lúc xuất phát (km) <span style="color:#ef4444;">*</span></span>
              <small style="color: #64748b; font-weight: 500;">Công tơ mét hiện tại</small>
            </label>
            <input type="number" id="checkInOdo" class="form-control" min="0" value="15200" placeholder="VD: 15200" required style="font-size: 0.95rem; font-weight: 700; color: #0f172a;" />
          </div>

          <!-- 2. Thanh trượt mức xăng / Pin 0 - 100% -->
          <div class="form-group" style="margin: 0; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" style="font-weight: 700; color: #166534; margin: 0;">
                2. Mức nhiên liệu (Xăng / Pin lúc giao) <span style="color:#ef4444;">*</span>
              </label>
              <span id="lblCheckInFuel" style="font-size: 1.15rem; font-weight: 800; color: #059669; background: #dcfce7; padding: 2px 10px; border-radius: 999px;">100%</span>
            </div>
            <input type="range" id="checkInFuel" min="0" max="100" value="100" step="5" style="width: 100%; accent-color: #059669; cursor: pointer;" oninput="document.getElementById('lblCheckInFuel').textContent = this.value + '%'" />
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #15803d; margin-top: 4px; font-weight: 600;">
              <span>0% (Cạn xăng)</span>
              <span>50% (Nửa bình)</span>
              <span>100% (Đầy bình)</span>
            </div>
          </div>

          <!-- 3. Bốn ô chọn / dán link ảnh ngoại quan xe -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label class="form-label" style="font-weight: 700; color: #1e293b; margin: 0;">
                3. Ảnh ngoại quan 4 góc xe <span style="color:#ef4444;">*</span>
              </label>
              <button type="button" class="btn btn-outline btn-xs" style="color: #0f766e; border-color: #0f766e; font-weight: 700;" onclick="OwnerService.setCheckInSamplePhotos()">
                ⚡ Chọn nhanh 4 ảnh mẫu
              </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
              <!-- Ô 1: Đầu xe -->
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 4px;">1. Đầu xe</div>
                <input type="text" id="checkInImg1" class="form-control" placeholder="URL ảnh..." style="font-size: 0.75rem; padding: 4px 6px; margin-bottom: 6px;" onchange="OwnerService.previewThumb(this, 'prevIn1')" />
                <img id="prevIn1" src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" alt="Đầu xe" />
              </div>
              <!-- Ô 2: Đuôi xe -->
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 4px;">2. Đuôi xe</div>
                <input type="text" id="checkInImg2" class="form-control" placeholder="URL ảnh..." style="font-size: 0.75rem; padding: 4px 6px; margin-bottom: 6px;" onchange="OwnerService.previewThumb(this, 'prevIn2')" />
                <img id="prevIn2" src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" alt="Đuôi xe" />
              </div>
              <!-- Ô 3: Sườn trái -->
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 4px;">3. Sườn trái</div>
                <input type="text" id="checkInImg3" class="form-control" placeholder="URL ảnh..." style="font-size: 0.75rem; padding: 4px 6px; margin-bottom: 6px;" onchange="OwnerService.previewThumb(this, 'prevIn3')" />
                <img id="prevIn3" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" alt="Sườn trái" />
              </div>
              <!-- Ô 4: Sườn phải -->
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 4px;">4. Sườn phải</div>
                <input type="text" id="checkInImg4" class="form-control" placeholder="URL ảnh..." style="font-size: 0.75rem; padding: 4px 6px; margin-bottom: 6px;" onchange="OwnerService.previewThumb(this, 'prevIn4')" />
                <img id="prevIn4" src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" alt="Sườn phải" />
              </div>
            </div>
          </div>

          <!-- 4. Ghi chú tình trạng trước khi xuất phát -->
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-weight: 700; color: #1e293b;">
              4. Ghi chú tình trạng trước khi xuất phát
            </label>
            <textarea id="checkInNotes" class="form-control" rows="2" placeholder="VD: Xe sạch sẽ, vết trầy nhẹ ở cản trước góc phải, đầy đủ lốp dự phòng và kích nâng..." style="font-size: 0.85rem;"></textarea>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;">
              <span class="badge" style="background:#f1f5f9; color:#475569; cursor:pointer;" onclick="OwnerService.appendNote('checkInNotes', 'Xe rửa sạch bóng')">+ Xe sạch bóng</span>
              <span class="badge" style="background:#f1f5f9; color:#475569; cursor:pointer;" onclick="OwnerService.appendNote('checkInNotes', 'Ngoại quan đẹp, không trầy xước')">+ Ngoại quan đẹp</span>
              <span class="badge" style="background:#f1f5f9; color:#475569; cursor:pointer;" onclick="OwnerService.appendNote('checkInNotes', 'Có kèm camera hành trình & ETC')">+ Kèm camera & ETC</span>
            </div>
          </div>

          <!-- Nút hành động -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            <button type="button" class="btn btn-outline btn-md" onclick="OwnerService.closeModal()">Hủy bỏ</button>
            <button type="submit" id="btnSubmitCheckIn" class="btn btn-primary btn-md" style="background: #059669; border-color: #059669; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Xác nhận bàn giao xe
            </button>
          </div>
        </form>
      </div>
    `;

    this.showModal(`Biên Bản Bàn Giao Xe (Check-in) — Đơn #${rentalId}`, html, '650px');
    // Điền sẵn link ảnh mẫu ban đầu
    this.setCheckInSamplePhotos();
  },

  setCheckInSamplePhotos() {
    const urls = [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80'
    ];
    for (let i = 1; i <= 4; i++) {
      const inp = document.getElementById(`checkInImg${i}`);
      const prev = document.getElementById(`prevIn${i}`);
      if (inp) inp.value = urls[i - 1];
      if (prev) prev.src = urls[i - 1];
    }
  },

  previewThumb(input, imgId) {
    const img = document.getElementById(imgId);
    if (img && input.value.trim()) {
      img.src = input.value.trim();
    }
  },

  appendNote(textareaId, text) {
    const el = document.getElementById(textareaId);
    if (!el) return;
    if (el.value.trim()) {
      el.value += ', ' + text;
    } else {
      el.value = text;
    }
  },

  async submitCheckIn(rentalId) {
    const btn = document.getElementById('btnSubmitCheckIn');
    const odo = parseInt(document.getElementById('checkInOdo')?.value || '0', 10);
    const fuel = parseInt(document.getElementById('checkInFuel')?.value || '100', 10);
    const notes = document.getElementById('checkInNotes')?.value.trim() || '';

    const imgs = [];
    for (let i = 1; i <= 4; i++) {
      const val = document.getElementById(`checkInImg${i}`)?.value.trim();
      if (val) imgs.push(val);
    }
    const imagesStr = imgs.join(',');

    if (isNaN(odo) || odo < 0) {
      alert('Vui lòng nhập số ODO hợp lệ (lớn hơn hoặc bằng 0)!');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang lập biên bản...';
    }

    const payload = {
      odoMeter: odo,
      fuelLevel: fuel,
      images: imagesStr,
      notes: notes || 'Xe bàn giao trong tình trạng sạch sẽ, hoạt động hoàn hảo'
    };

    try {
      const res = await RentalAPI.checkInRental(rentalId, payload);
      if (res && (res.success || res.code === 200)) {
        this.showToast(`Lập biên bản bàn giao xe đơn #${rentalId} thành công! Chuyến đi đã bắt đầu.`, 'success');
        if (typeof NotificationAPI !== 'undefined' && NotificationAPI.addNotification) {
          NotificationAPI.addNotification('Bàn giao xe thành công', `Chủ xe đã lập biên bản Check-in đơn #${rentalId}. Chúc quý khách chuyến đi an toàn!`, 'INSPECTION_CHECK_IN', rentalId);
        }
        this.closeModal();
        await this.renderOwnerPortal();
        this.switchOwnerTab('REQUESTS');
      } else {
        alert(res.message || 'Không thể lập biên bản bàn giao xe. Vui lòng thử lại!');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Xác nhận bàn giao xe';
        }
      }
    } catch (err) {
      console.error('Lỗi khi submit Check-in:', err);
      this.showToast('Lỗi kết nối khi gửi biên bản bàn giao!', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Xác nhận bàn giao xe';
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // SPRINT 3 - NHIỆM VỤ 3: MODAL NGHIỆM THU TRẢ XE (CHECK-OUT CHO CHỦ XE)
  // ─────────────────────────────────────────────────────────────
  async openCheckOutModal(rentalId) {
    const b = (this.ownerBookings || []).find(x => (x.rental_id || x.rentalId || x.id) == rentalId) || {};
    const c = (this.ownerCars || []).find(x => x.id == (b.car_id || b.carId)) || {};
    const renterName = b.renter_full_name || b.renterFullName || b.renter_name || b.renterName || 'Khách thuê';
    const carName = c.brand ? `${c.brand} ${c.model}` : (b.car_model || b.carModel || 'Xe cho thuê');
    const plate = c.license_plate || b.car_plate_number || b.license_plate || '---';

    // Lấy thông tin Check-in lúc giao xe để đối chiếu ODO và xăng
    let startOdo = 15200;
    let startFuel = 100;
    try {
      const inspRes = await RentalAPI.getRentalInspections(rentalId);
      if (inspRes && inspRes.data && Array.isArray(inspRes.data)) {
        const checkInRecord = inspRes.data.find(i => i.inspectionType === 'CHECK_IN' || i.inspection_type === 'CHECK_IN');
        if (checkInRecord) {
          startOdo = checkInRecord.odoMeter || checkInRecord.odo_meter || startOdo;
          startFuel = checkInRecord.fuelLevel ?? checkInRecord.fuel_level ?? startFuel;
        }
      }
    } catch (_) {}

    // Tính toán hóa đơn nghiệm thu: 70% tiền thuê còn lại + phụ phí
    const totalRent = Number(b.rental_amount || b.rentalAmount || (c.price_per_day * (b.total_days || 1)) || 1500000);
    const depositPaid = Number(b.deposit_amount || b.depositAmount || Math.round(totalRent * 0.3));
    const remaining70 = totalRent - depositPaid;
    const initialTraveled = 185;
    const initialEndOdo = startOdo + initialTraveled;

    const formatMoney = (v) => typeof StorageService !== 'undefined' ? StorageService.formatCurrency(v) : (v?.toLocaleString('vi-VN') + ' đ');

    const html = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Header tóm tắt đơn và thông số ban đầu -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">NGHIỆM THU ĐƠN THUÊ #${rentalId}</div>
              <strong style="font-size: 1.05rem; color: #0f172a;">${carName}</strong>
              <span class="vn-license-plate" style="margin-left: 6px;">${plate}</span>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-info" style="font-size: 0.75rem; font-weight: 700;">Đang trong chuyến</span>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">Khách: <strong style="color: #0f172a;">${renterName}</strong></div>
            </div>
          </div>
          <!-- Baseline Check-in -->
          <div style="display: flex; gap: 12px; font-size: 0.8rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; color: #334155;">
            <div>🏁 ODO lúc giao: <strong style="color: #0284c7;">${startOdo.toLocaleString('vi-VN')} km</strong></div>
            <div>•</div>
            <div>⛽ Mức xăng lúc giao: <strong style="color: #059669;">${startFuel}%</strong></div>
          </div>
        </div>

        <!-- Form Check-out -->
        <form id="formCheckOut" onsubmit="event.preventDefault(); OwnerService.submitCheckOut(${rentalId});" style="display: flex; flex-direction: column; gap: 14px;">
          
          <!-- 1. Số ODO lúc trả & Tự động tính quãng đường đã đi -->
          <div class="form-group" style="margin: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label class="form-label" style="font-weight: 700; color: #1e293b; margin: 0;">
                1. Số ODO lúc nhận lại xe (km) <span style="color:#ef4444;">*</span>
              </label>
              <div id="distanceTraveledBadge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 700; font-size: 0.82rem; padding: 2px 10px; border-radius: 999px;">
                Quãng đường đã đi: <span id="lblDistanceVal">${initialTraveled}</span> km
              </div>
            </div>
            <input type="number" id="checkOutOdo" class="form-control" min="${startOdo}" value="${initialEndOdo}" placeholder="Nhập ODO..." required style="font-size: 0.95rem; font-weight: 700; color: #0f172a;" oninput="OwnerService.updateDistanceCalculated(${startOdo})" />
          </div>

          <!-- 2. Mức xăng / Pin lúc nhận lại -->
          <div class="form-group" style="margin: 0; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" style="font-weight: 700; color: #0369a1; margin: 0;">
                2. Mức xăng / Pin lúc nhận lại xe <span style="color:#ef4444;">*</span>
              </label>
              <span id="lblCheckOutFuel" style="font-size: 1.15rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 10px; border-radius: 999px;">90%</span>
            </div>
            <input type="range" id="checkOutFuel" min="0" max="100" value="90" step="5" style="width: 100%; accent-color: #0284c7; cursor: pointer;" oninput="document.getElementById('lblCheckOutFuel').textContent = this.value + '%'" />
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #0369a1; margin-top: 4px; font-weight: 600;">
              <span>0% (Hết)</span>
              <span>50%</span>
              <span>100% (Đầy bình)</span>
            </div>
          </div>

          <!-- 3. Phụ phí phát sinh (nếu có) -->
          <div style="background: #fffbeb; border: 1.5px solid #fef08a; border-radius: 8px; padding: 12px 14px;">
            <label class="form-label" style="font-weight: 700; color: #92400e; margin-bottom: 6px; display: flex; justify-content: space-between;">
              <span>3. Phụ phí phát sinh (nếu có)</span>
              <small style="color: #b45309; font-weight: 600;">Rửa xe, thiếu xăng, vượt km...</small>
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 10px; margin-bottom: 8px;">
              <input type="number" id="checkOutExtraFee" class="form-control" min="0" step="10000" value="0" placeholder="Số tiền phụ phí (đ)" oninput="OwnerService.updateCheckOutSummary(${remaining70})" style="font-weight: 700; color: #b45309;" />
              <input type="text" id="checkOutExtraFeeReason" class="form-control" placeholder="Lý do phụ phí (VD: Rửa xe bùn đất...)" />
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline btn-xs" style="color:#b45309; border-color:#fde68a; background:#ffffff;" onclick="OwnerService.setExtraFee(50000, 'Rửa xe bẩn', ${remaining70})">+50k Rửa xe</button>
              <button type="button" class="btn btn-outline btn-xs" style="color:#b45309; border-color:#fde68a; background:#ffffff;" onclick="OwnerService.setExtraFee(100000, 'Bù hao hụt 10% nhiên liệu', ${remaining70})">+100k Bù nhiên liệu</button>
              <button type="button" class="btn btn-outline btn-xs" style="color:#b45309; border-color:#fde68a; background:#ffffff;" onclick="OwnerService.setExtraFee(150000, 'Chạy quá giới hạn 30km', ${remaining70})">+150k Quá km</button>
              <button type="button" class="btn btn-outline btn-xs" style="color:#64748b; border-color:#cbd5e1; background:#ffffff;" onclick="OwnerService.setExtraFee(0, '', ${remaining70})">0đ Miễn phí</button>
            </div>
          </div>

          <!-- 4. Ảnh đối chiếu khi trả xe -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label class="form-label" style="font-weight: 700; color: #1e293b; margin: 0;">
                4. Ảnh hiện trạng khi nhận lại xe
              </label>
              <button type="button" class="btn btn-outline btn-xs" style="color: #2563eb; border-color: #2563eb; font-weight: 700;" onclick="OwnerService.setCheckOutSamplePhotos()">
                ⚡ Điền nhanh ảnh nghiệm thu
              </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 6px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 3px;">Đầu xe</div>
                <input type="text" id="checkOutImg1" class="form-control" placeholder="URL..." style="font-size: 0.72rem; padding: 3px 6px; margin-bottom: 4px;" onchange="OwnerService.previewThumb(this, 'prevOut1')" />
                <img id="prevOut1" src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 65px; object-fit: cover; border-radius: 4px;" />
              </div>
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 6px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 3px;">Đuôi xe</div>
                <input type="text" id="checkOutImg2" class="form-control" placeholder="URL..." style="font-size: 0.72rem; padding: 3px 6px; margin-bottom: 4px;" onchange="OwnerService.previewThumb(this, 'prevOut2')" />
                <img id="prevOut2" src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 65px; object-fit: cover; border-radius: 4px;" />
              </div>
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 6px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 3px;">Sườn xe</div>
                <input type="text" id="checkOutImg3" class="form-control" placeholder="URL..." style="font-size: 0.72rem; padding: 3px 6px; margin-bottom: 4px;" onchange="OwnerService.previewThumb(this, 'prevOut3')" />
                <img id="prevOut3" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 65px; object-fit: cover; border-radius: 4px;" />
              </div>
              <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 6px; background: #fafafa; text-align: center;">
                <div style="font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 3px;">Taplo ODO</div>
                <input type="text" id="checkOutImg4" class="form-control" placeholder="URL..." style="font-size: 0.72rem; padding: 3px 6px; margin-bottom: 4px;" onchange="OwnerService.previewThumb(this, 'prevOut4')" />
                <img id="prevOut4" src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=300&q=80" style="width: 100%; height: 65px; object-fit: cover; border-radius: 4px;" />
              </div>
            </div>
          </div>

          <!-- 5. Ghi chú nghiệm thu -->
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-weight: 700; color: #1e293b;">5. Ghi chú nghiệm thu hoàn trả</label>
            <textarea id="checkOutNotes" class="form-control" rows="2" placeholder="Ghi nhận tình trạng xe khi hoàn trả..." style="font-size: 0.85rem;"></textarea>
          </div>

          <!-- 6. BẢNG HÓA ĐƠN TỔNG KẾT NGHIỆM THU (70% TIỀN THUÊ + PHỤ PHÍ) -->
          <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
              BẢNG HÓA ĐƠN THANH TOÁN TỔNG KẾT
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Tiền thuê xe còn lại (70%):</span>
              <strong style="color: #0f172a;">${formatMoney(remaining70)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Phụ phí phát sinh:</span>
              <strong id="summaryExtraFee" style="color: #b45309;">0 đ</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 2px;">
              <span style="color: #166534;">Tổng tiền Chủ xe thực nhận:</span>
              <span id="summaryTotalReceived" style="color: #166534; font-size: 1.15rem;">${formatMoney(remaining70)}</span>
            </div>
          </div>

          <!-- Nút hành động -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            <button type="button" class="btn btn-outline btn-md" onclick="OwnerService.closeModal()">Hủy bỏ</button>
            <button type="submit" id="btnSubmitCheckOut" class="btn btn-primary btn-md" style="background: #2563eb; border-color: #2563eb; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Xác nhận hoàn tất chuyến đi
            </button>
          </div>
        </form>
      </div>
    `;

    this.showModal(`Biên Bản Nghiệm Thu Trả Xe (Check-out) — Đơn #${rentalId}`, html, '660px');
    this.setCheckOutSamplePhotos();
  },

  setCheckOutSamplePhotos() {
    const urls = [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80'
    ];
    for (let i = 1; i <= 4; i++) {
      const inp = document.getElementById(`checkOutImg${i}`);
      const prev = document.getElementById(`prevOut${i}`);
      if (inp) inp.value = urls[i - 1];
      if (prev) prev.src = urls[i - 1];
    }
  },

  updateDistanceCalculated(startOdo) {
    const endOdo = parseInt(document.getElementById('checkOutOdo')?.value || '0', 10);
    const dist = Math.max(0, endOdo - startOdo);
    const lbl = document.getElementById('lblDistanceVal');
    if (lbl) lbl.textContent = dist.toLocaleString('vi-VN');
  },

  setExtraFee(fee, reason, remaining70) {
    const feeInput = document.getElementById('checkOutExtraFee');
    const reasonInput = document.getElementById('checkOutExtraFeeReason');
    if (feeInput) feeInput.value = fee;
    if (reasonInput) reasonInput.value = reason;
    this.updateCheckOutSummary(remaining70);
  },

  updateCheckOutSummary(remaining70) {
    const extra = parseInt(document.getElementById('checkOutExtraFee')?.value || '0', 10) || 0;
    const formatMoney = (v) => typeof StorageService !== 'undefined' ? StorageService.formatCurrency(v) : (v?.toLocaleString('vi-VN') + ' đ');
    
    const feeEl = document.getElementById('summaryExtraFee');
    const totalEl = document.getElementById('summaryTotalReceived');
    if (feeEl) feeEl.textContent = formatMoney(extra);
    if (totalEl) totalEl.textContent = formatMoney(remaining70 + extra);
  },

  async submitCheckOut(rentalId) {
    const btn = document.getElementById('btnSubmitCheckOut');
    const odo = parseInt(document.getElementById('checkOutOdo')?.value || '0', 10);
    const fuel = parseInt(document.getElementById('checkOutFuel')?.value || '100', 10);
    const extraFee = parseInt(document.getElementById('checkOutExtraFee')?.value || '0', 10) || 0;
    const extraFeeReason = document.getElementById('checkOutExtraFeeReason')?.value.trim() || '';
    const notes = document.getElementById('checkOutNotes')?.value.trim() || '';

    const imgs = [];
    for (let i = 1; i <= 4; i++) {
      const val = document.getElementById(`checkOutImg${i}`)?.value.trim();
      if (val) imgs.push(val);
    }
    const imagesStr = imgs.join(',');

    if (isNaN(odo) || odo < 0) {
      alert('Vui lòng nhập số ODO trả xe hợp lệ!');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang nghiệm thu...';
    }

    const payload = {
      odoMeter: odo,
      fuelLevel: fuel,
      extraFee: extraFee,
      extraFeeReason: extraFeeReason,
      images: imagesStr,
      notes: notes || 'Nghiệm thu xe hoàn trả thành công, không phát sinh khiếu nại'
    };

    try {
      const res = await RentalAPI.checkOutRental(rentalId, payload);
      if (res && (res.success || res.code === 200)) {
        this.showToast(`Nghiệm thu và hoàn tất chuyến đi #${rentalId} thành công! Trạng thái: COMPLETED.`, 'success');
        if (typeof NotificationAPI !== 'undefined' && NotificationAPI.addNotification) {
          NotificationAPI.addNotification('Chuyến đi đã hoàn tất', `Chủ xe đã hoàn tất nghiệm thu trả xe đơn #${rentalId}. Mời quý khách để lại đánh giá chuyến đi!`, 'RENTAL_COMPLETED', rentalId);
        }
        this.closeModal();
        await this.renderOwnerPortal();
        this.switchOwnerTab('REQUESTS');
      } else {
        alert(res.message || 'Không thể lập biên bản nghiệm thu. Vui lòng thử lại!');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Xác nhận hoàn tất chuyến đi';
        }
      }
    } catch (err) {
      console.error('Lỗi khi submit Check-out:', err);
      this.showToast('Lỗi kết nối khi gửi nghiệm thu trả xe!', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Xác nhận hoàn tất chuyến đi';
      }
    }
  },

  // Xem toàn bộ lịch sử biên bản giao nhận xe của đơn thuê
  async viewInspections(rentalId) {
    const formatMoney = (v) => typeof StorageService !== 'undefined' ? StorageService.formatCurrency(v) : (v?.toLocaleString('vi-VN') + ' đ');
    let inspections = [];
    try {
      const res = await RentalAPI.getRentalInspections(rentalId);
      if (res && res.data && Array.isArray(res.data)) {
        inspections = res.data;
      }
    } catch (_) {}

    if (inspections.length === 0) {
      this.showToast(`Chưa có biên bản giao nhận nào cho đơn #${rentalId}`, 'info');
      return;
    }

    const renderCard = (i) => {
      const isCheckIn = (i.inspectionType === 'CHECK_IN' || i.inspection_type === 'CHECK_IN');
      const imgList = (i.images ? i.images.split(',') : []).filter(Boolean);
      return `
        <div style="background: ${isCheckIn ? '#f0fdf4' : '#eff6ff'}; border: 1.5px solid ${isCheckIn ? '#86efac' : '#93c5fd'}; border-radius: 10px; padding: 14px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: ${isCheckIn ? '#166534' : '#1d4ed8'}; font-size: 0.95rem;">
              ${isCheckIn ? '✓ BIÊN BẢN BÀN GIAO (CHECK-IN)' : '✓ BIÊN BẢN NGHIỆM THU (CHECK-OUT)'}
            </strong>
            <span style="font-size: 0.75rem; color: #64748b;">${i.createdAt ? new Date(i.createdAt).toLocaleString('vi-VN') : 'Đã ghi nhận'}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; font-size: 0.85rem; margin-bottom: 8px;">
            <div>Số ODO: <strong>${(i.odoMeter || i.odo_meter || 0).toLocaleString('vi-VN')} km</strong></div>
            <div>Mức xăng: <strong>${i.fuelLevel ?? i.fuel_level ?? 100}%</strong></div>
            ${!isCheckIn && (i.extraFee || i.extra_fee) ? `
              <div style="color: #b45309;">Phụ phí: <strong>${formatMoney(i.extraFee || i.extra_fee)}</strong> (${i.extraFeeReason || i.extra_fee_reason || 'Phát sinh'})</div>
            ` : ''}
          </div>
          ${i.notes ? `<div style="font-size: 0.82rem; color: #475569; margin-bottom: 8px; font-style: italic;">" ${i.notes} "</div>` : ''}
          ${imgList.length > 0 ? `
            <div style="display: flex; gap: 8px; overflow-x: auto; padding-top: 4px;">
              ${imgList.map(url => `
                <img src="${url}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1;" onclick="OwnerService.zoomImage('${url}', 'Ảnh biên bản')" title="Bấm để phóng to" />
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    };

    const html = `
      <div>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 12px;">
          Toàn bộ biên bản bàn giao và nghiệm thu xe của đơn thuê <strong>#${rentalId}</strong>:
        </p>
        ${inspections.map(renderCard).join('')}
        <div style="text-align: right; margin-top: 14px;">
          <button class="btn btn-outline btn-sm" onclick="OwnerService.closeModal()">Đóng</button>
        </div>
      </div>
    `;

    this.showModal(`Biên Bản Giao Nhận Xe — Đơn #${rentalId}`, html, '650px');
  },

  // CRP_31-37: Quản lý Dropdown menu thao tác mở rộng của bảng xe
  toggleActionDropdown(carId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const menu = document.getElementById(`actionDropdown_${carId}`);
    const btn = document.getElementById(`btnActionMore_${carId}`);
    if (!menu) return;
    const isShowing = menu.classList.contains('show');

    // Đóng tất cả dropdown đang mở
    this.closeAllActionDropdowns();

    // Nếu chưa mở thì mở lên
    if (!isShowing) {
      // Kiểm tra khoảng cách phía dưới màn hình, nếu hẹp thì bung lên trên (dropup)
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 210 && rect.top > 210) {
          menu.classList.add('dropup');
        } else {
          menu.classList.remove('dropup');
        }
        btn.classList.add('active');
      }
      menu.classList.add('show');
    }
  },

  closeAllActionDropdowns() {
    document.querySelectorAll('.action-dropdown-menu.show').forEach(m => {
      m.classList.remove('show');
      m.classList.remove('dropup');
    });
    document.querySelectorAll('.btn-action-more.active').forEach(b => b.classList.remove('active'));
  }
};

// Đăng ký sự kiện click ngoài để đóng dropdown tự động
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.action-dropdown-wrapper')) {
      if (typeof OwnerService !== 'undefined' && OwnerService.closeAllActionDropdowns) {
        OwnerService.closeAllActionDropdowns();
      }
    }
  });
}
