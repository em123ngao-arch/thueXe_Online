/**
 * DriveShare Registration & Auth Controller (BR-01)
 * Phụ trách:
 * - BR-01-1: Validate email trùng -> hiển thị thông báo lỗi đỏ dưới ô input
 * - BR-01-2: Đăng ký thành công -> hiện toast xanh 'Đăng ký thành công!' trong 2s
 * - BR-01-3: Sau 2s -> tự động chuyển sang tab Đăng nhập (không reload trang)
 * - BR-01-6: Validate mật khẩu mạnh (>=8 ký tự, chữ hoa, số, ký tự đặc biệt)
 */

const RegisterController = {
  files: {
    cccdFront: null,
    cccdBack: null,
    gplxFront: null,
  },

  init() {
    this.bindEvents();
    this.bindDocUploadEvents();
    this.checkInitialTab();
  },

  bindDocUploadEvents() {
    // Bind file inputs
    const fileCccdFront = document.getElementById("fileCccdFront");
    const fileCccdBack = document.getElementById("fileCccdBack");
    const fileGplxFront = document.getElementById("fileGplxFront");

    if (fileCccdFront) {
      fileCccdFront.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected("cccdFront", e.target.files[0]);
        }
      });
    }

    if (fileCccdBack) {
      fileCccdBack.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected("cccdBack", e.target.files[0]);
        }
      });
    }

    if (fileGplxFront) {
      fileGplxFront.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected("gplxFront", e.target.files[0]);
        }
      });
    }

    // Drag and Drop
    this.setupDropzone("dropzoneCccdFront", "cccdFront");
    this.setupDropzone("dropzoneCccdBack", "cccdBack");
    this.setupDropzone("dropzoneGplx", "gplxFront");
  },

  setupDropzone(elementId, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    ["dragenter", "dragover"].forEach((eventName) => {
      el.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      el.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove("dragover");
      });
    });

    el.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        this.handleFileSelected(type, dt.files[0]);
      }
    });
  },

  handleFileSelected(type, file) {
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith("image/")) {
      if (typeof showToast === "function") {
        showToast("Vui lòng chỉ chọn file ảnh định dạng JPG, PNG, WEBP!", "error", 2500);
      }
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      if (typeof showToast === "function") {
        showToast("Dung lượng file vượt quá giới hạn 10MB!", "error", 2500);
      }
      return;
    }

    this.files[type] = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === "cccdFront") {
        const preview = document.getElementById("previewCccdFront");
        const wrap = document.getElementById("previewCccdFrontWrap");
        const content = document.getElementById("contentCccdFront");
        if (preview && wrap && content) {
          preview.src = e.target.result;
          content.style.display = "none";
          wrap.style.display = "block";
        }
      } else if (type === "cccdBack") {
        const preview = document.getElementById("previewCccdBack");
        const wrap = document.getElementById("previewCccdBackWrap");
        const content = document.getElementById("contentCccdBack");
        if (preview && wrap && content) {
          preview.src = e.target.result;
          content.style.display = "none";
          wrap.style.display = "block";
        }
      } else if (type === "gplxFront") {
        const preview = document.getElementById("previewGplx");
        const wrap = document.getElementById("previewGplxWrap");
        const content = document.getElementById("contentGplx");
        if (preview && wrap && content) {
          preview.src = e.target.result;
          content.style.display = "none";
          wrap.style.display = "block";
        }
      }
    };
    reader.readAsDataURL(file);
  },

  clearDocPreview(type) {
    this.files[type] = null;
    if (type === "cccdFront") {
      const input = document.getElementById("fileCccdFront");
      if (input) input.value = "";
      document.getElementById("contentCccdFront")?.setAttribute("style", "display: block;");
      document.getElementById("previewCccdFrontWrap")?.setAttribute("style", "display: none;");
      const preview = document.getElementById("previewCccdFront");
      if (preview) preview.src = "";
    } else if (type === "cccdBack") {
      const input = document.getElementById("fileCccdBack");
      if (input) input.value = "";
      document.getElementById("contentCccdBack")?.setAttribute("style", "display: block;");
      document.getElementById("previewCccdBackWrap")?.setAttribute("style", "display: none;");
      const preview = document.getElementById("previewCccdBack");
      if (preview) preview.src = "";
    } else if (type === "gplxFront") {
      const input = document.getElementById("fileGplxFront");
      if (input) input.value = "";
      document.getElementById("contentGplx")?.setAttribute("style", "display: block;");
      document.getElementById("previewGplxWrap")?.setAttribute("style", "display: none;");
      const preview = document.getElementById("previewGplx");
      if (preview) preview.src = "";
    }
  },

  selectRole(role) {
    const btnRenter = document.getElementById("roleOptionRenter");
    const btnOwner = document.getElementById("roleOptionOwner");
    const roleInput = document.getElementById("regRole");
    const roleNotice = document.getElementById("regRoleNotice");
    const sectionRenterDocs = document.getElementById("sectionRenterDocs");
    const sectionOwnerBank = document.getElementById("sectionOwnerBank");

    if (roleInput) roleInput.value = role;

    if (role === "OWNER") {
      btnOwner?.classList.add("active");
      btnRenter?.classList.remove("active");
      if (sectionRenterDocs) sectionRenterDocs.style.display = "none";
      if (sectionOwnerBank) sectionOwnerBank.style.display = "block";
      if (roleNotice) {
        roleNotice.innerHTML = `
          <div class="alert-box alert-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Tài khoản <strong>Chủ xe (Owner)</strong> cần tải lên CCCD 2 mặt & thông tin Ngân hàng. Ban quản trị sẽ <strong>xét duyệt hồ sơ (PENDING)</strong> trước khi bạn có thể đăng xe.</span>
          </div>
        `;
        roleNotice.style.display = "block";
      }
    } else {
      btnRenter?.classList.add("active");
      btnOwner?.classList.remove("active");
      if (sectionRenterDocs) sectionRenterDocs.style.display = "block";
      if (sectionOwnerBank) sectionOwnerBank.style.display = "none";
      if (roleNotice) {
        roleNotice.innerHTML = `
          <div class="alert-box alert-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Tài khoản <strong>Khách thuê (Renter)</strong> cần tải lên CCCD 2 mặt & Bằng lái xe (GPLX). Ban quản trị sẽ <strong>xét duyệt hồ sơ (PENDING)</strong> trước khi bạn có thể thuê xe.</span>
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
    if (e && e.preventDefault) e.preventDefault();
    const btnSubmit = document.getElementById("btnSubmitRegister");
    const emailInput = document.getElementById("regEmail");
    const emailError = document.getElementById("regEmailError");
    const passwordInput = document.getElementById("regPassword");
    const confirmInput = document.getElementById("regConfirmPassword");
    const fullNameInput = document.getElementById("regFullName");
    const phoneInput = document.getElementById("regPhone");
    const roleInput = document.getElementById("regRole");
    const idCardNumberInput = document.getElementById("regIdCardNumber");
    const licenseNumberInput = document.getElementById("regLicenseNumber");
    const bankNameInput = document.getElementById("regBankName");
    const bankAccountInput = document.getElementById("regBankAccountNumber");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const confirmPassword = confirmInput ? confirmInput.value : "";
    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const role = roleInput ? roleInput.value : "RENTER";
    const idCardNumber = idCardNumberInput ? idCardNumberInput.value.trim() : "";
    const licenseNumber = licenseNumberInput ? licenseNumberInput.value.trim() : "";
    const bankName = bankNameInput ? bankNameInput.value.trim() : "";
    const bankAccountNumber = bankAccountInput ? bankAccountInput.value.trim() : "";

    // 1. Validate mật khẩu
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

    // 2. Validate CCCD
    if (!idCardNumber) {
      if (typeof showToast === "function") {
        showToast("Vui lòng nhập Số CMND / CCCD!", "warning", 2500);
      }
      idCardNumberInput?.focus();
      return;
    }

    if (!this.files.cccdFront || !this.files.cccdBack) {
      if (typeof showToast === "function") {
        showToast("Vui lòng tải lên đầy đủ cả mặt trước và mặt sau CMND / CCCD!", "warning", 3000);
      }
      return;
    }

    // 3. Validate theo Role
    if (role === "RENTER") {
      if (!this.files.gplxFront) {
        if (typeof showToast === "function") {
          showToast("Khách thuê bắt buộc phải tải lên ảnh chụp Bằng lái xe (GPLX)!", "warning", 3000);
        }
        return;
      }
    }

    // 3b. Xác thực email bằng OTP TRƯỚC (giống Travel) -> nhập đúng mới tạo tài khoản
    if (this._otpTicketEmail !== email.toLowerCase() || !this._otpTicket) {
      if (typeof openRegisterOtpModal === "function") {
        openRegisterOtpModal(email, (ticket) => {
          this._otpTicket = ticket;
          this._otpTicketEmail = email.toLowerCase();
          this.handleRegister();
        });
        return;
      }
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="spinner"></span> Đang tải hồ sơ &amp; đăng ký...`;
    }

    // 4. Tạo FormData gửi lên Server
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("fullName", fullName);
    formData.append("phone", phone);
    formData.append("role", role);
    if (this._otpTicket) formData.append("otpTicket", this._otpTicket);
    formData.append("idCardNumber", idCardNumber);
    formData.append("cccdFront", this.files.cccdFront);
    formData.append("cccdBack", this.files.cccdBack);

    if (role === "RENTER") {
      formData.append("licenseNumber", licenseNumber || idCardNumber);
      if (this.files.gplxFront) {
        formData.append("gplxFront", this.files.gplxFront);
      }
    } else if (role === "OWNER") {
      if (bankName) formData.append("bankName", bankName);
      if (bankAccountNumber) formData.append("bankAccountNumber", bankAccountNumber);
    }

    const res = await AuthService.registerWithDocs(formData);

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `Đăng ký &amp; Gửi hồ sơ xét duyệt`;
    }

    if (res.success) {
      const usedTicket = !!this._otpTicket;
      this._otpTicket = null;
      this._otpTicketEmail = null;

      // Điền sẵn email vào form login
      const loginIdentifier = document.getElementById("loginIdentifier");
      if (loginIdentifier) loginIdentifier.value = email;

      if (usedTicket && res.data && res.data.requiresEmailVerification === false) {
        // Email đã xác thực bằng OTP từ trước -> không cần nhập OTP lần nữa
        if (typeof showToast === "function") {
          showToast(res.message || "Đăng ký thành công!", "success", 5000);
        }
        this.switchTab("login");
      } else {
        if (typeof showToast === "function") {
          showToast("Đăng ký thành công! Mã OTP đã được gửi tới email của bạn.", "success", 4000);
        }
        // Bắt buộc nhập đúng OTP email -> mới chuyển hồ sơ cho Admin duyệt
        if (typeof openVerifyEmailModal === "function") {
          openVerifyEmailModal(email, true);
        }
      }
    } else {
      // Vé OTP hết hạn / đã dùng -> bắt xác thực lại ở lần gửi sau
      if (res.errorCode === "OTP_EXPIRED") { this._otpTicket = null; this._otpTicketEmail = null; }
      if (res.errorCode === "EMAIL_EXISTED" || res.message?.includes("EMAIL_EXISTED") || res.details?.includes("Email")) {
        if (emailError) {
          emailError.innerText = "Email này đã được sử dụng. Vui lòng chọn email khác!";
          emailError.style.display = "block";
        }
        emailInput?.focus();
      } else if (res.errorCode === "ID_CARD_EXISTED") {
        if (typeof showToast === "function") {
          showToast("Số CMND/CCCD này đã được đăng ký trong hệ thống!", "error", 3000);
        }
      } else if (res.errorCode === "MISSING_CCCD_SIDE") {
        if (typeof showToast === "function") {
          showToast("Vui lòng tải lên đủ cả 2 mặt CCCD!", "error", 3000);
        }
      } else {
        if (typeof showToast === "function") {
          showToast(res.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!", "error", 3000);
        }
      }
    }
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
        const user = AuthService.getCurrentUser();
        const role = (typeof resolvePrimaryRole === "function" && user?.roles)
          ? resolvePrimaryRole(user.roles, user.role)
          : (user?.role || "").toUpperCase();

        if (role === "ADMIN") {
          window.location.href = "admin.html";
        } else if (role === "OWNER") {
          // Chủ xe luôn ưu tiên vào trang Quản lý xe, trừ khi có redirect đến trang chủ xe khác
          if (redirect && redirect.includes("owner-earnings.html")) {
            window.location.href = decodeURIComponent(redirect);
          } else {
            window.location.href = "owner-cars.html";
          }
        } else if (redirect && !redirect.includes("login.html") && !redirect.includes("owner-cars.html") && !redirect.includes("admin.html")) {
          window.location.href = decodeURIComponent(redirect);
        } else {
          window.location.href = "index.html";
        }
      }, 700);
    } else if (res.errorCode === "EMAIL_NOT_VERIFIED" && typeof openVerifyEmailModal === "function") {
      if (typeof showToast === "function") {
        showToast("Email chưa được xác thực bằng mã OTP.", "warning", 3500);
      }
      if (identifier.includes("@")) {
        openVerifyEmailModal(identifier, false);
      } else if (typeof showToast === "function") {
        showToast("Vui lòng đăng nhập bằng địa chỉ email để nhận lại mã xác thực.", "info", 4000);
      }
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
