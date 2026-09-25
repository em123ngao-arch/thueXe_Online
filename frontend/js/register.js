/**
 * DriveShare Registration & Auth Controller (BR-01)
 * Phụ trách:
 * - BR-01-1: Validate email trùng -> hiển thị thông báo lỗi đỏ dưới ô input
 * - BR-01-2: Đăng ký thành công -> hiện toast xanh 'Đăng ký thành công!' trong 2s
 * - BR-01-3: Sau 2s -> tự động chuyển sang tab Đăng nhập (không reload trang)
 * - BR-01-6: Validate mật khẩu mạnh (>=8 ký tự, chữ hoa, số, ký tự đặc biệt)
 */

const RegisterController = {
  init() {
    this.bindEvents();
    this.checkInitialTab();
  },

  bindEvents() {
    const formRegister = document.getElementById("formRegister");
    if (formRegister) {
      formRegister.addEventListener("submit", (e) => this.handleRegister(e));
    }

    const regPassword = document.getElementById("regPassword");
    if (regPassword) {
      regPassword.addEventListener("input", (e) => this.validatePasswordRealtime(e.target.value));
    }

    const regEmail = document.getElementById("regEmail");
    if (regEmail) {
      regEmail.addEventListener("input", () => {
        const errorEl = document.getElementById("regEmailError");
        if (errorEl) errorEl.style.display = "none";
      });
    }

    const formLogin = document.getElementById("formLogin");
    if (formLogin) {
      formLogin.addEventListener("submit", (e) => this.handleLogin(e));
    }
  },

  checkInitialTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    const role = urlParams.get("role");

    if (tab === "register") {
      this.switchTab("register");
      if (role === "owner") {
        this.selectRole("OWNER");
      }
    }
  },

  switchTab(tabName) {
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabRegisterBtn = document.getElementById("tabRegisterBtn");
    const panelLogin = document.getElementById("panelLogin");
    const panelRegister = document.getElementById("panelRegister");

    if (!tabLoginBtn || !panelLogin) return;

    if (tabName === "login") {
      tabLoginBtn.classList.add("active");
      tabRegisterBtn.classList.remove("active");
      panelLogin.style.display = "block";
      panelRegister.style.display = "none";
    } else {
      tabRegisterBtn.classList.add("active");
      tabLoginBtn.classList.remove("active");
      panelRegister.style.display = "block";
      panelLogin.style.display = "none";
    }
  },

  selectRole(role) {
    const btnRenter = document.getElementById("roleOptionRenter");
    const btnOwner = document.getElementById("roleOptionOwner");
    const roleInput = document.getElementById("regRole");
    const roleNotice = document.getElementById("regRoleNotice");

    if (roleInput) roleInput.value = role;

    if (role === "OWNER") {
      btnOwner?.classList.add("active");
      btnRenter?.classList.remove("active");
      if (roleNotice) {
        roleNotice.innerHTML = `
          <div class="alert-box alert-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Tài khoản <strong>Chủ xe (Owner)</strong> sau khi đăng ký sẽ ở trạng thái <strong>Chờ Admin duyệt (PENDING)</strong> trước khi có thể đăng xe.</span>
          </div>
        `;
        roleNotice.style.display = "block";
      }
    } else {
      btnRenter?.classList.add("active");
      btnOwner?.classList.remove("active");
      if (roleNotice) {
        roleNotice.innerHTML = `
          <div class="alert-box alert-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Tài khoản <strong>Khách thuê (Renter)</strong> sẽ được kích hoạt <strong>ACTIVE</strong> ngay sau khi đăng ký để bạn đặt xe lập tức!</span>
          </div>
        `;
        roleNotice.style.display = "block";
      }
    }
  },

  // BR-01-6: Mật khẩu tối thiểu 8 ký tự, có chữ hoa, số, ký tự đặc biệt
  isPasswordStrong(password) {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&#^()_\-+=\[\]{}|\\;:'",.<>\/?~`]/.test(password);
    return minLength && hasUpper && hasNumber && hasSpecial;
  },

  validatePasswordRealtime(password) {
    const hint = document.getElementById("regPasswordHint");
    if (!hint) return;

    if (!password) {
      hint.innerHTML = "";
      return;
    }

    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&#^()_\-+=\[\]{}|\\;:'",.<>\/?~`]/.test(password);

    const isStrong = minLength && hasUpper && hasNumber && hasSpecial;

    hint.innerHTML = `
      <div style="font-size: 0.78rem; margin-top: 6px; display: flex; flex-direction: column; gap: 2px;">
        <span style="color: ${minLength ? '#10b981' : '#ef4444'}">${minLength ? '✔' : '✖'} Tối thiểu 8 ký tự</span>
        <span style="color: ${hasUpper ? '#10b981' : '#ef4444'}">${hasUpper ? '✔' : '✖'} Có ít nhất 1 chữ hoa (A-Z)</span>
        <span style="color: ${hasNumber ? '#10b981' : '#ef4444'}">${hasNumber ? '✔' : '✖'} Có ít nhất 1 chữ số (0-9)</span>
        <span style="color: ${hasSpecial ? '#10b981' : '#ef4444'}">${hasSpecial ? '✔' : '✖'} Có ít nhất 1 ký tự đặc biệt (!@#$%...)</span>
      </div>
    `;
    return isStrong;
  },

  async handleRegister(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById("btnSubmitRegister");
    const emailInput = document.getElementById("regEmail");
    const emailError = document.getElementById("regEmailError");
    const passwordInput = document.getElementById("regPassword");
    const confirmInput = document.getElementById("regConfirmPassword");
    const fullNameInput = document.getElementById("regFullName");
    const phoneInput = document.getElementById("regPhone");
    const roleInput = document.getElementById("regRole");

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const fullName = fullNameInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const role = roleInput ? roleInput.value : "RENTER";

    // Validate FE trước khi gửi
    if (!this.isPasswordStrong(password)) {
      if (typeof showToast === "function") {
        showToast("Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra các tiêu chí bắt buộc!", "error", 2500);
      }
      passwordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      if (typeof showToast === "function") {
        showToast("Mật khẩu xác nhận không khớp!", "error", 2500);
      }
      confirmInput.focus();
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="spinner"></span> Đang đăng ký...`;
    }

    const payload = {
      email,
      password,
      fullName,
      full_name: fullName,
      phoneNumber: phone,
      phone_number: phone,
      role,
    };

    const res = await AuthService.register(payload);

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `Đăng ký tài khoản`;
    }

    if (res.success) {
      // BR-01-2: Hiện toast 'Đăng ký thành công!' màu xanh trong 2s
      if (typeof showToast === "function") {
        showToast("Đăng ký thành công!", "success", 2000);
      }

      // Điền sẵn email vào form login
      const loginIdentifier = document.getElementById("loginIdentifier");
      if (loginIdentifier) loginIdentifier.value = email;

      // BR-01-3: Sau 2 giây tự động chuyển sang tab Đăng nhập (không reload trang)
      setTimeout(() => {
        this.switchTab("login");
        const loginPassword = document.getElementById("loginPassword");
        if (loginPassword) loginPassword.focus();
      }, 2000);
    } else {
      // BR-01-1: Email đã tồn tại -> 400 EMAIL_EXISTED, FE hiện lỗi đỏ dưới ô email
      if (res.errorCode === "EMAIL_EXISTED" || res.message?.includes("EMAIL_EXISTED") || res.details?.includes("Email")) {
        if (emailError) {
          emailError.innerText = "Email này đã được sử dụng. Vui lòng chọn email khác!";
          emailError.style.display = "block";
        }
        emailInput.focus();
      }

      if (typeof showToast === "function") {
        showToast(res.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!", "error", 2500);
      }
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById("btnSubmitLogin");
    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!identifier || !password) {
      if (typeof showToast === "function") {
        showToast("Vui lòng nhập tài khoản và mật khẩu!", "warning", 2000);
      }
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="spinner"></span> Đang đăng nhập...`;
    }

    const res = await AuthService.login(identifier, password);

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `Đăng nhập`;
    }

    if (res.success) {
      if (typeof showToast === "function") {
        showToast(`Đăng nhập thành công! Chào mừng trở lại.`, "success", 2000);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");

      setTimeout(() => {
        if (redirect && !redirect.includes("login.html")) {
          window.location.href = decodeURIComponent(redirect);
        } else {
          const user = AuthService.getCurrentUser();
          const role = (user?.role || "").toUpperCase();
          if (role === "ADMIN") {
            window.location.href = "admin.html";
          } else if (role === "OWNER") {
            window.location.href = "owner-cars.html";
          } else {
            window.location.href = "index.html";
          }
        }
      }, 1000);
    } else {
      if (typeof showToast === "function") {
        showToast(res.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!", "error", 2500);
      }
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  RegisterController.init();
});
