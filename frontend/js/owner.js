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

    const allBookings = typeof StorageService !== 'undefined' ? StorageService.getBookings() : [];
    const myCarIds = ownerCars.map(c => c.id);
    const ownerBookings = allBookings.filter(b => myCarIds.includes(b.car_id));
    
    // Tính tổng tiền cọc và doanh thu tạm tính
    const totalEarnings = ownerBookings
      .filter(b => b.status === 'DEPOSIT_PAID' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.rental_amount || 0), 0);

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
                          <img class="table-car-thumb" src="${c.image_url}" alt="${c.brand}" />
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
                        <div class="table-actions" style="display: flex; gap: 6px;">
                          <button class="btn btn-outline btn-sm" onclick="OwnerService.viewCarDetail(${c.id})">Chi tiết</button>
                          <button class="btn btn-outline btn-sm" style="color: #0f766e; border-color: #0f766e;" onclick="OwnerService.openPhotosModal(${c.id}, '${c.brand} ${c.model}')">Ảnh xe</button>
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
                  ` : ownerBookings.map(b => `
                    <tr>
                      <td><span class="booking-code">#${b.id}</span></td>
                      <td><strong>${b.car_name}</strong></td>
                      <td>
                        ${b.renter_name}<br/>
                        <span style="font-size: 0.76rem; color: var(--slate-500);">${b.renter_phone}</span>
                      </td>
                      <td style="font-size: 0.82rem;">${b.start_date} &rarr; ${b.end_date}</td>
                      <td style="color: #047857; font-weight: 700;">${formatMoney(b.rental_amount)}</td>
                      <td>
                        ${b.status === 'DEPOSIT_PAID' ? '<span class="badge badge-success">Đã đặt cọc</span>' : 
                          (b.status === 'COMPLETED' ? '<span class="badge badge-neutral">Đã hoàn thành</span>' : '<span class="badge badge-warning">' + b.status + '</span>')}
                      </td>
                      <td>
                        ${b.status === 'DEPOSIT_PAID' ? `
                          <button class="btn btn-primary btn-sm" onclick="OwnerService.completeBooking(${b.id})">Hoàn tất chuyến</button>
                        ` : '<span style="color: var(--slate-400); font-size: 0.8rem;">—</span>'}
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
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin-bottom: 0.3rem;">
                  Đăng ký xe cho thuê mới
                </h3>
                <p style="color: var(--slate-600); font-size: 0.86rem; margin: 0;">
                  Vui lòng nhập chính xác thông tin phương tiện để bộ phận thẩm định duyệt hồ sơ nhanh chóng nhất.
                </p>
              </div>
              <button type="button" class="btn btn-outline btn-sm" style="border-color: #0f766e; color: #0f766e; font-weight: 700; background: #f0fdfa;" onclick="OwnerService.fillSampleCarData()">
                ⚡ Tự động điền dữ liệu mẫu chuẩn
              </button>
            </div>

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
                  <input type="text" class="form-control" id="newCarModel" placeholder="Ví dụ: VF3 Plus, Vios 1.5G, Camry 2.5Q..." required />
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Năm sản xuất <span class="required">*</span></label>
                  <input type="number" class="form-control" id="newCarYear" min="2016" max="2026" value="2023" required />
                </div>
                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label class="form-label" style="margin-bottom: 0;">Biển kiểm soát <span class="required">*</span></label>
                    <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.74rem; color: #0f766e; padding: 0 4px; text-decoration: underline;" onclick="OwnerService.generateSamplePlate()">
                      Tạo biển số mẫu
                    </button>
                  </div>
                  <input type="text" class="form-control" id="newCarPlate" placeholder="51A-12345 hoặc 30H-99999" required />
                  <span style="font-size: 0.72rem; color: var(--slate-500); display: block; margin-top: 3px;">
                    Định dạng chuẩn VN: <strong>51A-12345</strong> hoặc <strong>30H-99999</strong>
                  </span>
                </div>
                <div class="form-group">
                  <label class="form-label">Số chỗ ngồi <span class="required">*</span></label>
                  <select class="form-control" id="newCarSeats">
                    <option value="4">4 chỗ (Hatchback / Mini)</option>
                    <option value="5" selected>5 chỗ (Sedan / Crossover)</option>
                    <option value="7">7 chỗ (MPV / SUV)</option>
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
                  <input type="number" class="form-control" id="newCarPrice" placeholder="Ví dụ: 800000" step="50000" min="100000" max="10000000" value="800000" required />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Tỉnh / Thành phố <span class="required">*</span></label>
                  <select class="form-control" id="newCarProvince" required>
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
                <div class="form-group">
                  <label class="form-label">Địa chỉ nhận xe (Vị trí bãi đỗ) <span class="required">*</span></label>
                  <input type="text" class="form-control" id="newCarAddress" placeholder="Số nhà, tên đường, phường/xã, quận/huyện" required />
                </div>
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
                <label class="form-label">
                  Hình ảnh xe thực tế <span style="color: #0f766e; font-size: 0.8rem; font-weight: 600;">(Khuyên dùng: Chọn ảnh thật từ máy)</span>
                </label>
                <div style="margin-bottom: 8px;">
                  <input type="file" class="form-control" id="newCarPhotoFile" accept="image/png, image/jpeg, image/jpg, image/webp" onchange="OwnerService.previewCarPhoto(this)" />
                  <span style="font-size: 0.74rem; color: var(--slate-500); display: block; margin-top: 3px;">
                    Định dạng: JPG, PNG, WEBP. Dung lượng tối đa: 5MB.
                  </span>
                </div>
                <div id="newCarPhotoPreviewContainer" style="display: none; margin-bottom: 10px; position: relative; width: fit-content;">
                  <img id="newCarPhotoPreview" src="" alt="Xem trước ảnh xe" style="max-height: 160px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: cover;" />
                  <button type="button" class="btn btn-danger btn-xs" style="position: absolute; top: 6px; right: 6px; padding: 2px 7px; font-size: 11px; background: rgba(239, 68, 68, 0.9);" onclick="OwnerService.clearCarPhotoPreview()">Xóa ảnh</button>
                </div>
                <details style="font-size: 0.82rem; color: var(--slate-600); margin-top: 6px;">
                  <summary style="cursor: pointer; color: #0f766e; font-weight: 600;">Hoặc dán URL ảnh / chọn ảnh mẫu có sẵn</summary>
                  <div style="padding-top: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 4px;">
                      <label class="form-label" style="margin-bottom: 0; font-size: 0.78rem;">Link ảnh URL:</label>
                      <div style="display: flex; gap: 4px;">
                        <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.72rem; padding: 2px 7px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setCarSampleImage('SEDAN')">Mẫu Sedan</button>
                        <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.72rem; padding: 2px 7px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setCarSampleImage('SUV')">Mẫu SUV</button>
                        <button type="button" class="btn btn-ghost btn-xs" style="font-size: 0.72rem; padding: 2px 7px; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="OwnerService.setCarSampleImage('EV')">Mẫu Xe Điện</button>
                      </div>
                    </div>
                    <input type="text" class="form-control" id="newCarImageUrl" placeholder="Nếu để trống, hệ thống sẽ tự động gán hình ảnh xe minh họa đẹp mắt" value="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80" />
                  </div>
                </details>
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
    const el = document.getElementById('newCarImageUrl');
    if (el) el.value = images[type] || images.SEDAN;
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
      if (img) img.src = e.target.result;
      if (container) container.style.display = 'block';
    };
    reader.readAsDataURL(file);
  },

  clearCarPhotoPreview() {
    const input = document.getElementById('newCarPhotoFile');
    if (input) input.value = '';
    const container = document.getElementById('newCarPhotoPreviewContainer');
    if (container) container.style.display = 'none';
    const img = document.getElementById('newCarPhotoPreview');
    if (img) img.src = '';
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
              <img src="${imgUrl}" alt="Ảnh xe" style="width: 100%; height: 110px; object-fit: cover;" />
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

  viewCarDetail(carId) {
    if (typeof App !== 'undefined' && App.openCarDetailModal) {
      App.openCarDetailModal(carId);
      return;
    }
    const overlay = document.getElementById('carDetailModalOverlay');
    const body = document.getElementById('carDetailModalBody');
    const title = document.getElementById('carDetailModalTitle');
    
    let car = typeof StorageService !== 'undefined' ? StorageService.getCarById(carId) : null;
    if (overlay && body) {
      if (title) title.innerText = car ? `${car.brand} ${car.model}` : `Chi tiết xe #${carId}`;
      body.innerHTML = car ? `
        <div style="padding: 1rem;">
          <img src="${car.image_url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" />
          <h4>${car.brand} ${car.model} (${car.year})</h4>
          <p>Biển số: <strong>${car.license_plate}</strong></p>
          <p>Giá thuê: <strong>${typeof StorageService !== 'undefined' ? StorageService.formatCurrency(car.price_per_day) : car.price_per_day}</strong> / ngày</p>
          <p>Địa chỉ: ${car.pickup_address}</p>
        </div>
      ` : `<p style="padding: 1rem;">Không tìm thấy thông tin xe</p>`;
      overlay.classList.add('open');
    }
  },

  completeBooking(bookingId) {
    if (typeof StorageService !== 'undefined') {
      StorageService.updateBookingStatus(bookingId, 'COMPLETED');
    }
    this.showToast(`Chuyến đi #${bookingId} đã kết thúc thành công!`, 'success');
    this.renderOwnerPortal();
    this.switchOwnerTab('REQUESTS');
  }
};
