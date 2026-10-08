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
  },

  /**
   * POST /api/v1/cars/{carId}/photos — Tải lên hình ảnh xe (CRP-33)
   */
  async uploadCarPhoto(carId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = typeof TokenService !== 'undefined' ? TokenService.getToken() : localStorage.getItem('access_token');
    const res = await fetch(`http://localhost:8080/api/v1/cars/${carId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw data || new Error(`Upload ảnh xe thất bại (HTTP ${res.status})`);
    }
    return data;
  },

  /**
   * GET /api/v1/cars/{carId}/photos — Lấy danh sách ảnh của xe
   */
  getCarPhotos(carId) {
    return apiCall(`/cars/${carId}/photos`, 'GET');
  },

  /**
   * DELETE /api/v1/cars/{carId}/photos/{photoId} — Xóa ảnh của xe
   */
  deleteCarPhoto(carId, photoId) {
    return apiCall(`/cars/${carId}/photos/${photoId}`, 'DELETE');
  },

  /**
   * PATCH /api/v1/cars/{carId}/photos/{photoId}/set-primary — Đặt làm ảnh đại diện xe
   */
  setCarThumbnail(carId, photoId) {
    return apiCall(`/cars/${carId}/photos/${photoId}/set-primary`, 'PATCH');
  },

  /**
   * GET /api/v1/cars/{carId}/calendar — Lấy toàn bộ lịch xe và ngày bận (CRP-40)
   */
  getCarCalendar(carId, fromDate = null) {
    const query = fromDate ? `?fromDate=${fromDate}` : '';
    return apiCall(`/cars/${carId}/calendar${query}`, 'GET');
  },

  /**
   * POST /api/v1/cars/{carId}/calendar/blocks — Chủ xe chặn ngày bận (CRP-40)
   */
  addCalendarBlock(carId, blockData) {
    return apiCall(`/cars/${carId}/calendar/blocks`, 'POST', blockData);
  },

  /**
   * DELETE /api/v1/cars/{carId}/calendar/blocks/{blockId} — Chủ xe mở khóa ngày bận (CRP-40)
   */
  removeCalendarBlock(carId, blockId) {
    return apiCall(`/cars/${carId}/calendar/blocks/${blockId}`, 'DELETE');
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
    } catch (e) {
      console.warn('DriveShare: Lỗi duyệt hồ sơ chủ xe:', e.message);
      return { success: false, source: 'ERROR', message: e.message };
    }
  },

  /**
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

// ─────────────────────────────────────────────────────────────
// RENTAL API SERVICE (CRP-41, CRP-42, CRP-44, CRP-46 - Giai đoạn 1 v2.0.0)
// ─────────────────────────────────────────────────────────────

const RentalAPI = {
  getAuthHeaders() {
    const token = TokenService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  /**
   * CRP-41 & Giai đoạn 1: Gửi yêu cầu thuê xe mới (POST /api/v1/rentals)
   */
  async createRental(rentalData) {
    const url = `${API_CONFIG.BASE_URL}/rentals`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(rentalData)
      });
      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          errorCode: json.errorCode || json.code,
          message: json.message || 'Không thể tạo yêu cầu thuê xe'
        };
      }
      return { success: true, data: json.data || json };
    } catch (err) {
      console.warn('[RentalAPI] createRental offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi tạo yêu cầu thuê xe' };
    }
  },

  /**
   * CRP-44: Khách thuê xem danh sách đơn thuê của chính mình (GET /api/v1/rentals/me)
   */
  async getMyRentals() {
    const url = `${API_CONFIG.BASE_URL}/rentals/me`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể lấy danh sách đơn thuê' };
      }
      return { success: true, data: json.data || [] };
    } catch (err) {
      console.warn('[RentalAPI] getMyRentals offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * CRP-44 & Giai đoạn 1: Khách thuê rút / hủy yêu cầu khi đang chờ duyệt (PUT /api/v1/rentals/{id}/cancel)
   */
  async cancelRental(rentalId) {
    const url = `${API_CONFIG.BASE_URL}/rentals/${rentalId}/cancel`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể hủy yêu cầu thuê xe' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      console.warn('[RentalAPI] cancelRental offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi hủy yêu cầu' };
    }
  },

  /**
   * CRP-46: Chủ xe xem danh sách yêu cầu gửi đến xe của mình (GET /api/v1/owner/rentals)
   */
  async getOwnerRentals(status = null) {
    const url = `${API_CONFIG.BASE_URL}/owner/rentals${status ? '?status=' + status : ''}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể lấy danh sách yêu cầu thuê' };
      }
      return { success: true, data: json.data || [] };
    } catch (err) {
      console.warn('[RentalAPI] getOwnerRentals offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  /**
   * CRP-47 & Giai đoạn 2 & 3: Chủ xe duyệt yêu cầu thuê xe (PUT /api/v1/owner/rentals/{id}/approve)
   */
  async approveRental(rentalId) {
    if (!rentalId || rentalId === 'undefined') {
      console.error('[RentalAPI] approveRental invalid rentalId:', rentalId);
      return { success: false, message: 'Mã đơn thuê không hợp lệ' };
    }
    const url = `${API_CONFIG.BASE_URL}/owner/rentals/${rentalId}/approve`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể duyệt yêu cầu thuê' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      console.warn('[RentalAPI] approveRental offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi duyệt yêu cầu' };
    }
  },

  /**
   * CRP-48: Chủ xe từ chối yêu cầu thuê xe (PUT /api/v1/owner/rentals/{id}/reject)
   */
  async rejectRental(rentalId, reason) {
    if (!rentalId || rentalId === 'undefined') {
      console.error('[RentalAPI] rejectRental invalid rentalId:', rentalId);
      return { success: false, message: 'Mã đơn thuê không hợp lệ' };
    }
    const url = `${API_CONFIG.BASE_URL}/owner/rentals/${rentalId}/reject`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể từ chối yêu cầu thuê' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      console.warn('[RentalAPI] rejectRental offline/error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi từ chối yêu cầu' };
    }
  },

  /**
   * Giai đoạn 4: Bắt đầu chuyến đi (bàn giao xe) -> chuyển sang IN_PROGRESS
   * PUT /api/v1/owner/rentals/{id}/start
   */
  async startRental(rentalId) {
    if (!rentalId || rentalId === 'undefined') {
      console.error('[RentalAPI] startRental invalid rentalId:', rentalId);
      return { success: false, message: 'Mã đơn thuê không hợp lệ' };
    }
    const url = `${API_CONFIG.BASE_URL}/owner/rentals/${rentalId}/start`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể bắt đầu chuyến đi' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      console.warn('[RentalAPI] startRental error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi bắt đầu chuyến đi' };
    }
  },

  /**
   * Giai đoạn 4: Hoàn tất chuyến đi (khách trả xe) -> chuyển sang COMPLETED
   * PUT /api/v1/owner/rentals/{id}/complete
   */
  async completeRental(rentalId) {
    if (!rentalId || rentalId === 'undefined') {
      console.error('[RentalAPI] completeRental invalid rentalId:', rentalId);
      return { success: false, message: 'Mã đơn thuê không hợp lệ' };
    }
    const url = `${API_CONFIG.BASE_URL}/owner/rentals/${rentalId}/complete`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể hoàn tất chuyến đi' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      console.warn('[RentalAPI] completeRental error:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi hoàn tất chuyến đi' };
    }
  },

  /**
   * Sprint 3: Bàn giao xe (Check-in cho chủ xe)
   * POST /api/v1/owner/rentals/{id}/check-in
   * DTO: { odoMeter, fuelLevel, images, notes }
   */
  async checkInRental(rentalId, checkInData) {
    if (!rentalId || rentalId === 'undefined') {
      return { success: false, message: 'Mã đơn thuê không hợp lệ' };
    }
    const url = `${API_CONFIG.BASE_URL}/owner/rentals/${rentalId}/check-in`;
    const payload = {
      odoMeter: Number(checkInData.odoMeter || 0),
      fuelLevel: Number(checkInData.fuelLevel ?? 100),
      images: checkInData.images || '',
      notes: checkInData.notes || ''
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể lập biên bản bàn giao xe' };
      }
      // Lưu lại cache local inspection
      this.saveLocalInspection(rentalId, 'CHECK_IN', payload);
      return { success: true, data: json.data || json };
    } catch (err) {
      console.warn('[RentalAPI] checkInRental offline/fallback:', err);
      // Fallback local data
      this.saveLocalInspection(rentalId, 'CHECK_IN', payload);
      if (typeof StorageService !== 'undefined' && StorageService.updateBookingStatus) {
        StorageService.updateBookingStatus(rentalId, 'IN_PROGRESS');
      }
      return { success: true, data: payload, isMock: true };
    }
  },

  /**
   * Sprint 3: Nghiệm thu trả xe (Check-out cho chủ xe)
   * POST /api/v1/owner/rentals/{id}/check-out
   * DTO: { odoMeter, fuelLevel, extraFee, extraFeeReason, images, notes }
   */
  async checkOutRental(rentalId, checkOutData) {
    if (!rentalId || rentalId === 'undefined') {
      return { success: false, message: 'Mã đơn thuê không hợp lệ' };
    }
    const url = `${API_CONFIG.BASE_URL}/owner/rentals/${rentalId}/check-out`;
    const payload = {
      odoMeter: Number(checkOutData.odoMeter || 0),
      fuelLevel: Number(checkOutData.fuelLevel ?? 100),
      extraFee: Number(checkOutData.extraFee || 0),
      extraFeeReason: checkOutData.extraFeeReason || '',
      images: checkOutData.images || '',
      notes: checkOutData.notes || ''
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể lập biên bản nghiệm thu trả xe' };
      }
      this.saveLocalInspection(rentalId, 'CHECK_OUT', payload);
      return { success: true, data: json.data || json };
    } catch (err) {
      console.warn('[RentalAPI] checkOutRental offline/fallback:', err);
      this.saveLocalInspection(rentalId, 'CHECK_OUT', payload);
      if (typeof StorageService !== 'undefined' && StorageService.updateBookingStatus) {
        StorageService.updateBookingStatus(rentalId, 'COMPLETED');
      }
      return { success: true, data: payload, isMock: true };
    }
  },

  /**
   * Sprint 3: Xem danh sách biên bản giao nhận xe (Check-in & Check-out)
   * GET /api/v1/rentals/{id}/inspections hoặc /api/v1/owner/rentals/{id}/inspections
   */
  async getRentalInspections(rentalId) {
    if (!rentalId) return { success: false, data: [] };
    const url = `${API_CONFIG.BASE_URL}/rentals/${rentalId}/inspections`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.data) {
        return { success: true, data: json.data };
      }
    } catch (err) {
      console.warn('[RentalAPI] getRentalInspections offline fallback:', err);
    }
    const local = this.getLocalInspections(rentalId);
    return { success: true, data: local, isMock: true };
  },

  saveLocalInspection(rentalId, type, data) {
    try {
      const key = `ds_inspections_${rentalId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const item = {
        inspectionType: type,
        odoMeter: data.odoMeter,
        fuelLevel: data.fuelLevel,
        extraFee: data.extraFee || 0,
        extraFeeReason: data.extraFeeReason || '',
        images: data.images || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString()
      };
      const filtered = existing.filter(i => i.inspectionType !== type);
      filtered.push(item);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (_) {}
  },

  getLocalInspections(rentalId) {
    try {
      const key = `ds_inspections_${rentalId}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (_) {
      return [];
    }
  }
};

