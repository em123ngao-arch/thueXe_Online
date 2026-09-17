/**
 * DRIVESHARE — API Service Layer
 * Tầng kết nối Frontend → Backend Spring Boot (Port 8080)
 * Tất cả giao tiếp HTTP với backend đều đi qua file này.
 *
 * Quy ước response của backend:
 *   { success: true, message: "...", data: { ... } }
 *
 * Các endpoint Car Module:
 *   POST   /api/v1/cars              — Đăng xe mới (CRP-23)
 *   GET    /api/v1/cars/my-cars      — Danh sách xe của Owner (CRP-24)
 *   PUT    /api/v1/cars/{id}         — Cập nhật thông tin xe (CRP-24)
 *   PATCH  /api/v1/cars/{id}/status  — Đổi trạng thái xe (CRP-24)
 *   DELETE /api/v1/cars/{id}         — Xóa mềm xe (CRP-24)
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
    return localStorage.getItem('ds_access_token');
  },
  setToken(token) {
    localStorage.setItem('ds_access_token', token);
  },
  clearToken() {
    localStorage.removeItem('ds_access_token');
  },
  isLoggedIn() {
    return !!this.getToken();
  }
};

// ─────────────────────────────────────────────────────────────
// BACKEND HEALTH CHECK
// Ping /api/v1/health để kiểm tra backend có đang chạy không
// Trả về: 'online' | 'offline' | 'no-auth'
// ─────────────────────────────────────────────────────────────

const BackendStatus = {
  _cache: null,
  _cacheTime: 0,
  CACHE_TTL_MS: 15000, // cache 15 giây, tránh ping liên tục

  async check() {
    const now = Date.now();
    if (this._cache && (now - this._cacheTime) < this.CACHE_TTL_MS) {
      return this._cache;
    }

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
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

    // Backend trả lỗi (4xx, 5xx)
    if (!response.ok) {
      // 401 — chưa đăng nhập hoặc token hết hạn
      if (response.status === 401) {
        const err = new Error('Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.');
        err.code = 'UNAUTHORIZED';
        throw err;
      }
      const errorMsg = data.message || data.error || 'Lỗi kết nối tới máy chủ';
      throw new Error(errorMsg);
    }

    return data; // { success: true, message: "...", data: {...} }

  } catch (err) {
    // Lỗi network (backend chưa chạy, CORS, timeout...)
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
// CAR API — Mapping với CarController.java
// Base path: /api/v1/cars
// Yêu cầu JWT với ROLE_OWNER cho tất cả endpoints
// ─────────────────────────────────────────────────────────────

const CarAPI = {

  /**
   * POST /api/v1/cars
   * Đăng xe mới, xe sẽ ở trạng thái PENDING chờ Admin duyệt.
   */
  createCar(carData) {
    return apiCall('/cars', 'POST', carData);
  },

  /**
   * GET /api/v1/cars/my-cars?page=0&size=10
   * Lấy danh sách xe của Owner đang đăng nhập, có phân trang.
   */
  getMyCars(page = 0, size = 20) {
    return apiCall(`/cars/my-cars?page=${page}&size=${size}`);
  },

  /**
   * PUT /api/v1/cars/{id}
   * Cập nhật thông tin xe.
   */
  updateCar(carId, carData) {
    return apiCall(`/cars/${carId}`, 'PUT', carData);
  },

  /**
   * PATCH /api/v1/cars/{id}/status
   * Chủ xe bật/tắt hiển thị xe: ACTIVE ↔ INACTIVE.
   */
  updateCarStatus(carId, status) {
    return apiCall(`/cars/${carId}/status`, 'PATCH', { status });
  },

  /**
   * DELETE /api/v1/cars/{id}
   * Xóa mềm xe.
   */
  deleteCar(carId) {
    return apiCall(`/cars/${carId}`, 'DELETE');
  }
};

// ─────────────────────────────────────────────────────────────
// AUTH API (dùng để đăng nhập lấy JWT)
// Endpoint thực tế: POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────

const AuthAPI = {
  async login(username, password) {
    const data = await apiCall('/auth/login', 'POST', { username, password });
    if (data.data?.accessToken) {
      TokenService.setToken(data.data.accessToken);
      BackendStatus.invalidate();
    }
    return data;
  },

  logout() {
    TokenService.clearToken();
    BackendStatus.invalidate();
  }
};
