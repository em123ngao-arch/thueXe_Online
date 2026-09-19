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

const AuthService = (function () {
  const API_BASE = 'http://localhost:8080/api/v1/auth';

  // State keys in localStorage
  const KEY_ACCESS_TOKEN = 'ds_access_token';
  const KEY_REFRESH_TOKEN = 'ds_refresh_token';
  const KEY_USER = 'ds_user';

  // In-memory / localStorage helpers
  function getAccessToken() {
    return localStorage.getItem(KEY_ACCESS_TOKEN);
  }

  function getRefreshToken() {
    return localStorage.getItem(KEY_REFRESH_TOKEN);
  }

  function getCurrentUser() {
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

  // CRP-13: Change Password
  async function changePassword(currentPassword, newPassword, confirmPassword) {
    return await request('/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        current_password: currentPassword,
        newPassword,
        new_password: newPassword,
        confirmPassword,
        confirm_password: confirmPassword
      })
    });
  }

  // CRP-14: Forgot Password
  async function forgotPassword(email) {
    return await request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // CRP-14: Reset Password
  async function resetPassword(token, newPassword, confirmPassword) {
    return await request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        newPassword,
        new_password: newPassword,
        confirmPassword,
        confirm_password: confirmPassword
      })
    });
  }

  // CRP-16: RBAC Test Calls
  async function testRenterEndpoint() {
    return await request('/renter-test', { method: 'GET' });
  }

  async function testOwnerEndpoint() {
    return await request('/owner-test', { method: 'GET' });
  }

  async function testAdminEndpoint() {
    return await request('/admin-test', { method: 'GET' });
  }

  // Admin Approval for Pending Owners
  async function getPendingOwners() {
    return await request('/pending-owners', { method: 'GET' });
  }

  async function approveOwner(userId) {
    return await request(`/approve-owner/${userId}`, { method: 'POST' });
  }

  // Password Strength Evaluation
  function evaluatePasswordStrength(password) {
    if (!password) return { score: 0, label: 'Chưa nhập', color: '#94a3b8', width: '0%' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Yếu (Cần ít nhất 8 ký tự, chữ hoa, thường & số)', color: '#ef4444', width: '25%' };
      case 2:
        return { score: 2, label: 'Trung bình (Cần thêm chữ số hoặc chữ hoa)', color: '#f59e0b', width: '50%' };
      case 3:
        return { score: 3, label: 'Khá mạnh (Đạt chuẩn bảo mật)', color: '#3b82f6', width: '75%' };
      case 4:
        return { score: 4, label: 'Rất mạnh (Tối ưu an toàn)', color: '#10b981', width: '100%' };
      default:
        return { score: 0, label: 'Quá ngắn (< 8 ký tự)', color: '#ef4444', width: '10%' };
    }
  }

  // Fetch full user profile from backend: GET /api/v1/users/me (CRP-17 / CRP-18)
  async function fetchUserProfile() {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const res = await fetch('http://localhost:8080/api/v1/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          const u = getCurrentUser() || {};
          u.fullName = json.data.fullName || u.username;
          u.phone = json.data.phone || '';
          u.idCardNumber = json.data.idCardNumber || '';
          if (json.data.ownerProfile) {
            u.bankName = json.data.ownerProfile.bankName;
            u.bankAccountNumber = json.data.ownerProfile.bankAccountNumber;
            u.ownerVerificationStatus = json.data.ownerProfile.verificationStatus;
          }
          if (json.data.renterProfile) {
            u.licenseNumber = json.data.renterProfile.licenseNumber;
            u.licenseVerificationStatus = json.data.renterProfile.licenseVerificationStatus;
          }
          localStorage.setItem(KEY_USER, JSON.stringify(u));
          updateNavAuthUI();
          if (typeof OwnerService !== 'undefined' && document.getElementById('ownerSection')?.style.display === 'block') {
            OwnerService.renderOwnerPortal();
          }
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Lỗi nạp thông tin người dùng từ Backend:', e);
    }
    return null;
  }

  // Update Top Navigation Auth UI State
  function updateNavAuthUI() {
    const user = getCurrentUser();
    const navAuthContainer = document.getElementById('navAuthContainer');
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
        <div class="auth-user-badge-wrapper" style="display: flex; align-items: center; gap: 8px;">
          ${portalBtnHtml}
          <div class="user-avatar-chip" onclick="AuthModal.openProfile()" style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--slate-100, #f1f5f9); border-radius: 20px; font-size: 0.85rem; border: 1px solid var(--slate-200, #e2e8f0); cursor: pointer; transition: all 0.2s ease;" title="Xem & chỉnh sửa hồ sơ">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${roleColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem;">
              ${(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div style="text-align: left; line-height: 1.2;">
              <span style="font-weight: 600; color: var(--slate-800, #1e293b);">${user.fullName || user.username || user.email}</span>
              <span style="display: block; font-size: 0.7rem; color: ${roleColor}; font-weight: 700;">${roleName}</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="AuthModal.openProfile()" title="Xem và cập nhật Hồ sơ của tôi (CRP-17)" style="padding: 6px 12px; font-size: 0.82rem; color: var(--slate-700, #334155); border-color: var(--slate-300, #cbd5e1); font-weight: 600; display: inline-flex; align-items: center; gap: 5px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Hồ sơ của tôi
          </button>
          <button class="btn btn-outline btn-sm" onclick="AuthService.handleLogout()" title="Đăng xuất khỏi hệ thống" style="padding: 6px 12px; font-size: 0.82rem; color: #ef4444; border-color: #fecaca; font-weight: 500;">
            Đăng xuất
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

  return {
    getAccessToken,
    getRefreshToken,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    login,
    registerOwner,
    registerRenter,
    refreshToken,
    logout,
    handleLogout,
    changePassword,
    forgotPassword,
    resetPassword,
    testRenterEndpoint,
    testOwnerEndpoint,
    testAdminEndpoint,
    getPendingOwners,
    approveOwner,
    evaluatePasswordStrength,
    fetchUserProfile,
    updateNavAuthUI
  };
})();

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

  async function quickLogin(identifier, password, targetRole) {
    const idField = document.getElementById('loginIdentifier');
    const pwdField = document.getElementById('loginPassword');
    if (idField) idField.value = identifier;
    if (pwdField) pwdField.value = password;

    const btn = document.getElementById('btnLoginSubmit');
    const alertBox = document.getElementById('loginAlertBox');
    if (btn) {
      btn.disabled = true;
      btn.innerText = `Đang đăng nhập ${identifier}...`;
    }
    if (alertBox) alertBox.style.display = 'none';

    const res = await AuthService.login(identifier, password);
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Đăng nhập';
    }

    if (res.success) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#dcfce7';
        alertBox.style.color = '#166534';
        alertBox.style.border = '1px solid #bbf7d0';
        alertBox.innerText = `Đăng nhập thành công!`;
      }
      setTimeout(() => {
        closeModal();
        if (targetRole) {
          App.switchRole(targetRole);
        } else {
          const user = AuthService.getCurrentUser();
          if (user && user.roles) {
            if (user.roles.includes('ROLE_ADMIN')) App.switchRole('ADMIN');
            else if (user.roles.includes('ROLE_OWNER')) App.switchRole('OWNER');
            else App.switchRole('RENTER');
          }
        }
        App.showToast(`Đã đăng nhập tài khoản: ${identifier}`, 'success');
      }, 300);
    } else {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.style.border = '1px solid #fecaca';
        alertBox.innerText = res.message || 'Đăng nhập thất bại!';
      }
    }
  }

  async function submitLogin(e) {
    e.preventDefault();
    const idField = document.getElementById('loginIdentifier');
    const pwdField = document.getElementById('loginPassword');
    const btn = document.getElementById('btnLoginSubmit');
    const alertBox = document.getElementById('loginAlertBox');

    btn.disabled = true;
    btn.innerText = 'Đang xử lý đăng nhập...';
    alertBox.style.display = 'none';

    const res = await AuthService.login(idField.value.trim(), pwdField.value);
    btn.disabled = false;
    btn.innerText = 'Đăng nhập';

    if (res.success) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#dcfce7';
      alertBox.style.color = '#166534';
      alertBox.style.border = '1px solid #bbf7d0';
      alertBox.innerText = 'Đăng nhập thành công!';
      
      setTimeout(() => {
        closeModal();
        const user = AuthService.getCurrentUser();
        if (user && user.roles) {
          if (user.roles.includes('ROLE_ADMIN')) {
            App.switchRole('ADMIN');
          } else if (user.roles.includes('ROLE_OWNER')) {
            App.switchRole('OWNER');
          } else {
            App.switchRole('RENTER');
          }
        }
        App.showToast(`Chào mừng trở lại, ${user.username || user.email}!`, 'success');
      }, 500);
    } else {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fee2e2';
      alertBox.style.color = '#991b1b';
      alertBox.style.border = '1px solid #fecaca';

      if (res.errorCode === 'ACCOUNT_PENDING') {
        alertBox.innerHTML = `<strong>Tài khoản Chờ duyệt:</strong> Tài khoản Chủ xe của bạn đang chờ Admin phê duyệt trước khi có thể đăng nhập.`;
      } else if (res.errorCode === 'RATE_LIMITED') {
        alertBox.innerHTML = `<strong>Khóa tạm thời:</strong> Bạn đã thử đăng nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút.`;
      } else if (res.errorCode === 'ACCOUNT_LOCKED') {
        alertBox.innerHTML = `<strong>Tài khoản bị khóa:</strong> Vui lòng liên hệ hỗ trợ để mở khóa.`;
      } else {
        alertBox.innerText = res.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
      }
    }
  }

  // 2. Register Tabs Modal (CRP-10: Owner, CRP-11: Renter)
  function openRegister(defaultTab = 'renter') {
    const html = `
      <div class="auth-register-tabs">
        <div style="display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.25rem;">
          <button type="button" id="tabBtnRenter" onclick="AuthModal.switchRegisterTab('renter')" style="flex: 1; padding: 10px; border: none; background: transparent; font-weight: 700; font-size: 0.95rem; cursor: pointer; border-bottom: 3px solid ${defaultTab === 'renter' ? '#2563eb' : 'transparent'}; color: ${defaultTab === 'renter' ? '#2563eb' : '#64748b'};">
            👤 Khách thuê (Renter)
          </button>
          <button type="button" id="tabBtnOwner" onclick="AuthModal.switchRegisterTab('owner')" style="flex: 1; padding: 10px; border: none; background: transparent; font-weight: 700; font-size: 0.95rem; cursor: pointer; border-bottom: 3px solid ${defaultTab === 'owner' ? '#f59e0b' : 'transparent'}; color: ${defaultTab === 'owner' ? '#f59e0b' : '#64748b'};">
            🚗 Chủ xe (Owner)
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

    btnRenter.style.borderBottomColor = isRenter ? '#2563eb' : 'transparent';
    btnRenter.style.color = isRenter ? '#2563eb' : '#64748b';
    btnOwner.style.borderBottomColor = isRenter ? 'transparent' : '#f59e0b';
    btnOwner.style.color = isRenter ? '#64748b' : '#f59e0b';

    const alertBox = document.getElementById('registerAlertBox');
    if (alertBox) alertBox.style.display = 'none';
  }

  function onPasswordInput(val, targetId) {
    const res = AuthService.evaluatePasswordStrength(val);
    const el = document.getElementById(targetId);
    if (!el) return;
    el.innerHTML = `
      <div style="height: 4px; width: 100%; background: #e2e8f0; border-radius: 2px; overflow: hidden; margin-top: 4px;">
        <div style="height: 100%; width: ${res.width}; background: ${res.color}; transition: all 0.3s ease;"></div>
      </div>
      <span style="font-size: 0.75rem; color: ${res.color}; font-weight: 600; display: block; margin-top: 2px;">
        ${res.label}
      </span>
    `;
  }

  async function submitRegister(e, role) {
    e.preventDefault();
    const alertBox = document.getElementById('registerAlertBox');
    alertBox.style.display = 'none';

    let payload = {};
    let btnSubmit = null;

    if (role === 'RENTER') {
      btnSubmit = document.getElementById('btnRegisterRenter');
      const email = document.getElementById('renterEmail').value.trim();
      const fullName = document.getElementById('renterFullName').value.trim();
      const phone = document.getElementById('renterPhone').value.trim();
      const password = document.getElementById('renterPassword').value;
      const confirmPassword = document.getElementById('renterConfirmPassword').value;

      if (password !== confirmPassword) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.innerText = 'Mật khẩu xác nhận không khớp!';
        return;
      }

      payload = { email, fullName, phone, password, confirmPassword, role: 'RENTER' };
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Đang xử lý đăng ký...';

      const res = await AuthService.registerRenter(payload);
      btnSubmit.disabled = false;
      btnSubmit.innerText = 'Đăng ký tài khoản Khách thuê';

      if (res.success) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#dcfce7';
        alertBox.style.color = '#166534';
        alertBox.innerHTML = `<strong>Thành công!</strong> ${res.message || 'Đăng ký thành công! Bạn có thể đăng nhập ngay.'}`;
        setTimeout(() => openLogin(), 1500);
      } else {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.innerText = res.message || 'Đăng ký thất bại!';
      }
    } else {
      btnSubmit = document.getElementById('btnRegisterOwner');
      const email = document.getElementById('ownerEmail').value.trim();
      const fullName = document.getElementById('ownerFullName').value.trim();
      const phone = document.getElementById('ownerPhone').value.trim();
      const bankAccountNumber = document.getElementById('ownerBankAccount').value.trim();
      const bankName = document.getElementById('ownerBankName').value.trim();
      const password = document.getElementById('ownerPassword').value;
      const confirmPassword = document.getElementById('ownerConfirmPassword').value;

      if (password !== confirmPassword) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.innerText = 'Mật khẩu xác nhận không khớp!';
        return;
      }

      payload = { email, fullName, phone, bankAccountNumber, bankName, password, confirmPassword, role: 'OWNER' };
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Đang xử lý đăng ký...';

      const res = await AuthService.registerOwner(payload);
      btnSubmit.disabled = false;
      btnSubmit.innerText = 'Đăng ký tài khoản Chủ xe (Chờ duyệt)';

      if (res.success) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fef3c7';
        alertBox.style.color = '#92400e';
        alertBox.innerHTML = `
          <strong>Đăng ký thành công!</strong><br>
          Tài khoản Chủ xe của bạn đang ở trạng thái <strong>Chờ duyệt (Pending Approval)</strong>.<br>
          Admin sẽ tiến hành duyệt tài khoản trước khi bạn có thể đăng nhập.
        `;
      } else {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.innerText = res.message || 'Đăng ký thất bại!';
      }
    }
  }

  // 3. Change Password Modal (CRP-13)
  function openChangePassword() {
    if (!AuthService.isAuthenticated()) {
      openLogin();
      return;
    }
    const html = `
      <div class="auth-card">
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.25rem;">
          Sau khi đổi mật khẩu thành công, tất cả các phiên đăng nhập khác của bạn trên các thiết bị sẽ tự động hết hiệu lực (Revoked).
        </p>

        <div id="changePwdAlertBox" style="display: none; padding: 10px 12px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;"></div>

        <form id="authChangePwdForm" onsubmit="AuthModal.submitChangePassword(event)">
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Mật khẩu hiện tại *</label>
            <input type="password" id="curPassword" class="form-control" required placeholder="••••••••" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
          </div>
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Mật khẩu mới *</label>
            <input type="password" id="newPassword" class="form-control" required placeholder="Tối thiểu 8 ký tự" oninput="AuthModal.onPasswordInput(this.value, 'newPwdStrength')" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
            <div id="newPwdStrength" style="margin-top: 5px;"></div>
          </div>
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Xác nhận mật khẩu mới *</label>
            <input type="password" id="confirmNewPassword" class="form-control" required placeholder="Nhập lại mật khẩu mới" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
          </div>

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
    const cur = document.getElementById('curPassword').value;
    const next = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;
    const alertBox = document.getElementById('changePwdAlertBox');
    const btn = document.getElementById('btnChangePwdSubmit');

    if (next !== confirm) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fee2e2';
      alertBox.style.color = '#991b1b';
      alertBox.innerText = 'Mật khẩu xác nhận không trùng khớp!';
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Đang đổi mật khẩu...';
    alertBox.style.display = 'none';

    const res = await AuthService.changePassword(cur, next, confirm);
    btn.disabled = false;
    btn.innerText = 'Cập nhật mật khẩu mới';

    if (res.success) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#dcfce7';
      alertBox.style.color = '#166534';
      alertBox.innerText = 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.';
      setTimeout(() => {
        AuthService.logout();
        openLogin();
      }, 1500);
    } else {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fee2e2';
      alertBox.style.color = '#991b1b';
      alertBox.innerText = res.message || 'Không thể đổi mật khẩu!';
    }
  }

  // 4. Forgot Password Modal (CRP-14)
  function openForgotPassword() {
    const html = `
      <div class="auth-card">
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.25rem;">
          Nhập địa chỉ email tài khoản của bạn. Chúng tôi sẽ tạo liên kết đặt lại mật khẩu an toàn (hạn dùng 30 phút).
        </p>

        <div id="forgotAlertBox" style="display: none; padding: 10px 12px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;"></div>

        <form id="authForgotForm" onsubmit="AuthModal.submitForgotPassword(event)">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">Email tài khoản *</label>
            <input type="email" id="forgotEmail" class="form-control" required placeholder="admin@driveshare.com" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
          </div>

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
    const next = document.getElementById('resetNewPassword').value;
    const confirm = document.getElementById('resetConfirmPassword').value;
    const alertBox = document.getElementById('resetAlertBox');
    const btn = document.getElementById('btnResetSubmit');

    if (next !== confirm) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fee2e2';
      alertBox.style.color = '#991b1b';
      alertBox.innerText = 'Mật khẩu xác nhận không khớp!';
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Đang đặt lại mật khẩu...';
    alertBox.style.display = 'none';

    const res = await AuthService.resetPassword(token, next, confirm);
    btn.disabled = false;
    btn.innerText = 'Lưu mật khẩu mới';

    if (res.success) {
      alertBox.style.display = 'block';
      alertBox.style.background = '#dcfce7';
      alertBox.style.color = '#166534';
      alertBox.innerText = 'Đặt lại mật khẩu thành công! Chuyển hướng đến đăng nhập...';
      window.location.hash = '';
      setTimeout(() => openLogin(), 1500);
    } else {
      alertBox.style.display = 'block';
      alertBox.style.background = '#fee2e2';
      alertBox.style.color = '#991b1b';
      alertBox.innerText = res.message || 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!';
    }
  }

  // 6. Interactive RBAC Tester Console (CRP-16 Demonstration)
  function openRbacTester() {
    const user = AuthService.getCurrentUser();
    const roleText = user && user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'Chưa đăng nhập (Unauthenticated)';

    const html = `
      <div class="rbac-tester-card">
        <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1rem;">
          Kiểm tra tính năng <strong>Phân quyền tập trung (Centralized RBAC - CRP-16)</strong> qua Spring Security.<br>
          Phiên hiện tại: <strong style="color: #1e293b;">${roleText}</strong>
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 1rem;">
          <button class="btn btn-outline btn-sm" onclick="AuthModal.runRbacTest('RENTER')" style="padding: 10px 4px; font-weight: 600; font-size: 0.82rem;">
            Test /renter-test
          </button>
          <button class="btn btn-outline btn-sm" onclick="AuthModal.runRbacTest('OWNER')" style="padding: 10px 4px; font-weight: 600; font-size: 0.82rem; color: #d97706; border-color: #fde68a;">
            Test /owner-test
          </button>
          <button class="btn btn-outline btn-sm" onclick="AuthModal.runRbacTest('ADMIN')" style="padding: 10px 4px; font-weight: 600; font-size: 0.82rem; color: #dc2626; border-color: #fecaca;">
            Test /admin-test
          </button>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
          <button class="btn btn-outline btn-sm" onclick="AuthModal.runRefreshTokenTest()" style="flex: 1; padding: 8px; font-size: 0.8rem;">
            🔄 Test Refresh Token (CRP-15)
          </button>
          <button class="btn btn-outline btn-sm" onclick="AuthModal.testInvalidToken()" style="flex: 1; padding: 8px; font-size: 0.8rem; color: #ef4444;">
            ⛔ Giả lập Token bị thu hồi (401)
          </button>
        </div>

        <div style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 4px;">
          Kết quả phản hồi từ Backend API:
        </div>
        <pre id="rbacTestConsole" style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.8rem; min-height: 120px; max-height: 220px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">
Nhấn các nút kiểm tra ở trên để xem phản hồi thực tế từ máy chủ (HTTP 200, 401 Unauthorized, 403 Forbidden)...
        </pre>
      </div>
    `;
    showModal('Console Kiểm thử Phân quyền (RBAC Tester)', html);
  }

  async function runRbacTest(targetRole) {
    const consoleEl = document.getElementById('rbacTestConsole');
    consoleEl.innerText = `Đang gửi HTTP GET /api/v1/auth/${targetRole.toLowerCase()}-test...`;

    let res = null;
    if (targetRole === 'RENTER') res = await AuthService.testRenterEndpoint();
    else if (targetRole === 'OWNER') res = await AuthService.testOwnerEndpoint();
    else if (targetRole === 'ADMIN') res = await AuthService.testAdminEndpoint();

    formatConsoleOutput(consoleEl, `GET /api/v1/auth/${targetRole.toLowerCase()}-test`, res);
  }

  async function runRefreshTokenTest() {
    const consoleEl = document.getElementById('rbacTestConsole');
    consoleEl.innerText = 'Đang gửi HTTP POST /api/v1/auth/refresh-token...';
    const res = await AuthService.refreshToken();
    formatConsoleOutput(consoleEl, 'POST /api/v1/auth/refresh-token', res);
  }

  async function testInvalidToken() {
    const consoleEl = document.getElementById('rbacTestConsole');
    consoleEl.innerText = 'Đang gửi request với Header Authorization token rác...';
    try {
      const resp = await fetch('http://localhost:8080/api/v1/auth/me', {
        headers: { 'Authorization': 'Bearer INVALID_REVOKED_TOKEN_XYZ' }
      });
      const data = await resp.json().catch(() => null);
      formatConsoleOutput(consoleEl, 'GET /api/v1/auth/me [Forged/Revoked Token]', {
        status: resp.status,
        success: resp.ok,
        data: data
      });
    } catch (e) {
      consoleEl.innerText = 'Lỗi kết nối máy chủ: ' + e.message;
    }
  }

  function formatConsoleOutput(el, requestLabel, res) {
    let statusBadge = '';
    if (res.status === 200) statusBadge = '🟢 HTTP 200 OK (Truy cập thành công)';
    else if (res.status === 401) statusBadge = '🔴 HTTP 401 UNAUTHORIZED (Chưa đăng nhập / Token hết hạn)';
    else if (res.status === 403) statusBadge = '🟠 HTTP 403 FORBIDDEN (Truy cập bị từ chối - Sai Role)';
    else statusBadge = `⚪ HTTP ${res.status}`;

    const output = [
      `===> ${requestLabel}`,
      `Trạng thái: ${statusBadge}`,
      `Payload JSON nhận về:`,
      JSON.stringify(res, null, 2)
    ].join('\n');
    el.innerText = output;
  }

  // --- 7. Profile Modal (CRP-17 / CRP-18: Hồ sơ cá nhân) ---
  async function openProfile() {
    const user = AuthService.getCurrentUser();
    if (!user) {
      openLogin();
      return;
    }

    // Hiển thị modal loading phong cách hiện đại
    showModal('Hồ sơ của tôi', `
      <div style="text-align: center; padding: 2.5rem 1rem;">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0f766e; border-radius: 50%; animation: spinProfile 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #64748b; font-size: 0.9rem; font-weight: 500;">Đang nạp dữ liệu hồ sơ từ máy chủ...</p>
      </div>
      <style>@keyframes spinProfile { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `);

    let profileData = {
      username: user.username || '',
      email: user.email || '',
      fullName: user.fullName || user.username || '',
      phone: user.phone || '',
      idCardNumber: user.idCardNumber || '',
      roles: user.roles || [],
      renterProfile: null,
      ownerProfile: null
    };

    // Gọi API backend lấy dữ liệu mới nhất: GET /api/v1/users/me
    try {
      const token = AuthService.getAccessToken();
      const res = await fetch('http://localhost:8080/api/v1/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          profileData = Object.assign(profileData, json.data);
          user.fullName = profileData.fullName;
          user.phone = profileData.phone;
          user.idCardNumber = profileData.idCardNumber;
          localStorage.setItem('ds_user', JSON.stringify(user));
          AuthService.updateNavAuthUI();
        }
      }
    } catch (err) {
      console.warn('Lỗi nạp /users/me, sử dụng dữ liệu tạm:', err);
    }

    const isRenter = (profileData.roles || []).some(r => r.includes('RENTER'));
    const isOwner = (profileData.roles || []).some(r => r.includes('OWNER'));
    const isAdmin = (profileData.roles || []).some(r => r.includes('ADMIN'));

    let roleBadgeText = 'Khách thuê (Renter)';
    let roleBadgeColor = '#3b82f6';
    if (isAdmin) { roleBadgeText = 'Quản trị viên (Admin)'; roleBadgeColor = '#ef4444'; }
    else if (isOwner) { roleBadgeText = 'Chủ xe (Owner)'; roleBadgeColor = '#f59e0b'; }

    let specificFieldsHtml = '';

    if (isRenter) {
      const licenseNumber = profileData.renterProfile ? (profileData.renterProfile.licenseNumber || '') : '';
      const licenseStatus = profileData.renterProfile ? (profileData.renterProfile.licenseVerificationStatus || 'PENDING') : 'PENDING';
      const licenseBadgeColor = licenseStatus === 'VERIFIED' ? '#16a34a' : '#d97706';
      const licenseBadgeBg = licenseStatus === 'VERIFIED' ? '#dcfce7' : '#fef3c7';
      const licenseBadgeText = licenseStatus === 'VERIFIED' ? 'Đã duyệt' : 'Chờ xác thực';

      specificFieldsHtml = `
        <div style="margin-top: 1.25rem; padding-top: 1.15rem; border-top: 1px dashed #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <label style="font-weight: 700; color: #1e293b; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="11" y2="16"></line></svg>
              Giấy phép lái xe (GPLX)
            </label>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${licenseBadgeColor}; background: ${licenseBadgeBg}; padding: 2px 8px; border-radius: 12px;">
              ${licenseBadgeText}
            </span>
          </div>
          <div class="form-group" style="margin-bottom: 0.5rem;">
            <label style="font-size: 0.8rem; color: #64748b; font-weight: 500; margin-bottom: 4px; display: block;">Số bằng lái xe (12 chữ số theo quy định)</label>
            <input type="text" id="profLicenseNumber" value="${licenseNumber}" placeholder="VD: 790123456789" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: monospace;">
          </div>
        </div>
      `;
    } else if (isOwner) {
      const bankName = profileData.ownerProfile ? (profileData.ownerProfile.bankName || '') : '';
      const bankAccount = profileData.ownerProfile ? (profileData.ownerProfile.bankAccountNumber || '') : '';
      const ownerStatus = profileData.ownerProfile ? (profileData.ownerProfile.verificationStatus || 'PENDING') : 'PENDING';
      const ownerBadgeColor = ownerStatus === 'VERIFIED' ? '#16a34a' : '#d97706';
      const ownerBadgeBg = ownerStatus === 'VERIFIED' ? '#dcfce7' : '#fef3c7';
      const ownerBadgeText = ownerStatus === 'VERIFIED' ? 'Đã duyệt' : 'Chờ xét duyệt';

      specificFieldsHtml = `
        <div style="margin-top: 1.25rem; padding-top: 1.15rem; border-top: 1px dashed #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <label style="font-weight: 700; color: #1e293b; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              Tài khoản nhận tiền thuê (Chủ xe)
            </label>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${ownerBadgeColor}; background: ${ownerBadgeBg}; padding: 2px 8px; border-radius: 12px;">
              ${ownerBadgeText}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label style="font-size: 0.8rem; color: #64748b; font-weight: 500; margin-bottom: 4px; display: block;">Ngân hàng</label>
              <input type="text" id="profBankName" value="${bankName}" placeholder="VD: Vietcombank" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label style="font-size: 0.8rem; color: #64748b; font-weight: 500; margin-bottom: 4px; display: block;">Số tài khoản</label>
              <input type="text" id="profBankAccount" value="${bankAccount}" placeholder="VD: 0071001234567" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-family: monospace;">
            </div>
          </div>
        </div>
      `;
    }

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

    showModal('Hồ sơ của tôi', html);
  }

  async function submitProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('btnProfileSubmit');
    const alertBox = document.getElementById('profileAlertBox');
    const user = AuthService.getCurrentUser();
    if (!user) return;

    const fullName = document.getElementById('profFullName')?.value?.trim() || '';
    const phone = document.getElementById('profPhone')?.value?.trim() || '';
    const idCard = document.getElementById('profIdCard')?.value?.trim() || '';

    btn.disabled = true;
    btn.innerHTML = 'Đang lưu...';
    if (alertBox) alertBox.style.display = 'none';

    const token = AuthService.getAccessToken();
    const isOwner = (user.roles || []).some(r => r.includes('OWNER'));

    let endpoint = 'http://localhost:8080/api/v1/users/me/renter-profile';
    let payload = {
      fullName: fullName,
      full_name: fullName,
      phone: phone,
      idCardNumber: idCard,
      id_card_number: idCard
    };

    if (isOwner) {
      endpoint = 'http://localhost:8080/api/v1/users/me/owner-profile';
      const bankName = document.getElementById('profBankName')?.value?.trim() || '';
      const bankAccount = document.getElementById('profBankAccount')?.value?.trim() || '';
      payload.bankName = bankName;
      payload.bank_name = bankName;
      payload.bankAccountNumber = bankAccount;
      payload.bank_account_number = bankAccount;
    } else {
      const licenseNum = document.getElementById('profLicenseNumber')?.value?.trim() || '';
      if (licenseNum) {
        payload.licenseNumber = licenseNum;
        payload.license_number = licenseNum;
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      btn.disabled = false;
      btn.innerHTML = 'Lưu thay đổi';

      if (res.ok && data.success) {
        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.style.background = '#dcfce7';
          alertBox.style.color = '#166534';
          alertBox.style.border = '1px solid #bbf7d0';
          alertBox.innerText = 'Cập nhật thông tin hồ sơ thành công!';
        }

        // Cập nhật trạng thái người dùng local
        user.fullName = fullName;
        user.phone = phone;
        user.idCardNumber = idCard;
        localStorage.setItem('ds_user', JSON.stringify(user));
        AuthService.updateNavAuthUI();

        // Nếu đang ở Kênh Chủ Xe thì cập nhật lại giao diện ngay
        if (typeof OwnerService !== 'undefined' && document.getElementById('ownerSection')?.style.display === 'block') {
          OwnerService.renderOwnerPortal();
        }

        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('Hồ sơ của bạn đã được cập nhật thành công!', 'success');
        }

        setTimeout(() => {
          closeModal();
        }, 1200);
      } else {
        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.style.background = '#fee2e2';
          alertBox.style.color = '#991b1b';
          alertBox.style.border = '1px solid #fecaca';
          alertBox.innerText = data.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại dữ liệu.';
        }
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = 'Lưu thay đổi';
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.style.border = '1px solid #fecaca';
        alertBox.innerText = 'Lỗi kết nối máy chủ backend: ' + err.message;
      }
    }
  }

  return {
    init,
    closeModal,
    openLogin,
    submitLogin,
    quickLogin,
    openRegister,
    switchRegisterTab,
    onPasswordInput,
    submitRegister,
    openChangePassword,
    submitChangePassword,
    openForgotPassword,
    submitForgotPassword,
    openResetPassword,
    submitResetPassword,
    openRbacTester,
    runRbacTest,
    runRefreshTokenTest,
    testInvalidToken,
    openProfile,
    submitProfile
  };
})();

// Auto-init on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      AuthModal.init();
    });
  } else {
    AuthModal.init();
  }
}
