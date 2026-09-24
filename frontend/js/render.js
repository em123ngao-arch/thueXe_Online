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
        const depositAmount = Math.round(car.price_per_day * 0.3);
        const fuelText =
          car.fuel_type === "ELECTRIC"
            ? "Xe điện (EV)"
            : car.fuel_type === "DIESEL"
              ? "Dầu Diesel"
              : "Xăng";
        const transText =
          car.transmission === "AUTOMATIC" ? "Tự động" : "Số sàn";

        return `
        <div class="car-card animate-fade-in" data-id="${car.id}">
          <div class="car-card-img-wrapper">
            <img class="car-card-img" src="${car.image_url}" alt="${car.brand} ${car.model}" loading="lazy" />
            <div class="car-top-badges">
              <span class="car-tag-instant">Giao tận nơi</span>
              <span class="car-tag-fuel">${fuelText}</span>
            </div>
          </div>
          
          <div class="car-card-body">
            <div class="car-brand-model">
              <h3 class="car-title">${car.brand} ${car.model}</h3>
              <span class="car-year">${car.year}</span>
            </div>
            
            <div class="car-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${car.district ? `${car.district}, ${car.city}` : car.pickup_address}</span>
            </div>

            <div class="car-specs-row">
              <span class="spec-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                ${car.seat_count} chỗ
              </span>
              <span class="spec-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 7v5l3 3"></path>
                </svg>
                ${transText}
              </span>
              <span class="spec-item">
                ${car.fuel_consumption}
              </span>
            </div>

            <div class="car-rating-trip">
              <span class="rating-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ea580c" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                ${car.rating.toFixed(1)}
              </span>
              <span class="trip-count">· ${car.trip_count} chuyến thành công</span>
            </div>

            <div class="car-card-footer">
              <div class="car-price-box">
                <span class="car-price-amount">${StorageService.formatCurrency(car.price_per_day)}</span>
                <span class="car-price-unit">/ ngày</span>
                <span class="car-price-deposit">Cọc 30%: ${StorageService.formatCurrency(depositAmount)}</span>
              </div>
              <div class="car-card-actions">
                <button class="btn btn-outline btn-sm" onclick="AuthService.requireLoginThen(() => App.openCarDetailModal(${car.id}))">Chi tiết</button>
                <button class="btn btn-primary btn-sm" onclick="AuthService.requireLoginThen(() => BookingService.startBookingFlow(${car.id}))">Đặt xe</button>
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
    const carId = car.carId || car.id;
    const pricePerDay = car.pricePerDay || car.price_per_day || 0;
    const depositAmount = Math.round(pricePerDay * 0.3);
    const plateNumber = car.plateNumberMasked || car.license_plate || car.plate_number || "51A-XXX.XX";
    const city = car.province || car.city || "TP.HCM";
    const pickupAddress = car.address || car.pickup_address || "Địa điểm nhận xe";
    const imageUrl = car.thumbnailUrl || car.image_url || (car.images && car.images.length > 0 ? car.images[0].imageUrl : '');

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
              <h2 style="font-size: 1.35rem; color: var(--slate-900);">${car.brand} ${car.model} (${car.year})</h2>
              <p style="color: var(--slate-500); font-size: 0.88rem; margin-top: 0.2rem;">Biển số: <strong>${plateNumber}</strong> · Đăng ký tại ${city}</p>
            </div>
            <span class="badge badge-success">Sẵn sàng đón khách</span>
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

  // 3. Render Danh sách đơn thuê của tôi (Khách thuê)
  renderMyBookings(bookings, containerId = "myBookingsListContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!bookings || bookings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3>Bạn chưa có chuyến đi nào</h3>
          <p>Hãy chọn cho mình một chiếc xe ưng ý để chuẩn bị cho chuyến hành trình sắp tới.</p>
          <button class="btn btn-primary btn-sm" onclick="App.switchRole('RENTER')">Tìm xe ngay</button>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings
      .map((bk) => {
        let statusBadge = "";
        if (bk.status === "DEPOSIT_PAID") {
          statusBadge = '<span class="badge badge-success">Đã cọc 30%</span>';
        } else if (bk.status === "COMPLETED") {
          statusBadge =
            '<span class="badge badge-neutral">Đã hoàn thành</span>';
        } else if (bk.status === "PENDING") {
          statusBadge =
            '<span class="badge badge-warning">Chờ chủ xe duyệt</span>';
        } else if (bk.status === "CANCELLED") {
          statusBadge = '<span class="badge badge-danger">Đã hủy đơn</span>';
        } else {
          statusBadge = `<span class="badge badge-info">${bk.status}</span>`;
        }

        return `
        <div class="booking-item-card animate-fade-in">
          <div class="booking-car-thumb">
            <img src="${bk.car_image}" alt="${bk.car_name}" />
          </div>
          <div class="booking-details">
            <div class="booking-top-row">
              <span class="booking-code">Mã đơn: #${bk.id}</span>
              ${statusBadge}
            </div>

            <h3 class="booking-car-name">${bk.car_name}</h3>

            <div class="booking-schedule-row">
              <span class="booking-schedule-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Từ: <strong>${bk.start_time}</strong>
              </span>
              <span class="booking-schedule-item">
                Đến: <strong>${bk.end_time}</strong> (${bk.total_days} ngày)
              </span>
              <span class="booking-schedule-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${bk.pickup_address}
              </span>
            </div>

            <div class="booking-financial-row">
              <div class="booking-amount-box">
                <div>
                  <span style="font-size: 0.76rem; color: var(--slate-500);">Tổng tiền:</span>
                  <div style="font-weight: 700; color: var(--slate-900); font-size: 0.95rem;">
                    ${StorageService.formatCurrency(bk.total_amount)}
                  </div>
                </div>
                <div>
                  <span style="font-size: 0.76rem; color: var(--primary);">Đã cọc 30%:</span>
                  <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">
                    ${StorageService.formatCurrency(bk.deposit_amount)}
                  </div>
                </div>
              </div>

              <div class="booking-actions">
                ${
                  bk.status === "DEPOSIT_PAID"
                    ? `
                  <button class="btn btn-outline btn-sm" onclick="App.showHandoverInfo('${bk.id}')">
                    Biên bản giao xe
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="App.showContactOwner('${bk.id}')">
                    Liên hệ Chủ xe
                  </button>
                `
                    : ""
                }
                ${
                  bk.status === "COMPLETED"
                    ? `
                  <button class="btn btn-outline btn-sm" onclick="App.showReviewPrompt('${bk.id}')">
                    Đánh giá chuyến đi
                  </button>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  },
};
