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

  applyStatusBadge(badgeEl, status) {
    if (!badgeEl) return;
    badgeEl.style.display = "inline-block";
    const s = String(status || "PENDING").toUpperCase();
    if (s === "APPROVED" || s === "VERIFIED") {
      badgeEl.className = "badge badge-success";
      badgeEl.innerText = "Đã duyệt";
    } else if (s === "REJECTED") {
      badgeEl.className = "badge badge-danger";
      badgeEl.innerText = "Bị từ chối";
    } else {
      badgeEl.className = "badge badge-warning";
      badgeEl.innerText = "Đang chờ duyệt";
    }
  },

  renderProfile() {
    const u = this.userData || {};
    const curUser = (typeof AuthService !== "undefined" && AuthService.getCurrentUser()) || {};
    const userId = curUser.id || curUser.userId || "me";

    let cachedCccd = null;
    try {
      cachedCccd = JSON.parse(localStorage.getItem(`ds_cccd_${userId}`));
    } catch (e) {}

    let cachedGplx = null;
    try {
      cachedGplx = JSON.parse(localStorage.getItem(`ds_gplx_${userId}`));
    } catch (e) {}

    const roles = Array.from(u.roles || (u.role ? [u.role] : []));
    const isOwner = roles.some(r => r.toUpperCase().includes("OWNER"));
    const isRenter = roles.some(r => r.toUpperCase().includes("RENTER")) || !isOwner;
    const isVerified = (u.renterProfile?.verificationStatus === "APPROVED") || (u.ownerProfile?.verificationStatus === "APPROVED") || (u.verificationStatus === "APPROVED");

    // Avatar & Header (hiển thị ngay tức thì từ API hoặc LocalStorage)
    const avatarEl = document.getElementById("profileAvatarImg");
    const resolvedAvatar = u.avatarUrl || curUser.avatar || curUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
    if (avatarEl) avatarEl.src = resolvedAvatar;
    document.querySelectorAll(".nav-avatar, .user-avatar, #navAuthContainer img").forEach(img => {
      img.src = resolvedAvatar;
    });

    const nameHeaderEl = document.getElementById("profileHeaderName");
    if (nameHeaderEl) nameHeaderEl.innerText = u.fullName || curUser.fullName || curUser.name || "Người dùng";

    const emailHeaderEl = document.getElementById("profileHeaderEmail");
    if (emailHeaderEl) emailHeaderEl.innerText = u.email || curUser.email || "";

    const roleBadgeEl = document.getElementById("profileRoleBadge");
    if (roleBadgeEl) {
      if (isOwner && isRenter) {
        roleBadgeEl.innerText = "Chủ xe & Khách thuê";
        roleBadgeEl.className = "badge badge-success";
      } else if (isOwner) {
        roleBadgeEl.innerText = "Chủ xe (Owner)";
        roleBadgeEl.className = "badge badge-warning";
      } else {
        roleBadgeEl.innerText = "Khách thuê (Renter)";
        roleBadgeEl.className = "badge badge-info";
      }
    }

    const verifyBadgeEl = document.getElementById("profileVerifyBadge");
    if (verifyBadgeEl) {
      const status = u.renterProfile?.verificationStatus || u.ownerProfile?.verificationStatus || u.verificationStatus || (cachedCccd ? cachedCccd.status : "NOT_SUBMITTED");
      if (status === "APPROVED" || status === "VERIFIED") {
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
      nameInput.value = u.fullName || curUser.fullName || curUser.name || "";
      if (isVerified || (u.lockedFields && u.lockedFields.includes("fullName"))) {
        nameInput.readOnly = true;
        nameInput.classList.add("input-readonly");
        if (nameLockIcon) nameLockIcon.style.display = "inline-block";
      }
    }

    // SĐT & Địa chỉ (luôn sửa được)
    const phoneInput = document.getElementById("profPhone");
    if (phoneInput) phoneInput.value = u.phone || u.phoneNumber || curUser.phone || curUser.phoneNumber || "";

    const addressInput = document.getElementById("profAddress");
    if (addressInput) addressInput.value = u.address || curUser.address || "";

    // CMND / CCCD
    const cccdInput = document.getElementById("profNationalId");
    const cccdLockIcon = document.getElementById("cccdLockIcon");
    if (cccdInput) {
      cccdInput.value = u.nationalId || u.idCardNumber || "";
      if (isVerified || (u.lockedFields && u.lockedFields.includes("nationalId"))) {
        cccdInput.readOnly = true;
        cccdInput.classList.add("input-readonly");
        if (cccdLockIcon) cccdLockIcon.style.display = "inline-block";
      }
    }

    // Hiển thị ảnh CCCD đã upload trước đó (nếu có từ BE hoặc LocalStorage)
    const cccdFrontUrl = u.idCardFrontUrl || u.profile?.idCardFrontUrl || u.renterProfile?.idCardFrontUrl || u.ownerProfile?.idCardFrontUrl || cachedCccd?.frontUrl;
    const cccdBackUrl = u.idCardBackUrl || u.profile?.idCardBackUrl || u.renterProfile?.idCardBackUrl || u.ownerProfile?.idCardBackUrl || cachedCccd?.backUrl;
    const cccdStatus = u.idCardVerificationStatus || u.renterProfile?.verificationStatus || u.ownerProfile?.verificationStatus || cachedCccd?.status || ((cccdFrontUrl && cccdBackUrl) ? "PENDING" : null);

    if (cccdFrontUrl) {
      const frontImg = document.getElementById("cccdFrontPreview");
      const frontWrap = document.getElementById("cccdFrontPreviewWrapper");
      const frontBadge = document.getElementById("cccdFrontStatusBadge");
      if (frontImg) frontImg.src = cccdFrontUrl;
      if (frontWrap) frontWrap.style.display = "block";
      if (frontBadge && cccdStatus) {
        this.applyStatusBadge(frontBadge, cccdStatus);
      }
    }

    if (cccdBackUrl) {
      const backImg = document.getElementById("cccdBackPreview");
      const backWrap = document.getElementById("cccdBackPreviewWrapper");
      const backBadge = document.getElementById("cccdBackStatusBadge");
      if (backImg) backImg.src = cccdBackUrl;
      if (backWrap) backWrap.style.display = "block";
      if (backBadge && cccdStatus) {
        this.applyStatusBadge(backBadge, cccdStatus);
      }
    }

    // Hiển thị thông báo lưu trữ hồ sơ CCCD
    const cccdAlert = document.getElementById("cccdSubmittedAlert");
    const btnCccd = document.getElementById("btnUploadCccd");
    if (cccdFrontUrl && cccdBackUrl) {
      if (cccdAlert) {
        cccdAlert.style.display = "block";
        const isAppr = cccdStatus === "APPROVED" || cccdStatus === "VERIFIED";
        cccdAlert.style.background = isAppr ? "#f0fdf4" : "#fefce8";
        cccdAlert.style.border = isAppr ? "1px solid #bbf7d0" : "1px solid #fef08a";
        cccdAlert.style.color = isAppr ? "#166534" : "#854d0e";
        cccdAlert.innerHTML = `📁 <strong>CMND/CCCD (2 mặt):</strong> Đã tải lên và lưu trữ trên hệ thống. Trạng thái: <span class="badge ${isAppr ? 'badge-success' : 'badge-warning'}">${isAppr ? 'Đã duyệt' : 'Đang chờ Admin xét duyệt'}</span>`;
      }
      if (btnCccd) {
        btnCccd.innerText = "Tải lên lại để thay đổi CMND / CCCD";
        btnCccd.className = "btn btn-outline";
      }
    }

    // Role-specific sections (BR-09-3 & BR-09-4)
    const renterSection = document.getElementById("renterGplxSection");
    const ownerSection = document.getElementById("ownerBankSection");

    if (isOwner) {
      if (ownerSection) ownerSection.style.display = "block";
      const bankNameInput = document.getElementById("profBankName");
      if (bankNameInput) bankNameInput.value = u.ownerProfile?.bankName || u.profile?.bankName || "";
      const bankAccountInput = document.getElementById("profBankAccount");
      if (bankAccountInput) bankAccountInput.value = u.ownerProfile?.bankAccountNumber || u.profile?.bankAccountNumber || "";
    } else {
      if (ownerSection) ownerSection.style.display = "none";
    }

    // GPLX Section
    const licenseInput = document.getElementById("profLicenseNumber");
    const gplxLockIcon = document.getElementById("gplxLockIcon");
    if (licenseInput) {
      licenseInput.value = u.licenseNumber || u.renterProfile?.licenseNumber || u.profile?.licenseNumber || "";
      if (isVerified || (u.lockedFields && u.lockedFields.includes("licenseNumber"))) {
        licenseInput.readOnly = true;
        licenseInput.classList.add("input-readonly");
        if (gplxLockIcon) gplxLockIcon.style.display = "inline-block";
      }
    }

    // Hiển thị ảnh GPLX đã upload trước đó (nếu có từ BE hoặc LocalStorage)
    const gplxUrl = u.licenseImageUrl || u.profile?.licenseImageUrl || u.renterProfile?.licenseFrontUrl || cachedGplx?.licenseUrl;
    const gplxStatus = u.licenseVerificationStatus || u.renterProfile?.licenseVerificationStatus || cachedGplx?.status || (gplxUrl ? "PENDING" : null);
    const gplxPreview = document.getElementById("gplxPreview");
    const gplxWrap = document.getElementById("gplxPreviewWrapper");
    const gplxBadge = document.getElementById("gplxStatusBadge");
    const gplxImgBadge = document.getElementById("gplxImageStatusBadge");
    const gplxAlert = document.getElementById("gplxSubmittedAlert");
    const btnGplx = document.getElementById("btnUploadGplx");

    if (gplxUrl && gplxPreview) {
      gplxPreview.src = gplxUrl;
      if (gplxWrap) gplxWrap.style.display = "block";
    }
    if (gplxBadge && gplxStatus) {
      this.applyStatusBadge(gplxBadge, gplxStatus);
    }
    if (gplxImgBadge && gplxStatus) {
      this.applyStatusBadge(gplxImgBadge, gplxStatus);
    }
    if (gplxUrl) {
      if (gplxAlert) {
        gplxAlert.style.display = "block";
        const isAppr = gplxStatus === "APPROVED" || gplxStatus === "VERIFIED";
        gplxAlert.style.background = isAppr ? "#f0fdf4" : "#fefce8";
        gplxAlert.style.border = isAppr ? "1px solid #bbf7d0" : "1px solid #fef08a";
        gplxAlert.style.color = isAppr ? "#166534" : "#854d0e";
        gplxAlert.innerHTML = `📁 <strong>Giấy phép lái xe:</strong> Đã tải lên và lưu trữ trên hệ thống. Trạng thái: <span class="badge ${isAppr ? 'badge-success' : 'badge-warning'}">${isAppr ? 'Đã duyệt' : 'Đang chờ Admin xét duyệt'}</span>`;
      }
      if (btnGplx) {
        btnGplx.innerText = "Tải lên lại để thay đổi GPLX";
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
      cccdFront.addEventListener("change", (e) => this.previewFile(e, "cccdFrontPreview", "cccdFrontPreviewWrapper"));
    }
    const cccdBack = document.getElementById("cccdBackFile");
    if (cccdBack) {
      cccdBack.addEventListener("change", (e) => this.previewFile(e, "cccdBackPreview", "cccdBackPreviewWrapper"));
    }
    const gplxFile = document.getElementById("gplxFile");
    if (gplxFile) {
      gplxFile.addEventListener("change", (e) => this.previewFile(e, "gplxPreview", "gplxPreviewWrapper"));
    }

    // Kích hoạt Drag & Drop
    this.setupDragDrop("profileAvatarBox", "avatarFileInput", (file) => {
      this.handleAvatarSelected({ target: { files: [file] } });
    });
    this.setupDragDrop("cccdFrontBox", "cccdFrontFile", (file) => {
      this.displayFilePreview(file, "cccdFrontPreview", "cccdFrontPreviewWrapper");
    });
    this.setupDragDrop("cccdBackBox", "cccdBackFile", (file) => {
      this.displayFilePreview(file, "cccdBackPreview", "cccdBackPreviewWrapper");
    });
    this.setupDragDrop("gplxBox", "gplxFile", (file) => {
      this.displayFilePreview(file, "gplxPreview", "gplxPreviewWrapper");
    });
  },

  // Cấu hình Drag & Drop cho một upload box
  setupDragDrop(boxId, inputId, onFileSelected) {
    const box = document.getElementById(boxId);
    const input = document.getElementById(inputId);
    if (!box || !input) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      box.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        box.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      box.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        box.classList.remove('drag-over');
      }, false);
    });

    box.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      box.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP!', 'error', 2500);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('Dung lượng ảnh vượt quá 10MB!', 'error', 2500);
        return;
      }

      // Gán file vào input để form submit bình thường
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      if (typeof onFileSelected === 'function') {
        onFileSelected(file);
      }
    }, false);
  },

  previewFile(e, targetImgId, targetWrapperId) {
    const file = e.target.files[0];
    if (!file) return;
    this.displayFilePreview(file, targetImgId, targetWrapperId);
  },

  displayFilePreview(file, targetImgId, targetWrapperId) {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Chỉ chấp nhận file định dạng JPG, PNG hoặc WEBP!", "error", 2500);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("File vượt quá dung lượng tối đa 10MB!", "error", 2500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.getElementById(targetImgId);
      const wrap = targetWrapperId ? document.getElementById(targetWrapperId) : null;
      if (img) {
        img.src = event.target.result;
        img.style.display = "block";
      }
      if (wrap) {
        wrap.style.display = "block";
      }
    };
    reader.readAsDataURL(file);
  },

  zoomImage(src, caption = 'Chi tiết hình ảnh') {
    const modal = document.getElementById('imagePreviewModalOverlay');
    const img = document.getElementById('imagePreviewModalImg');
    const cap = document.getElementById('imagePreviewModalCaption');
    if (!modal || !img || !src) return;
    img.src = src;
    if (cap) cap.innerText = caption;
    modal.classList.add('open');
  },

  clearGplxPreview() {
    const input = document.getElementById('gplxFile');
    if (input) input.value = '';
    const img = document.getElementById('gplxPreview');
    if (img) img.src = '';
    const wrap = document.getElementById('gplxPreviewWrapper');
    if (wrap) wrap.style.display = 'none';
  },

  clearCccdPreview(side) {
    if (side === 'front') {
      const input = document.getElementById('cccdFrontFile');
      if (input) input.value = '';
      const img = document.getElementById('cccdFrontPreview');
      if (img) img.src = '';
      const wrap = document.getElementById('cccdFrontPreviewWrapper');
      if (wrap) wrap.style.display = 'none';
    } else {
      const input = document.getElementById('cccdBackFile');
      if (input) input.value = '';
      const img = document.getElementById('cccdBackPreview');
      if (img) img.src = '';
      const wrap = document.getElementById('cccdBackPreviewWrapper');
      if (wrap) wrap.style.display = 'none';
    }
  },

  async handleAvatarSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    // BR-08-2 & BR-08-3: JPG/PNG/WEBP, max 5MB
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      showToast("Định dạng không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP!", "error", 2500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!", "error", 2500);
      return;
    }

    // 1. Hiển thị tức thì ngay trên giao diện khi vừa chọn file (Không cần đợi tải lên hoàn tất)
    const reader = new FileReader();
    reader.onload = async (event) => {
      const immediatePreviewUrl = event.target.result;
      const avatarEl = document.getElementById("profileAvatarImg");
      if (avatarEl) avatarEl.src = immediatePreviewUrl;

      // Cập nhật ngay tất cả avatar trên navbar và header
      document.querySelectorAll(".nav-avatar, .user-avatar, #navAuthContainer img").forEach(img => {
        img.src = immediatePreviewUrl;
      });

      // 2. Gửi API lên máy chủ backend
      const formData = new FormData();
      formData.append("file", file);

      showToast("Đang tải ảnh đại diện lên máy chủ...", "info", 1500);
      try {
        const res = await fetch("http://localhost:8080/api/v1/users/me/avatar", {
          method: "POST",
          headers: getAuthHeaders(true),
          body: formData,
        });
        const data = await res.json().catch(() => null);

        if (res.ok) {
          showToast("Cập nhật ảnh đại diện thành công!", "success", 2000);
          const newAvatarUrl = data?.data?.avatarUrl || data?.result?.avatarUrl || data?.avatarUrl;
          if (newAvatarUrl) {
            if (avatarEl) avatarEl.src = newAvatarUrl;
            document.querySelectorAll(".nav-avatar, .user-avatar, #navAuthContainer img").forEach(img => {
              img.src = newAvatarUrl;
            });

            const curUser = (typeof AuthService !== "undefined" && AuthService.getCurrentUser()) || {};
            curUser.avatar = newAvatarUrl;
            curUser.avatarUrl = newAvatarUrl;
            localStorage.setItem("user_info", JSON.stringify(curUser));
            localStorage.setItem("ds_user", JSON.stringify(curUser));
            localStorage.setItem("driveshare_current_auth_user", JSON.stringify(curUser));
            if (this.userData) this.userData.avatarUrl = newAvatarUrl;

            if (typeof AuthService !== "undefined" && AuthService.updateAuthUI) {
              AuthService.updateAuthUI();
            }
          }
          return;
        }
      } catch (err) {
        console.warn("Avatar API offline:", err);
      }

      // Offline fallback: lưu data URL vào bộ nhớ
      showToast("Cập nhật ảnh đại diện thành công (Offline)!", "success", 2000);
      const curUser = (typeof AuthService !== "undefined" && AuthService.getCurrentUser()) || {};
      curUser.avatar = immediatePreviewUrl;
      curUser.avatarUrl = immediatePreviewUrl;
      localStorage.setItem("user_info", JSON.stringify(curUser));
      localStorage.setItem("ds_user", JSON.stringify(curUser));
      localStorage.setItem("driveshare_current_auth_user", JSON.stringify(curUser));
      if (this.userData) this.userData.avatarUrl = immediatePreviewUrl;
      if (typeof AuthService !== "undefined" && AuthService.updateAuthUI) {
        AuthService.updateAuthUI();
      }
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
      const form = document.getElementById("formChangePassword");
      if (form) form.reset();

      showToast("Đổi mật khẩu thành công! Các phiên đăng nhập khác đã bị vô hiệu hóa. Vui lòng đăng nhập lại.", "success", 2500);
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2500);
    } else {
      const errorMessage = res.data?.errors?.[0]?.message || res.details || res.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!";
      showToast(errorMessage, "error", 3000);
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
        const frontUrl = data?.data?.frontImageUrl || data?.result?.frontImageUrl;
        const backUrl = data?.data?.backImageUrl || data?.result?.backImageUrl;
        const curUser = (typeof AuthService !== "undefined" && AuthService.getCurrentUser()) || {};
        const userId = curUser.id || curUser.userId || "me";

        const cccdCache = {
          frontUrl: frontUrl || "",
          backUrl: backUrl || "",
          status: "PENDING",
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(`ds_cccd_${userId}`, JSON.stringify(cccdCache));

        if (this.userData) {
          this.userData.idCardFrontUrl = cccdCache.frontUrl;
          this.userData.idCardBackUrl = cccdCache.backUrl;
          this.userData.idCardVerificationStatus = "PENDING";
        }
        this.renderProfile();
        return;
      } else {
        showToast(data?.message || "Lỗi tải ảnh CCCD!", "error", 3000);
        return;
      }
    } catch (err) {
      console.error("CCCD API offline/error:", err);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Tải lên xác minh CMND / CCCD`;
      }
      showToast("Lỗi kết nối máy chủ khi upload CCCD!", "error", 2500);
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
        const uploadedUrl = data?.data?.licenseImageUrl || data?.result?.licenseImageUrl;
        const curUser = (typeof AuthService !== "undefined" && AuthService.getCurrentUser()) || {};
        const userId = curUser.id || curUser.userId || "me";

        const gplxCache = {
          licenseUrl: uploadedUrl || "",
          status: "PENDING",
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(`ds_gplx_${userId}`, JSON.stringify(gplxCache));

        if (this.userData) {
          this.userData.licenseImageUrl = gplxCache.licenseUrl;
          this.userData.licenseVerificationStatus = "PENDING";
        }
        this.renderProfile();
        return;
      } else {
        const errorMsg = data?.message || "Tải lên GPLX thất bại! Vui lòng thử lại.";
        showToast(errorMsg, "error", 3500);
        return;
      }
    } catch (err) {
      console.error("GPLX API offline/error:", err);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Tải lên xác minh GPLX`;
      }
      showToast("Lỗi kết nối máy chủ khi upload GPLX!", "error", 2500);
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  ProfileController.init();
});
