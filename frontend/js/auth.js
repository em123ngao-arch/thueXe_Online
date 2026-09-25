/**
 * DriveShare Authentication & RBAC Client (CRP-10 -> CRP-16 + Sprint 1 Fix)
 * Tương thích chuẩn API Backend Spring Boot (Port 8080) và hỗ trợ Mock Fallback
 */

// Storage keys dùng chung
const KEY_ACCESS_TOKEN = "access_token";
const KEY_REFRESH_TOKEN = "refresh_token";
const KEY_USER = "user_info";
const AUTH_STORAGE_KEY = "driveshare_current_auth_user";

const API_BASE = "http://localhost:8080/api/v1";

// ─────────────────────────────────────────────────────────────
// AUTH HELPERS TOÀN CỤC
// ─────────────────────────────────────────────────────────────

function getAccessToken() {
  return (
    localStorage.getItem(KEY_ACCESS_TOKEN) ||
    localStorage.getItem("ds_access_token") ||
    localStorage.getItem("driveshare_access_token") ||
    ""
  );
}

function getRefreshToken() {
  return (
    localStorage.getItem(KEY_REFRESH_TOKEN) ||
    localStorage.getItem("ds_refresh_token") ||
    ""
  );
}

function getCurrentUser() {
  try {
    const raw =
      localStorage.getItem(KEY_USER) ||
      localStorage.getItem("ds_user") ||
      localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function isAuthenticated() {
  return !!getAccessToken();
}

function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  const userRole = (user.role || (user.roles && user.roles[0]) || "").replace(
    "ROLE_",
    "",
  );
  const targetRole = role.replace("ROLE_", "");
  return userRole.toUpperCase() === targetRole.toUpperCase();
}

function getAuthHeaders(isMultipart = false) {
  const token = getAccessToken();
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Auth Guard (BR-05-1): Kiểm tra đăng nhập trước khi vào trang được bảo vệ
 * @param {string|null} requiredRole Role bắt buộc nếu có (ADMIN, OWNER, RENTER)
 * @returns {boolean} true nếu hợp lệ, false nếu đang redirect
 */
function checkAuth(requiredRole = null) {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname + window.location.search;
    const redirectUrl = `login.html?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = redirectUrl;
    return false;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    if (typeof showToast === "function") {
      showToast("Bạn không có quyền truy cập trang này!", "error", 2500);
    } else {
      alert("Bạn không có quyền truy cập trang này!");
    }
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
    return false;
  }

  return true;
}

function setSession(authData) {
  const token =
    authData.accessToken || authData.access_token || authData.token;
  if (token) {
    localStorage.setItem(KEY_ACCESS_TOKEN, token);
    localStorage.setItem("ds_access_token", token);
    localStorage.setItem("driveshare_access_token", token);
  }

  const refreshToken = authData.refreshToken || authData.refresh_token;
  if (refreshToken) {
    localStorage.setItem(KEY_REFRESH_TOKEN, refreshToken);
    localStorage.setItem("ds_refresh_token", refreshToken);
  }

  const role =
    authData.role ||
    (authData.roles && authData.roles[0]) ||
    authData.user?.role ||
    "RENTER";

  const user = {
    userId: authData.userId || authData.user_id || authData.user?.id || Date.now(),
    id: authData.userId || authData.user_id || authData.user?.id || Date.now(),
    name:
      authData.fullName ||
      authData.full_name ||
      authData.user?.fullName ||
      authData.username ||
      "Người dùng",
    fullName:
      authData.fullName ||
      authData.full_name ||
      authData.user?.fullName ||
      authData.username ||
      "Người dùng",
    email: authData.email || authData.user?.email || "",
    phone: authData.phoneNumber || authData.phone || authData.user?.phoneNumber || "",
    role: role.replace("ROLE_", ""),
    roles: [role.startsWith("ROLE_") ? role : "ROLE_" + role],
    status: authData.status || authData.user?.status || "ACTIVE",
    avatar:
      authData.avatarUrl ||
      authData.avatar ||
      authData.user?.avatarUrl ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  };

  localStorage.setItem(KEY_USER, JSON.stringify(user));
  localStorage.setItem("ds_user", JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

  if (typeof AuthService !== "undefined" && AuthService.updateAuthUI) {
    AuthService.updateAuthUI();
  }
}

function clearSession() {
  localStorage.removeItem(KEY_ACCESS_TOKEN);
  localStorage.removeItem("ds_access_token");
  localStorage.removeItem("driveshare_access_token");
  localStorage.removeItem(KEY_REFRESH_TOKEN);
  localStorage.removeItem("ds_refresh_token");
  localStorage.removeItem(KEY_USER);
  localStorage.removeItem("ds_user");
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("driveshare_current_role");
  localStorage.removeItem("driveshare_mock_users");

  if (typeof AuthService !== "undefined" && AuthService.updateAuthUI) {
    AuthService.updateAuthUI();
  }
}

// ─────────────────────────────────────────────────────────────
// AUTH SERVICE OBJECT
// ─────────────────────────────────────────────────────────────

const AuthService = {
  _pendingCallback: null,

  getAccessToken,
  getRefreshToken,
  getCurrentUser,
  isAuthenticated,
  hasRole,
  checkAuth,
  setSession,
  clearSession,

  requireLoginThen(callback) {
    if (this.isAuthenticated()) {
      callback();
      return;
    }
    this._pendingCallback = callback;
    if (typeof AuthModal !== "undefined" && AuthModal.openLogin) {
      AuthModal.openLogin();
    } else {
      window.location.href = "login.html";
    }
  },

  _runPendingCallback() {
    if (this._pendingCallback) {
      const cb = this._pendingCallback;
      this._pendingCallback = null;
      setTimeout(cb, 200);
    }
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = getAuthHeaders(options.isMultipart);
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const resp = await fetch(url, { ...options, headers });
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        if (resp.status === 401 && !endpoint.includes("/auth/login")) {
          console.warn("Phiên làm việc đã hết hạn (401)");
          this.clearSession();
        }
        return {
          success: false,
          status: resp.status,
          errorCode: data?.errorCode || data?.error_code || data?.code || "HTTP_" + resp.status,
          message: data?.message || `Lỗi HTTP ${resp.status}`,
          details: data?.details,
          data: data,
        };
      }

      return {
        success: true,
        status: resp.status,
        message: data?.message,
        data: data?.result !== undefined ? data.result : (data?.data !== undefined ? data.data : data),
      };
    } catch (err) {
      console.warn("Backend API offline, sử dụng mock fallback:", err.message);
      return {
        success: false,
        status: 0,
        errorCode: "NETWORK_ERROR",
        message: "Không thể kết nối đến máy chủ backend (http://localhost:8080)",
        error: err,
      };
    }
  },

  // Đăng nhập (CRP-12)
  async login(identifier, password) {
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: identifier, identifier, password }),
    });

    if (res.success && res.data) {
      this.setSession(res.data);
      return res;
    }

    // Mock fallback khi BE chưa chạy
    if (res.errorCode === "NETWORK_ERROR") {
      const users = JSON.parse(localStorage.getItem("driveshare_mock_users") || "[]");
      const found = users.find(
        (u) => (u.email === identifier || u.username === identifier) && u.password === password,
      );

      // Tài khoản mặc định sẵn có
      let mockUser = found;
      if (!mockUser) {
        if (identifier.includes("admin")) {
          mockUser = {
            userId: 999,
            fullName: "Quản trị viên DriveShare",
            email: identifier,
            role: "ADMIN",
            status: "ACTIVE",
          };
        } else if (identifier.includes("owner")) {
          mockUser = {
            userId: 888,
            fullName: "Chủ xe Đối tác",
            email: identifier,
            role: "OWNER",
            status: "ACTIVE",
          };
        } else {
          mockUser = {
            userId: 777,
            fullName: identifier.split("@")[0] || "Khách thuê",
            email: identifier.includes("@") ? identifier : `${identifier}@gmail.com`,
            role: "RENTER",
            status: "ACTIVE",
          };
        }
      }

      const mockData = {
        accessToken: "mock_jwt_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
        user: mockUser,
        role: mockUser.role,
        fullName: mockUser.fullName,
        email: mockUser.email,
        status: mockUser.status,
      };

      this.setSession(mockData);
      return { success: true, message: "Đăng nhập thành công (Chế độ mô phỏng)", data: mockData };
    }

    return res;
  },

  // Đăng ký (CRP-10 & CRP-11, BR-01)
  async register(registerData) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });

    if (res.success) return res;

    // Mock fallback
    if (res.errorCode === "NETWORK_ERROR") {
      const users = JSON.parse(localStorage.getItem("driveshare_mock_users") || "[]");
      if (users.some((u) => u.email === registerData.email)) {
        return {
          success: false,
          status: 400,
          errorCode: "EMAIL_EXISTED",
          message: "EMAIL_EXISTED: Email đã được sử dụng bởi tài khoản khác",
        };
      }

      const newUser = {
        userId: Date.now(),
        id: Date.now(),
        ...registerData,
        status: registerData.role === "OWNER" ? "PENDING" : "ACTIVE",
      };
      users.push(newUser);
      localStorage.setItem("driveshare_mock_users", JSON.stringify(users));

      return {
        success: true,
        message: "Đăng ký thành công!",
        data: newUser,
      };
    }

    return res;
  },

  // Đổi mật khẩu (BR-06, CRP-13)
  async changePassword(oldPassword, newPassword, confirmPassword) {
    const res = await this.request("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        oldPassword,
        old_password: oldPassword,
        currentPassword: oldPassword,
        current_password: oldPassword,
        newPassword,
        new_password: newPassword,
        confirmPassword,
        confirm_password: confirmPassword,
      }),
    });

    if (res.success) {
      this.clearSession();
      return res;
    }

    // Mock fallback
    if (res.errorCode === "NETWORK_ERROR") {
      this.clearSession();
      return {
        success: true,
        message: "Đổi mật khẩu thành công. Các phiên đăng nhập khác đã bị vô hiệu hóa",
      };
    }

    return res;
  },

  // Đổi email (BR-07)
  async requestChangeEmail(newEmail) {
    const res = await this.request("/auth/change-email/request", {
      method: "POST",
      body: JSON.stringify({ newEmail }),
    });

    if (res.success) return res;

    // Mock fallback
    if (res.errorCode === "NETWORK_ERROR") {
      return {
        success: true,
        message: "Link xác nhận đã được gửi đến email mới (hiệu lực 15 phút)",
      };
    }

    return res;
  },

  // Đăng xuất (CRP-15)
  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Lỗi khi gửi request logout:", e);
    }
    this.clearSession();
    if (typeof showToast === "function") {
      showToast("Đã đăng xuất tài khoản thành công.", "info", 2000);
    }
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  },

  // Cập nhật UI thanh Navbar
  updateAuthUI() {
    const user = this.getCurrentUser();
    const navAuthContainer = document.getElementById("navAuthContainer");
    if (!navAuthContainer) return;

    if (user && this.isAuthenticated()) {
      const roleName = (user.role || (user.roles && user.roles[0]) || "RENTER")
        .replace("ROLE_", "")
        .toUpperCase();

      const roleBadgeText =
        roleName === "ADMIN" ? "Quản trị" : roleName === "OWNER" ? "Chủ xe" : "Khách thuê";
      const roleColor =
        roleName === "ADMIN" ? "#ef4444" : roleName === "OWNER" ? "#f59e0b" : "#3b82f6";

      navAuthContainer.innerHTML = `
        <div class="user-profile-badge" style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 4px 10px; border-radius: 9999px; border: 1px solid #e2e8f0;">
          <a href="profile.html" title="Xem hồ sơ cá nhân" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">
            <img src="${user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}" alt="${user.fullName || user.name}" class="nav-avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid ${roleColor};" />
            <div class="nav-user-info" style="display: flex; flex-direction: column; line-height: 1.2;">
              <span class="nav-user-name" style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">${user.fullName || user.name}</span>
              <span class="nav-user-role" style="font-size: 0.72rem; font-weight: 600; color: ${roleColor};">${roleBadgeText}</span>
            </div>
          </a>
          <div style="display: flex; align-items: center; gap: 4px; margin-left: 4px;">
            <a href="profile.html" class="btn btn-ghost btn-sm" title="Hồ sơ cá nhân" style="padding: 4px; color: #64748b; border-radius: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </a>
            ${
              roleName === "ADMIN"
                ? `<a href="admin.html" class="btn btn-sm" title="Kênh Quản trị" style="padding: 4px 8px; font-size: 0.75rem; background: #ef4444; color: white; border-radius: 6px; text-decoration: none; font-weight: 700;">Admin</a>`
                : roleName === "OWNER"
                ? `<a href="owner-cars.html" class="btn btn-sm" title="Quản lý xe" style="padding: 4px 8px; font-size: 0.75rem; background: #f59e0b; color: white; border-radius: 6px; text-decoration: none; font-weight: 700;">Xe của tôi</a>`
                : ""
            }
            <button class="btn btn-ghost btn-sm" onclick="AuthService.logout()" title="Đăng xuất" style="padding: 4px; color: #94a3b8; border: none; background: transparent; cursor: pointer; border-radius: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      `;
    } else {
      navAuthContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="login.html" class="btn btn-outline btn-sm" style="font-weight: 600; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; padding: 6px 14px; border-radius: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Đăng nhập</span>
          </a>
          <a href="login.html?tab=register" class="btn btn-primary btn-sm" style="font-weight: 600; display: inline-flex; align-items: center; text-decoration: none; padding: 6px 14px; border-radius: 8px;">
            <span>Đăng ký</span>
          </a>
        </div>
      `;
    }
  },
};

// ─────────────────────────────────────────────────────────────
// MODAL DIALOG MỞ NHANH TRÊN TRANG CHỦ
// ─────────────────────────────────────────────────────────────

const AuthModal = {
  openLogin() {
    window.location.href = "login.html";
  },
  openRegister(tab = "renter") {
    window.location.href = `login.html?tab=register&role=${tab}`;
  },
  closeModal() {
    const modal = document.getElementById("authUnifiedModalOverlay");
    if (modal) modal.style.display = "none";
  },
};

// Khởi tạo trạng thái khi load trang
document.addEventListener("DOMContentLoaded", function () {
  AuthService.updateAuthUI();
});
