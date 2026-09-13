/**
 * DRIVESHARE — Main Application Controller (Clean & Professional, No Emojis)
 * Điều phối sự kiện, bộ lọc tìm kiếm, chuyển đổi vai trò (Renter, Owner, Admin)
 */

const App = {
  currentFilters: {
    city: 'ALL',
    brand: 'ALL',
    seats: 'ALL',
    transmission: 'ALL',
    fuel: 'ALL',
    priceRange: 'ALL',
    sort: 'RECOMMENDED',
    keyword: ''
  },

  init() {
    // 1. Cài đặt vai trò hiện tại
    const currentRole = StorageService.getCurrentRole();
    this.switchRole(currentRole);

    // 2. Cập nhật số lượng đơn cọc trên badge
    this.updateBookingCountBadge();

    // 3. Lắng nghe sự kiện modal đóng
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeCarDetailModal();
      }
    });

    // 4. Cài đặt sự kiện tìm kiếm & lọc
    this.attachFilterEvents();
  },

  // Chuyển đổi vai trò người dùng (Khách thuê, Chủ xe, Nhân viên Quản trị)
  switchRole(role) {
    StorageService.setCurrentRole(role);

    // Update desktop pill active states
    document.getElementById('pillRoleRenter')?.classList.toggle('active', role === 'RENTER');
    document.getElementById('pillRoleOwner')?.classList.toggle('active', role === 'OWNER');
    document.getElementById('pillRoleAdmin')?.classList.toggle('active', role === 'ADMIN');

    // Update mobile pill active states
    document.getElementById('mobRoleRenter')?.classList.toggle('active', role === 'RENTER');
    document.getElementById('mobRoleOwner')?.classList.toggle('active', role === 'OWNER');
    document.getElementById('mobRoleAdmin')?.classList.toggle('active', role === 'ADMIN');

    // Sections
    const renterView = document.getElementById('renterSection');
    const myBookingsView = document.getElementById('myBookingsSection');
    const ownerView = document.getElementById('ownerSection');
    const adminView = document.getElementById('adminSection');

    if (role === 'RENTER') {
      if (renterView) renterView.style.display = 'block';
      if (myBookingsView) myBookingsView.style.display = 'none';
      if (ownerView) ownerView.style.display = 'none';
      if (adminView) adminView.style.display = 'none';
      this.applyFilters();
    } else if (role === 'OWNER') {
      if (renterView) renterView.style.display = 'none';
      if (myBookingsView) myBookingsView.style.display = 'none';
      if (ownerView) ownerView.style.display = 'block';
      if (adminView) adminView.style.display = 'none';
      OwnerService.renderOwnerPortal();
    } else if (role === 'ADMIN') {
      if (renterView) renterView.style.display = 'none';
      if (myBookingsView) myBookingsView.style.display = 'none';
      if (ownerView) ownerView.style.display = 'none';
      if (adminView) adminView.style.display = 'block';
      AdminService.renderAdminPortal();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Hiển thị màn hình "Chuyến của tôi" (cho Renter)
  showMyBookingsView() {
    const renterView = document.getElementById('renterSection');
    const myBookingsView = document.getElementById('myBookingsSection');
    const ownerView = document.getElementById('ownerSection');
    const adminView = document.getElementById('adminSection');

    if (renterView) renterView.style.display = 'none';
    if (myBookingsView) myBookingsView.style.display = 'block';
    if (ownerView) ownerView.style.display = 'none';
    if (adminView) adminView.style.display = 'none';

    // Highlight nav link
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById('navMyBookings')?.classList.add('active');

    const bookings = StorageService.getBookings();
    RenderService.renderMyBookings(bookings);
  },

  showCatalogView() {
    this.switchRole('RENTER');
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById('navCatalog')?.classList.add('active');
  },

  // Cập nhật số đơn trên navbar
  updateBookingCountBadge() {
    const badge = document.getElementById('navBookingBadgeCount');
    if (badge) {
      const bookings = StorageService.getBookings();
      const activeCount = bookings.filter(b => b.status === 'DEPOSIT_PAID' || b.status === 'PENDING').length;
      badge.textContent = activeCount;
      badge.style.display = activeCount > 0 ? 'flex' : 'none';
    }
  },

  // Lắng nghe và áp dụng bộ lọc
  attachFilterEvents() {
    // Chips lọc hãng
    document.querySelectorAll('[data-filter-brand]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-brand]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilters.brand = btn.getAttribute('data-filter-brand');
        this.applyFilters();
      });
    });

    // Chips lọc số chỗ
    document.querySelectorAll('[data-filter-seats]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-seats]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilters.seats = btn.getAttribute('data-filter-seats');
        this.applyFilters();
      });
    });

    // Dropdown truyền động
    document.getElementById('selectTransmission')?.addEventListener('change', (e) => {
      this.currentFilters.transmission = e.target.value;
      this.applyFilters();
    });

    // Dropdown nhiên liệu
    document.getElementById('selectFuel')?.addEventListener('change', (e) => {
      this.currentFilters.fuel = e.target.value;
      this.applyFilters();
    });

    // Dropdown mức giá
    document.getElementById('selectPrice')?.addEventListener('change', (e) => {
      this.currentFilters.priceRange = e.target.value;
      this.applyFilters();
    });

    // Dropdown sắp xếp
    document.getElementById('selectSort')?.addEventListener('change', (e) => {
      this.currentFilters.sort = e.target.value;
      this.applyFilters();
    });

    // Nút tìm kiếm tại Hero Search Widget
    document.getElementById('btnHeroSearch')?.addEventListener('click', () => {
      const locationSelect = document.getElementById('searchLocationSelect');
      if (locationSelect) {
        this.currentFilters.city = locationSelect.value;
      }
      this.applyFilters();
      document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' });
    });
  },

  // Áp dụng logic lọc danh sách xe
  applyFilters() {
    const allCars = StorageService.getCars();
    // Chỉ lấy xe ACTIVE cho sàn khách thuê
    let filtered = allCars.filter(c => c.status === 'ACTIVE');

    // Lọc theo thành phố
    if (this.currentFilters.city && this.currentFilters.city !== 'ALL') {
      filtered = filtered.filter(c => c.city && c.city.includes(this.currentFilters.city));
    }

    // Lọc theo Hãng
    if (this.currentFilters.brand && this.currentFilters.brand !== 'ALL') {
      filtered = filtered.filter(c => c.brand.toLowerCase() === this.currentFilters.brand.toLowerCase());
    }

    // Lọc theo Số chỗ
    if (this.currentFilters.seats && this.currentFilters.seats !== 'ALL') {
      if (this.currentFilters.seats === '4-5') {
        filtered = filtered.filter(c => c.seat_count <= 5 && c.car_type !== 'PICKUP');
      } else if (this.currentFilters.seats === '7') {
        filtered = filtered.filter(c => c.seat_count >= 7);
      } else if (this.currentFilters.seats === 'PICKUP') {
        filtered = filtered.filter(c => c.car_type === 'PICKUP');
      }
    }

    // Lọc theo Hộp số
    if (this.currentFilters.transmission && this.currentFilters.transmission !== 'ALL') {
      filtered = filtered.filter(c => c.transmission === this.currentFilters.transmission);
    }

    // Lọc theo Nhiên liệu
    if (this.currentFilters.fuel && this.currentFilters.fuel !== 'ALL') {
      filtered = filtered.filter(c => c.fuel_type === this.currentFilters.fuel);
    }

    // Lọc theo Mức giá
    if (this.currentFilters.priceRange && this.currentFilters.priceRange !== 'ALL') {
      if (this.currentFilters.priceRange === 'UNDER_800') {
        filtered = filtered.filter(c => c.price_per_day < 800000);
      } else if (this.currentFilters.priceRange === '800_1200') {
        filtered = filtered.filter(c => c.price_per_day >= 800000 && c.price_per_day <= 1200000);
      } else if (this.currentFilters.priceRange === 'OVER_1200') {
        filtered = filtered.filter(c => c.price_per_day > 1200000);
      }
    }

    // Sắp xếp
    if (this.currentFilters.sort === 'PRICE_ASC') {
      filtered.sort((a, b) => a.price_per_day - b.price_per_day);
    } else if (this.currentFilters.sort === 'PRICE_DESC') {
      filtered.sort((a, b) => b.price_per_day - a.price_per_day);
    } else if (this.currentFilters.sort === 'RATING') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (this.currentFilters.sort === 'TRIPS') {
      filtered.sort((a, b) => b.trip_count - a.trip_count);
    }

    // Cập nhật số lượng xe tìm thấy
    const countEl = document.getElementById('resultsCountNumber');
    if (countEl) countEl.textContent = filtered.length;

    RenderService.renderCarGrid(filtered);
  },

  resetFilters() {
    this.currentFilters = {
      city: 'ALL',
      brand: 'ALL',
      seats: 'ALL',
      transmission: 'ALL',
      fuel: 'ALL',
      priceRange: 'ALL',
      sort: 'RECOMMENDED',
      keyword: ''
    };

    document.querySelectorAll('[data-filter-brand]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter-brand="ALL"]')?.classList.add('active');

    document.querySelectorAll('[data-filter-seats]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter-seats="ALL"]')?.classList.add('active');

    const selectTrans = document.getElementById('selectTransmission');
    if (selectTrans) selectTrans.value = 'ALL';
    const selectFuel = document.getElementById('selectFuel');
    if (selectFuel) selectFuel.value = 'ALL';
    const selectPrice = document.getElementById('selectPrice');
    if (selectPrice) selectPrice.value = 'ALL';
    const selectSort = document.getElementById('selectSort');
    if (selectSort) selectSort.value = 'RECOMMENDED';
    const searchLocation = document.getElementById('searchLocationSelect');
    if (searchLocation) searchLocation.value = 'ALL';

    this.applyFilters();
    this.showToast('Đã đặt lại tất cả bộ lọc', 'info');
  },

  // Gợi ý thông minh tự nhiên theo lộ trình (Không có emoji)
  applyPromptSuggestion(type) {
    if (type === 'VUNG_TAU') {
      this.currentFilters.seats = '4-5';
      this.currentFilters.priceRange = 'UNDER_800';
      this.showToast('Gợi ý: Dòng xe 5 chỗ Sedan Vios / Accent tiết kiệm xăng, cốp rộng đi Vũng Tàu', 'info');
    } else if (type === 'DA_LAT_7CHO') {
      this.currentFilters.seats = '7';
      this.showToast('Gợi ý: Dòng MPV/SUV 7 chỗ Xpander / Carnival gầm cao máy khỏe vượt đèo', 'info');
    } else if (type === 'XE_DIEN') {
      this.currentFilters.fuel = 'ELECTRIC';
      this.showToast('Gợi ý: SUV điện VinFast VF8 lái êm ái, sạc miễn phí trên toàn quốc', 'info');
    } else if (type === 'TIET_KIEM') {
      this.currentFilters.priceRange = 'UNDER_800';
      this.showToast('Gợi ý: Dòng xe giá tốt dưới 800.000 đ/ngày cho chuyến đi tiết kiệm', 'info');
    }

    this.applyFilters();
    document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' });
  },

  // Modal Chi tiết xe
  openCarDetailModal(carId) {
    const car = StorageService.getCarById(carId);
    if (!car) return;

    const modalBody = document.getElementById('carDetailModalBody');
    const modalTitle = document.getElementById('carDetailModalTitle');
    if (modalTitle) modalTitle.textContent = `${car.brand} ${car.model} (${car.year})`;
    if (modalBody) modalBody.innerHTML = RenderService.renderCarDetail(car);

    document.getElementById('carDetailModalOverlay')?.classList.add('open');
  },

  closeCarDetailModal() {
    document.getElementById('carDetailModalOverlay')?.classList.remove('open');
  },

  // General Modal
  openModal(title, htmlContent) {
    const titleEl = document.getElementById('generalModalTitle');
    const bodyEl = document.getElementById('generalModalBody');
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = htmlContent;

    document.getElementById('generalModalOverlay')?.classList.add('open');
  },

  closeModal() {
    document.getElementById('generalModalOverlay')?.classList.remove('open');
  },

  // Hiển thị Biên bản giao nhận xe thực tế (Handover Record)
  showHandoverInfo(bookingId) {
    const bookings = StorageService.getBookings();
    const bk = bookings.find(b => b.id === bookingId);
    if (!bk) return;

    const html = `
      <div style="font-size: 0.88rem;">
        <div style="background: var(--primary-light); border: 1px solid var(--primary-subtle); border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 1.15rem;">
          <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem; margin-bottom: 0.2rem;">
            Biên bản bàn giao xe điện tử #${bk.id}
          </div>
          <div style="color: var(--slate-600); font-size: 0.8rem;">
            Theo quy trình bàn giao xe DriveShare: Kiểm tra chỉ số ODO, vạch xăng và chụp hiện trạng ngoại thất.
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.15rem;">
          <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 0.8rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Chỉ số ODO nhận xe:</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--slate-800); font-family: monospace;">24.560 km</div>
          </div>
          <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 0.8rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.72rem; color: var(--slate-500); font-weight: 700; text-transform: uppercase;">Mức nhiên liệu:</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary);">8 / 8 Vạch (Đầy bình)</div>
          </div>
        </div>

        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.45rem;">Hiện trạng ngoại thất & Giấy tờ:</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.35rem; color: var(--slate-700); font-size: 0.82rem; margin-bottom: 1.15rem;">
          <li>- Cavet xe và Bảo hiểm TNDS gốc kèm theo xe</li>
          <li>- Lốp dự phòng, bộ kích nâng xe, tẩu sạc nguyên vẹn</li>
          <li>- Đã chụp ảnh 4 góc xe và lưu trữ trên hệ thống DriveShare</li>
        </ul>

        <div style="text-align: right;">
          <button class="btn btn-primary btn-sm" onclick="App.closeModal()">Đã xác nhận & Đóng</button>
        </div>
      </div>
    `;

    this.openModal(`Biên bản bàn giao xe #${bookingId}`, html);
  },

  // Hiển thị popup Liên hệ Chủ xe
  showContactOwner(bookingId) {
    const bookings = StorageService.getBookings();
    const bk = bookings.find(b => b.id === bookingId);
    if (!bk) return;

    const html = `
      <div style="text-align: center; padding: 0.5rem 0;">
        <div style="width: 52px; height: 52px; background: var(--primary-light); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem auto;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <h3 style="font-size: 1.1rem; margin-bottom: 0.4rem;">Liên hệ với Chủ xe</h3>
        <p style="color: var(--slate-600); font-size: 0.86rem; margin-bottom: 1.25rem;">
          Xe <strong>${bk.car_name}</strong> · Biển số: <strong>${bk.car_plate}</strong>
        </p>

        <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-lg); padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.82rem; color: var(--slate-500);">Hotline hỗ trợ trực tiếp chủ xe:</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary); margin: 0.3rem 0;">0901 234 567</div>
          <div style="font-size: 0.8rem; color: var(--slate-500);">Chủ xe: Nguyễn Văn Hùng (Zalo / Điện thoại)</div>
        </div>

        <button class="btn btn-primary" style="width: 100%;" onclick="App.showToast('Đang kết nối tới số 0901 234 567...', 'info'); App.closeModal();">
          Gọi điện ngay
        </button>
      </div>
    `;

    this.openModal(`Thông tin chủ xe đơn #${bookingId}`, html);
  },

  showReviewPrompt(bookingId) {
    const html = `
      <div>
        <p style="color: var(--slate-600); font-size: 0.88rem; margin-bottom: 1rem;">
          Chuyến đi của bạn thế nào? Hãy chia sẻ đánh giá để giúp cộng đồng thuê xe an tâm hơn.
        </p>

        <div style="display: flex; justify-content: center; gap: 0.65rem; margin-bottom: 1.25rem;">
          <button class="btn btn-outline btn-sm" style="color: #ea580c; font-weight: 700;">5 Sao - Rất tốt</button>
          <button class="btn btn-outline btn-sm">4 Sao - Tốt</button>
          <button class="btn btn-outline btn-sm">3 Sao - Trung bình</button>
        </div>

        <div class="form-group">
          <label class="form-label">Nhận xét của bạn</label>
          <textarea class="form-control" rows="3" placeholder="Xe sạch sẽ, chủ xe bàn giao đúng giờ và hỗ trợ nhiệt tình..."></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-outline btn-sm" onclick="App.closeModal()">Để sau</button>
          <button class="btn btn-primary btn-sm" onclick="App.showToast('Cảm ơn bạn đã gửi đánh giá chuyến đi!', 'success'); App.closeModal();">
            Gửi đánh giá
          </button>
        </div>
      </div>
    `;

    this.openModal(`Đánh giá chuyến đi #${bookingId}`, html);
  },

  // Toast Notification
  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Khởi chạy ứng dụng khi DOM tải xong
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
