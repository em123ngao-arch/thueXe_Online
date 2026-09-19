/**
 * DriveShare Authentication & RBAC Client (CRP-10 -> CRP-16)
 * Handles:
 * - CRP-10: Owner Registration (Pending approval)
 * - CRP-11: Renter Registration (Active status)
 * - CRP-12: Login with JWT tokens, account status check, rate limiting handling
 * - CRP-13: Change Password & session revocation
 * - CRP-14: Forgot & Reset Password
 * - CRP-15: Logout & Refresh Token
 * - CRP-16: RBAC Authorization testing (200, 401, 403) & Admin Owner Approval
 */

const AUTH_STORAGE_KEY = "driveshare_current_auth_user";

const AuthService = {
  // Callback chờ sau khi đăng nhập (dùng cho login-gate xem chi tiết / đặt xe)
  _pendingCallback: null,

  // ==================== LOGIN GATE ====================
  // Kiểm tra đăng nhập trước khi thực hiện hành động.
  // Nếu chưa đăng nhập → lưu callback rồi mở modal đăng nhập.
  // Sau khi đăng nhập thành công → callback được gọi tự động.
  requireLoginThen(callback) {
    if (this.getCurrentUser()) {
      callback();
      return;
    }
    this._pendingCallback = callback;
    this.openLoginModal();
  },

  // Gọi callback đang chờ (nếu có) sau khi đăng nhập / đăng ký thành công
  _runPendingCallback() {
    if (this._pendingCallback) {
      const cb = this._pendingCallback;
      this._pendingCallback = null;
      setTimeout(cb, 200);
    }
  },

  // Lấy thông tin tài khoản đang đăng nhập
  getCurrentUser() {
    try {
      const u = localStorage.getItem(KEY_USER);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(authData) {
    const token = authData.accessToken || authData.access_token;
    if (token) {
      localStorage.setItem(KEY_ACCESS_TOKEN, token);
      localStorage.setItem('driveshare_access_token', token);
    }
    if (authData.refreshToken || authData.refresh_token) {
      localStorage.setItem(KEY_REFRESH_TOKEN, authData.refreshToken || authData.refresh_token);
    }
    const user = {
      userId: authData.userId || authData.user_id,
      username: authData.username,
      email: authData.email,
      roles: authData.roles || [],
      status: authData.status || 'ACTIVE'
    };
    localStorage.setItem(KEY_USER, JSON.stringify(user));
    updateNavAuthUI();
  }

  function clearSession() {
    localStorage.removeItem(KEY_ACCESS_TOKEN);
    localStorage.removeItem('driveshare_access_token');
    localStorage.removeItem(KEY_REFRESH_TOKEN);
    localStorage.removeItem(KEY_USER);
    updateNavAuthUI();
  }

  function isAuthenticated() {
    return !!getAccessToken();
  }

  function hasRole(role) {
    const user = getCurrentUser();
    if (!user || !user.roles) return false;
    const search = role.startsWith('ROLE_') ? role : 'ROLE_' + role;
    return user.roles.includes(search);
  }

  // HTTP Helper with auto-bearer injection
  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getAccessToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const resp = await fetch(url, { ...options, headers });
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        // Handle 401 Unauthenticated
        if (resp.status === 401 && endpoint !== '/login' && endpoint !== '/refresh-token') {
          console.warn('Session expired or 401 returned');
        }
        return {
          success: false,
          status: resp.status,
          errorCode: data?.errorCode || data?.error_code || 'HTTP_' + resp.status,
          message: data?.message || `Lỗi HTTP ${resp.status}`,
          data: data
        };
      }

      return {
        success: true,
        status: resp.status,
        message: data?.message,
        data: data?.data !== undefined ? data.data : data
      };
    } catch (err) {
      console.warn('Backend API connection error:', err);
      return {
        success: false,
        status: 0,
        errorCode: 'NETWORK_ERROR',
        message: 'Không thể kết nối đến máy chủ backend (http://localhost:8080). Vui lòng kiểm tra backend đã khởi chạy chưa.',
        error: err
      };
    }
  }

  // --- Core Auth APIs ---

  // CRP-12: Login
  async function login(identifier, password) {
    const res = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    if (res.success && res.data) {
      setSession(res.data);
    }
    return res;
  }

  // CRP-10: Register Owner
  async function registerOwner(ownerData) {
    return await request('/register/owner', {
      method: 'POST',
      body: JSON.stringify(ownerData)
    });
  }

  // CRP-11: Register Renter
  async function registerRenter(renterData) {
    return await request('/register/renter', {
      method: 'POST',
      body: JSON.stringify(renterData)
    });
  }

  // CRP-15: Refresh Token
  async function refreshToken() {
    const refToken = getRefreshToken();
    if (!refToken) {
      return { success: false, message: 'Không tìm thấy refresh token' };
    }
    const res = await request('/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refToken, refresh_token: refToken })
    });
    if (res.success && res.data) {
      setSession(res.data);
    }
    return res;
  }

  // CRP-15: Logout
  async function logout() {
    try {
      await request('/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Error sending logout to server', e);
    }
    clearSession();
  }

  // Cập nhật trạng thái đăng nhập trên giao diện
  updateAuthUI() {
    const user = this.getCurrentUser();
    const navAuthContainer = document.getElementById("navAuthContainer");
    if (!navAuthContainer) return;

    if (user && isAuthenticated()) {
      const roleName = user.roles && user.roles.length > 0
        ? user.roles[0].replace('ROLE_', '')
        : 'USER';
      const roleColor = roleName === 'ADMIN' ? '#ef4444' : (roleName === 'OWNER' ? '#f59e0b' : '#3b82f6');

      const portalBtnHtml = roleName === 'ADMIN'
        ? `<button class="btn btn-sm" onclick="App.switchRole('ADMIN')" title="Mở Kênh Quản trị" style="padding: 6px 11px; font-size: 0.8rem; background: #ef4444; color: white; border: none; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(239,68,68,0.25); cursor: pointer;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Kênh Quản trị
           </button>`
        : (roleName === 'OWNER'
            ? `<button class="btn btn-sm" onclick="App.switchRole('OWNER')" title="Mở Kênh Chủ xe" style="padding: 6px 11px; font-size: 0.8rem; background: #f59e0b; color: white; border: none; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(245,158,11,0.25); cursor: pointer;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>
                Kênh Chủ xe
               </button>`
            : '');

      navAuthContainer.innerHTML = `
        <div class="user-profile-badge">
          <img src="${user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}" alt="${user.name}" class="nav-avatar" />
          <div class="nav-user-info">
            <span class="nav-user-name">${user.name}</span>
            <span class="nav-user-role">${user.role === "OWNER" ? "Chủ xe" : user.role === "ADMIN" ? "Quản trị" : "Khách thuê"}</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="AuthService.logout()" title="Đăng xuất" style="padding: 0.3rem 0.5rem; color: var(--slate-500);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      `;
    } else {
      navAuthContainer.innerHTML = `
        <div style="display: flex; align-items: center;">
          <button class="btn btn-outline btn-sm" onclick="AuthModal.openLogin()" style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Đăng nhập</span>
          </button>
        </div>
      `;
    }
  }

  async function handleLogout() {
    await logout();
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Bạn đã đăng xuất khỏi hệ thống', 'info');
      App.switchRole('RENTER');
    }
  }

        <!-- Social Login -->
        <div class="social-login-grid">
          <!-- TODO: Gán Google OAuth Client ID thật vào đây -->
          <!-- Hướng dẫn: https://developers.google.com/identity/oauth2/web/guides/overview -->
          <button class="social-btn google" id="btnGoogleLogin" onclick="AuthService.loginWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Tiếp tục với Google
        </div>

