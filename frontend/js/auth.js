/**
 * DRIVESHARE — Auth Service (Đăng ký, Đăng nhập, Đăng ký Chủ xe)
 * Quản lý phiên làm việc người dùng, hỗ trợ Google, Facebook và LocalStorage
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
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Cập nhật trạng thái đăng nhập trên giao diện
  updateAuthUI() {
    const user = this.getCurrentUser();
    const navAuthContainer = document.getElementById("navAuthContainer");
    if (!navAuthContainer) return;

    if (user) {
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
        <button class="btn btn-outline btn-sm" onclick="AuthService.openLoginModal()">Đăng nhập</button>
        <button class="btn btn-primary btn-sm" onclick="AuthService.openRegisterModal()">Đăng ký</button>
      `;
    }
  },

  // ==================== 1. MODAL ĐĂNG NHẬP ====================
  openLoginModal() {
    const html = `
      <div class="auth-modal-content">
        <div class="auth-header">
          <h3>Đăng nhập DriveShare</h3>
          <p>Thuê xe tự lái an toàn, giao tận nơi toàn quốc</p>
        </div>

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

        <div class="auth-divider">
          <span>hoặc đăng nhập bằng tài khoản</span>
        </div>

        <form id="formLogin" onsubmit="AuthService.handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Gmail hoặc Số điện thoại</label>
            <input type="text" class="form-control" id="loginIdentifier" placeholder="name@example.com hoặc 0901234567" required />
          </div>

          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input type="password" class="form-control" id="loginPassword" placeholder="Nhập mật khẩu của bạn" required />
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--slate-600); cursor: pointer;">
              <input type="checkbox" checked /> Ghi nhớ đăng nhập
            </label>
            <a href="javascript:void(0)" onclick="App.showToast('Vui lòng liên hệ CSKH 1900 8888 để lấy lại mật khẩu', 'info')" style="font-size: 0.84rem; color: var(--primary); font-weight: 600;">Quên mật khẩu?</a>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
            Đăng nhập ngay
          </button>
        </form>

        <div class="auth-footer-prompt">
          Chưa có tài khoản? <a href="javascript:void(0)" onclick="AuthService.openRegisterModal()">Đăng ký tài khoản mới</a>
        </div>
      </div>
    `;

    App.openModal("Đăng nhập khách hàng", html);
  },

  // ==================== 2. MODAL ĐĂNG KÝ KHÁCH THUÊ XE ====================
  openRegisterModal() {
    const html = `
      <div class="auth-modal-content">
        <div class="auth-header">
          <h3>Đăng ký tài khoản Khách thuê</h3>
          <p>Tạo tài khoản nhận ngay ưu đãi 100k cho chuyến thuê xe đầu tiên</p>
        </div>

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

        <div class="auth-divider">
          <span>hoặc điền thông tin chi tiết</span>
        </div>

        <form id="formRegister" onsubmit="AuthService.handleRegister(event)">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Họ và tên <span style="color: var(--danger);">*</span></label>
              <input type="text" class="form-control" id="regFullName" placeholder="Nguyễn Văn A" required />
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại <span style="color: var(--danger);">*</span></label>
              <input type="tel" class="form-control" id="regPhone" placeholder="0901 234 567" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Địa chỉ Gmail <span style="color: var(--danger);">*</span></label>
            <input type="email" class="form-control" id="regEmail" placeholder="name@gmail.com" required />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Mật khẩu <span style="color: var(--danger);">*</span></label>
              <input type="password" class="form-control" id="regPassword" placeholder="Tối thiểu 6 ký tự" minlength="6" required />
            </div>
            <div class="form-group">
              <label class="form-label">Xác thực mật khẩu <span style="color: var(--danger);">*</span></label>
              <input type="password" class="form-control" id="regConfirmPassword" placeholder="Nhập lại mật khẩu" minlength="6" required />
            </div>
          </div>

          <p style="font-size: 0.8rem; color: var(--slate-500); margin-bottom: 1.15rem;">
            Bằng việc nhấn Đăng ký, bạn đồng ý với <a href="javascript:void(0)" style="color: var(--primary);">Điều khoản dịch vụ</a> và <a href="javascript:void(0)" style="color: var(--primary);">Chính sách bảo mật</a> của DriveShare.
          </p>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
            Tạo tài khoản thuê xe
          </button>
        </form>

        <div class="auth-footer-prompt">
          Đã có tài khoản? <a href="javascript:void(0)" onclick="AuthService.openLoginModal()">Đăng nhập ngay</a>
        </div>
      </div>
    `;

    App.openModal("Đăng ký tài khoản khách thuê", html);
  },

  // ==================== 3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ ====================
  handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!identifier || !password) {
      App.showToast("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }

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

  handleRegister(e) {
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

  // ==================== 4. XỬ LÝ FORM ĐĂNG KÝ TRỞ THÀNH CHỦ XE TẠI TRANG CHỦ ====================
  handleOwnerHomeRegister(e) {
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

    // Hiển thị thông báo chúc mừng
    const html = `
      <div style="text-align: center; padding: 1.5rem 1rem;">
        <div style="width: 60px; height: 60px; background: var(--success-bg); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.15rem auto;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--slate-900); margin-bottom: 0.5rem;">
          Đăng ký thông tin Chủ xe thành công!
        </h3>
        <p style="color: var(--slate-600); font-size: 0.9rem; line-height: 1.6; max-width: 480px; margin: 0 auto 1.5rem auto;">
          Cảm ơn anh/chị <strong>${name}</strong> (${phone}). Chuyên viên phát triển đối tác DriveShare tại khu vực <strong>${area}</strong> sẽ liên hệ trong vòng 30 phút để hỗ trợ thẩm định xe <strong>${carType}</strong> và hướng dẫn bật xe nhận doanh thu.
        </p>
        <button class="btn btn-primary" onclick="App.closeModal()">Đã hiểu & Quay lại</button>
      </div>
    `;

    App.openModal("Hồ sơ đối tác Chủ xe", html);
    document.getElementById("formHomeOwnerRegister").reset();
  },
};
