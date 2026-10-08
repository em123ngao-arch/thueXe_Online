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
    // 1. Cài đặt vai trò hiện tại (dựa vào JWT nếu đã đăng nhập)
    const currentRole = this._resolveInitialRole();
    this.switchRole(currentRole);

    // 2. Cập nhật số lượng đơn cọc trên badge
    this.updateBookingCountBadge();

    // 2.1. Cập nhật trạng thái đăng nhập / đăng ký trên Header
    if (typeof AuthService !== 'undefined') {
      AuthService.updateAuthUI();
    }

    // 2.2. Ẩn/hiện các pill role theo quyền của tài khoản đang đăng nhập
    this.updateNavByRole();

    // 3. Lắng nghe sự kiện modal đóng
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeCarDetailModal();
        if (typeof AuthModal !== 'undefined') {
          AuthModal.closeModal();
        }
      }
    });

    // 4. Cài đặt sự kiện tìm kiếm & lọc
    this.attachFilterEvents();

    // 5. Cài đặt ràng buộc ngày nhận/trả xe (tối thiểu cách 1 ngày, không ở quá khứ)
    this.initSearchDates();

    // 6. Kiểm tra URL param hoặc hash để mở trực tiếp Chuyến đi
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'trips' || window.location.hash === '#trips' || window.location.hash === '#my-trips') {
      setTimeout(() => this.showMyBookingsView(), 150);
    }
    const paramCarId = urlParams.get('carId');
    if (paramCarId) {
      setTimeout(() => this.openCarDetailModal(paramCarId), 250);
    }
    const paramBookCarId = urlParams.get('bookCarId');
    if (paramBookCarId) {
      setTimeout(() => {
        if (typeof AuthService !== 'undefined' && typeof BookingService !== 'undefined') {
          AuthService.requireLoginThen(() => BookingService.startBookingFlow(paramBookCarId));
        }
      }, 300);
    }
  },

  // Xác định role ban đầu dựa vào JWT (tài khoản đã đăng nhập) hoặc StorageService
  _resolveInitialRole() {
    if (typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      const user = AuthService.getCurrentUser();
      if (user) {
        const role = (typeof resolvePrimaryRole === 'function' && user.roles)
          ? resolvePrimaryRole(user.roles, user.role)
          : (user.role || (user.roles && user.roles[0]) || 'RENTER').replace('ROLE_', '').toUpperCase();
        if (role === 'ADMIN') return 'ADMIN';
        if (role === 'OWNER') return 'OWNER';
        return 'RENTER';
      }
    }
    return StorageService.getCurrentRole();
  },

  // Ẩn/hiện các pill role và nút Đăng xe theo quyền tài khoản
  updateNavByRole() {
    const isLoggedIn = typeof AuthService !== 'undefined' && AuthService.isAuthenticated();
    let userRole = 'GUEST';
    if (isLoggedIn && typeof AuthService !== 'undefined') {
      const user = AuthService.getCurrentUser();
      if (user) {
        userRole = (typeof resolvePrimaryRole === 'function' && user.roles)
          ? resolvePrimaryRole(user.roles, user.role)
          : (user.role || (user.roles && user.roles[0]) || 'RENTER').replace('ROLE_', '').toUpperCase();
      }
    }

    const pillRenter = document.getElementById('pillRoleRenter');
    const pillOwner  = document.getElementById('pillRoleOwner');
    const pillAdmin  = document.getElementById('pillRoleAdmin');
    const mobRenter  = document.getElementById('mobRoleRenter');
    const mobOwner   = document.getElementById('mobRoleOwner');
    const mobAdmin   = document.getElementById('mobRoleAdmin');
    const btnAddCar  = document.getElementById('btnAddCar');
    const navBookings = document.getElementById('navMyBookings');

    // Ẩn hoàn toàn role-switcher ở giữa theo yêu cầu người dùng
    document.querySelectorAll('.role-switcher-wrapper, .mobile-role-bar').forEach(el => {
      el.style.display = 'none';
    });
    if (pillRenter) pillRenter.style.display = 'none';
    if (pillOwner)  pillOwner.style.display  = 'none';
    if (pillAdmin)  pillAdmin.style.display  = 'none';
    if (mobRenter)  mobRenter.style.display  = 'none';
    if (mobOwner)   mobOwner.style.display   = 'none';
    if (mobAdmin)   mobAdmin.style.display   = 'none';

    if (userRole === 'RENTER') {
      if (btnAddCar)   btnAddCar.style.display   = 'none';
      if (navBookings) navBookings.style.display = '';
    } else if (userRole === 'OWNER') {
      if (btnAddCar) {
        btnAddCar.style.display = '';
        btnAddCar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>Kênh Quản lý xe`;
        btnAddCar.onclick = () => { window.location.href = 'owner-cars.html'; };
      }
      if (navBookings) navBookings.style.display = 'none';
    } else if (userRole === 'ADMIN') {
      if (btnAddCar) {
        btnAddCar.style.display = '';
        btnAddCar.innerHTML = `Vào Trang Quản Trị`;
        btnAddCar.onclick = () => { window.location.href = 'admin.html'; };
      }
      if (navBookings) navBookings.style.display = 'none';
    } else {
      if (btnAddCar)   btnAddCar.style.display   = '';
      if (navBookings) navBookings.style.display = '';
    }
  },

  // Chuyển đổi vai trò người dùng (Khách thuê, Chủ xe, Nhân viên Quản trị)
  switchRole(role) {
    // Kiểm tra quyền trước khi cho phép chuyển sang role khác
    if (typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      const user = AuthService.getCurrentUser();
      if (user) {
        const userRole = (user.role || (user.roles && user.roles[0]) || 'RENTER')
          .replace('ROLE_', '').toUpperCase();
        // Không cho phép chuyển sang role không thuộc quyền
        if (role !== userRole) {
          if (typeof showToast === 'function') {
            showToast('Bạn không có quyền truy cập phần này!', 'error');
          }
          return;
        }
      }
    } else if (typeof AuthService !== 'undefined' && !AuthService.isAuthenticated()) {
      // Chưa đăng nhập: nếu cố bấm OWNER/ADMIN thì redirect về login
      if (role === 'OWNER' || role === 'ADMIN') {
        window.location.href = 'login.html';
        return;
      }
    }

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

    // Cập nhật trạng thái menu chính
    const navCatalog = document.getElementById('navMenuCatalog');
    const navOwner = document.getElementById('navMenuOwner');
    if (navCatalog) {
      navCatalog.style.color = role === 'RENTER' ? 'var(--primary)' : 'var(--slate-600)';
      navCatalog.style.fontWeight = role === 'RENTER' ? '700' : '500';
    }
    if (navOwner) {
      navOwner.style.color = role === 'OWNER' ? 'var(--primary)' : 'var(--slate-600)';
      navOwner.style.fontWeight = role === 'OWNER' ? '700' : '500';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Hiển thị màn hình "Chuyến của tôi" (cho Renter - Giai đoạn 1 v2.0.0)
  async showMyBookingsView() {
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

    // Cập nhật nút quay về trang chủ chuyên nghiệp trên Header
    const btnHome = document.getElementById('btnHeaderReturnHome');
    if (btnHome) {
      btnHome.classList.add('highlight-back');
      btnHome.title = "Quay về trang chủ tìm xe";
      btnHome.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span id="txtHeaderHomeLabel">Về trang chủ</span>
      `;
    }

    // Ưu tiên tải từ API backend thực tế (RentalAPI.getMyRentals)
    let bookings = [];
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getMyRentals && typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      try {
        const res = await RentalAPI.getMyRentals();
        if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
          bookings = res.data;
        } else {
          bookings = StorageService.getBookings();
        }
      } catch (e) {
        console.warn('Lỗi khi tải đơn thuê từ server, sử dụng local storage:', e);
        bookings = StorageService.getBookings();
      }
    } else {
      bookings = StorageService.getBookings();
    }

    // Cập nhật thông tin khách thuê thực tế lên tiêu đề
    if (typeof AuthService !== 'undefined') {
      const u = AuthService.getCurrentUser();
      const nameEl = document.getElementById('myTripsCustomerName');
      const gplxEl = document.getElementById('myTripsCustomerGplx');
      if (nameEl && u && (u.fullName || u.name)) {
        nameEl.textContent = u.fullName || u.name;
      }
      if (gplxEl && u && (u.driverLicense || u.licenseNumber)) {
        gplxEl.textContent = `GPLX: ${u.driverLicense || u.licenseNumber} (Đã xác minh)`;
      }
    }

    this.cachedMyBookings = bookings;
    this.currentTripTab = this.currentTripTab || 'ALL';
    this.currentTripSearch = this.currentTripSearch || '';
    RenderService.renderMyBookings(bookings, 'myBookingsListContainer', this.currentTripTab, this.currentTripSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setTripFilterTab(tab) {
    this.currentTripTab = tab;
    if (this.cachedMyBookings) {
      RenderService.renderMyBookings(this.cachedMyBookings, 'myBookingsListContainer', this.currentTripTab, this.currentTripSearch || '');
    } else {
      this.showMyBookingsView();
    }
  },

  handleTripSearch(keyword) {
    this.currentTripSearch = (keyword || '').trim().toLowerCase();
    if (this.cachedMyBookings) {
      RenderService.renderMyBookings(this.cachedMyBookings, 'myBookingsListContainer', this.currentTripTab || 'ALL', this.currentTripSearch);
    }
  },

  zoomImage(src, caption = '') {
    const overlay = document.getElementById('imagePreviewModalOverlay');
    const img = document.getElementById('imagePreviewModalImg');
    const cap = document.getElementById('imagePreviewModalCaption');
    if (overlay && img) {
      img.src = src;
      if (cap) cap.textContent = caption;
      overlay.classList.add('open');
    }
  },

  showCatalogView() {
    // Ẩn Chuyến đi của tôi, hiện lại renterSection
    const renterView = document.getElementById('renterSection');
    const myBookingsView = document.getElementById('myBookingsSection');
    if (renterView) renterView.style.display = 'block';
    if (myBookingsView) myBookingsView.style.display = 'none';

    // Chỉ về Renter view nếu đây là role của user (hoặc chưa đăng nhập)
    const role = this._resolveInitialRole();
    this.switchRole(role);
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById('navCatalog')?.classList.add('active');

    // Đặt lại nút Trang chủ trên Header
    const btnHome = document.getElementById('btnHeaderReturnHome');
    if (btnHome) {
      btnHome.classList.remove('highlight-back');
      btnHome.title = "Trang chủ";
      btnHome.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span id="txtHeaderHomeLabel">Trang chủ</span>
      `;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Cập nhật số đơn trên navbar
  async updateBookingCountBadge() {
    const badge = document.getElementById('navBookingBadgeCount');
    if (!badge) return;

    let activeCount = 0;
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getMyRentals && typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      try {
        const res = await RentalAPI.getMyRentals();
        if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
          activeCount = res.data.filter(b => 
            b.status === 'PENDING' || 
            b.status === 'PENDING_APPROVAL' || 
            b.status === 'WAITING_PAYMENT' || 
            b.status === 'CONFIRMED' || 
            b.status === 'DEPOSIT_PAID' ||
            b.status === 'IN_PROGRESS'
          ).length;
          badge.textContent = activeCount;
          badge.style.display = activeCount > 0 ? 'flex' : 'none';
          return;
        }
      } catch (e) {}
    }

    const bookings = StorageService.getBookings();
    activeCount = bookings.filter(b => 
      b.status === 'DEPOSIT_PAID' || 
      b.status === 'PENDING' || 
      b.status === 'PENDING_APPROVAL' ||
      b.status === 'WAITING_PAYMENT'
    ).length;
    badge.textContent = activeCount;
    badge.style.display = activeCount > 0 ? 'flex' : 'none';
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

    // Nút tìm kiếm tại Hero Search Widget (CRP-38 & CRP-39)
    document.getElementById('btnHeroSearch')?.addEventListener('click', () => {
      const locationSelect = document.getElementById('searchLocationSelect');
      if (locationSelect) {
        this.currentFilters.city = locationSelect.value;
      }
      const startEl = document.getElementById('searchStartDate');
      const endEl = document.getElementById('searchEndDate');
      if (typeof MiotoTimePicker !== 'undefined') {
        if (MiotoTimePicker.state?.startDate) {
          this.currentFilters.startDate = MiotoTimePicker.state.startDate;
        }
        if (MiotoTimePicker.state?.endDate) {
          this.currentFilters.endDate = MiotoTimePicker.state.endDate;
        }
      } else {
        if (startEl && startEl.value) {
          this.currentFilters.startDate = startEl.value;
        }
        if (endEl && endEl.value) {
          this.currentFilters.endDate = endEl.value;
        }
      }
      this.applyFilters();
      document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' });
    });
  },

  // Cài đặt ràng buộc ngày nhận và ngày trả xe (tối thiểu cách 1 ngày, không ở quá khứ)
  initSearchDates() {
    if (typeof MiotoTimePicker !== 'undefined') {
      MiotoTimePicker.init();
      return;
    }

    const startEl = document.getElementById('searchStartDate');
    const endEl = document.getElementById('searchEndDate');
    if (!startEl || !endEl) return;

    const today = new Date();
    // Ngày nhận tối thiểu cách 1 ngày (từ ngày mai)
    const minStart = new Date(today);
    minStart.setDate(today.getDate() + 1);

    const defaultEnd = new Date(today);
    defaultEnd.setDate(today.getDate() + 3);

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const minStartStr = formatYMD(minStart);
    const defaultEndStr = formatYMD(defaultEnd);

    startEl.min = minStartStr;
    if (!startEl.value || startEl.value < minStartStr) {
      startEl.value = minStartStr;
    }

    endEl.min = startEl.value;
    if (!endEl.value || endEl.value < startEl.value) {
      endEl.value = defaultEndStr;
    }

    startEl.addEventListener('change', () => {
      if (startEl.value < minStartStr) {
        alert('Ngày nhận xe không được ở trong quá khứ và tối thiểu phải cách thời điểm hiện tại 1 ngày (từ ngày mai trở đi)!');
        startEl.value = minStartStr;
      }
      endEl.min = startEl.value;
      if (endEl.value < startEl.value) {
        endEl.value = startEl.value;
      }
    });

    endEl.addEventListener('change', () => {
      if (endEl.value < startEl.value) {
        alert('Ngày trả xe phải sau hoặc bằng ngày nhận xe!');
        endEl.value = startEl.value;
      }
    });
  },

  // Áp dụng logic lọc danh sách xe (hỗ trợ CarAPI.searchCars & fallback)
  async applyFilters() {
    let carsFromApi = null;
    if (typeof CarAPI !== 'undefined' && CarAPI.searchCars) {
      try {
        const params = { page: 0, size: 50 };
        if (this.currentFilters.city && this.currentFilters.city !== 'ALL') params.province = this.currentFilters.city;
        if (this.currentFilters.brand && this.currentFilters.brand !== 'ALL') params.brand = this.currentFilters.brand;
        if (this.currentFilters.startDate) params.startDate = this.currentFilters.startDate;
        if (this.currentFilters.endDate) params.endDate = this.currentFilters.endDate;
        if (this.currentFilters.transmission && this.currentFilters.transmission !== 'ALL') params.transmission = this.currentFilters.transmission;
        if (this.currentFilters.fuel && this.currentFilters.fuel !== 'ALL') params.fuelType = this.currentFilters.fuel;
        if (this.currentFilters.priceRange && this.currentFilters.priceRange !== 'ALL') {
          if (this.currentFilters.priceRange === 'UNDER_800') params.maxPrice = 800000;
          else if (this.currentFilters.priceRange === '800_1200') { params.minPrice = 800000; params.maxPrice = 1200000; }
          else if (this.currentFilters.priceRange === 'OVER_1200') params.minPrice = 1200000;
        }
        if (this.currentFilters.sort === 'PRICE_ASC') params.sortBy = 'price_asc';
        else if (this.currentFilters.sort === 'PRICE_DESC') params.sortBy = 'price_desc';

        if (this.currentFilters.seats === '7') {
          params.seats = 7;
        }

        const res = await CarAPI.searchCars(params);
        // Backend trả dạng: { data: { items: [...], pagination: {...} } }
        const items = res?.data?.items || res?.data?.content || res?.result?.items || [];
        if (items.length > 0) {
          carsFromApi = items;
        }
      } catch (err) {
        console.warn('CarAPI.searchCars fallback to local:', err);
      }
    }

    let filtered = [];
    if (carsFromApi) {
      filtered = [...carsFromApi];

      // Lọc theo Số chỗ
      if (this.currentFilters.seats && this.currentFilters.seats !== 'ALL') {
        if (this.currentFilters.seats === '4-5') {
          filtered = filtered.filter(c => {
            const seats = c.seats || c.seat_count || 5;
            const model = (c.model || '').toLowerCase();
            return seats <= 5 && !model.includes('ranger');
          });
        } else if (this.currentFilters.seats === '7') {
          filtered = filtered.filter(c => (c.seats || c.seat_count || 0) >= 7);
        } else if (this.currentFilters.seats === 'PICKUP') {
          filtered = filtered.filter(c => (c.model || '').toLowerCase().includes('ranger') || c.car_type === 'PICKUP');
        }
      }

      // Lọc theo Hộp số
      if (this.currentFilters.transmission && this.currentFilters.transmission !== 'ALL') {
        filtered = filtered.filter(c => c.transmission === this.currentFilters.transmission);
      }

      // Lọc theo Nhiên liệu
      if (this.currentFilters.fuel && this.currentFilters.fuel !== 'ALL') {
        filtered = filtered.filter(c => (c.fuel_type || c.fuelType) === this.currentFilters.fuel);
      }

      // Lọc theo Hãng xe
      if (this.currentFilters.brand && this.currentFilters.brand !== 'ALL') {
        filtered = filtered.filter(c => (c.brand || '').toLowerCase() === this.currentFilters.brand.toLowerCase());
      }

      // Lọc theo Địa điểm / Tỉnh thành
      if (this.currentFilters.city && this.currentFilters.city !== 'ALL') {
        filtered = filtered.filter(c => {
          const prov = (c.province || c.city || '').toLowerCase();
          return prov.includes(this.currentFilters.city.toLowerCase());
        });
      }

      // Lọc theo Mức giá
      if (this.currentFilters.priceRange && this.currentFilters.priceRange !== 'ALL') {
        if (this.currentFilters.priceRange === 'UNDER_800') {
          filtered = filtered.filter(c => Number(c.price_per_day || c.pricePerDay || 0) < 800000);
        } else if (this.currentFilters.priceRange === '800_1200') {
          filtered = filtered.filter(c => {
            const p = Number(c.price_per_day || c.pricePerDay || 0);
            return p >= 800000 && p <= 1200000;
          });
        } else if (this.currentFilters.priceRange === 'OVER_1200') {
          filtered = filtered.filter(c => Number(c.price_per_day || c.pricePerDay || 0) > 1200000);
        }
      }

      // Sắp xếp
      if (this.currentFilters.sort === 'PRICE_ASC') {
        filtered.sort((a, b) => Number(a.price_per_day || a.pricePerDay || 0) - Number(b.price_per_day || b.pricePerDay || 0));
      } else if (this.currentFilters.sort === 'PRICE_DESC') {
        filtered.sort((a, b) => Number(b.price_per_day || b.pricePerDay || 0) - Number(a.price_per_day || a.pricePerDay || 0));
      }
      console.log('[App] Sau khi lọc: còn ' + filtered.length + ' xe phù hợp');
    } else {
      // FALLBACK: chỉ dùng khi backend offline hoặc không có kết nối
      console.warn('[App] Backend không có dữ liệu xe — fallback về local StorageService');
      const allCars = StorageService.getCars();
      // Chỉ lấy xe ACTIVE cho sàn khách thuê
      filtered = allCars.filter(c => c.status === 'ACTIVE');

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
    // Reset all filter controls visually first
    document.querySelectorAll('[data-filter-brand]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter-brand="ALL"]')?.classList.add('active');
    this.currentFilters.brand = 'ALL';

    document.querySelectorAll('[data-filter-seats]').forEach(b => b.classList.remove('active'));
    const fuelSelect = document.getElementById('selectFuel');
    if (fuelSelect) fuelSelect.value = 'ALL';
    this.currentFilters.fuel = 'ALL';

    const priceSelect = document.getElementById('selectPrice');
    if (priceSelect) priceSelect.value = 'ALL';
    this.currentFilters.priceRange = 'ALL';

    if (type === 'VUNG_TAU') {
      this.currentFilters.seats = '4-5';
      this.currentFilters.priceRange = 'UNDER_800';
      document.querySelector('[data-filter-seats="4-5"]')?.classList.add('active');
      if (priceSelect) priceSelect.value = 'UNDER_800';
      this.showToast('Gợi ý: Dòng xe 4-5 chỗ Sedan / CUV tiết kiệm xăng dưới 800.000 đ/ngày đi Vũng Tàu', 'info');
    } else if (type === 'DA_LAT_7CHO') {
      this.currentFilters.seats = '7';
      document.querySelector('[data-filter-seats="7"]')?.classList.add('active');
      this.showToast('Gợi ý: Dòng MPV/SUV 7 chỗ Xpander / Fortuner / Carnival gầm cao máy khỏe cho gia đình đi Đà Lạt', 'info');
    } else if (type === 'XE_DIEN') {
      this.currentFilters.fuel = 'ELECTRIC';
      document.querySelector('[data-filter-seats="ALL"]')?.classList.add('active');
      if (fuelSelect) fuelSelect.value = 'ELECTRIC';
      this.showToast('Gợi ý: Dòng xe điện thông minh VinFast VF8 lái êm ái, sạc thông minh', 'info');
    } else if (type === 'TIET_KIEM') {
      this.currentFilters.priceRange = 'UNDER_800';
      document.querySelector('[data-filter-seats="ALL"]')?.classList.add('active');
      if (priceSelect) priceSelect.value = 'UNDER_800';
      this.showToast('Gợi ý: Dòng xe giá tốt dưới 800.000 đ/ngày cho chuyến đi tiết kiệm', 'info');
    }

    this.applyFilters();
    document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' });
  },

  // Modal Chi tiết xe
  async openCarDetailModal(carId) {
    // Ưu tiên lấy từ backend API (dữ liệu thật)
    let car = null;

    const carApi = (typeof CarAPI !== 'undefined' && CarAPI.getPublicCarDetail) ? CarAPI : null;
    if (carApi) {
      try {
        const res = await carApi.getPublicCarDetail(carId);
        if (res && (res.success || res.code === 200) && res.data) {
          car = res.data;
        }
      } catch (err) {
        console.warn('[App] API getPublicCarDetail lỗi, thử fallback local:', err);
      }
    }

    // Fallback về local chỉ khi carId khớp với data local (không dùng khi backend offline + carId từ API)
    if (!car) {
      const localCar = StorageService.getCarById(carId);
      if (localCar) {
        car = localCar;
        console.warn('[App] Dùng dữ liệu local cho xe #' + carId + ' — chỉ hiển thị, không thể đặt xe');
      }
    }

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
    const allBks = [...(this.cachedMyBookings || []), ...StorageService.getBookings()];
    const bk = allBks.find(b => b.id == bookingId || b.rental_id == bookingId || b.rentalId == bookingId);
    if (!bk) return;
    const id = bk.rental_id || bk.rentalId || bk.id;

    const html = `
      <div style="font-size: 0.88rem;">
        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 1.15rem;">
          <div style="font-weight: 700; color: #0f766e; font-size: 0.95rem; margin-bottom: 0.2rem;">
            Biên bản bàn giao xe điện tử #${id}
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
            <div style="font-size: 1.15rem; font-weight: 800; color: #0f766e;">8 / 8 Vạch (Đầy bình)</div>
          </div>
        </div>

        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.45rem;">Hiện trạng ngoại thất & Giấy tờ:</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.35rem; color: var(--slate-700); font-size: 0.82rem; margin-bottom: 1.15rem; padding-left: 0;">
          <li>- Cavet xe và Bảo hiểm TNDS gốc kèm theo xe</li>
          <li>- Lốp dự phòng, bộ kích nâng xe, tẩu sạc nguyên vẹn</li>
          <li>- Đã chụp ảnh 4 góc xe và lưu trữ trên hệ thống DriveShare</li>
        </ul>

        <div style="text-align: right;">
          <button class="btn btn-primary btn-sm" onclick="App.closeModal()">Đã xác nhận & Đóng</button>
        </div>
      </div>
    `;

    this.openModal(`Biên bản bàn giao xe #${id}`, html);
  },

  // Hiển thị popup Liên hệ Chủ xe
  showContactOwner(bookingId) {
    const allBks = [...(this.cachedMyBookings || []), ...StorageService.getBookings()];
    const bk = allBks.find(b => b.id == bookingId || b.rental_id == bookingId || b.rentalId == bookingId);
    if (!bk) return;
    const id = bk.rental_id || bk.rentalId || bk.id;
    const carName = (bk.car_brand ? `${bk.car_brand} ${bk.car_model || ''}` : (bk.carBrand ? `${bk.carBrand} ${bk.carModel || ''}` : bk.car_name)) || 'Xe cho thuê';
    const plate = bk.car_plate_number || bk.carPlateNumber || bk.license_plate || bk.car_plate || '51H-XXXX';
    const hostName = bk.owner_name || bk.ownerName || bk.host_name || 'Nguyễn Văn Hùng';
    const hostPhone = bk.owner_phone || bk.ownerPhone || '0901 234 567';

    const html = `
      <div style="text-align: center; padding: 0.5rem 0;">
        <div style="width: 52px; height: 52px; background: #f0fdfa; color: #0f766e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.85rem auto;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <h3 style="font-size: 1.1rem; margin-bottom: 0.4rem;">Liên hệ với Chủ xe</h3>
        <p style="color: var(--slate-600); font-size: 0.86rem; margin-bottom: 1.25rem;">
          Xe <strong>${carName}</strong> · Biển số: <strong>${plate}</strong>
        </p>

        <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-lg); padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.82rem; color: var(--slate-500);">Hotline hỗ trợ trực tiếp chủ xe:</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #0f766e; margin: 0.3rem 0;">${hostPhone}</div>
          <div style="font-size: 0.8rem; color: var(--slate-500);">Chủ xe: ${hostName} (Zalo / Điện thoại)</div>
        </div>

        <button class="btn btn-primary" style="width: 100%;" onclick="App.showToast('Đang kết nối tới số ${hostPhone}...', 'info'); App.closeModal();">
          Gọi điện ngay
        </button>
      </div>
    `;

    this.openModal(`Thông tin chủ xe đơn #${id}`, html);
  },

  // ─────────────────────────────────────────────────────────────
  // SPRINT 3 - NHIỆM VỤ 4: MODAL ĐÁNH GIÁ 5 SAO CHO KHÁCH THUÊ
  // ─────────────────────────────────────────────────────────────
  currentReviewRating: 5,

  async showReviewPrompt(bookingId) {
    this.currentReviewRating = 5;

    // Kiểm tra xem đơn này đã có đánh giá chưa
    let existingReview = null;
    if (typeof ReviewAPI !== 'undefined' && ReviewAPI.getRentalReview) {
      try {
        const res = await ReviewAPI.getRentalReview(bookingId);
        if (res && res.success && res.data) {
          existingReview = res.data;
        }
      } catch (_) {}
    }

    if (existingReview) {
      const starsStr = '★'.repeat(existingReview.rating) + '☆'.repeat(5 - existingReview.rating);
      const html = `
        <div style="text-align: center; padding: 10px 0;">
          <div style="font-size: 2.2rem; color: #f59e0b; margin-bottom: 6px; letter-spacing: 4px;">${starsStr}</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
            Đã đánh giá: ${existingReview.rating}/5 sao
          </div>
          ${existingReview.comment ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 0.88rem; color: #475569; font-style: italic; max-width: 460px; margin: 0 auto 14px auto;">
              "${existingReview.comment}"
            </div>
          ` : ''}
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 14px;">
            Cảm ơn bạn đã gửi phản hồi giúp nâng cao chất lượng dịch vụ trên DriveShare.
          </p>
          <button class="btn btn-primary btn-md" onclick="App.closeModal()">Đóng</button>
        </div>
      `;
      this.openModal(`Đánh giá chuyến đi #${bookingId}`, html);
      return;
    }

    const html = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p style="color: var(--slate-600); font-size: 0.88rem; margin: 0; line-height: 1.5; text-align: center;">
          Chuyến đi của bạn đã hoàn tất! Hãy chấm điểm và chia sẻ cảm nghĩ để giúp cộng đồng thuê xe an tâm hơn.
        </p>

        <!-- Widget 5 Ngôi sao tương tác (⭐⭐⭐⭐⭐) -->
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; text-align: center;">
          <div class="star-rating-box" id="starRatingBox" style="display: flex; justify-content: center; gap: 10px; font-size: 2.4rem; cursor: pointer; user-select: none;">
            <span class="star-item" data-star="1" style="color: #f59e0b; transition: transform 0.15s ease;" onclick="App.setReviewStar(1)" onmouseover="App.hoverReviewStar(1)" onmouseout="App.resetReviewStar()">★</span>
            <span class="star-item" data-star="2" style="color: #f59e0b; transition: transform 0.15s ease;" onclick="App.setReviewStar(2)" onmouseover="App.hoverReviewStar(2)" onmouseout="App.resetReviewStar()">★</span>
            <span class="star-item" data-star="3" style="color: #f59e0b; transition: transform 0.15s ease;" onclick="App.setReviewStar(3)" onmouseover="App.hoverReviewStar(3)" onmouseout="App.resetReviewStar()">★</span>
            <span class="star-item" data-star="4" style="color: #f59e0b; transition: transform 0.15s ease;" onclick="App.setReviewStar(4)" onmouseover="App.hoverReviewStar(4)" onmouseout="App.resetReviewStar()">★</span>
            <span class="star-item" data-star="5" style="color: #f59e0b; transition: transform 0.15s ease;" onclick="App.setReviewStar(5)" onmouseover="App.hoverReviewStar(5)" onmouseout="App.resetReviewStar()">★</span>
          </div>
          <div id="reviewRatingLabel" style="font-weight: 800; color: #b45309; font-size: 0.95rem; margin-top: 6px;">
            Tuyệt vời (5 / 5 sao)
          </div>
        </div>

        <!-- Ô nhận xét cảm nghĩ -->
        <div class="form-group" style="margin: 0;">
          <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">
            Nhận xét cảm nghĩ của bạn <span style="font-weight: 400; color: #64748b;">(Tùy chọn)</span>
          </label>
          <textarea id="reviewCommentText" class="form-control" rows="3" placeholder="Xe sạch sẽ, êm ái, chủ xe bàn giao đúng giờ và hỗ trợ rất nhiệt tình..." style="font-size: 0.88rem;"></textarea>
          
          <!-- Quick suggestions chips -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
            <button type="button" class="badge" style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; cursor:pointer;" onclick="App.appendReviewChip('Xe sạch sẽ & thơm tho')">+ Xe sạch sẽ</button>
            <button type="button" class="badge" style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; cursor:pointer;" onclick="App.appendReviewChip('Chủ xe thân thiện, đúng giờ')">+ Chủ xe đúng hẹn</button>
            <button type="button" class="badge" style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; cursor:pointer;" onclick="App.appendReviewChip('Tiết kiệm nhiên liệu, máy bốc')">+ Tiết kiệm xăng</button>
            <button type="button" class="badge" style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; cursor:pointer;" onclick="App.appendReviewChip('Tài xế lái xe an toàn, lịch sự')">+ Tài xế lịch sự</button>
          </div>
        </div>

        <!-- Nút Gửi đánh giá -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
          <button class="btn btn-outline btn-md" onclick="App.closeModal()">Để sau</button>
          <button id="btnSubmitReview" class="btn btn-primary btn-md" style="background: #f59e0b; border-color: #f59e0b; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;" onclick="App.submitReview(${bookingId})">
            <span>⭐</span>
            <span>Gửi Đánh Giá</span>
          </button>
        </div>
      </div>
    `;

    this.openModal(`Đánh giá chuyến đi #${bookingId}`, html);
  },

  setReviewStar(star) {
    this.currentReviewRating = star;
    this.updateStarsUI(star);
  },

  hoverReviewStar(star) {
    this.updateStarsUI(star);
  },

  resetReviewStar() {
    this.updateStarsUI(this.currentReviewRating);
  },

  updateStarsUI(star) {
    const starItems = document.querySelectorAll('#starRatingBox .star-item');
    if (!starItems || starItems.length === 0) return;

    const labels = {
      1: 'Rất không hài lòng (1 / 5 sao)',
      2: 'Chưa hài lòng (2 / 5 sao)',
      3: 'Bình thường (3 / 5 sao)',
      4: 'Hài lòng (4 / 5 sao)',
      5: 'Tuyệt vời (5 / 5 sao)'
    };

    starItems.forEach((el, idx) => {
      const val = idx + 1;
      if (val <= star) {
        el.textContent = '★';
        el.style.color = '#f59e0b';
        el.style.transform = 'scale(1.1)';
      } else {
        el.textContent = '☆';
        el.style.color = '#cbd5e1';
        el.style.transform = 'scale(1.0)';
      }
    });

    const lbl = document.getElementById('reviewRatingLabel');
    if (lbl) {
      lbl.textContent = labels[star] || `${star} / 5 sao`;
    }
  },

  appendReviewChip(text) {
    const txt = document.getElementById('reviewCommentText');
    if (!txt) return;
    if (txt.value.trim()) {
      txt.value += ', ' + text;
    } else {
      txt.value = text;
    }
  },

  async submitReview(bookingId) {
    const btn = document.getElementById('btnSubmitReview');
    const comment = document.getElementById('reviewCommentText')?.value.trim() || '';
    const rating = this.currentReviewRating || 5;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi đánh giá...';
    }

    try {
      if (typeof ReviewAPI !== 'undefined' && ReviewAPI.createReview) {
        const res = await ReviewAPI.createReview(bookingId, { rating, comment });
        if (res && (res.success || res.code === 200)) {
          this.showToast(`Cảm ơn bạn đã gửi đánh giá ${rating} sao cho chuyến đi #${bookingId}!`, 'success');
          if (typeof NotificationAPI !== 'undefined' && NotificationAPI.addNotification) {
            NotificationAPI.addNotification('Đánh giá thành công ⭐', `Bạn đã gửi đánh giá ${rating} sao cho đơn thuê #${bookingId}.`, 'REVIEW_SENT', bookingId);
          }
          this.closeModal();
          // Cập nhật lại view chuyến đi
          this.showMyBookingsView();
          return;
        } else {
          alert(res.message || 'Không thể gửi đánh giá. Vui lòng thử lại!');
        }
      } else {
        this.showToast(`Cảm ơn bạn đã gửi đánh giá ${rating} sao!`, 'success');
        this.closeModal();
        this.showMyBookingsView();
      }
    } catch (err) {
      console.error('Lỗi khi submit review:', err);
      this.showToast('Lỗi kết nối khi gửi đánh giá!', 'error');
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>⭐</span><span>Gửi Đánh Giá</span>';
    }
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
  // QUAN TRỌNG: Trước khi init, ép đồng bộ role từ JWT vào localStorage
  // Tránh trường hợp localStorage còn lưu role cũ (ADMIN/OWNER) từ session trước
  if (typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
    const user = AuthService.getCurrentUser();
    if (user) {
      const jwtRole = (typeof resolvePrimaryRole === 'function' && user.roles)
        ? resolvePrimaryRole(user.roles, user.role)
        : (user.role || (user.roles && user.roles[0]) || 'RENTER').replace('ROLE_', '').toUpperCase();
      // Ép overwrite CURRENT_ROLE theo role thật của user hiện tại
      localStorage.setItem('driveshare_current_role', jwtRole);
    }
  } else {
    // Chưa đăng nhập: reset về RENTER
    localStorage.setItem('driveshare_current_role', 'RENTER');
  }

  App.init();
});
