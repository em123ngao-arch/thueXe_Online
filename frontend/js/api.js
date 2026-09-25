/**
 * DRIVESHARE — API Service Layer & Bridge
 * Tầng kết nối Frontend → Backend Spring Boot (Port 8080)
 * Hỗ trợ đồng thời:
 *   - Car Module (Phat: CRP-23, CRP-24)
 *   - Admin & User Management Module (Khiêm: CRP-19 → 22)
 *   - Auth & Token helpers (Vĩ: CRP-12 → 16)
 */

// ─────────────────────────────────────────────────────────────
// CẤU HÌNH
// ─────────────────────────────────────────────────────────────

const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/v1',
  TIMEOUT_MS: 10000
};

// ─────────────────────────────────────────────────────────────
// TOKEN HELPERS (JWT được lưu sau khi login thành công)
// ─────────────────────────────────────────────────────────────

const TokenService = {
  getToken() {
    return (
      (typeof getAccessToken === 'function' ? getAccessToken() : null) ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('ds_access_token') ||
      localStorage.getItem('driveshare_access_token') ||
      ''
    );
  },
  setToken(token) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('ds_access_token', token);
    localStorage.setItem('driveshare_access_token', token);
  },
  clearToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('ds_access_token');
    localStorage.removeItem('driveshare_access_token');
  },
  isLoggedIn() {
    return !!this.getToken();
  }
};

// ─────────────────────────────────────────────────────────────
// BACKEND HEALTH CHECK
// Ping /api/v1/health để kiểm tra backend có đang chạy không
// ─────────────────────────────────────────────────────────────

const BackendStatus = {
  _cache: null,
  _cacheTime: 0,
  CACHE_TTL_MS: 15000,

  async check() {
    const now = Date.now();
    if (this._cache && (now - this._cacheTime) < this.CACHE_TTL_MS) {
      return this._cache;
    }

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
      });
      const result = res.ok ? 'online' : 'offline';
      this._cache = result;
      this._cacheTime = now;
      return result;
    } catch (_) {
      this._cache = 'offline';
      this._cacheTime = now;
      return 'offline';
    }
  },

  invalidate() {
    this._cache = null;
    this._cacheTime = 0;
  }
};

// ─────────────────────────────────────────────────────────────
// HÀM GỌI API CHUNG
// Mọi request đều đi qua đây — tự gắn Authorization header
// ─────────────────────────────────────────────────────────────

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = TokenService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        const err = new Error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
        err.code = 'UNAUTHORIZED';
        throw err;
      }
      const errorMsg = data.message || data.error || 'Lỗi kết nối tới máy chủ';
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netErr = new Error('Không thể kết nối tới máy chủ. Hãy đảm bảo backend đang chạy tại ' + API_CONFIG.BASE_URL);
      netErr.code = 'NETWORK_ERROR';
      throw netErr;
    }
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const timeoutErr = new Error('Kết nối tới backend bị timeout. Vui lòng kiểm tra lại server.');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// CAR API — Mapping với CarController.java (CRP-23, CRP-24)
// Base path: /api/v1/cars
// ─────────────────────────────────────────────────────────────

const CarAPI = {
  /**
   * POST /api/v1/cars — Đăng xe mới (chờ Admin duyệt)
   */
  createCar(carData) {
    return apiCall('/cars', 'POST', carData);
  },

  /**
   * GET /api/v1/cars/my-cars?page=0&size=10 — Lấy danh sách xe của Owner đang đăng nhập
   */
  getMyCars(page = 0, size = 20) {
    return apiCall(`/cars/my-cars?page=${page}&size=${size}`);
  },

  /**
   * PUT /api/v1/cars/{id} — Cập nhật thông tin xe
   */
  updateCar(carId, carData) {
    return apiCall(`/cars/${carId}`, 'PUT', carData);
  },

  /**
   * PATCH /api/v1/cars/{id}/status — Bật/tắt hiển thị xe: ACTIVE ↔ INACTIVE
   */
  updateCarStatus(carId, status) {
    return apiCall(`/cars/${carId}/status`, 'PATCH', { status });
  },

  /**
   * DELETE /api/v1/cars/{id} — Xóa mềm xe
   */
  deleteCar(carId) {
    return apiCall(`/cars/${carId}`, 'DELETE');
  },

  /**
   * GET /api/v1/public/cars/{carId} — Xem chi tiết thông tin xe công khai (CRP-37)
   */
  getPublicCarDetail(carId) {
    return apiCall(`/public/cars/${carId}`, 'GET');
  },

  /**
   * GET /api/v1/public/cars/search — Tìm kiếm và lọc danh sách xe (CRP-39)
   */
  searchCars(params = {}) {
    const query = new URLSearchParams();
    if (params.location) query.append('location', params.location);
    if (params.province) query.append('province', params.province);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.minPrice) query.append('minPrice', params.minPrice);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);
    if (params.brand) query.append('brand', params.brand);
    if (params.seats) query.append('seats', params.seats);
    if (params.transmission) query.append('transmission', params.transmission);
    if (params.fuelType) query.append('fuelType', params.fuelType);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);

    const queryString = query.toString();
    return apiCall(`/public/cars/search${queryString ? '?' + queryString : ''}`, 'GET');
  }
};