// ─────────────────────────────────────────────────────────────
// SPRINT 3: REVIEW & RATINGS API (Khách thuê đánh giá 5 sao)
// ─────────────────────────────────────────────────────────────

const ReviewAPI = {
  getAuthHeaders() {
    const token = TokenService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  /**
   * POST /api/v1/rentals/{rentalId}/reviews
   * DTO: { rating (1-5), comment }
   */
  async createReview(rentalId, reviewData) {
    if (!rentalId) {
      return { success: false, message: 'Mã đơn thuê không hợp lệ' };
    }
    const url = `${API_CONFIG.BASE_URL}/rentals/${rentalId}/reviews`;
    const payload = {
      rating: Math.max(1, Math.min(5, Number(reviewData.rating || 5))),
      comment: reviewData.comment ? reviewData.comment.trim() : ''
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, status: res.status, message: json.message || 'Không thể gửi đánh giá chuyến đi' };
      }
      this.saveLocalReview(rentalId, payload);
      return { success: true, data: json.data || json };
    } catch (err) {
      console.warn('[ReviewAPI] createReview fallback to local:', err);
      this.saveLocalReview(rentalId, payload);
      return { success: true, data: payload, isMock: true };
    }
  },

  /**
   * GET /api/v1/rentals/{rentalId}/reviews
   */
  async getRentalReview(rentalId) {
    if (!rentalId) return { success: false, data: null };
    const url = `${API_CONFIG.BASE_URL}/rentals/${rentalId}/reviews`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.data) {
        return { success: true, data: json.data };
      }
    } catch (_) {}
    const local = this.getLocalReview(rentalId);
    return { success: !!local, data: local };
  },

  /**
   * GET /api/v1/public/cars/{carId}/reviews?page=0&size=10
   */
  async getCarReviews(carId, page = 0, size = 10) {
    if (!carId) return { success: true, data: { content: [], totalElements: 0 } };
    const url = `${API_CONFIG.BASE_URL}/public/cars/${carId}/reviews?page=${page}&size=${size}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      const json = await res.json();
      if (res.ok && json.data) {
        return { success: true, data: json.data };
      }
    } catch (_) {}
    return { success: true, data: { content: [], totalElements: 0 } };
  },

  saveLocalReview(rentalId, data) {
    try {
      const key = `ds_review_${rentalId}`;
      const reviewObj = {
        rentalId,
        rating: data.rating,
        comment: data.comment,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(reviewObj));
    } catch (_) {}
  },

  getLocalReview(rentalId) {
    try {
      const key = `ds_review_${rentalId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
};

// ─────────────────────────────────────────────────────────────
// SPRINT 3: NOTIFICATION API & NOTIFICATION CENTER
// ─────────────────────────────────────────────────────────────

const NotificationAPI = {
  getAuthHeaders() {
    const token = TokenService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  /**
   * GET /api/v1/notifications/my-notifications
   */
  async getMyNotifications() {
    const url = `${API_CONFIG.BASE_URL}/notifications/my-notifications`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.data) {
        return { success: true, data: json.data };
      }
    } catch (_) {}
    return { success: true, data: this.getLocalNotifications(), isMock: true };
  },

  /**
   * PUT /api/v1/notifications/{id}/read
   */
  async markAsRead(notificationId) {
    const url = `${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok) {
        this.setLocalNotificationRead(notificationId);
        return { success: true, data: json.data };
      }
    } catch (_) {}
    this.setLocalNotificationRead(notificationId);
    return { success: true };
  },

  getLocalNotifications() {
    try {
      const raw = localStorage.getItem('ds_notifications');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    // Khởi tạo các thông báo mẫu trực quan sinh động
    const defaultNotifs = [
      {
        id: 1,
        title: "Đơn thuê #101 đã xác nhận",
        content: "Khách thuê đã thanh toán cọc 30% qua VietQR. Đơn đã sẵn sàng bàn giao.",
        type: "RENTAL_CONFIRMED",
        referenceId: 101,
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: "Bàn giao xe thành công",
        content: "Biên bản check-in đơn #102 đã được duyệt. Chuyến đi bắt đầu an toàn.",
        type: "INSPECTION_CHECK_IN",
        referenceId: 102,
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 3,
        title: "Đánh giá 5 sao mới ⭐",
        content: "Khách vừa gửi đánh giá 5 sao cho chiếc Mazda CX-5 của bạn: 'Xe rất sạch sẽ, chủ xe tuyệt vời!'",
        type: "REVIEW_RECEIVED",
        referenceId: 103,
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];
    try {
      localStorage.setItem('ds_notifications', JSON.stringify(defaultNotifs));
    } catch (_) {}
    return defaultNotifs;
  },

  setLocalNotificationRead(id) {
    try {
      const notifs = this.getLocalNotifications();
      const updated = notifs.map(n => n.id == id ? { ...n, isRead: true } : n);
      localStorage.setItem('ds_notifications', JSON.stringify(updated));
    } catch (_) {}
  },

  markAllLocalAsRead() {
    try {
      const notifs = this.getLocalNotifications();
      const updated = notifs.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('ds_notifications', JSON.stringify(updated));
    } catch (_) {}
  },

  addNotification(title, content, type = 'GENERAL', referenceId = null) {
    try {
      const notifs = this.getLocalNotifications();
      const newNotif = {
        id: Date.now(),
        title,
        content,
        type,
        referenceId,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      notifs.unshift(newNotif);
      localStorage.setItem('ds_notifications', JSON.stringify(notifs.slice(0, 30)));
      if (typeof NotificationCenter !== 'undefined' && NotificationCenter.refresh) {
        NotificationCenter.refresh();
      }
    } catch (_) {}
  }
};

// ─────────────────────────────────────────────────────────────
// NOTIFICATION CENTER UI (Sprint 3 Dropdown Chuông thông báo)
// ─────────────────────────────────────────────────────────────

const NotificationCenter = {
  notifications: [],
  isOpen: false,
  _interval: null,

  async init() {
    this.mountBell();
    await this.refresh();

    if (!this._interval) {
      this._interval = setInterval(() => this.refresh(), 20000);
    }

    if (!this._hasClickOutsideListener) {
      document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('notificationBellWrapper');
        if (wrapper && !wrapper.contains(e.target) && this.isOpen) {
          this.close();
        }
      });
      this._hasClickOutsideListener = true;
    }
  },

  mountBell() {
    if (document.getElementById('notificationBellWrapper')) return;

    let container = document.getElementById('notificationBellContainer');
    if (!container) {
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        container = document.createElement('div');
        container.id = 'notificationBellContainer';
        container.className = 'notification-bell-container';

        const navAuth = document.getElementById('navAuthContainer');
        if (navAuth && navAuth.parentNode === navActions) {
          navActions.insertBefore(container, navAuth);
        } else {
          navActions.prepend(container);
        }
      }
    }

    if (!container) return;

    container.innerHTML = `
      <div class="notification-bell-wrapper" id="notificationBellWrapper">
        <button id="btnNotificationBell" class="notification-bell-btn" title="Thông báo hệ thống" aria-label="Thông báo" onclick="NotificationCenter.toggle()">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
        </button>
        <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
          <div class="notification-header">
            <div class="notification-title-group">
              <h4>Thông báo</h4>
              <span class="notif-unread-count-pill" id="notifUnreadPill" style="display: none;">0 mới</span>
            </div>
            <button class="btn-mark-all-read" onclick="NotificationCenter.markAllAsRead()" title="Đánh dấu tất cả đã đọc">
              Đánh dấu đã đọc
            </button>
          </div>
          <div class="notification-list" id="notificationList">
            <!-- Items rendered dynamically -->
          </div>
          <div class="notification-footer">
            <span>Thông báo tức thời theo thời gian thực · DriveShare</span>
          </div>
        </div>
      </div>
    `;
  },

  async refresh() {
    try {
      const res = await NotificationAPI.getMyNotifications();
      if (res && res.data && Array.isArray(res.data)) {
        this.notifications = res.data;
      } else {
        this.notifications = NotificationAPI.getLocalNotifications();
      }
    } catch (_) {
      this.notifications = NotificationAPI.getLocalNotifications();
    }
    this.render();
  },

  render() {
    const unreadCount = this.notifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('notificationBadge');
    const pill = document.getElementById('notifUnreadPill');
    const bellBtn = document.getElementById('btnNotificationBell');

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
        if (bellBtn) bellBtn.classList.add('has-unread');
      } else {
        badge.style.display = 'none';
        if (bellBtn) bellBtn.classList.remove('has-unread');
      }
    }

    if (pill) {
      if (unreadCount > 0) {
        pill.textContent = `${unreadCount} mới`;
        pill.style.display = 'inline-block';
      } else {
        pill.style.display = 'none';
      }
    }

    const listEl = document.getElementById('notificationList');
    if (!listEl) return;

    if (this.notifications.length === 0) {
      listEl.innerHTML = `
        <div class="notification-empty">
          <div style="font-size: 28px; margin-bottom: 6px;">🔔</div>
          <div style="font-size: 13px; font-weight: 600; color: #475569;">Bạn chưa có thông báo nào</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Các cập nhật đặt xe & chuyến đi sẽ xuất hiện tại đây</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.notifications.map(n => {
      const isUnread = !n.isRead;
      const typeIcons = {
        'RENTAL_CONFIRMED': { icon: '🚗', bg: '#dcfce7', color: '#166534' },
        'INSPECTION_CHECK_IN': { icon: '🔑', bg: '#e0e7ff', color: '#3730a3' },
        'INSPECTION_CHECK_OUT': { icon: '📋', bg: '#fef3c7', color: '#92400e' },
        'REVIEW_RECEIVED': { icon: '⭐', bg: '#fef9c3', color: '#854d0e' },
        'GENERAL': { icon: '🔔', bg: '#f1f5f9', color: '#475569' }
      };
      const iconMeta = typeIcons[n.type] || typeIcons['GENERAL'];
      const timeAgo = this._formatTimeAgo(n.createdAt);

      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="NotificationCenter.handleItemClick(${n.id})">
          <div class="notif-icon-circle" style="background: ${iconMeta.bg}; color: ${iconMeta.color};">
            ${iconMeta.icon}
          </div>
          <div class="notif-body">
            <div class="notif-item-title">
              <span>${this._escapeHtml(n.title)}</span>
              ${isUnread ? '<span class="notif-unread-dot"></span>' : ''}
            </div>
            <div class="notif-item-content">${this._escapeHtml(n.content)}</div>
            <div class="notif-item-time">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.style.display = this.isOpen ? 'flex' : 'none';
      if (this.isOpen) {
        this.render();
      }
    }
  },

  close() {
    this.isOpen = false;
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  },

  async handleItemClick(notifId) {
    const item = this.notifications.find(n => n.id == notifId);
    if (!item) return;

    if (!item.isRead) {
      item.isRead = true;
      await NotificationAPI.markAsRead(notifId);
      this.render();
    }

    if (item.type === 'REVIEW_RECEIVED' && item.referenceId) {
      if (typeof App !== 'undefined' && App.showReviewPrompt) {
        App.showReviewPrompt(item.referenceId);
        this.close();
      }
    } else if (item.type === 'RENTAL_CONFIRMED' || item.type === 'INSPECTION_CHECK_IN') {
      if (typeof App !== 'undefined' && App.showMyBookingsView) {
        App.showMyBookingsView();
        this.close();
      }
    }
  },

  async markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true);
    await NotificationAPI.markAllLocalAsRead();
    this.render();
  },

  _formatTimeAgo(dateStr) {
    if (!dateStr) return 'Vừa xong';
    const past = new Date(dateStr).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - past) / 1000);
    if (isNaN(diffSec) || diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    return `${Math.floor(diffSec / 86400)} ngày trước`;
  },

  _escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

// Khởi chạy NotificationCenter khi DOM sẵn sàng
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationCenter.init());
  } else {
    NotificationCenter.init();
  }
}



