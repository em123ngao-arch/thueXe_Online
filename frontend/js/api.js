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
    const token = localStorage.getItem('driveshare_access_token') || localStorage.getItem('ds_access_token');
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
  }
};