/**
 * Modal Manager for Auth Dialogs (Login, Register Owner/Renter, Forgot, Change Password, RBAC Console)
 */
const AuthModal = (function () {
  const MODAL_ID = 'authUnifiedModalOverlay';

  function init() {
    // Check if URL hash has reset token: #reset=XYZ
    const hash = window.location.hash;
    if (hash && hash.startsWith('#reset=')) {
      const token = hash.replace('#reset=', '');
      setTimeout(() => openResetPassword(token), 400);
    }
    AuthService.updateNavAuthUI();
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.classList.remove('open');
      setTimeout(() => {
        if (!modal.classList.contains('open')) {
          modal.style.display = 'none';
        }
      }, 250);
    }
  }

  function showModal(title, htmlBody) {
    let modal = document.getElementById(MODAL_ID);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = MODAL_ID;
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width: 520px; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
          <div class="modal-header" style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 1.25rem 1.5rem; border-bottom: none;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #3b82f6; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
              <h3 class="modal-title" id="authModalTitle" style="color: white; font-size: 1.15rem; font-weight: 700; margin: 0;"></h3>
            </div>
            <button class="modal-close-btn" onclick="AuthModal.closeModal()" style="color: #94a3b8; background: transparent; border: none; font-size: 1.5rem; cursor: pointer;">
              &times;
            </button>
          </div>
          <div class="modal-body" id="authModalBody" style="padding: 1.5rem; background: #ffffff; max-height: 85vh; overflow-y: auto;"></div>
        </div>
      `;
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          AuthModal.closeModal();
        }
      });
      document.body.appendChild(modal);
    }
    document.getElementById('authModalTitle').innerText = title;
    document.getElementById('authModalBody').innerHTML = htmlBody;
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('open');
    });
  }

  // --- Modal Forms ---

  // 1. Login Modal (CRP-12)
  function openLogin() {
    const html = `
      <div class="auth-card">
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.25rem;">
          Nhập email hoặc tên đăng nhập để truy cập tài khoản DriveShare của bạn.
        </p>
        <form id="authLoginForm" onsubmit="AuthModal.submitLogin(event)">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Email hoặc Tên đăng nhập *</label>
            <input type="text" id="loginIdentifier" class="form-control" required placeholder="admin@driveshare.com hoặc owner@driveshare.com" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
          </div>
          <div class="form-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="font-weight: 600; font-size: 0.85rem; color: #334155;">Mật khẩu *</label>
              <a href="javascript:void(0)" onclick="AuthModal.openForgotPassword()" style="font-size: 0.8rem; color: #2563eb; text-decoration: none;">Quên mật khẩu?</a>
            </div>
            <input type="password" id="loginPassword" class="form-control" required placeholder="••••••••" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
          </div>
          
          <div id="loginAlertBox" style="display: none; padding: 10px 12px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;"></div>

          <button type="submit" id="btnLoginSubmit" class="btn btn-primary" style="width: 100%; padding: 11px; font-size: 0.95rem; font-weight: 600; border-radius: 8px; margin-top: 4px;">
            Đăng nhập
          </button>
        </form>

        <div style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid #f1f5f9; text-align: center; font-size: 0.85rem; color: #64748b;">
          Chưa có tài khoản? 
          <a href="javascript:void(0)" onclick="AuthModal.openRegister()" style="color: #2563eb; font-weight: 600; text-decoration: none;">Đăng ký ngay</a>
        </div>

        <!-- Khung Tài khoản trải nghiệm nhanh -->
        <div style="margin-top: 1.15rem; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="font-weight: 700; font-size: 0.78rem; color: #475569; margin-bottom: 0.65rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#0284c7"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Tài khoản trải nghiệm mẫu</span>
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <!-- 1. Admin -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; transition: all 0.15s;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 6px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;">
                  A
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.82rem; color: #1e293b; line-height: 1.2;">
                    Quản trị viên (Admin)
                  </div>
                  <div style="font-size: 0.72rem; color: #64748b; font-family: monospace;">admin@driveshare.com</div>
                </div>
              </div>
              <button type="button" onclick="AuthModal.quickLogin('admin@driveshare.com', 'Admin123@', 'ADMIN')" style="background: #ef4444; color: white; border: none; font-weight: 600; font-size: 0.75rem; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
                Đăng nhập
              </button>
            </div>

            <!-- 2. Owner -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; transition: all 0.15s;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 6px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;">
                  O
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.82rem; color: #1e293b; line-height: 1.2;">
                    Chủ xe (Owner)
                  </div>
                  <div style="font-size: 0.72rem; color: #64748b; font-family: monospace;">owner@driveshare.com</div>
                </div>
              </div>
              <button type="button" onclick="AuthModal.quickLogin('owner@driveshare.com', 'Owner123@', 'OWNER')" style="background: #f59e0b; color: white; border: none; font-weight: 600; font-size: 0.75rem; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
                Đăng nhập
              </button>
            </div>

            <!-- 3. Renter -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; transition: all 0.15s;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 6px; background: #dbeafe; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;">
                  R
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.82rem; color: #1e293b; line-height: 1.2;">
                    Khách thuê (Renter)
                  </div>
                  <div style="font-size: 0.72rem; color: #64748b; font-family: monospace;">renter@driveshare.com</div>
                </div>
              </div>
              <button type="button" onclick="AuthModal.quickLogin('renter@driveshare.com', 'Renter123@', 'RENTER')" style="background: #3b82f6; color: white; border: none; font-weight: 600; font-size: 0.75rem; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    showModal('Đăng nhập vào DriveShare', html);
  }

    App.openModal("Đăng nhập khách hàng", html);
  },

    const btn = document.getElementById('btnLoginSubmit');
    const alertBox = document.getElementById('loginAlertBox');
    if (btn) {
      btn.disabled = true;
      btn.innerText = `Đang đăng nhập ${identifier}...`;
    }
    if (alertBox) alertBox.style.display = 'none';

        <!-- Social Registration -->
        <div class="social-login-grid">
          <!-- TODO: Gán Google OAuth Client ID thật vào đây -->
          <button class="social-btn google" id="btnGoogleRegister" onclick="AuthService.loginWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Đăng ký bằng Google
          </button>
        </div>

        <div id="registerAlertBox" style="display: none; padding: 10px 12px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;"></div>

        <!-- Form Khách thuê (CRP-11) -->
        <form id="formRegisterRenter" style="display: ${defaultTab === 'renter' ? 'block' : 'none'};" onsubmit="AuthModal.submitRegister(event, 'RENTER')">
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 8px 12px; border-radius: 4px; margin-bottom: 1rem; font-size: 0.82rem; color: #1e40af;">
            Đăng ký Renter: Tài khoản sẽ được <strong>kích hoạt ngay lập tức (Active)</strong> để bạn có thể đặt xe tự lái.
          </div>
          
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Email nhận thông báo *</label>
            <input type="email" id="renterEmail" required placeholder="name@domain.com" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Họ và tên khách thuê *</label>
            <input type="text" id="renterFullName" required placeholder="Nguyễn Văn A" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Số điện thoại liên hệ *</label>
            <input type="tel" id="renterPhone" required placeholder="0912345678" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Mật khẩu *</label>
            <input type="password" id="renterPassword" required placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, thường & số" oninput="AuthModal.onPasswordInput(this.value, 'renterStrength')" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            <div id="renterStrength" style="margin-top: 5px;"></div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Xác nhận mật khẩu *</label>
            <input type="password" id="renterConfirmPassword" required placeholder="Nhập lại mật khẩu" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <button type="submit" id="btnRegisterRenter" class="btn btn-primary" style="width: 100%; padding: 11px; font-weight: 600; border-radius: 8px;">
            Đăng ký tài khoản Khách thuê
          </button>
        </form>

        <!-- Form Chủ xe (CRP-10) -->
        <form id="formRegisterOwner" style="display: ${defaultTab === 'owner' ? 'block' : 'none'};" onsubmit="AuthModal.submitRegister(event, 'OWNER')">
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 8px 12px; border-radius: 4px; margin-bottom: 1rem; font-size: 0.82rem; color: #92400e;">
            Đăng ký Owner: Tài khoản mới sẽ có trạng thái <strong>Chờ phê duyệt (Pending Approval)</strong>. Bạn cần chờ Quản trị viên xét duyệt trước khi đăng nhập đăng xe.
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Email chủ xe *</label>
            <input type="email" id="ownerEmail" required placeholder="owner@domain.com" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Họ tên chủ xe / Doanh nghiệp *</label>
            <input type="text" id="ownerFullName" required placeholder="Nguyễn Văn A" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Số điện thoại chính chủ *</label>
            <input type="tel" id="ownerPhone" required placeholder="0988776655" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 0.85rem;">
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Số tài khoản ngân hàng</label>
              <input type="text" id="ownerBankAccount" placeholder="1903..." style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            </div>
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Ngân hàng</label>
              <input type="text" id="ownerBankName" placeholder="Techcombank / VCB" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Mật khẩu quản trị xe *</label>
            <input type="password" id="ownerPassword" required placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, thường & số" oninput="AuthModal.onPasswordInput(this.value, 'ownerStrength')" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            <div id="ownerStrength" style="margin-top: 5px;"></div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Xác nhận mật khẩu *</label>
            <input type="password" id="ownerConfirmPassword" required placeholder="Nhập lại mật khẩu" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
          </div>

          <button type="submit" id="btnRegisterOwner" class="btn btn-primary" style="width: 100%; padding: 11px; font-weight: 600; border-radius: 8px; background: #f59e0b; border-color: #d97706;">
            Đăng ký tài khoản Chủ xe (Chờ duyệt)
          </button>
        </form>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; text-align: center; font-size: 0.85rem; color: #64748b;">
          Đã có tài khoản? 
          <a href="javascript:void(0)" onclick="AuthModal.openLogin()" style="color: #2563eb; font-weight: 600; text-decoration: none;">Đăng nhập ngay</a>
        </div>
      </div>
    `;
    showModal('Đăng ký tài khoản DriveShare', html);
  }

  function switchRegisterTab(tab) {
    const isRenter = tab === 'renter';
    document.getElementById('formRegisterRenter').style.display = isRenter ? 'block' : 'none';
    document.getElementById('formRegisterOwner').style.display = isRenter ? 'none' : 'block';

    const btnRenter = document.getElementById('tabBtnRenter');
    const btnOwner = document.getElementById('tabBtnOwner');

    App.openModal("Đăng ký tài khoản khách thuê", html);
  },

  async function submitRegister(e, role) {
    e.preventDefault();
    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!identifier || !password) {
      App.showToast("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }
    const html = `
      <div class="auth-card">
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.25rem;">
          Sau khi đổi mật khẩu thành công, tất cả các phiên đăng nhập khác của bạn trên các thiết bị sẽ tự động hết hiệu lực (Revoked).
        </p>

    // Giả lập đăng nhập thành công
    const user = {
      id: Date.now(),
      name: identifier.includes("@") ? identifier.split("@")[0] : identifier,
      email: identifier.includes("@") ? identifier : `${identifier}@gmail.com`,
      phone: !identifier.includes("@") ? identifier : "0901 234 567",
      role: "RENTER",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.updateAuthUI();
    App.closeModal();
    App.showToast(`Chào mừng bạn trở lại, ${user.name}!`, "success");
    this._runPendingCallback();
  },

          <button type="submit" id="btnChangePwdSubmit" class="btn btn-primary" style="width: 100%; padding: 11px; font-weight: 600; border-radius: 8px;">
            Cập nhật mật khẩu mới
          </button>
        </form>
      </div>
    `;
    showModal('Đổi mật khẩu tài khoản', html);
  }

  async function submitChangePassword(e) {
    e.preventDefault();
    const fullName = document.getElementById("regFullName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password !== confirmPassword) {
      App.showToast(
        "Mật khẩu xác thực không khớp! Vui lòng kiểm tra lại.",
        "error",
      );
      return;
    }

    const newUser = {
      id: Date.now(),
      name: fullName,
      email: email,
      phone: phone,
      role: "RENTER",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    this.updateAuthUI();
    App.closeModal();
    App.showToast(
      `Đăng ký thành công! Chào mừng ${fullName} gia nhập DriveShare.`,
      "success",
    );
    this._runPendingCallback();
  },

  // ==================== GOOGLE OAUTH ====================
  // TODO: Tích hợp Google OAuth thật
  // Bước 1: Vào https://console.cloud.google.com/ → tạo OAuth 2.0 Client ID
  // Bước 2: Thêm <script src="https://accounts.google.com/gsi/client" async></script> vào index.html
  // Bước 3: Thay YOUR_GOOGLE_CLIENT_ID bên dưới bằng Client ID thật
  // Bước 4: Bỏ thuộc tính `disabled` và `style="opacity:0.5"` trên các nút Google
  loginWithGoogle() {
    const CLIENT_ID =
      "297892126227-pv2j9270l1uuskn1luo2sqbd9bpe4n5c.apps.googleusercontent.com";

    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "email profile",
      callback: (response) => {
        if (response.error) {
          App.showToast(
            "Đăng nhập Google thất bại: " + response.error,
            "error",
          );
          return;
        }
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.access_token}` },
        })
          .then((r) => r.json())
          .then((profile) => {
            const user = {
              id: "google_" + profile.sub,
              name: profile.name,
              email: profile.email,
              phone: "",
              role: "RENTER",
              avatar: profile.picture,
            };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
            this.updateAuthUI();
            App.closeModal();
            App.showToast(
              `Chào mừng ${profile.name}! Đăng nhập Google thành công.`,
              "success",
            );
            this._runPendingCallback();
          })
          .catch(() => {
            App.showToast(
              "Không lấy được thông tin tài khoản Google.",
              "error",
            );
          });
      },
    });

    // prompt: '' → lần đầu chọn tài khoản, lần sau dùng lại token không cần chọn lại
    client.requestAccessToken({ prompt: "" });
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.updateAuthUI();
    App.showToast("Đã đăng xuất tài khoản thành công.", "info");
  },

          <button type="submit" id="btnForgotSubmit" class="btn btn-primary" style="width: 100%; padding: 11px; font-weight: 600; border-radius: 8px;">
            Gửi yêu cầu đặt lại mật khẩu
          </button>
        </form>

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; text-align: center; font-size: 0.85rem; color: #64748b;">
          Quay lại 
          <a href="javascript:void(0)" onclick="AuthModal.openLogin()" style="color: #2563eb; font-weight: 600; text-decoration: none;">Đăng nhập</a>
        </div>
      </div>
    `;
    showModal('Quên mật khẩu', html);
  }

  async function submitForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const alertBox = document.getElementById('forgotAlertBox');
    const btn = document.getElementById('btnForgotSubmit');

    btn.disabled = true;
    btn.innerText = 'Đang gửi yêu cầu...';
    alertBox.style.display = 'none';

    const res = await AuthService.forgotPassword(email);
    btn.disabled = false;
    btn.innerText = 'Gửi yêu cầu đặt lại mật khẩu';

    if (res.success) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#dcfce7';
      alertBox.style.color = '#166534';
      
      const resetUrl = res.data && (res.data.resetUrl || res.data.reset_url);
      if (resetUrl) {
        alertBox.innerHTML = `
          <strong>Yêu cầu thành công!</strong><br>
          ${res.data.message || 'Đã gửi hướng dẫn.'}<br>
          <div style="margin-top: 8px; padding: 6px 10px; background: white; border-radius: 4px; border: 1px dashed #86efac; word-break: break-all;">
            <strong>Link thử nghiệm (Dev Mode):</strong><br>
            <a href="${resetUrl}" onclick="AuthModal.closeModal()" style="color: #2563eb;">Nhấp vào đây để đặt lại mật khẩu</a>
          </div>
        `;
      } else {
        alertBox.innerText = res.message || 'Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.';
      }
    } else {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fee2e2';
      alertBox.style.color = '#991b1b';
      alertBox.innerText = res.message || 'Có lỗi xảy ra!';
    }
  }

  // 5. Reset Password Modal (CRP-14 with Token)
  function openResetPassword(token) {
    const html = `
      <div class="auth-card">
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.25rem;">
          Thiết lập mật khẩu mới cho tài khoản của bạn.
        </p>

        <div id="resetAlertBox" style="display: none; padding: 10px 12px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;"></div>

        <form id="authResetForm" onsubmit="AuthModal.submitResetPassword(event, '${token}')">
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Mật khẩu mới *</label>
            <input type="password" id="resetNewPassword" class="form-control" required placeholder="Tối thiểu 8 ký tự" oninput="AuthModal.onPasswordInput(this.value, 'resetStrength')" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
            <div id="resetStrength" style="margin-top: 5px;"></div>
          </div>
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Xác nhận mật khẩu mới *</label>
            <input type="password" id="resetConfirmPassword" class="form-control" required placeholder="Nhập lại mật khẩu mới" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
          </div>

          <button type="submit" id="btnResetSubmit" class="btn btn-primary" style="width: 100%; padding: 11px; font-weight: 600; border-radius: 8px;">
            Lưu mật khẩu mới
          </button>
        </form>
      </div>
    `;
    showModal('Đặt lại mật khẩu', html);
  }

  async function submitResetPassword(e, token) {
    e.preventDefault();
    const name = document.getElementById("ownerRegName").value.trim();
    const phone = document.getElementById("ownerRegPhone").value.trim();
    const area = document.getElementById("ownerRegArea").value;
    const carType = document.getElementById("ownerRegCarType").value;

    if (!name || !phone || !area || !carType) {
      App.showToast("Vui lòng điền đầy đủ các mục đăng ký chủ xe!", "error");
      return;
    }

    // Lưu yêu cầu đăng ký chủ xe
    const ownerRequest = {
      id: Date.now(),
      name,
      phone,
      area,
      carType,
      status: "PENDING_APPROVAL",
      created_at: new Date().toLocaleString("vi-VN"),
    };

    const existingRequests = JSON.parse(
      localStorage.getItem("driveshare_owner_requests") || "[]",
    );
    existingRequests.unshift(ownerRequest);
    localStorage.setItem(
      "driveshare_owner_requests",
      JSON.stringify(existingRequests),
    );

    const html = `
      <div style="font-size: 0.92rem;">
        <!-- Card thông tin header -->
        <div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1.25rem;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: ${roleBadgeColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            ${(profileData.fullName || profileData.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 700; color: #0f172a; font-size: 1.05rem;">${profileData.fullName || profileData.username}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: ${roleBadgeColor}; background: white; padding: 2px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">${roleBadgeText}</span>
              <span style="font-size: 0.8rem; color: #64748b;">@${profileData.username}</span>
            </div>
          </div>
        </div>

        <form id="profileUpdateForm" onsubmit="AuthModal.submitProfile(event)">
          <!-- Hộp thông báo alert -->
          <div id="profileAlertBox" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem;"></div>

          <!-- Thông tin cơ bản -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.8rem; color: #475569; font-weight: 600; margin-bottom: 4px; display: block;">Họ và tên *</label>
              <input type="text" id="profFullName" required value="${profileData.fullName || ''}" placeholder="Nhập họ và tên" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            </div>
            <div class="form-group">
              <label style="font-size: 0.8rem; color: #475569; font-weight: 600; margin-bottom: 4px; display: block;">Số điện thoại *</label>
              <input type="tel" id="profPhone" required value="${profileData.phone || ''}" placeholder="VD: 0901234567" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.8rem; color: #475569; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
                <span>Email đăng nhập</span>
                <span style="color: #94a3b8; font-size: 0.72rem; font-weight: normal;">(Cố định)</span>
              </label>
              <input type="email" disabled value="${profileData.email || ''}" style="width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; background: #f8fafc; color: #64748b; cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label style="font-size: 0.8rem; color: #475569; font-weight: 600; margin-bottom: 4px; display: block;">Số CMND / CCCD</label>
              <input type="text" id="profIdCard" value="${profileData.idCardNumber || ''}" placeholder="VD: 079201001234" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            </div>
          </div>

          ${specificFieldsHtml}

          <!-- Nút hành động -->
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
            <button type="button" class="btn btn-outline btn-sm" onclick="AuthModal.closeModal()" style="padding: 9px 16px; font-weight: 600; border-radius: 8px;">
              Hủy
            </button>
            <button type="submit" id="btnProfileSubmit" class="btn btn-primary btn-sm" style="padding: 9px 20px; font-weight: 700; border-radius: 8px; background: #0f766e; border: none; display: inline-flex; align-items: center; gap: 6px; color: white; cursor: pointer;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    `;

    App.openModal("Hồ sơ đối tác Chủ xe", html);
    document.getElementById("formHomeOwnerRegister").reset();
  },
};
