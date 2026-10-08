/**
 * DRIVESHARE — Render Module (Professional & Clean, No Emojis)
 * Chịu trách nhiệm tạo giao diện thẻ xe, modal chi tiết, danh sách chuyến đi
 */

const RenderService = {
  // 1. Render danh sách xe trong Catalogue
  renderCarGrid(cars, containerId = "carGridContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!cars || cars.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3>Không tìm thấy xe phù hợp</h3>
          <p>Hãy thử thay đổi bộ lọc hoặc chọn mức giá, địa điểm khác để tìm thêm lựa chọn.</p>
          <button class="btn btn-outline btn-sm" onclick="App.resetFilters()">Đặt lại bộ lọc</button>
        </div>
      `;
      return;
    }

    container.innerHTML = cars
      .map((car) => {
        // Backend trả snake_case (SNAKE_CASE Jackson strategy): car_id, price_per_day, fuel_type...
        const carId = car.car_id || car.carId || car.id;
        const pricePerDay = Number(car.price_per_day || car.pricePerDay || 0);
        const depositAmount = Math.round(pricePerDay * 0.3);
        const fuel = car.fuel_type || car.fuelType;
        const fuelText =
          fuel === "ELECTRIC"
            ? "Xe điện (EV)"
            : fuel === "DIESEL"
              ? "Dầu Diesel"
              : "Xăng";
        const trans = car.transmission;
        const transText =
          trans === "AUTOMATIC" ? "Tự động" : "Số sàn";
        const imageUrl = car.thumbnail_url || car.thumbnailUrl || car.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80';
        const seats = car.seats || car.seat_count || 4;
        const locationText = car.province
          ? `${car.address ? car.address + ', ' : ''}${car.province}`
          : (car.district ? `${car.district}, ${car.city}` : car.pickup_address || 'TP. Hồ Chí Minh');
        const rating = Number(car.rating || 5.0).toFixed(1);
        const tripCount = car.trip_count || car.tripCount || 0;

        const unavailableDates = car.unavailable_dates || car.unavailableDates || [];
        let busyBadgeHtml = '';
        if (Array.isArray(unavailableDates) && unavailableDates.length > 0) {
          const sorted = [...unavailableDates].sort();
          const todayStr = new Date().toISOString().slice(0, 10);
          const upcoming = sorted.filter(d => d >= todayStr);
          if (upcoming.length > 0) {
            const first = upcoming[0].slice(5).replace('-', '/');
            const last = upcoming[upcoming.length - 1].slice(5).replace('-', '/');
            const rangeText = first === last ? `Bận ${first}` : `Bận ${first} - ${last}`;
            busyBadgeHtml = `<span class="car-tag-busy" title="Xe có lịch bận từ ${first} đến ${last}"><i class="fa-solid fa-calendar-xmark" style="font-size:0.7rem;margin-right:2px;"></i>${rangeText}</span>`;
          }
        }

        return `
        <div class="car-card animate-fade-in" data-id="${carId}">
          <div class="car-card-img-wrapper">
            <img class="car-card-img" src="${imageUrl}" alt="${car.brand} ${car.model}" loading="lazy" />
            <div class="car-top-badges">
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <span class="car-tag-instant">Giao tận nơi</span>
                ${busyBadgeHtml}
              </div>
              <span class="car-tag-fuel">${fuelText}</span>
            </div>
          </div>
          
          <div class="car-card-body">
            <div class="car-brand-model">
              <h3 class="car-title">${car.brand} ${car.model}</h3>
              <span class="car-year">${car.year || ''}</span>
            </div>
            
            <div class="car-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${locationText}</span>
            </div>

            <div class="car-specs-row">
              <span class="spec-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                ${seats} chỗ
              </span>
              <span class="spec-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 7v5l3 3"></path>
                </svg>
                ${transText}
              </span>
              <span class="spec-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 22h12"></path><path d="M4 9h10"></path><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
                </svg>
                ${fuelText}
              </span>
            </div>

            <div class="car-rating-trip">
              <span class="rating-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ea580c" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                ${rating}
              </span>
              <span class="trip-count">· ${tripCount} chuyến thành công</span>
            </div>

            <div class="car-card-footer">
              <div class="car-price-box">
                <span class="car-price-amount">${StorageService.formatCurrency(pricePerDay)}</span>
                <span class="car-price-unit">/ ngày</span>
                <span class="car-price-deposit">Cọc 30%: ${StorageService.formatCurrency(depositAmount)}</span>
              </div>
              <div class="car-card-actions">
                <button class="btn btn-outline btn-sm" onclick="AuthService.requireLoginThen(() => App.openCarDetailModal(${carId}))">Chi tiết</button>
                <button class="btn btn-primary btn-sm" onclick="AuthService.requireLoginThen(() => BookingService.startBookingFlow(${carId}))">Đặt xe</button>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  },

  // 2. Render Modal Chi tiết xe (CRP-37)
  renderCarDetail(car) {
    // Backend trả snake_case: car_id, price_per_day, plate_number_masked, thumbnail_url...
    const carId = car.car_id || car.carId || car.id;
    const pricePerDay = Number(car.price_per_day || car.pricePerDay || 0);
    const depositAmount = Math.round(pricePerDay * 0.3);
    const plateNumber = car.plate_number_masked || car.plateNumberMasked || car.license_plate || car.plate_number || "51A-XXX.XX";
    const city = car.province || car.city || "TP.HCM";
    const pickupAddress = car.address || car.pickup_address || "Địa điểm nhận xe";
    const imageUrl = car.thumbnail_url || car.thumbnailUrl || car.image_url || (car.images && car.images.length > 0 ? (car.images[0].image_url || car.images[0].imageUrl) : '');

    // Technical specifications & characteristics
    const seats = car.seats || car.seat_count || 5;
    const transmission = car.transmission || 'AUTOMATIC';
    const transText = (transmission === 'AUTOMATIC' || transmission === 'Tự động') ? 'Số tự động (AT)' : (transmission === 'MANUAL' || transmission === 'Số sàn') ? 'Số sàn (MT)' : 'Tự động';
    const fuel = car.fuel_type || car.fuelType || 'GASOLINE';
    const fuelText = (fuel === 'ELECTRIC' || fuel === 'EV') ? 'Xe điện (EV)' : (fuel === 'DIESEL') ? 'Dầu Diesel' : 'Xăng';
    const year = car.year || 2023;
    const color = car.color || 'Trắng';

    // Check filter matching against active search criteria
    const activeMatches = [];
    let highlightSeats = false;
    let highlightTrans = false;
    let highlightFuel = false;

    if (typeof App !== 'undefined' && App.currentFilters) {
      const f = App.currentFilters;
      if (f.brand && f.brand !== 'ALL' && f.brand.toLowerCase() === (car.brand || '').toLowerCase()) {
        activeMatches.push(`Hãng xe: ${car.brand}`);
      }
      if (f.seats && f.seats !== 'ALL') {
        if (f.seats === '7' && seats >= 7) {
          activeMatches.push('Đúng phân khúc 7 chỗ (MPV / SUV)');
          highlightSeats = true;
        } else if (f.seats === '4-5' && seats <= 5) {
          activeMatches.push('Đúng phân khúc 4-5 chỗ');
          highlightSeats = true;
        } else if (f.seats === 'PICKUP' && (car.model || '').toLowerCase().includes('ranger')) {
          activeMatches.push('Dòng xe Bán tải (4x4)');
          highlightSeats = true;
        }
      }
      if (f.transmission && f.transmission !== 'ALL' && f.transmission === transmission) {
        activeMatches.push(`Hộp số: ${transText}`);
        highlightTrans = true;
      }
      if (f.fuel && f.fuel !== 'ALL' && (f.fuel === fuel || (f.fuel === 'GASOLINE' && fuel === 'GASOLINE'))) {
        activeMatches.push(`Nhiên liệu: ${fuelText}`);
        highlightFuel = true;
      }
      if (f.city && f.city !== 'ALL' && city.toLowerCase().includes(f.city.toLowerCase())) {
        activeMatches.push(`Địa điểm: ${city}`);
      }
      if (f.priceRange && f.priceRange !== 'ALL') {
        if (f.priceRange === 'UNDER_800' && pricePerDay < 800000) activeMatches.push('Mức giá: Tiết kiệm dưới 800k');
        else if (f.priceRange === '800_1200' && pricePerDay >= 800000 && pricePerDay <= 1200000) activeMatches.push('Mức giá: 800k - 1.2M');
        else if (f.priceRange === 'OVER_1200' && pricePerDay > 1200000) activeMatches.push('Mức giá: Trên 1.2M');
      }
    }

    const filterMatchHtml = activeMatches.length > 0 ? `
      <div class="filter-match-box">
        <div class="filter-match-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Khớp với tiêu chí tìm kiếm của bạn:
        </div>
        <div class="filter-match-tags">
          ${activeMatches.map(m => `<span class="filter-match-tag">✓ ${m}</span>`).join('')}
        </div>
      </div>
    ` : '';

    // Owner info resolution
    const ownerName = car.owner?.fullName || car.owner_name || "Chủ xe uy tín";
    const ownerAvatar = car.owner?.avatarUrl || car.owner_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
    const ownerRating = car.owner?.rating || car.rating || 5.0;
    const totalCars = car.owner?.totalCars || 1;

    // Amenities list resolution
    let amenitiesList = [];
    if (Array.isArray(car.amenities)) {
      amenitiesList = car.amenities;
    } else if (typeof car.features === 'string' && car.features.trim()) {
      amenitiesList = car.features.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      amenitiesList = ["GPS", "Bluetooth", "Camera lùi", "Cảm biến va chạm"];
    }

    const amenitiesHtml = amenitiesList
      .map(
        (a) => `
      <span class="amenity-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" color="#0f766e">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        ${a}
      </span>
    `,
      )
      .join("");

    // Gallery images rendering
    let galleryHtml = `<img src="${imageUrl}" alt="${car.brand} ${car.model}" />`;
    if (car.images && car.images.length > 1) {
      const thumbs = car.images.map(img => `<img src="${img.imageUrl}" alt="Gallery image" style="height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;" onclick="document.querySelector('.detail-gallery > img').src='${img.imageUrl}'" />`).join('');
      galleryHtml = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <img src="${imageUrl}" alt="${car.brand} ${car.model}" style="width: 100%; height: 260px; object-fit: cover; border-radius: 8px;" />
          <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.3rem;">
            ${thumbs}
          </div>
        </div>
      `;
    }

    return `
      <div class="detail-gallery">
        ${galleryHtml}
      </div>

      <div class="detail-columns">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h2 style="font-size: 1.35rem; color: var(--slate-900);">${car.brand} ${car.model} (${year})</h2>
              <p style="color: var(--slate-500); font-size: 0.88rem; margin-top: 0.2rem;">Biển số: <strong>${plateNumber}</strong> · Màu: <strong>${color}</strong> · Đăng ký tại ${city}</p>
            </div>
            <span class="badge badge-success">Sẵn sàng đón khách</span>
          </div>

          ${filterMatchHtml}

          <!-- Thông số kỹ thuật nổi bật -->
          <div class="detail-specs-grid">
            <div class="detail-spec-card ${highlightSeats ? 'highlight' : ''}">
              <div class="detail-spec-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div class="detail-spec-info">
                <span class="detail-spec-label">Số chỗ ngồi</span>
                <span class="detail-spec-value">${seats} chỗ</span>
              </div>
            </div>

            <div class="detail-spec-card ${highlightTrans ? 'highlight' : ''}">
              <div class="detail-spec-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>
              </div>
              <div class="detail-spec-info">
                <span class="detail-spec-label">Hộp số</span>
                <span class="detail-spec-value">${transText}</span>
              </div>
            </div>

            <div class="detail-spec-card ${highlightFuel ? 'highlight' : ''}">
              <div class="detail-spec-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22h12"></path><path d="M4 9h10"></path><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path></svg>
              </div>
              <div class="detail-spec-info">
                <span class="detail-spec-label">Nhiên liệu</span>
                <span class="detail-spec-value">${fuelText}</span>
              </div>
            </div>

            <div class="detail-spec-card">
              <div class="detail-spec-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div class="detail-spec-info">
                <span class="detail-spec-label">Năm SX</span>
                <span class="detail-spec-value">${year}</span>
              </div>
            </div>
          </div>

          <div style="margin: 1.15rem 0;">
            <h4 class="detail-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Địa điểm nhận & trả xe
            </h4>
            <p style="font-size: 0.88rem; color: var(--slate-700); background: var(--slate-50); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--slate-200);">
              ${pickupAddress} (Có hỗ trợ giao nhận tận nơi bán kính 10km)
            </p>
          </div>

          <div style="margin-bottom: 1.15rem;">
            <h4 class="detail-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Trang bị & Tiện ích trên xe
            </h4>
            <div class="detail-amenities-list">
              ${amenitiesHtml}
            </div>
          </div>

          <div style="margin-bottom: 1.15rem;">
            <h4 class="detail-section-title">Mô tả từ chủ xe</h4>
            <p style="font-size: 0.88rem; color: var(--slate-600); line-height: 1.6;">${car.description || 'Không có mô tả bổ sung.'}</p>
          </div>

          <div class="rental-rules-box">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--slate-800); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Giấy tờ & Điều khoản thuê xe:
            </h4>
            <ul class="rental-rules-list">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Có GPLX hạng B1 hoặc B2 còn hạn sử dụng (xác minh trực tiếp trên hệ thống).</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Căn cước công dân gắn chip hoặc Hộ chiếu (bản gốc để đối chiếu khi nhận xe).</span>
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Tài sản thế chấp: Xe máy chính chủ kèm cavet (hoặc tiền mặt 15.000.000 đ hoàn lại sau chuyến).</span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <!-- Chủ xe info -->
          <div style="background: var(--white); border: 1px solid var(--slate-200); border-radius: var(--radius-lg); padding: 0.95rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
            <img src="${ownerAvatar}" alt="${ownerName}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
            <div>
              <div style="font-size: 0.72rem; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Chủ xe uy tín</div>
              <div style="font-size: 0.92rem; font-weight: 700; color: var(--slate-900);">${ownerName}</div>
              <div style="font-size: 0.78rem; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ea580c" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ${Number(ownerRating).toFixed(1)} (${totalCars} xe đang quản lý)
              </div>
            </div>
          </div>

          <!-- Price box -->
          <div class="calc-card">
            <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.75rem;">Bảng giá tham khảo</h4>
            <div class="calc-row">
              <span>Đơn giá ngày:</span>
              <span style="font-weight: 700;">${StorageService.formatCurrency(pricePerDay)}</span>
            </div>
            <div class="calc-row">
              <span>Bảo hiểm chuyến đi MIC:</span>
              <span>100.000 đ / ngày</span>
            </div>
            <div class="calc-row">
              <span>Phí rửa xe sau chuyến:</span>
              <span style="color: var(--success); font-weight: 600;">Miễn phí</span>
            </div>
            <div class="calc-row deposit-highlight">
              <span>Cọc giữ chỗ (30%):</span>
              <span>${StorageService.formatCurrency(depositAmount)}</span>
            </div>
            <div style="margin-top: 1.15rem;">
              <button class="btn btn-primary" style="width: 100%;" onclick="App.closeCarDetailModal(); AuthService.requireLoginThen(() => BookingService.startBookingFlow(${carId}))">
                Tiến hành Đặt xe ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 3. Render Danh sách đơn thuê của tôi (Khách thuê - Giai đoạn 1 v2.0.0)
  renderMyBookings(bookings, containerId = "myBookingsListContainer", activeTab = "ALL", searchQuery = "") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const allBookings = Array.isArray(bookings) ? bookings : [];

    // Định dạng tiền tệ
    const formatMoney = (val) => {
      return typeof StorageService !== 'undefined' ? StorageService.formatCurrency(val) : (Number(val || 0).toLocaleString('vi-VN') + ' đ');
    };

    // Định dạng ngày Việt Nam
    const formatDateVN = (dStr) => {
      if (!dStr) return '';
      const parts = String(dStr).split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dStr;
    };

    // Phân loại trạng thái
    const isUrgent = (s) => s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'WAITING_PAYMENT' || s === 'APPROVED';
    const isActive = (s) => ['CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS', 'ON_HOLD'].includes(s);
    const isHistory = (s) => ['COMPLETED', 'REJECTED', 'WITHDRAWN_BY_GUEST', 'EXPIRED', 'AUTO_EXPIRED_NO_HOST_ACTION', 'CANCELLED', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST'].includes(s);

    const totalCount = allBookings.length;
    const urgentCount = allBookings.filter(b => isUrgent(b.status)).length;
    const activeCount = allBookings.filter(b => isActive(b.status)).length;
    const historyCount = allBookings.filter(b => isHistory(b.status)).length;

    const totalSpent = allBookings
      .filter(b => ['DEPOSIT_PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.deposit_amount || b.depositAmount || 0), 0);

    // Lọc theo Tab và Từ khóa tìm kiếm
    const filteredBookings = allBookings.filter(b => {
      if (activeTab === 'URGENT' && !isUrgent(b.status)) return false;
      if (activeTab === 'ACTIVE' && !isActive(b.status)) return false;
      if (activeTab === 'HISTORY' && !isHistory(b.status)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const idStr = String(b.rental_id || b.rentalId || b.id || '').toLowerCase();
        const carName = String((b.car_brand ? `${b.car_brand} ${b.car_model || ''}` : (b.carBrand ? `${b.carBrand} ${b.carModel || ''}` : b.car_name)) || '').toLowerCase();
        const plate = String(b.car_plate_number || b.carPlateNumber || b.license_plate || '').toLowerCase();
        if (!idStr.includes(q) && !carName.includes(q) && !plate.includes(q)) {
          return false;
        }
      }
      return true;
    });

    // Helper an toàn sinh ảnh xe fallback chất lượng cao
    const resolveCarImage = (bk) => {
      const url = bk.car_thumbnail_url || bk.carThumbnailUrl || bk.car_image || bk.image_url;
      if (url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) && !url.includes('5%20T%E1%BB%90T')) {
        return url;
      }
      const brand = (bk.car_brand || bk.carBrand || '').toLowerCase();
      if (brand.includes('vinfast') || brand.includes('vf')) {
        return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80';
      }
      if (brand.includes('toyota')) {
        return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=400&q=80';
      }
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80';
    };

    container.innerHTML = `
      <!-- 1. DASHBOARD THỐNG KÊ NHANH (STATS GRID) -->
      <div class="renter-stats-grid">
        <div class="stat-card">
          <div class="stat-icon teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${totalCount}</div>
            <div class="stat-label">Tổng chuyến đã đặt</div>
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
            <div class="stat-value">${urgentCount}</div>
            <div class="stat-label">Cần thanh toán / duyệt</div>
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
            <div class="stat-value">${activeCount}</div>
            <div class="stat-label">Đang diễn ra & Sắp tới</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${formatMoney(totalSpent)}</div>
            <div class="stat-label">Tổng tiền cọc đã chi</div>
          </div>
        </div>
      </div>

      <!-- 2. THANH LỌC TRẠNG THÁI & TÌM KIẾM (FILTER & SEARCH BAR) -->
      <div class="renter-filter-bar">
        <div class="renter-status-tabs">
          <button type="button" class="renter-tab-pill ${activeTab === 'ALL' ? 'active' : ''}" onclick="App.setTripFilterTab('ALL')">
            Tất cả (${totalCount})
          </button>
          <button type="button" class="renter-tab-pill ${activeTab === 'URGENT' ? 'active' : ''}" onclick="App.setTripFilterTab('URGENT')">
            <span class="tab-indicator red"></span> Cần xử lý (${urgentCount})
          </button>
          <button type="button" class="renter-tab-pill ${activeTab === 'ACTIVE' ? 'active' : ''}" onclick="App.setTripFilterTab('ACTIVE')">
            <span class="tab-indicator green"></span> Đang diễn ra (${activeCount})
          </button>
          <button type="button" class="renter-tab-pill ${activeTab === 'HISTORY' ? 'active' : ''}" onclick="App.setTripFilterTab('HISTORY')">
            <span class="tab-indicator gray"></span> Lịch sử chuyến đi (${historyCount})
          </button>
        </div>

        <div class="renter-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            id="inputTripSearch"
            placeholder="Tìm theo tên xe, biển số, mã đơn..."
            value="${searchQuery || ''}"
            oninput="App.handleTripSearch(this.value)"
          />
        </div>
      </div>

      <!-- 3. DANH SÁCH THẺ CHUYẾN ĐI (TRIP CARDS) -->
      <div class="renter-trips-list">
        ${filteredBookings.length === 0 ? `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; text-align: center; padding: 3.5rem 1.5rem; color: var(--slate-500);">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom: 10px;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem;">Không tìm thấy chuyến đi nào</div>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px; margin-bottom: 1rem;">
              ${searchQuery ? `Không có đơn nào khớp với từ khóa "${searchQuery}".` : 'Bạn chưa có chuyến đi nào trong danh mục này.'}
            </div>
            ${searchQuery || activeTab !== 'ALL' ? `
              <button class="btn btn-outline btn-sm" onclick="App.setTripFilterTab('ALL')">Xem tất cả chuyến đi</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="App.showCatalogView()">Tìm và thuê xe ngay</button>
            `}
          </div>
        ` : filteredBookings.map(bk => {
          const id = bk.rental_id || bk.rentalId || bk.id;
          const carName = (bk.car_brand ? `${bk.car_brand} ${bk.car_model || ''}` : (bk.carBrand ? `${bk.carBrand} ${bk.carModel || ''}` : bk.car_name)) || 'Xe cho thuê';
          const carImage = resolveCarImage(bk);
          const startDate = bk.start_date || bk.startDate || '';
          const endDate = bk.end_date || bk.endDate || '';
          const totalDays = bk.total_days || bk.totalDays || 1;
          const totalPrice = Number(bk.total_price || bk.totalPrice || bk.total_amount || 0);
          const depositAmount = Number(bk.deposit_amount || bk.depositAmount || Math.round(totalPrice * 0.3));
          const remainingAmount = Math.max(0, totalPrice - depositAmount);
          const note = bk.note || bk.trip_purpose || '';
          const plate = bk.car_plate_number || bk.carPlateNumber || bk.license_plate || '';
          const hostName = bk.owner_name || bk.ownerName || bk.host_name || 'Chủ xe đối tác';
          const hostPhone = bk.owner_phone || bk.ownerPhone || '0988 776 655';
          const pickupAddress = bk.pickup_address || bk.address || 'Hồ Chí Minh';
          const createdDate = bk.created_at || bk.createdAt || '';

          // Trạng thái, Badge & Hành động
          let statusBadge = '';
          let alertBanner = '';
          let actionButtons = '';
          let activeStep = 1; // 1: Đặt xe, 2: Chờ duyệt, 3: Cọc 30%, 4: Nhận xe, 5: Hoàn tất
          let isCancelledOrRejected = false;

          if (bk.status === 'PENDING' || bk.status === 'PENDING_APPROVAL') {
            statusBadge = '<span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:700;">Chờ duyệt hồ sơ</span>';
            alertBanner = `
              <div class="trip-alert-banner warning">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>Yêu cầu đang chờ chủ xe duyệt hồ sơ. Bạn chưa cần thanh toán ở bước này.</div>
              </div>
            `;
            actionButtons = `
              <button class="btn btn-outline btn-sm" style="color:#ef4444; border-color:#fca5a5; background:#fff5f5;" onclick="BookingService.cancelBooking(${id})">
                Rút yêu cầu
              </button>
            `;
            activeStep = 2;
          } else if (bk.status === 'WAITING_PAYMENT' || bk.status === 'APPROVED') {
            statusBadge = '<span class="badge badge-primary" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-weight:700;">Chủ xe đã duyệt - Chờ cọc (45 phút)</span>';
            alertBanner = `
              <div class="trip-alert-banner info">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <div>Chủ xe đã đồng ý cho thuê! Vui lòng đặt cọc 30% để xác nhận giữ chỗ trước khi hết hạn 45 phút.</div>
              </div>
            `;
            actionButtons = `
              <a href="payment.html?rental_id=${id}" class="btn btn-primary btn-sm" style="background:#0f766e; border-color:#0f766e; text-decoration:none;">
                Đặt cọc 30% ngay
              </a>
              <button class="btn btn-outline btn-sm" style="color:#ef4444; border-color:#fca5a5; background:#fff5f5;" onclick="BookingService.cancelBooking(${id})">
                Rút yêu cầu
              </button>
            `;
            activeStep = 3;
          } else if (bk.status === 'ON_HOLD') {
            statusBadge = '<span class="badge" style="background:#fef9c3; color:#a16207; border:1px solid #fef08a; font-weight:700;">Tạm hoãn giữ chỗ</span>';
            alertBanner = `
              <div class="trip-alert-banner warning">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>Chủ xe đang ưu tiên thanh toán cho lượt đặt trước cùng thời gian. Đơn sẽ tự mở lại nếu lượt trước không cọc kịp.</div>
              </div>
            `;
            actionButtons = `
              <button class="btn btn-outline btn-sm" style="color:#ef4444; border-color:#fca5a5; background:#fff5f5;" onclick="BookingService.cancelBooking(${id})">
                Rút yêu cầu
              </button>
            `;
            activeStep = 3;
          } else if (bk.status === 'CONFIRMED' || bk.status === 'DEPOSIT_PAID') {
            statusBadge = '<span class="badge badge-success" style="font-weight:700;">Đã chốt cọc 30%</span>';
            actionButtons = `
              <button class="btn btn-primary btn-sm" style="background:#059669; border-color:#059669;" onclick="App.showContactOwner('${id}')">
                Liên hệ chủ xe
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.showHandoverInfo('${id}')">
                Biên bản bàn giao
              </button>
            `;
            activeStep = 4;
          } else if (bk.status === 'IN_PROGRESS') {
            statusBadge = '<span class="badge badge-info" style="font-weight:700;">Đang trong chuyến đi</span>';
            actionButtons = `
              <button class="btn btn-primary btn-sm" style="background:#2563eb; border-color:#2563eb;" onclick="App.showHandoverInfo('${id}')">
                Biên bản bàn giao
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.showContactOwner('${id}')">
                Liên hệ chủ xe
              </button>
            `;
            activeStep = 4;
          } else if (bk.status === 'COMPLETED') {
            statusBadge = '<span class="badge badge-neutral" style="font-weight:700;">Đã hoàn thành</span>';
            actionButtons = `
              <button class="btn btn-outline btn-sm" style="color:#0f766e; border-color:#0f766e; font-weight:700;" onclick="App.showReviewPrompt('${id}')">
                Đánh giá chuyến đi
              </button>
            `;
            activeStep = 5;
          } else if (bk.status === 'REJECTED') {
            statusBadge = '<span class="badge badge-danger">Chủ xe từ chối</span>';
            const reason = bk.reject_reason || bk.rejectReason || 'Xe bận lịch đột xuất';
            alertBanner = `
              <div class="trip-alert-banner danger">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                <div>Chủ xe không thể nhận đơn này. Lý do: ${reason}</div>
              </div>
            `;
            isCancelledOrRejected = true;
          } else if (bk.status === 'WITHDRAWN_BY_GUEST') {
            statusBadge = '<span class="badge" style="background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0;">Đã rút yêu cầu</span>';
            isCancelledOrRejected = true;
          } else if (bk.status === 'EXPIRED' || bk.status === 'AUTO_EXPIRED_NO_HOST_ACTION') {
            statusBadge = '<span class="badge badge-secondary" style="background:#f1f5f9; color:#94a3b8;">Hết hạn giữ chỗ</span>';
            isCancelledOrRejected = true;
          } else if (bk.status === 'CANCELLED' || bk.status === 'CANCELLED_BY_GUEST' || bk.status === 'CANCELLED_BY_HOST') {
            statusBadge = '<span class="badge badge-danger">Đã hủy đơn</span>';
            isCancelledOrRejected = true;
          } else {
            statusBadge = `<span class="badge badge-info">${bk.status}</span>`;
          }

          // Tính toán % tiến trình Stepper
          const stepperPercent = Math.min(100, Math.max(0, (activeStep - 1) * 25));

          return `
          <div class="renter-trip-card">
            <!-- Header Thẻ -->
            <div class="renter-trip-header">
              <div class="renter-trip-header-left">
                <span class="trip-order-code">#${id}</span>
                ${plate ? `<span class="vn-license-plate">${plate}</span>` : ''}
                ${createdDate ? `<span class="trip-created-time">Ngày tạo: ${formatDateVN(createdDate)}</span>` : ''}
              </div>
              <div class="renter-trip-header-right">
                ${statusBadge}
              </div>
            </div>

            <!-- Body Thẻ (3 Cột) -->
            <div class="renter-trip-body">
              <!-- Cột 1: Ảnh Xe -->
              <div>
                <div class="trip-thumb-wrapper" style="cursor: zoom-in;" onclick="App.zoomImage('${carImage}', '${carName} (${plate})')" title="Bấm để phóng to xem ảnh">
                  <img src="${carImage}" alt="${carName}" />
                  <span class="trip-thumb-tag">${totalDays} ngày thuê</span>
                </div>
              </div>

              <!-- Cột 2: Thông Tin Hành Trình & Tiến Trình -->
              <div class="trip-main-info">
                <h3 class="trip-car-title">${carName}</h3>
                
                <div class="trip-host-info">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>Địa điểm nhận xe: <strong>${pickupAddress}</strong> · Chủ xe: <strong>${hostName}</strong> (${hostPhone})</span>
                </div>

                <div class="trip-schedule-badge-wrap">
                  <div class="rental-date-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${formatDateVN(startDate)} &rarr; ${formatDateVN(endDate)}</span>
                    <span class="rental-date-days">(${totalDays} ngày)</span>
                  </div>
                  ${note ? `
                    <div class="trip-route-note" title="Mục đích / Lộ trình chuyến đi">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                      </svg>
                      Lộ trình: ${note}
                    </div>
                  ` : ''}
                </div>

                ${alertBanner}

                <!-- Stepper 5 bước (Chỉ hiện khi đơn còn hiệu lực) -->
                ${!isCancelledOrRejected ? `
                  <div class="trip-stepper">
                    <div class="stepper-line">
                      <div class="stepper-line-fill" style="width: ${stepperPercent}%;"></div>
                    </div>
                    <div class="stepper-step ${activeStep > 1 ? 'completed' : (activeStep === 1 ? 'active' : '')}">
                      <div class="stepper-circle">1</div>
                      <div class="stepper-label">Gửi đơn</div>
                    </div>
                    <div class="stepper-step ${activeStep > 2 ? 'completed' : (activeStep === 2 ? 'active' : '')}">
                      <div class="stepper-circle">2</div>
                      <div class="stepper-label">Phê duyệt</div>
                    </div>
                    <div class="stepper-step ${activeStep > 3 ? 'completed' : (activeStep === 3 ? 'active' : '')}">
                      <div class="stepper-circle">3</div>
                      <div class="stepper-label">Đặt cọc 30%</div>
                    </div>
                    <div class="stepper-step ${activeStep > 4 ? 'completed' : (activeStep === 4 ? 'active' : '')}">
                      <div class="stepper-circle">4</div>
                      <div class="stepper-label">Nhận xe</div>
                    </div>
                    <div class="stepper-step ${activeStep === 5 ? 'completed active' : ''}">
                      <div class="stepper-circle">5</div>
                      <div class="stepper-label">Hoàn tất</div>
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- Cột 3: Hộp Tài Chính & Nút Thao Tác -->
              <div class="trip-financial-col">
                <div class="trip-financial-box">
                  <div class="trip-price-row total">
                    <span>Tổng tiền dự kiến</span>
                    <span>${formatMoney(totalPrice)}</span>
                  </div>
                  <div class="trip-price-row deposit">
                    <span>Tiền cọc 30%</span>
                    <span>${formatMoney(depositAmount)}</span>
                  </div>
                  <div class="trip-price-row remaining">
                    <span>Còn lại khi nhận xe (70%)</span>
                    <span>${formatMoney(remainingAmount)}</span>
                  </div>
                </div>

                <div class="trip-actions-container">
                  ${actionButtons}
                </div>
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
