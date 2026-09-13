/**
 * DRIVESHARE — Owner Module (Clean & Professional, No Emojis)
 * Phân hệ Chủ xe: Đăng ký xe mới, Quản lý đội xe, Duyệt đơn thuê xe từ khách
 */

const OwnerService = {
  // Render giao diện Phân hệ Chủ xe
  renderOwnerPortal(containerId = 'ownerPortalContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const owner = StorageService.getCurrentOwner();
    const allCars = StorageService.getCars();
    const ownerCars = allCars.filter(c => c.owner_id === owner.id);
    const allBookings = StorageService.getBookings();
    
    // Đơn thuê liên quan đến các xe của chủ này
    const myCarIds = ownerCars.map(c => c.id);
    const ownerBookings = allBookings.filter(b => myCarIds.includes(b.car_id));
    
    // Tính tổng tiền cọc và doanh thu tạm tính
    const totalEarnings = ownerBookings
      .filter(b => b.status === 'DEPOSIT_PAID' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.rental_amount || 0), 0);

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
              <div class="portal-subtitle">Chủ xe: <strong>${owner.name}</strong> · ${owner.phone} · ${owner.address}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="OwnerService.showAddCarTab()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Đăng ký xe cho thuê mới
            </button>
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
              <div class="stat-value">${ownerCars.filter(c => c.status === 'PENDING_APPROVAL').length}</div>
              <div class="stat-label">Xe chờ nhân viên duyệt</div>
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
              <div class="stat-value">${StorageService.formatCurrency(totalEarnings)}</div>
              <div class="stat-label">Doanh thu tạm tính</div>
            </div>
          </div>
        </div>

        <!-- Tab Content: Danh sách xe của tôi -->
        <div id="ownerTabCarsContent">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Phương tiện của tôi</h3>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Xe & Năm sản xuất</th>
                    <th>Biển số</th>
                    <th>Giá thuê / ngày</th>
                    <th>Địa điểm đón xe</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  ${ownerCars.length === 0 ? `
                    <tr><td colspan="6" style="text-align: center; padding: 2rem;">Chưa có xe nào. Hãy nhấn "Đăng xe mới" để bắt đầu!</td></tr>
                  ` : ownerCars.map(c => `
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
                      <td style="color: var(--primary); font-weight: 700;">${StorageService.formatCurrency(c.price_per_day)}</td>
                      <td style="font-size: 0.82rem; max-width: 200px;">${c.pickup_address}</td>
                      <td>
                        ${c.status === 'ACTIVE' 
                          ? '<span class="badge badge-success">Đang hoạt động</span>' 
                          : (c.status === 'PENDING_APPROVAL' 
                            ? '<span class="badge badge-warning">Chờ nhân viên duyệt</span>' 
                            : '<span class="badge badge-danger">Bị từ chối</span>')}
                      </td>
                      <td>
                        <div class="table-actions">
                          <button class="btn btn-outline btn-sm" onclick="App.openCarDetailModal(${c.id})">Xem</button>
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
              <h3>Danh sách yêu cầu thuê xe</h3>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Xe thuê</th>
                    <th>Khách thuê</th>
                    <th>Thời gian thuê</th>
                    <th>Tiền cọc 30%</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  ${ownerBookings.length === 0 ? `
                    <tr><td colspan="7" style="text-align: center; padding: 2rem;">Chưa có yêu cầu thuê xe nào phát sinh.</td></tr>
                  ` : ownerBookings.map(b => `
                    <tr>
                      <td><span class="booking-code">#${b.id}</span></td>
                      <td><strong>${b.car_name}</strong> (${b.car_plate})</td>
                      <td>
                        <div>${b.renter_name}</div>
                        <div style="font-size: 0.76rem; color: var(--slate-500);">${b.renter_phone}</div>
                      </td>
                      <td>
                        <div style="font-size: 0.8rem;">Từ: ${b.start_time}</div>
                        <div style="font-size: 0.8rem;">Đến: ${b.end_time}</div>
                      </td>
                      <td style="font-weight: 700; color: var(--primary);">${StorageService.formatCurrency(b.deposit_amount)}</td>
                      <td>
                        ${b.status === 'DEPOSIT_PAID' ? '<span class="badge badge-success">Đã nhận cọc</span>' : `<span class="badge badge-neutral">${b.status}</span>`}
                      </td>
                      <td>
                        ${b.status === 'DEPOSIT_PAID' ? `
                          <button class="btn btn-primary btn-sm" onclick="OwnerService.completeBooking('${b.id}')">Hoàn thành chuyến</button>
                        ` : '<span style="color: var(--slate-400); font-size: 0.8rem;">Đã xử lý</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Content: Đăng xe mới -->
        <div id="ownerTabAddContent" style="display: none;">
          <div class="form-card">
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin-bottom: 0.4rem;">
              Đăng ký xe cho thuê mới
            </h3>
            <p style="color: var(--slate-600); font-size: 0.86rem; margin-bottom: 1.35rem;">
              Vui lòng nhập chính xác thông tin phương tiện để bộ phận thẩm định của DriveShare duyệt hồ sơ nhanh chóng nhất.
            </p>

            <form id="addCarForm" onsubmit="OwnerService.handleCarSubmit(event)">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Hãng xe <span class="required">*</span></label>
                  <select class="form-control" id="newCarBrand" required>
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
                <div class="form-group">
                  <label class="form-label">Dòng xe & Phiên bản <span class="required">*</span></label>
                  <input type="text" class="form-control" id="newCarModel" placeholder="Ví dụ: Vios 1.5G hoặc VF8 Plus" required />
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Năm sản xuất <span class="required">*</span></label>
                  <input type="number" class="form-control" id="newCarYear" min="2016" max="2026" value="2023" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Biển kiểm soát <span class="required">*</span></label>
                  <input type="text" class="form-control" id="newCarPlate" placeholder="51H-123.45" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Số chỗ ngồi <span class="required">*</span></label>
                  <select class="form-control" id="newCarSeats">
                    <option value="5">5 chỗ (Sedan / Crossover)</option>
                    <option value="7">7 chỗ (MPV / SUV)</option>
                    <option value="4">4 chỗ (Hatchback nhỏ)</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Hộp số <span class="required">*</span></label>
                  <select class="form-control" id="newCarTransmission">
                    <option value="AUTOMATIC">Số tự động (AT)</option>
                    <option value="MANUAL">Số sàn (MT)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Loại nhiên liệu <span class="required">*</span></label>
                  <select class="form-control" id="newCarFuel">
                    <option value="GASOLINE">Xăng</option>
                    <option value="ELECTRIC">Điện</option>
                    <option value="DIESEL">Dầu Diesel</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Giá thuê đề xuất (đ/ngày) <span class="required">*</span></label>
                  <input type="number" class="form-control" id="newCarPrice" placeholder="Ví dụ: 800000" step="50000" min="400000" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Địa chỉ nhận xe (Vị trí bãi đỗ) <span class="required">*</span></label>
                <input type="text" class="form-control" id="newCarAddress" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành" required />
              </div>

              <div class="form-group">
                <label class="form-label">Tiện ích & Trang bị sẵn trên xe</label>
                <div class="checkbox-group-grid">
                  <label class="checkbox-label"><input type="checkbox" name="amenity" value="Bản đồ dẫn đường" checked> Bản đồ dẫn đường</label>
                  <label class="checkbox-label"><input type="checkbox" name="amenity" value="Camera lùi / 360" checked> Camera lùi / 360</label>
                  <label class="checkbox-label"><input type="checkbox" name="amenity" value="Thu phí tự động VETC" checked> Thu phí tự động VETC</label>
                  <label class="checkbox-label"><input type="checkbox" name="amenity" value="Apple CarPlay / Android Auto"> Apple CarPlay</label>
                  <label class="checkbox-label"><input type="checkbox" name="amenity" value="Cửa sổ trời"> Cửa sổ trời</label>
                  <label class="checkbox-label"><input type="checkbox" name="amenity" value="Cảm biến áp suất lốp"> Cảm biến áp suất lốp</label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Link ảnh thực tế xe (URL ảnh rõ nét) <span class="required">*</span></label>
                <input type="url" class="form-control" id="newCarImageUrl" placeholder="https://images.unsplash.com/photo-..." value="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80" required />
              </div>

              <div class="form-group">
                <label class="form-label">Mô tả thêm về tình trạng xe</label>
                <textarea class="form-control" id="newCarDesc" rows="3" placeholder="Xe mới bảo dưỡng, máy êm, sạch sẽ không mùi thuốc lá..."></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-outline btn-sm" onclick="OwnerService.switchOwnerTab('CARS')">Hủy bỏ</button>
                <button type="submit" class="btn btn-primary btn-sm">Gửi xe lên phê duyệt</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
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

  handleCarSubmit(e) {
    e.preventDefault();
    const owner = StorageService.getCurrentOwner();

    const brand = document.getElementById('newCarBrand').value;
    const model = document.getElementById('newCarModel').value;
    const year = parseInt(document.getElementById('newCarYear').value, 10);
    const plate = document.getElementById('newCarPlate').value.trim().toUpperCase();
    const seats = parseInt(document.getElementById('newCarSeats').value, 10);
    const transmission = document.getElementById('newCarTransmission').value;
    const fuel = document.getElementById('newCarFuel').value;
    const price = parseFloat(document.getElementById('newCarPrice').value);
    const address = document.getElementById('newCarAddress').value.trim();
    const imageUrl = document.getElementById('newCarImageUrl').value.trim();
    const desc = document.getElementById('newCarDesc').value.trim();

    const amenities = Array.from(document.querySelectorAll('input[name="amenity"]:checked')).map(cb => cb.value);

    StorageService.saveCar({
      owner_id: owner.id,
      brand,
      model,
      year,
      license_plate: plate,
      seat_count: seats,
      transmission,
      fuel_type: fuel,
      fuel_consumption: fuel === 'ELECTRIC' ? 'Pin 400km / sạc' : '6.5L / 100km',
      price_per_day: price,
      pickup_address: address,
      amenities,
      description: desc || 'Xe chất lượng cao của chủ xe DriveShare.',
      image_url: imageUrl,
      owner_name: owner.name,
      owner_phone: owner.phone,
      owner_avatar: owner.avatar
    });

    App.showToast(`Đã gửi xe ${brand} ${model} lên hệ thống! Đang chờ Nhân viên duyệt.`, 'success');
    this.renderOwnerPortal();
    this.switchOwnerTab('CARS');
  },

  completeBooking(bookingId) {
    StorageService.updateBookingStatus(bookingId, 'COMPLETED');
    App.showToast(`Chuyến đi #${bookingId} đã kết thúc thành công!`, 'success');
    this.renderOwnerPortal();
    this.switchOwnerTab('REQUESTS');
  }
};