// ─────────────────────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────────────────────

const AuthAPI = {
  async login(username, password) {
    const data = await apiCall('/auth/login', 'POST', { identifier: username, username, password });
    if (data.data?.accessToken || data.data?.access_token) {
      TokenService.setToken(data.data.accessToken || data.data.access_token);
      BackendStatus.invalidate();
    }
    return data;
  },

  logout() {
    TokenService.clearToken();
    BackendStatus.invalidate();
  }
};

// ─────────────────────────────────────────────────────────────
// API SERVICE (Admin & User Management — Khiêm CRP-19 → 22)
// Hỗ trợ fallback sang StorageService nếu backend offline
// ─────────────────────────────────────────────────────────────

const ApiService = {
  getAuthHeader() {
    const token = TokenService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  /**
   * API: Lấy danh sách người dùng (Admin)
   * GET /api/v1/admin/users
   */
  async getAdminUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);

    const url = `${API_CONFIG.BASE_URL}/admin/users?${query.toString()}`;

    try {
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return {
            source: 'BACKEND_API',
            ...json.data
          };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn('DriveShare: Chuyển sang Local Storage cho danh sách người dùng:', error.message);
      const localData = typeof StorageService !== 'undefined' ? StorageService.getUsers(params) : { items: [], pagination: {} };
      return {
        source: 'LOCAL_STORAGE',
        ...localData
      };
    }
  },

  /**
   * API: Lấy chi tiết một người dùng (Admin)
   * GET /api/v1/admin/users/{userId}
   */
  async getAdminUserById(userId) {
    const url = `${API_CONFIG.BASE_URL}/admin/users/${userId}`;

    try {
      const res = await this.fetchWithTimeout(url);
      if (res.status === 404) {
        let errJson = null;
        try { errJson = await res.json(); } catch(e) {}
        return {
          success: false,
          status: 404,
          errorCode: errJson?.errorCode || 'USER_NOT_FOUND',
          message: errJson?.message || 'Không tìm thấy người dùng (404 Not Found)',
          source: 'BACKEND_API'
        };
      }
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return {
            success: true,
            source: 'BACKEND_API',
            data: json.data
          };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      if (error && error.status === 404) return error;
      const localUser = typeof StorageService !== 'undefined' ? StorageService.getUserById(userId) : null;
      if (localUser) {
        return { success: true, source: 'LOCAL_STORAGE', data: localUser };
      }
      return {
        success: false,
        status: 404,
        errorCode: 'USER_NOT_FOUND',
        message: `Không tìm thấy người dùng #${userId}`,
        source: 'LOCAL_STORAGE'
      };
    }
  },

  /**
   * API: Phê duyệt hoặc từ chối hồ sơ Chủ xe (Admin)
   * PATCH /api/v1/admin/users/{userId}/approve-owner
   */
  async approveOwner(userId, data = {}) {
    const url = `${API_CONFIG.BASE_URL}/admin/users/${userId}/approve-owner`;

    try {
      const res = await this.fetchWithTimeout(url, {
        method: 'PATCH',
        body: JSON.stringify({
          verification_status: data.verification_status,
          rejection_reason: data.rejection_reason
        })
      });

      if (res.status === 403) {
        return { success: false, status: 403, errorCode: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' };
      }
      if (res.status === 400) {
        let errJson = null;
        try { errJson = await res.json(); } catch(e) {}
        return { success: false, status: 400, errorCode: errJson?.errorCode || 'VALIDATION_FAILED', message: errJson?.message || 'Dữ liệu không hợp lệ' };
      }
      if (res.ok) {
        const json = await res.json();
        return { success: true, source: 'BACKEND_API', message: json.message || 'Cập nhật trạng thái duyệt thành công', data: json.data };
      }
      throw new Error(`HTTP ${res.status}`);
    }   /**
   * API: Lấy thống kê tổng quan hệ thống (Admin)
   * GET /api/v1/admin/stats
   */
  async getAdminStats() {
    const url = `${API_CONFIG.BASE_URL}/admin/stats`;
    try {
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return { success: true, source: 'BACKEND_API', data: json.data };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('DriveShare: Lỗi lấy thống kê admin:', e.message);
      return { success: false, source: 'ERROR' };
    }
  },

  /**
   * API: Lấy danh sách xe chờ duyệt (Admin)
   * GET /api/v1/admin/cars/pending
   */
  async getAdminPendingCars(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const url = `${API_CONFIG.BASE_URL}/admin/cars/pending?${query.toString()}`;
    try {
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return { success: true, source: 'BACKEND_API', ...json.data };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('DriveShare: Lỗi lấy xe chờ duyệt:', e.message);
      return { success: false, source: 'ERROR', items: [] };
    }
  },

  /**
   * API: Lấy danh sách xe trong hệ thống (Admin)
   * GET /api/v1/admin/cars
   */
  async getAdminCars(params = {}) {
    const query = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      status: params.status || 'all',
      sortBy: params.sortBy || 'created_at',
      sortDir: params.sortDir || 'desc'
    }).toString();

    const url = `${API_CONFIG.BASE_URL}/admin/cars?${query}`;

    try {
      const res = await this.fetchWithTimeout(url, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return {
            success: true,
            source: 'BACKEND_API',
            ...json.data,
            data: json.data
          };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn('⚠️ DriveShare: Không thể kết nối Backend API khi lấy danh sách xe, sử dụng Local Storage:', error.message);
      const allCars = (typeof StorageService !== 'undefined' && StorageService.getCars) ? StorageService.getCars() : [];
      let filtered = allCars;
      if (params.status && params.status !== 'all') {
        const st = params.status.toUpperCase();
        filtered = allCars.filter(c => c.status === st || (st === 'PENDING_REVIEW' && c.status === 'PENDING_APPROVAL'));
      }
      return {
        success: true,
        source: 'LOCAL_STORAGE',
        items: filtered,
        data: {
          items: filtered,
          total_elements: filtered.length,
          total_pages: 1,
          current_page: 1,
          has_next: false,
          has_previous: false
        }
      };
    }
  },

  /**
   * API: Lấy chi tiết xe cho Admin
   * GET /api/v1/admin/cars/{carId}
   */
  async getAdminCarById(carId) {
    const url = `${API_CONFIG.BASE_URL}/admin/cars/${carId}`;
    try {
      const res = await this.fetchWithTimeout(url, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          return { success: true, source: 'BACKEND_API', data: json.data || json.result };
        }
      }
      return { success: false, message: `Lỗi HTTP ${res.status}` };
    } catch (e) {
      console.warn(`⚠️ DriveShare: Fallback Local Storage cho chi tiết xe #${carId}:`, e.message);
      if (typeof StorageService !== 'undefined' && StorageService.getCarById) {
        const car = StorageService.getCarById(carId);
        if (car) return { success: true, source: 'LOCAL_STORAGE', data: car };
      }
      return { success: false, message: e.message || 'Không tìm thấy thông tin xe' };
    }
  },

  /**
   * API: Xem chi tiết 1 xe (Admin) - alias
   */
  async getAdminCarDetail(carId) {
    return this.getAdminCarById(carId);
  },

  /**
   * API: Phê duyệt xe mới đăng (Admin)
   * PATCH / PUT /api/v1/admin/cars/{carId}/approve
   */
  async approveCar(carId, status = 'APPROVED', reason = '') {
    const url = `${API_CONFIG.BASE_URL}/admin/cars/${carId}/approve`;
    try {
      const body = { status };
      if (reason) body.reason = reason;
      const res = await this.fetchWithTimeout(url, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        return {
          success: true,
          source: 'BACKEND_API',
          message: json?.message || 'Phê duyệt xe thành công',
          data: json?.data
        };
      }
      return { success: false, message: json?.message || `Lỗi HTTP ${res.status}` };
    } catch (error) {
      console.warn(`⚠️ DriveShare: Fallback Local Storage duyệt xe #${carId}:`, error.message);
      if (typeof StorageService !== 'undefined' && StorageService.updateCarStatus) {
        StorageService.updateCarStatus(carId, 'ACTIVE');
      }
      return {
        success: true,
        source: 'LOCAL_STORAGE',
        message: `Đã duyệt xe #${carId} (Local Storage)`
      };
    }
  },

  /**
   * API: Từ chối xe mới đăng (Admin)
   * PATCH /api/v1/admin/cars/{carId}/reject
   */
  async rejectCar(carId, rejectionReason = '') {
    const url = `${API_CONFIG.BASE_URL}/admin/cars/${carId}/reject`;
    try {
      const res = await this.fetchWithTimeout(url, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason,
          rejectionReason: rejectionReason
        })
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        return {
          success: true,
          source: 'BACKEND_API',
          message: json?.message || 'Đã từ chối xe',
          data: json?.data
        };
      }
      return { success: false, message: json?.message || `Lỗi HTTP ${res.status}` };
    } catch (error) {
      console.warn(`⚠️ DriveShare: Fallback Local Storage từ chối xe #${carId}:`, error.message);
      if (typeof StorageService !== 'undefined' && StorageService.updateCarStatus) {
        StorageService.updateCarStatus(carId, 'REJECTED', rejectionReason);
      }
      return {
        success: true,
        source: 'LOCAL_STORAGE',
        message: `Đã từ chối xe #${carId} (Local Storage)`
      };
    }
  },

  /**
   * API: Lấy danh sách CMND/CCCD chờ duyệt (Admin)
   * GET /api/v1/admin/users/pending-cccd
   */
  async getAdminPendingCccd() {
    const url = `${API_CONFIG.BASE_URL}/admin/users/pending-cccd`;
    try {
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const json = await res.json();
        const list = json?.data || json?.result || [];
        return { success: true, source: 'BACKEND_API', data: list };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('DriveShare: Lỗi lấy CCCD chờ duyệt:', e.message);
      return { success: false, source: 'ERROR', data: [] };
    }
  },

  /**
   * API: Phê duyệt hoặc từ chối CMND/CCCD (Admin)
   * PUT /api/v1/admin/users/{userId}/verify-cccd
   */
  async verifyCccd(userId, status = 'APPROVED', reason = '') {
    const url = `${API_CONFIG.BASE_URL}/admin/users/${userId}/verify-cccd`;
    try {
      const body = { status };
      if (reason) body.reason = reason;
      const res = await this.fetchWithTimeout(url, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        return { success: true, source: 'BACKEND_API', message: json?.message || 'Thao tác CCCD thành công' };
      }
      return { success: false, message: json?.message || `Lỗi HTTP ${res.status}` };
    } catch (e) {
      console.warn('DriveShare: Lỗi duyệt CCCD:', e.message);
      return { success: false, message: e.message };
    }
  },

  /**
   * API: Lấy danh sách hồ sơ GPLX cần xác thực (Admin)
   * GET /api/v1/admin/users/pending-licenses
   */
  async getAdminLicenses() {
    const url = `${API_CONFIG.BASE_URL}/admin/users/pending-licenses`;
    try {
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const json = await res.json();
        const list = json?.data || json?.result || [];
        return { success: true, source: 'BACKEND_API', data: list };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('DriveShare: Lỗi lấy GPLX chờ duyệt:', e.message);
      return { success: false, source: 'ERROR', data: [] };
    }
  },

  /**
   * API: Phê duyệt hoặc từ chối Giấy phép lái xe của Khách thuê (Admin)
   * PATCH /api/v1/admin/users/{userId}/approve-license
   */
  async approveLicense(userId, statusOrData = 'verified', reason = '') {
    let verificationStatus = 'verified';
    let rejectionReason = reason;

    if (typeof statusOrData === 'object' && statusOrData !== null) {
      verificationStatus = statusOrData.verification_status || statusOrData.verificationStatus || 'verified';
      rejectionReason = statusOrData.rejection_reason || statusOrData.rejectionReason || '';
    } else if (typeof statusOrData === 'string') {
      verificationStatus = statusOrData;
    }

    const url = `${API_CONFIG.BASE_URL}/admin/users/${userId}/approve-license`;
    try {
      const body = {
        verification_status: verificationStatus,
        verificationStatus: verificationStatus
      };
      if (rejectionReason) {
        body.rejection_reason = rejectionReason;
        body.rejectionReason = rejectionReason;
      }
      const res = await this.fetchWithTimeout(url, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });

      if (res.status === 403) {
        return {
          success: false,
          status: 403,
          errorCode: 'FORBIDDEN',
          message: 'Bạn không có quyền thực hiện thao tác này (403 Forbidden)'
        };
      }

      if (res.status === 400) {
        let errJson = null;
        try { errJson = await res.json(); } catch (e) {}
        return {
          success: false,
          status: 400,
          errorCode: errJson?.errorCode || 'VALIDATION_FAILED',
          message: errJson?.message || 'Dữ liệu không hợp lệ hoặc thiếu lý do từ chối'
        };
      }

      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          source: 'BACKEND_API',
          message: json.message || 'Cập nhật trạng thái bằng lái thành công',
          data: json.data
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn(`⚠️ DriveShare: Không thể kết nối Backend API khi duyệt GPLX user #${userId}, cập nhật Local Storage:`, error.message);
      const storageStatus = verificationStatus === 'verified' ? 'APPROVED' : 'REJECTED';
      if (typeof StorageService !== 'undefined' && StorageService.updateRenterLicense) {
        StorageService.updateRenterLicense(userId, storageStatus);
      }
      return {
        success: true,
        source: 'LOCAL_STORAGE',
        message: verificationStatus === 'verified'
          ? 'Đã xác minh GPLX hợp lệ (Local Storage)'
          : 'Đã từ chối GPLX (Local Storage)'
      };
    }
  },

  /**
   * API: Lấy toàn bộ đơn đặt xe trên sàn (Admin)
   * GET /api/v1/admin/rentals
   */
  async getAdminRentals(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    const url = `${API_CONFIG.BASE_URL}/admin/rentals?${query.toString()}`;
    try {
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const json = await res.json();
        const list = json?.data || json?.result || [];
        return { success: true, source: 'BACKEND_API', data: list };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('DriveShare: Lỗi lấy danh sách đơn thuê:', e.message);
      return { success: false, source: 'ERROR', data: [] };
    }
}
};

