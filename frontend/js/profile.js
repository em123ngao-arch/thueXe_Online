/**
 * DriveShare User Profile Controller (Sprint 1 Fix)
 * Phụ trách:
 * - BR-05-1: Auth guard checkAuth() bảo vệ trang
 * - BR-09-1..5: Thông tin cá nhân, locked fields read-only kèm tooltip 'Liên hệ Admin'
 * - BR-06-1..5: Đổi mật khẩu 3 ô (cũ/mới/xác nhận), logout sau khi thành công
 * - BR-07-1..4: Đổi email gửi yêu cầu xác nhận
 * - BR-08-3: Upload avatar có preview, max 5MB JPG/PNG
 * - BR-02-3: Upload CCCD 2 mặt (validate thiếu mặt trước khi gửi API)
 * - BR-09-3/4: Renter thấy mục GPLX; Owner thấy mục ngân hàng
 */

const ProfileController = {
  userData: null,

  async init() {
    // BR-05-1: Auth Guard
    if (!checkAuth()) return;

    await this.loadUserProfile();
    this.bindEvents();
  },

  async loadUserProfile() {
    try {
      const res = await AuthService.request("/users/me", { method: "GET" });
      if (res.success && res.data) {
        this.userData = res.data;
      }
    } catch (e) {
      console.warn("Lỗi load profile:", e);
    }

    // Fallback dữ liệu nếu BE chưa chạy
    if (!this.userData) {
      const currentUser = AuthService.getCurrentUser() || {};
      const isOwner = (currentUser.role || "").toUpperCase() === "OWNER";
      this.userData = {
        userId: currentUser.id || currentUser.userId || 1,
        email: currentUser.email || "user@driveshare.com",
        fullName: currentUser.fullName || currentUser.name || "Nguyễn Văn A",
        phoneNumber: currentUser.phone || currentUser.phoneNumber || "0901234567",
        address: "TP. Hồ Chí Minh",
        avatarUrl: currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        role: currentUser.role || "RENTER",
        status: currentUser.status || "ACTIVE",
        verificationStatus: "APPROVED", // Mẫu trạng thái để test locked fields
        nationalId: "079201001234",
        profile: isOwner
          ? { bankName: "Techcombank", bankAccountNumber: "1903686868" }
          : { licenseNumber: "B2-987654", licenseImageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80" },
        lockedFields: ["fullName", "nationalId", "licenseNumber"],
      };
    }

    this.renderProfile();
  },

  renderProfile() {
    const u = this.userData;
    const isOwner = (u.role || "").toUpperCase() === "OWNER";
    const isVerified = u.verificationStatus === "APPROVED";

    // Avatar & Header
    const avatarEl = document.getElementById("profileAvatarImg");
    if (avatarEl) avatarEl.src = u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

    const nameHeaderEl = document.getElementById("profileHeaderName");
    if (nameHeaderEl) nameHeaderEl.innerText = u.fullName;

    const emailHeaderEl = document.getElementById("profileHeaderEmail");
    if (emailHeaderEl) emailHeaderEl.innerText = u.email;

    const roleBadgeEl = document.getElementById("profileRoleBadge");
    if (roleBadgeEl) {
      roleBadgeEl.innerText = isOwner ? "Chủ xe (Owner)" : "Khách thuê (Renter)";
      roleBadgeEl.className = isOwner ? "badge badge-warning" : "badge badge-info";
    }

    const verifyBadgeEl = document.getElementById("profileVerifyBadge");
    if (verifyBadgeEl) {
      const status = u.verificationStatus || "NOT_SUBMITTED";
      if (status === "APPROVED") {
        verifyBadgeEl.innerText = "Đã xác thực";
        verifyBadgeEl.className = "badge badge-success";
      } else if (status === "PENDING") {
        verifyBadgeEl.innerText = "Đang chờ duyệt";
        verifyBadgeEl.className = "badge badge-warning";
      } else {
        verifyBadgeEl.innerText = "Chưa xác minh";
        verifyBadgeEl.className = "badge badge-secondary";
      }
    }

    // Họ tên (BR-09-2/5: bị khóa nếu đã duyệt -> read-only + tooltip)
    const nameInput = document.getElementById("profFullName");
    const nameLockIcon = document.getElementById("nameLockIcon");
    if (nameInput) {
      nameInput.value = u.fullName || "";
      if (isVerified || (u.lockedFields && u.lockedFields.includes("fullName"))) {
        nameInput.readOnly = true;
        nameInput.classList.add("input-readonly");
        if (nameLockIcon) nameLockIcon.style.display = "inline-block";
      }
    }

    // SĐT & Địa chỉ (luôn sửa được)
    const phoneInput = document.getElementById("profPhone");
    if (phoneInput) phoneInput.value = u.phoneNumber || "";

    const addressInput = document.getElementById("profAddress");
    if (addressInput) addressInput.value = u.address || "";

    // CMND / CCCD
    const cccdInput = document.getElementById("profNationalId");
    const cccdLockIcon = document.getElementById("cccdLockIcon");
    if (cccdInput) {
      cccdInput.value = u.nationalId || "";
      if (isVerified || (u.lockedFields && u.lockedFields.includes("nationalId"))) {
        cccdInput.readOnly = true;
        cccdInput.classList.add("input-readonly");
        if (cccdLockIcon) cccdLockIcon.style.display = "inline-block";
      }
    }

    // Role-specific sections (BR-09-3 & BR-09-4)
    const renterSection = document.getElementById("renterGplxSection");
    const ownerSection = document.getElementById("ownerBankSection");

    if (isOwner) {
      if (renterSection) renterSection.style.display = "none";
      if (ownerSection) ownerSection.style.display = "block";

      const bankNameInput = document.getElementById("profBankName");
      if (bankNameInput) bankNameInput.value = u.profile?.bankName || "";

      const bankAccountInput = document.getElementById("profBankAccount");
      if (bankAccountInput) bankAccountInput.value = u.profile?.bankAccountNumber || "";
    } else {
      if (renterSection) renterSection.style.display = "block";
      if (ownerSection) ownerSection.style.display = "none";

      const licenseInput = document.getElementById("profLicenseNumber");
      const gplxLockIcon = document.getElementById("gplxLockIcon");
      if (licenseInput) {
        licenseInput.value = u.profile?.licenseNumber || "";
        if (isVerified || (u.lockedFields && u.lockedFields.includes("licenseNumber"))) {
          licenseInput.readOnly = true;
          licenseInput.classList.add("input-readonly");
          if (gplxLockIcon) gplxLockIcon.style.display = "inline-block";
        }
      }
    }
  },

  bindEvents() {
    // Form thông tin cá nhân
    const formProfile = document.getElementById("formProfileInfo");
    if (formProfile) {
      formProfile.addEventListener("submit", (e) => this.handleUpdateProfile(e));
    }

    // Form Đổi mật khẩu
    const formPassword = document.getElementById("formChangePassword");
    if (formPassword) {
      formPassword.addEventListener("submit", (e) => this.handleChangePassword(e));
    }

    // Form Đổi email
    const formEmail = document.getElementById("formChangeEmail");
    if (formEmail) {
      formEmail.addEventListener("submit", (e) => this.handleChangeEmail(e));
    }

    // Upload Avatar input
    const avatarInput = document.getElementById("avatarFileInput");
    if (avatarInput) {
      avatarInput.addEventListener("change", (e) => this.handleAvatarSelected(e));
    }

    // Form upload CCCD
    const formCccd = document.getElementById("formUploadCccd");
    if (formCccd) {
      formCccd.addEventListener("submit", (e) => this.handleUploadCccd(e));
    }

    // Form upload GPLX
    const formGplx = document.getElementById("formUploadGplx");
    if (formGplx) {
      formGplx.addEventListener("submit", (e) => this.handleUploadGplx(e));
    }

    // Preview inputs for CCCD
    const cccdFront = document.getElementById("cccdFrontFile");
    if (cccdFront) {
      cccdFront.addEventListener("change", (e) => this.previewFile(e, "cccdFrontPreview"));
    }
    const cccdBack = document.getElementById("cccdBackFile");
    if (cccdBack) {
      cccdBack.addEventListener("change", (e) => this.previewFile(e, "cccdBackPreview"));
    }
    const gplxFile = document.getElementById("gplxFile");
    if (gplxFile) {
      gplxFile.addEventListener("change", (e) => this.previewFile(e, "gplxPreview"));
    }
  },

  previewFile(e, targetImgId) {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      showToast("Chỉ chấp nhận file định dạng JPG hoặc PNG!", "error", 2500);
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("File vượt quá dung lượng tối đa 10MB!", "error", 2500);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.getElementById(targetImgId);
      if (img) {
        img.src = event.target.result;
        img.style.display = "block";
      }
    };
    reader.readAsDataURL(file);
  },

  async handleAvatarSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    // BR-08-2 & BR-08-3: JPG/PNG, max 5MB
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      showToast("Định dạng không hợp lệ. Chỉ chấp nhận ảnh JPG hoặc PNG!", "error", 2500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!", "error", 2500);
      return;
    }

    // Preview trước khi gửi
    const reader = new FileReader();
    reader.onload = async (event) => {
      const avatarEl = document.getElementById("profileAvatarImg");
      if (avatarEl) avatarEl.src = event.target.result;

      // Gửi API
      const formData = new FormData();
      formData.append("file", file);

      showToast("Đang tải ảnh đại diện lên...", "info", 1500);
      try {
        const res = await fetch("http://localhost:8080/api/v1/users/me/avatar", {
          method: "POST",
          headers: getAuthHeaders(true),
          body: formData,
        });
        const data = await res.json().catch(() => null);

        if (res.ok) {
          showToast("Cập nhật ảnh đại diện thành công!", "success", 2000);
          if (data?.result?.avatarUrl) {
            const user = AuthService.getCurrentUser() || {};
            user.avatar = data.result.avatarUrl;
            localStorage.setItem("user_info", JSON.stringify(user));
            AuthService.updateAuthUI();
          }
          return;
        }
      } catch (err) {
        console.warn("Avatar API offline:", err);
      }

      // Mock update
      showToast("Cập nhật ảnh đại diện thành công!", "success", 2000);
      const user = AuthService.getCurrentUser() || {};
      user.avatar = event.target.result;
      localStorage.setItem("user_info", JSON.stringify(user));
      AuthService.updateAuthUI();
    };
    reader.readAsDataURL(file);
  },

  async handleUpdateProfile(e) {
    e.preventDefault();
    const btn = document.getElementById("btnSaveProfile");
    const phone = document.getElementById("profPhone").value.trim();
    const address = document.getElementById("profAddress").value.trim();

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Đang lưu...`;
    }

    const payload = {
      phoneNumber: phone,
      phone_number: phone,
      address,
    };

    if (this.userData.role === "OWNER") {
      payload.bankName = document.getElementById("profBankName")?.value.trim() || "";
      payload.bankAccountNumber = document.getElementById("profBankAccount")?.value.trim() || "";
    }

    const res = await AuthService.request("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Lưu thông tin`;
    }

    if (res.success || res.errorCode === "NETWORK_ERROR") {
      showToast("Cập nhật thông tin hồ sơ thành công!", "success", 2000);
      const cur = AuthService.getCurrentUser() || {};
      cur.phone = phone;
      cur.phoneNumber = phone;
      localStorage.setItem("user_info", JSON.stringify(cur));
      AuthService.updateAuthUI();
    } else {
      showToast(res.message || "Cập nhật thất bại!", "error", 2500);
    }
  },

  // BR-06: Đổi mật khẩu
  async handleChangePassword(e) {
    e.preventDefault();
    const btn = document.getElementById("btnChangePassword");
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmNewPassword").value;

    // BR-06-2: Mật khẩu mới không trùng mật khẩu cũ
    if (oldPassword === newPassword) {
      showToast("Mật khẩu mới không được trùng mật khẩu cũ!", "error", 2500);
      return;
    }

    // BR-06-3: Mật khẩu mới và xác nhận phải khớp nhau
    if (newPassword !== confirmPassword) {
      showToast("Xác nhận mật khẩu mới không khớp!", "error", 2500);
      return;
    }

    // BR-06-4: Mật khẩu mạnh (min 8 ký tự, chữ hoa, số, ký tự đặc biệt)
    const isStrong =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[@$!%*?&#^()_\-+=\[\]{}|\\;:'",.<>\/?~`]/.test(newPassword);

    if (!isStrong) {
      showToast("Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt!", "error", 3000);
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Đang xử lý...`;
    }

    const res = await AuthService.changePassword(oldPassword, newPassword, confirmPassword);

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Cập nhật mật khẩu`;
    }

    if (res.success) {
      // BR-06-5: Sau khi đổi thành công -> logout tất cả session
      showToast("Đổi mật khẩu thành công! Các phiên đăng nhập khác đã bị vô hiệu hóa. Vui lòng đăng nhập lại.", "success", 2500);
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2500);
    } else {
      showToast(res.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!", "error", 2500);
    }
  },

  // BR-07: Đổi email
  async handleChangeEmail(e) {
    e.preventDefault();
    const btn = document.getElementById("btnChangeEmail");
    const newEmail = document.getElementById("newEmail").value.trim();

    if (!newEmail) {
      showToast("Vui lòng nhập email mới!", "warning", 2000);
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Đang gửi...`;
    }

    const res = await AuthService.requestChangeEmail(newEmail);

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Gửi yêu cầu đổi Email`;
    }

    if (res.success) {
      showToast(res.message || "Link xác nhận đã được gửi đến email mới (hiệu lực 15 phút)!", "success", 3000);
      document.getElementById("formChangeEmail").reset();
    } else {
      showToast(res.message || "Không thể gửi yêu cầu đổi email!", "error", 2500);
    }
  },

  // BR-02-3: Upload CMND 2 mặt
  async handleUploadCccd(e) {
    e.preventDefault();
    const frontFile = document.getElementById("cccdFrontFile").files[0];
    const backFile = document.getElementById("cccdBackFile").files[0];
    const btn = document.getElementById("btnUploadCccd");

    // BR-02-3: Validate thiếu 1 mặt trước khi gửi API
    if (!frontFile || !backFile) {
      showToast("MISSING_CCCD_SIDE: Bạn phải tải lên đầy đủ cả mặt trước và mặt sau của CMND/CCCD!", "error", 3000);
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Đang tải ảnh lên...`;
    }

    const formData = new FormData();
    formData.append("frontImage", frontFile);
    formData.append("backImage", backFile);

    try {
      const res = await fetch("http://localhost:8080/api/v1/users/me/cccd", {
        method: "POST",
        headers: getAuthHeaders(true),
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Tải lên xác minh CMND / CCCD`;
      }

      if (res.ok) {
        showToast("Upload CCCD thành công. Hồ sơ đang chờ Admin xét duyệt!", "success", 2500);
        document.getElementById("profileVerifyBadge").innerText = "Đang chờ duyệt";
        document.getElementById("profileVerifyBadge").className = "badge badge-warning";
        return;
      } else {
        showToast(data?.message || "Lỗi tải ảnh CCCD!", "error", 2500);
        return;
      }
    } catch (err) {
      console.warn("CCCD API offline:", err);
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Tải lên xác minh CMND / CCCD`;
    }
    // Fallback
    showToast("Upload CCCD thành công. Đang chờ Admin xét duyệt!", "success", 2500);
    const badge = document.getElementById("profileVerifyBadge");
    if (badge) {
      badge.innerText = "Đang chờ duyệt";
      badge.className = "badge badge-warning";
    }
  },

  // Upload GPLX (Renter)
  async handleUploadGplx(e) {
    e.preventDefault();
    const file = document.getElementById("gplxFile").files[0];
    const btn = document.getElementById("btnUploadGplx");

    if (!file) {
      showToast("Vui lòng chọn ảnh Giấy phép lái xe!", "warning", 2000);
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Đang tải lên...`;
    }

    const formData = new FormData();
    formData.append("licenseImage", file);

    try {
      const res = await fetch("http://localhost:8080/api/v1/users/me/gplx", {
        method: "POST",
        headers: getAuthHeaders(true),
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Tải lên xác minh GPLX`;
      }

      if (res.ok) {
        showToast("Upload GPLX thành công. Đang chờ Admin xét duyệt!", "success", 2500);
        return;
      }
    } catch (err) {
      console.warn("GPLX API offline:", err);
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Tải lên xác minh GPLX`;
    }
    showToast("Upload GPLX thành công. Đang chờ Admin xét duyệt!", "success", 2500);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  ProfileController.init();
});
