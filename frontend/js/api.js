/**
 * DRIVESHARE — API Service Bridge
 * Kết nối giao tiếp trực tiếp với Backend Spring Boot REST API (http://localhost:8080/api/v1)
 * Có cơ chế tự động Fallback về StorageService (LocalStorage) nếu Backend đang offline
 */

const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/v1',
  TIMEOUT_MS: 3000
};

const ApiService = {
  // Lấy Access Token lưu trữ (nếu có đăng nhập)
  getAuthHeader() {
    const token = localStorage.getItem('driveshare_access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  /**
   * Helper fetch có timeout để phát hiện nhanh nếu backend chưa bật
   */
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
          console.info(' DriveShare API: Nhận dữ liệu người dùng trực tiếp từ Backend Spring Boot');
          return {
            source: 'BACKEND_API',
            ...json.data // PageResponse: { items, pagination }
          };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn('⚠️ DriveShare: Không thể kết nối Backend API (đang offline hoặc chưa có token), tự động chuyển sang Local Storage:', error.message);
      const localData = StorageService.getUsers(params);
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
          console.info(` DriveShare API: Nhận chi tiết user #${userId} từ Backend Spring Boot`);
          return {
            success: true,
            source: 'BACKEND_API',
            data: json.data
          };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      // Nếu là lỗi 404 từ backend thì không fallback local data giả
      if (error && error.status === 404) {
        return error;
      }
      console.warn(`⚠️ DriveShare: Không thể kết nối Backend API, kiểm tra Local Storage cho user #${userId}:`, error.message);
      const localUser = StorageService.getUserById(userId);
      if (localUser) {
        return {
          success: true,
          source: 'LOCAL_STORAGE',
          data: localUser
        };
      }
      return {
        success: false,
        status: 404,
        errorCode: 'USER_NOT_FOUND',
        message: `Không tìm thấy người dùng #${userId} (404 Not Found)`,
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
        return {
          success: false,
          status: 403,
          errorCode: 'FORBIDDEN',
          message: 'Bạn không có quyền thực hiện thao tác này (403 Forbidden)'
        };
      }

      if (res.status === 400) {
        let errJson = null;
        try { errJson = await res.json(); } catch(e) {}
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
          message: json.message || 'Cập nhật trạng thái duyệt thành công',
          data: json.data
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn(`⚠️ DriveShare: Không thể kết nối Backend API khi duyệt chủ xe #${userId}, cập nhật Local Storage:`, error.message);
      const localUser = StorageService.approveOwner(userId, data.verification_status, data.rejection_reason);
      if (localUser) {
        return {
          success: true,
          source: 'LOCAL_STORAGE',
          message: data.verification_status === 'verified' 
            ? 'Phê duyệt hồ sơ chủ xe thành công (Local Storage)' 
            : 'Đã từ chối hồ sơ chủ xe (Local Storage)',
          data: localUser
        };
      }
      return {
        success: false,
        message: 'Lỗi cập nhật trạng thái chủ xe'
      };
    }
  },

  /**
   * API: Khóa hoặc Mở khóa tài khoản người dùng (Admin)
   * PATCH /api/v1/admin/users/{userId}/status
   */
  async updateUserStatus(userId, data = {}) {
    const url = `${API_CONFIG.BASE_URL}/admin/users/${userId}/status`;

    try {
      const res = await this.fetchWithTimeout(url, {
        method: 'PATCH',
        body: JSON.stringify({
          status: data.status,
          reason: data.reason
        })
      });

      if (res.status === 403) {
        return {
          success: false,
          status: 403,
          errorCode: 'FORBIDDEN',
          message: 'Bạn không có quyền thực hiện thao tác này (403 Forbidden)'
        };
      }

      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          source: 'BACKEND_API',
          message: json.message || 'Cập nhật trạng thái người dùng thành công',
          data: json.data
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn(`⚠️ DriveShare: Không thể kết nối Backend API khi đổi trạng thái user #${userId}, cập nhật Local Storage:`, error.message);
      const localUser = StorageService.updateUserStatus(userId, data.status);
      if (localUser) {
        return {
          success: true,
          source: 'LOCAL_STORAGE',
          message: data.status === 'locked' 
            ? 'Khóa tài khoản thành công (Local Storage)' 
            : 'Mở khóa tài khoản thành công (Local Storage)',
          data: localUser
        };
      }
      return {
        success: false,
        message: 'Lỗi cập nhật trạng thái người dùng'
      };
    }
  },

  /**
   * API: Phê duyệt hoặc từ chối Giấy phép lái xe của Khách thuê (Admin)
   * PATCH /api/v1/admin/users/{userId}/approve-license
   */
  async approveLicense(userId, data = {}) {
    const url = `${API_CONFIG.BASE_URL}/admin/users/${userId}/approve-license`;

    try {
      const res = await this.fetchWithTimeout(url, {
        method: 'PATCH',
        body: JSON.stringify({
          verification_status: data.verification_status,
          rejection_reason: data.rejection_reason
        })
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
        try { errJson = await res.json(); } catch(e) {}
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
      const status = data.verification_status === 'verified' ? 'APPROVED' : 'REJECTED';
      StorageService.updateRenterLicense(userId, status);
      return {
        success: true,
        source: 'LOCAL_STORAGE',
        message: data.verification_status === 'verified'
          ? 'Đã xác minh GPLX hợp lệ (Local Storage)'
          : 'Đã từ chối GPLX (Local Storage)'
      };
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
            data: json.data
          };
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn('⚠️ DriveShare: Không thể kết nối Backend API khi lấy danh sách xe, sử dụng Local Storage:', error.message);
      const allCars = StorageService.getCars();
      let filtered = allCars;
      if (params.status && params.status !== 'all') {
        const st = params.status.toUpperCase();
        filtered = allCars.filter(c => c.status === st || (st === 'PENDING_REVIEW' && c.status === 'PENDING_APPROVAL'));
      }
      return {
        success: true,
        source: 'LOCAL_STORAGE',
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
   * API: Xem chi tiết 1 xe (Admin)
   * GET /api/v1/admin/cars/{carId}
   */
  async getAdminCarDetail(carId) {
    const url = `${API_CONFIG.BASE_URL}/admin/cars/${carId}`;
    try {
      const res = await this.fetchWithTimeout(url, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          source: 'BACKEND_API',
          data: json.data
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn(`⚠️ DriveShare: Fallback Local Storage cho chi tiết xe #${carId}:`, error.message);
      const car = StorageService.getCarById(carId);
      if (car) return { success: true, source: 'LOCAL_STORAGE', data: car };
      return { success: false, message: 'Không tìm thấy thông tin xe' };
    }
  },

  /**
   * API: Phê duyệt xe mới đăng (Admin)
   * PATCH /api/v1/admin/cars/{carId}/approve
   */
  async approveCar(carId) {
    const url = `${API_CONFIG.BASE_URL}/admin/cars/${carId}/approve`;

    try {
      const res = await this.fetchWithTimeout(url, { method: 'PATCH' });
      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          source: 'BACKEND_API',
          message: json.message || 'Phê duyệt xe thành công',
          data: json.data
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn(`⚠️ DriveShare: Fallback Local Storage duyệt xe #${carId}:`, error.message);
      StorageService.updateCarStatus(carId, 'ACTIVE');
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
          rejection_reason: rejectionReason
        })
      });

      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          source: 'BACKEND_API',
          message: json.message || 'Đã từ chối xe',
          data: json.data
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.warn(`⚠️ DriveShare: Fallback Local Storage từ chối xe #${carId}:`, error.message);
      StorageService.updateCarStatus(carId, 'REJECTED', rejectionReason);
      return {
        success: true,
        source: 'LOCAL_STORAGE',
        message: `Đã từ chối xe #${carId} (Local Storage)`
      };
    }
  }
};