// ─────────────────────────────────────────────────────────────
// PAYMENT API SERVICE (Chí Tín: CRP-51, CRP-52, CRP-53, CRP-54)
// ─────────────────────────────────────────────────────────────

const PaymentAPI = {
  getAuthHeaders() {
    const token = TokenService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  /**
   * CRP-51: Khởi tạo thanh toán đặt cọc 30% VietQR cho đơn thuê đã duyệt
   * POST /api/v1/rentals/{rentalId}/payment
   */
  async createDepositPayment(rentalId, data = {}) {
    const url = `${API_CONFIG.BASE_URL}/rentals/${rentalId}/payment`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể tạo thanh toán cọc' };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      console.warn('[PaymentAPI] createDepositPayment offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ thanh toán' };
    }
  },

  /**
   * CRP-52 & CRP-53: Xác nhận thanh toán cọc thành công -> chuyển đơn sang CONFIRMED
   * POST /api/v1/payments/{paymentId}/confirm
   */
  async confirmPayment(paymentId) {
    const url = `${API_CONFIG.BASE_URL}/payments/${paymentId}/confirm`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể xác nhận thanh toán' };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      console.warn('[PaymentAPI] confirmPayment offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi xác nhận thanh toán' };
    }
  },

  /**
   * CRP-52: Đánh dấu thanh toán thất bại
   * POST /api/v1/payments/{paymentId}/fail
   */
  async failPayment(paymentId, note = '') {
    const url = `${API_CONFIG.BASE_URL}/payments/${paymentId}/fail`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ note })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể cập nhật trạng thái thất bại' };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * CRP-52: Hủy giao dịch thanh toán
   * POST /api/v1/payments/{paymentId}/cancel
   */
  async cancelPayment(paymentId, note = '') {
    const url = `${API_CONFIG.BASE_URL}/payments/${paymentId}/cancel`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ note })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể hủy giao dịch' };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * Tra cứu chi tiết giao dịch thanh toán
   * GET /api/v1/payments/{paymentId}
   */
  async getPayment(paymentId) {
    const url = `${API_CONFIG.BASE_URL}/payments/${paymentId}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * Tra cứu thanh toán theo rental_id
   * GET /api/v1/payments/rental/{rentalId}
   */
  async getPaymentByRental(rentalId) {
    const url = `${API_CONFIG.BASE_URL}/payments/rental/${rentalId}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * CRP-54: Chủ xe xem thống kê doanh thu và lịch sử giao dịch
   * GET /api/v1/owner/earnings
   */
  async getOwnerEarnings() {
    const url = `${API_CONFIG.BASE_URL}/owner/earnings`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể lấy dữ liệu doanh thu' };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      console.warn('[PaymentAPI] getOwnerEarnings offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi lấy thống kê doanh thu' };
    }
  }
};

