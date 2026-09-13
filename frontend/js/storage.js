/**
 * DRIVESHARE — Storage Manager
 * Quản lý trạng thái và lưu trữ cục bộ LocalStorage với dự phòng Initial Seed Data
 */

const STORAGE_KEYS = {
  CARS: 'driveshare_cars_v2',
  BOOKINGS: 'driveshare_bookings_v2',
  RENTERS: 'driveshare_renters_v2',
  OWNERS: 'driveshare_owners_v2',
  CURRENT_ROLE: 'driveshare_current_role',
  CURRENT_RENTER: 'driveshare_current_renter',
  CURRENT_OWNER: 'driveshare_current_owner'
};

const StorageService = {
  // Khởi tạo dữ liệu nếu chưa có trong LocalStorage
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CARS)) {
      localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(INITIAL_DATA.cars));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_DATA.bookings));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RENTERS)) {
      localStorage.setItem(STORAGE_KEYS.RENTERS, JSON.stringify(INITIAL_DATA.renters));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OWNERS)) {
      localStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(INITIAL_DATA.owners));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'RENTER'); // RENTER | OWNER | ADMIN
    }
  },

  // Lấy vai trò hiện tại
  getCurrentRole() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || 'RENTER';
  },

  setCurrentRole(role) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role);
  },

  // Xe
  getCars() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CARS);
      return data ? JSON.parse(data) : INITIAL_DATA.cars;
    } catch (e) {
      return INITIAL_DATA.cars;
    }
  },

  getCarById(id) {
    const cars = this.getCars();
    return cars.find(c => String(c.id) === String(id));
  },

  saveCar(carData) {
    const cars = this.getCars();
    const newCar = {
      ...carData,
      id: Date.now(),
      status: 'PENDING_APPROVAL', // Chờ nhân viên duyệt theo luồng nghiệp vụ
      rating: 5.0,
      trip_count: 0
    };
    cars.unshift(newCar);
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    return newCar;
  },

  updateCarStatus(carId, status, rejectionReason = '') {
    const cars = this.getCars();
    const index = cars.findIndex(c => String(c.id) === String(carId));
    if (index !== -1) {
      cars[index].status = status;
      if (rejectionReason) {
        cars[index].rejection_reason = rejectionReason;
      }
      localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
      return cars[index];
    }
    return null;
  },

  // Đơn đặt xe (Bookings)
  getBookings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : INITIAL_DATA.bookings;
    } catch (e) {
      return INITIAL_DATA.bookings;
    }
  },

  createBooking(bookingData) {
    const bookings = this.getBookings();
    const newBooking = {
      ...bookingData,
      id: 'BK-' + Math.floor(10000 + Math.random() * 90000),
      created_at: new Date().toLocaleString('vi-VN')
    };
    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return newBooking;
  },

  updateBookingStatus(bookingId, status) {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      bookings[index].status = status;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return bookings[index];
    }
    return null;
  },

  // Khách thuê & GPLX
  getRenters() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RENTERS);
      return data ? JSON.parse(data) : INITIAL_DATA.renters;
    } catch (e) {
      return INITIAL_DATA.renters;
    }
  },

  getCurrentRenter() {
    const renters = this.getRenters();
    return renters[0] || { id: 1, name: 'Lê Hoàng Nam', phone: '0988 776 655', license_status: 'APPROVED' };
  },

  updateRenterLicense(renterId, status) {
    const renters = this.getRenters();
    const index = renters.findIndex(r => String(r.id) === String(renterId));
    if (index !== -1) {
      renters[index].license_status = status;
      localStorage.setItem(STORAGE_KEYS.RENTERS, JSON.stringify(renters));
      return renters[index];
    }
    return null;
  },

  // Chủ xe
  getOwners() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OWNERS);
      return data ? JSON.parse(data) : INITIAL_DATA.owners;
    } catch (e) {
      return INITIAL_DATA.owners;
    }
  },

  getCurrentOwner() {
    const owners = this.getOwners();
    return owners[0]; // Mặc định Anh Hùng (Quận 1)
  },

  // Định dạng tiền tệ VND
  formatCurrency(amount) {
    if (!amount && amount !== 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
};

// Kích hoạt khởi tạo
StorageService.init();
