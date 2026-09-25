/**
 * DRIVESHARE — Staff / Admin Module (Clean & Professional, No Emojis)
 * Quản trị & Vận hành: Duyệt xe mới đăng, Duyệt Giấy phép lái xe (GPLX), Giám sát đơn toàn sàn
 */

const AdminService = {
  renderAdminPortal(containerId = 'adminPortalContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="portal-header">
        <div class="container">
          <div class="portal-title-row">
            <div class="portal-title-group">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#0f766e">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Kênh Quản Trị & Thẩm Định (Staff / Admin)
              </h2>
              <div class="portal-subtitle">Hệ thống giám sát vận hành, kiểm duyệt xe và thẩm định tài khoản DriveShare</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-primary">Quyền hạn: Thẩm định & Giám sát</span>
            </div>
          </div>

          <!-- Tabs -->
          <div class="portal-tabs">
            <button class="portal-tab-btn active" id="adminTabCars" onclick="AdminService.switchTab('CARS')">
              Duyệt xe mới đăng (<span id="badgePendingCars">...</span>)
            </button>
            <button class="portal-tab-btn" id="adminTabCccd" onclick="AdminService.switchTab('CCCD')">
              Duyệt CMND/CCCD (<span id="badgePendingCccd">...</span>)
            </button>
            <button class="portal-tab-btn" id="adminTabLicenses" onclick="AdminService.switchTab('LICENSES')">
              Xác minh bằng lái GPLX (<span id="badgePendingLicenses">...</span>)
            </button>
            <button class="portal-tab-btn" id="adminTabBookings" onclick="AdminService.switchTab('BOOKINGS')">
              Toàn bộ đơn đặt xe (<span id="badgeTotalBookings">...</span>)
            </button>
            <button class="portal-tab-btn" id="adminTabUsers" onclick="AdminService.switchTab('USERS')">
              Quản lý tài khoản & Vai trò
            </button>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Stats Row -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statPendingCars">...</div>
              <div class="stat-label">Xe chờ kiểm duyệt</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statPendingLicenses">...</div>
              <div class="stat-label">GPLX chờ xác thực</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statActiveCars">...</div>
              <div class="stat-label">Tổng xe đang hoạt động</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statTotalBookings">...</div>
              <div class="stat-label">Tổng lượt giao dịch</div>
            </div>
          </div>
        </div>

        <!-- Tab Content 1: Duyệt xe mới đăng -->
        <div id="adminTabCarsContent">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Danh sách xe chờ phê duyệt xuất bản</h3>
            </div>
            <div class="table-responsive" id="adminCarsTableWrapper">
              <!-- Được render động qua renderCarsList() -->
            </div>
          </div>
        </div>

        <!-- Tab Content: Duyệt CMND/CCCD (BR-02) -->
        <div id="adminTabCccdContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Danh sách hồ sơ CMND / CCCD chờ xét duyệt (BR-02)</h3>
              <p style="font-size: 0.82rem; color: var(--slate-500); margin-top: 0.2rem;">
                Xác minh thông tin định danh cá nhân 2 mặt (Mặt trước & Mặt sau) trước khi kích hoạt tài khoản
              </p>
            </div>
            <div style="padding: 1.25rem;">
              <div id="adminCccdListContainer">
                <!-- Được render động qua renderCccdList() -->
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Content 2: Xác minh bằng lái GPLX -->
        <div id="adminTabLicensesContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Hồ sơ Giấy phép lái xe (GPLX) gửi xác thực</h3>
            </div>
            <div style="padding: 1.15rem;">
              <div id="adminLicensesContainer">
                <!-- Được render động qua renderLicensesList() -->
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Content 3: Toàn bộ đơn đặt xe -->
        <div id="adminTabBookingsContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <h3>Toàn bộ giao dịch trên hệ thống DriveShare</h3>
            </div>
            <div class="table-responsive" id="adminBookingsTableWrapper">
              <!-- Được render động qua renderBookingsList() -->
            </div>
          </div>
        </div>

        <!-- Tab Content 4: Quản lý người dùng (Users & Roles) -->
        <div id="adminTabUsersContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header" style="border-bottom: none;">
              <div>
                <h3>Danh sách người dùng toàn hệ thống</h3>
                <p style="font-size: 0.82rem; color: var(--slate-500); margin-top: 0.2rem;">
                  Tra cứu, tìm kiếm và giám sát mọi tài khoản theo vai trò (Role) và trạng thái (Status)
                </p>
              </div>
            </div>

            <!-- Task 14: 2 Tab Admin Khách thuê / Chủ xe -->
            <div class="user-role-subtabs" style="display: flex; gap: 8px; margin: 0 1.25rem 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
              <button type="button" class="btn btn-sm btn-primary" id="btnSubtabAll" onclick="AdminService.setUserRoleTab('all')" style="font-weight: 600; border-radius: 8px;">
                Tất cả người dùng
              </button>
              <button type="button" class="btn btn-sm btn-outline" id="btnSubtabRenter" onclick="AdminService.setUserRoleTab('renter')" style="font-weight: 600; border-radius: 8px;">
                Khách thuê (Renter)
              </button>
              <button type="button" class="btn btn-sm btn-outline" id="btnSubtabOwner" onclick="AdminService.setUserRoleTab('owner')" style="font-weight: 600; border-radius: 8px;">
                Chủ xe (Owner)
              </button>
            </div>

            <!-- Filter & Search Bar -->
            <div class="user-filter-bar">
              <div class="user-search-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  id="adminUserSearchInput" 
                  class="user-search-input" 
                  placeholder="Tìm theo họ tên, email, tên đăng nhập hoặc SĐT..." 
                  oninput="AdminService.onUserFilterChange()"
                />
              </div>

              <!-- Role Filter -->
              <select id="adminUserRoleFilter" class="user-filter-select" onchange="AdminService.onUserFilterChange()">
                <option value="all">Tất cả vai trò</option>
                <option value="owner">Chủ xe (Owner)</option>
                <option value="renter">Khách thuê (Renter)</option>
                <option value="staff">Nhân viên (Staff)</option>
                <option value="admin">Quản trị (Admin)</option>
              </select>

              <!-- Status Filter -->
              <select id="adminUserStatusFilter" class="user-filter-select" onchange="AdminService.onUserFilterChange()">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động (Active)</option>
                <option value="pending">Chờ phê duyệt (Pending)</option>
                <option value="locked">Bị khóa (Locked)</option>
              </select>
            </div>

            <!-- Users Table Container -->
            <div class="table-responsive" id="adminUsersTableWrapper">
              <!-- Sẽ được điền động qua renderUsersTable -->
            </div>
          </div>
        </div>

      </div>
    `;

    // Tải dữ liệu ban đầu
    this.loadAdminStats();
    this.renderCarsList();
  },

  // State quản lý filter và phân trang người dùng
  userState: {
    page: 1,
    limit: 5,
    search: '',
    role: 'all',
    status: 'all'
  },

  onUserFilterChange() {
    const searchInput = document.getElementById('adminUserSearchInput');
    const roleFilter = document.getElementById('adminUserRoleFilter');
    const statusFilter = document.getElementById('adminUserStatusFilter');

    this.userState.search = searchInput ? searchInput.value : '';
    this.userState.role = roleFilter ? roleFilter.value : 'all';
    this.userState.status = statusFilter ? statusFilter.value : 'all';
    this.userState.page = 1; // Reset về trang 1 khi lọc

    this.renderUsersTable();
  },

  goToUserPage(page) {
    this.userState.page = page;
    this.renderUsersTable();
  },

  async renderUsersTable() {
    const wrapper = document.getElementById('adminUsersTableWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải danh sách người dùng...
      </div>
    `;

    // Gọi trực tiếp qua ApiService (Kết nối Backend API và fallback StorageService)
    const data = typeof ApiService !== 'undefined' 
      ? await ApiService.getAdminUsers(this.userState) 
      : StorageService.getUsers(this.userState);

    const users = data.items || [];
    const pagination = data.pagination || { page: 1, limit: 5, totalItems: users.length, totalPages: 1, hasNext: false, hasPrev: false };

    let roleBadgeClass = (r) => {
      switch(String(r).toLowerCase()) {
        case 'admin': return 'badge-danger';
        case 'staff': return 'badge-primary';
        case 'owner': return 'badge-success';
        default: return 'badge-neutral';
      }
    };

    let roleLabel = (r) => {
      switch(String(r).toLowerCase()) {
        case 'admin': return 'Admin';
        case 'staff': return 'Nhân viên';
        case 'owner': return 'Chủ xe';
        default: return 'Khách thuê';
      }
    };

    wrapper.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Email & SĐT</th>
            <th>Vai trò (Role)</th>
            <th>Trạng thái tài khoản</th>
            <th>Trạng thái duyệt Chủ xe</th>
            <th>Ngày tham gia</th>
            <th style="text-align: center;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${users.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--slate-500);">
                Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm và lọc.
              </td>
            </tr>
          ` : users.map(u => {
            const isOwner = Array.isArray(u.roles) && u.roles.some(r => String(r).toLowerCase().includes('owner'));
            const ownerStatus = u.owner_profile ? (u.owner_profile.verification_status || u.owner_profile.verificationStatus) : (u.ownerProfile ? (u.ownerProfile.verification_status || u.ownerProfile.verificationStatus) : null);
            
            return `
              <tr>
                <td>
                  <div class="table-user-cell">
                    <img class="table-user-avatar" src="${u.avatar_url || u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" alt="${u.full_name || u.fullName}" />
                    <div>
                      <strong style="color: var(--slate-800);">${u.full_name || u.fullName || u.username}</strong>
                      <div style="font-size: 0.76rem; color: var(--slate-500);">@${u.username} · ID: #${u.user_id || u.userId}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.84rem; font-weight: 500;">${u.email}</div>
                  <div style="font-size: 0.76rem; color: var(--slate-500);">${u.phone || 'Chưa cập nhật SĐT'}</div>
                </td>
                <td>
                  <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                    ${(u.roles || []).map(r => `
                      <span class="badge ${roleBadgeClass(r)}" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">
                        ${roleLabel(r)}
                      </span>
                    `).join('')}
                  </div>
                </td>
                <td>
                  ${(u.status === 'ACTIVE' || u.status === 'active') ? '<span class="badge badge-success">Hoạt động</span>' : 
                    ((u.status === 'PENDING' || u.status === 'pending') ? '<span class="badge badge-warning">Chờ duyệt</span>' : 
                    '<span class="badge badge-danger">Đã khóa</span>')}
                </td>
                <td>
                  ${isOwner ? `
                    ${(ownerStatus === 'VERIFIED' || ownerStatus === 'verified') ? `
                      <span class="badge badge-success" title="Ngân hàng: ${u.owner_profile?.bank_name || u.owner_profile?.bankName || u.ownerProfile?.bankName || 'N/A'}">
                        Đã duyệt hồ sơ
                      </span>
                    ` : (ownerStatus === 'REJECTED' || ownerStatus === 'rejected') ? `
                      <span class="badge badge-danger">Từ chối phê duyệt</span>
                    ` : `
                      <span class="badge badge-warning">Chờ thẩm định CCCD/Bank</span>
                    `}
                  ` : `
                    <span style="color: var(--slate-400); font-size: 0.8rem;">— (Không phải chủ xe)</span>
                  `}
                </td>
                <td style="font-size: 0.8rem; color: var(--slate-500); white-space: nowrap;">
                  ${u.created_at || u.createdAt || 'Mới tham gia'}
                </td>
                <td style="text-align: center; white-space: nowrap; display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
                  <button class="btn btn-outline btn-sm" onclick="AdminService.openUserDetailModal(${u.user_id || u.userId})" style="padding: 0.28rem 0.55rem; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Chi tiết
                  </button>
                  ${(u.status === 'LOCKED' || u.status === 'locked') ? `
                    <button class="btn btn-outline btn-sm" onclick="AdminService.unblockUserAction(${u.user_id || u.userId}, '${u.username}')" title="Mở khóa tài khoản" style="padding: 0.28rem 0.55rem; font-size: 0.78rem; color: #059669; border-color: #059669; display: inline-flex; align-items: center; gap: 0.25rem;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                      Mở khóa
                    </button>
                  ` : `
                    <button class="btn btn-outline btn-sm" onclick="AdminService.blockUserAction(${u.user_id || u.userId}, '${u.username}')" title="Khóa tài khoản" style="padding: 0.28rem 0.55rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger); display: inline-flex; align-items: center; gap: 0.25rem;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Khóa
                    </button>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Pagination Footer -->
      <div class="admin-pagination">
        <div>
          Hiển thị <strong>${users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</strong> - 
          <strong>${Math.min(pagination.page * pagination.limit, pagination.totalItems ?? pagination.total_items ?? users.length)}</strong> 
          trong tổng số <strong>${pagination.totalItems ?? pagination.total_items ?? users.length}</strong> người dùng
        </div>

        <div class="pagination-controls">
          <button 
            class="pagination-btn" 
            onclick="AdminService.goToUserPage(${pagination.page - 1})" 
            ${!(pagination.hasPrev ?? pagination.has_prev) ? 'disabled' : ''}>
            &larr; Trang trước
          </button>
          
          <span class="pagination-page-indicator">Trang ${pagination.page} / ${pagination.totalPages ?? pagination.total_pages ?? 1}</span>

          <button 
            class="pagination-btn" 
            onclick="AdminService.goToUserPage(${pagination.page + 1})" 
            ${!(pagination.hasNext ?? pagination.has_next) ? 'disabled' : ''}>
            Trang sau &rarr;
          </button>
        </div>
      </div>
    `;
  },

  showToast(message, type = 'info') {
    if (typeof toast !== 'undefined' && typeof toast[type] === 'function') {
      toast[type](message);
    } else if (typeof toast !== 'undefined' && typeof toast.show === 'function') {
      toast.show(message, type);
    } else if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      alert(message);
    }
  },

  openModal(title, contentHtml) {
    let overlay = document.getElementById('generalModalOverlay');
    if (overlay) {
      const titleEl = document.getElementById('generalModalTitle');
      const bodyEl = document.getElementById('generalModalBody');
      if (titleEl) titleEl.innerText = title;
      if (bodyEl) bodyEl.innerHTML = contentHtml;
      overlay.classList.add('open');
      overlay.style.display = 'flex';
      return;
    }
    if (typeof App !== 'undefined' && App.openModal) {
      App.openModal(title, contentHtml);
    }
  },

  closeModal() {
    let overlay = document.getElementById('generalModalOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.style.display = 'none';
      return;
    }
    if (typeof App !== 'undefined' && App.closeModal) {
      App.closeModal();
    }
  },

  // Tải thống kê thời gian thực từ Backend DB (GET /api/v1/admin/stats)
  async loadAdminStats() {
    let stats = {
      pendingCars: 0,
      pendingLicenses: 0,
      activeCars: 0,
      totalBookings: 0,
      pendingCccd: 0,
      totalUsers: 0
    };

    try {
      if (typeof ApiService !== 'undefined') {
        const res = await ApiService.getAdminStats();
        if (res && res.success && res.data) {
          const d = res.data;
          stats.pendingCars = d.pending_cars_count ?? d.pending_cars ?? d.pendingCarsCount ?? 0;
          stats.pendingLicenses = d.pending_licenses_count ?? d.pending_licenses ?? d.pendingLicensesCount ?? 0;
          stats.activeCars = d.active_cars_count ?? d.active_cars ?? d.activeCarsCount ?? 0;
          stats.totalBookings = d.total_bookings_count ?? d.total_bookings ?? d.totalBookingsCount ?? 0;
          stats.pendingCccd = d.pending_cccd_count ?? d.pending_cccd ?? d.pendingCccdCount ?? 0;
          stats.totalUsers = d.total_users_count ?? d.total_users ?? d.totalUsersCount ?? 0;
        }
      } else if (typeof StorageService !== 'undefined') {
        const allCars = StorageService.getCars();
        stats.pendingCars = allCars.filter(c => c.status === 'PENDING_APPROVAL' || c.status === 'PENDING').length;
        stats.activeCars = allCars.filter(c => c.status === 'ACTIVE').length;
        const allRenters = StorageService.getRenters();
        stats.pendingLicenses = allRenters.filter(r => r.license_status === 'PENDING').length;
        stats.totalBookings = StorageService.getBookings().length;
        const allUsersObj = StorageService.getUsers();
        const allUsersList = Array.isArray(allUsersObj) ? allUsersObj : (allUsersObj?.items || []);
        stats.pendingCccd = allUsersList.filter(u => u.verification_status === 'PENDING' || u.status === 'PENDING').length;
        stats.totalUsers = allUsersList.length;
      }
    } catch (e) {
      console.warn('Lỗi khi tải thống kê Admin:', e);
    }

    // 4 Thẻ KPI chính
    const elPendingCars = document.getElementById('statPendingCars');
    if (elPendingCars) elPendingCars.innerText = stats.pendingCars;
    const elPendingLicenses = document.getElementById('statPendingLicenses');
    if (elPendingLicenses) elPendingLicenses.innerText = stats.pendingLicenses;
    const elActiveCars = document.getElementById('statActiveCars');
    if (elActiveCars) elActiveCars.innerText = stats.activeCars;
    const elTotalBookings = document.getElementById('statTotalBookings');
    if (elTotalBookings) elTotalBookings.innerText = stats.totalBookings;

    // Badges trên các Tab
    const badgePendingCars = document.getElementById('badgePendingCars');
    if (badgePendingCars) badgePendingCars.innerText = stats.pendingCars;
    const badgePendingCccd = document.getElementById('badgePendingCccd');
    if (badgePendingCccd) badgePendingCccd.innerText = stats.pendingCccd;
    const badgePendingLicenses = document.getElementById('badgePendingLicenses');
    if (badgePendingLicenses) badgePendingLicenses.innerText = stats.pendingLicenses;
    const badgeTotalBookings = document.getElementById('badgeTotalBookings');
    if (badgeTotalBookings) badgeTotalBookings.innerText = stats.totalBookings;
  },

  // Tab 1: Duyệt xe mới đăng (GET /api/v1/admin/cars/pending)
  async renderCarsList() {
    const wrapper = document.getElementById('adminCarsTableWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải danh sách xe chờ duyệt từ hệ thống...
      </div>
    `;

    let cars = [];
    try {
      if (typeof ApiService !== 'undefined') {
        const res = await ApiService.getAdminPendingCars();
        if (res && res.success) {
          cars = res.items || (Array.isArray(res.data) ? res.data : (res.data?.items || []));
        }
      } else if (typeof StorageService !== 'undefined') {
        const allCars = StorageService.getCars();
        cars = allCars.filter(c => c.status === 'PENDING_APPROVAL' || c.status === 'PENDING' || c.status === 'PENDING_REVIEW');
      }
    } catch (e) {
      console.warn('renderCarsList error:', e);
    }

    wrapper.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Thông tin xe</th>
            <th>Biển số</th>
            <th>Chủ xe</th>
            <th>Giá đề xuất</th>
            <th>Địa điểm đón</th>
            <th>Thẩm định & Quyết định</th>
          </tr>
        </thead>
        <tbody>
          ${cars.length === 0 ? `
            <tr>
              <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--slate-500);">
                Hệ thống đã xử lý hết mọi xe chờ duyệt. Hiện không có yêu cầu nào tồn đọng.
              </td>
            </tr>
          ` : cars.map(c => {
            const carId = c.car_id || c.id;
            const thumb = c.thumbnail_url || c.thumbnailUrl || c.image_url || c.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80';
            const brand = c.brand || 'Xe';
            const model = c.model || '';
            const year = c.year || '';
            const seats = c.seat_count || c.seatCount || c.seats || 4;
            const trans = (c.transmission === 'AUTOMATIC' || c.transmission === 'Số tự động') ? 'Tự động' : 'Số sàn';
            const plate = c.license_plate || c.licensePlate || c.plate_number || c.plateNumber || 'N/A';
            const owner = c.owner_name || c.ownerName || 'Chủ xe';
            const price = c.base_price_per_day || c.basePricePerDay || c.price_per_day || c.pricePerDay || 0;
            const addr = c.pickup_address || c.pickupAddress || c.address || 'Chưa cập nhật';
            return `
            <tr>
              <td>
                <div class="table-car-cell">
                  <img class="table-car-thumb" src="${thumb}" alt="${brand}" />
                  <div>
                    <strong>${brand} ${model}</strong>
                    <div style="font-size: 0.76rem; color: var(--slate-500);">${year} · ${seats} chỗ · ${trans}</div>
                  </div>
                </div>
              </td>
              <td><strong style="font-family: monospace;">${plate}</strong></td>
              <td>${owner}</td>
              <td style="color: var(--primary); font-weight: 700;">${typeof StorageService !== 'undefined' ? StorageService.formatCurrency(price) : (Number(price).toLocaleString('vi-VN') + ' đ')}</td>
              <td style="font-size: 0.82rem; max-width: 180px;">${addr}</td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-outline btn-sm" onclick="AdminService.openCarDetailModal(${carId})">Chi tiết</button>
                  <button class="btn btn-primary btn-sm" onclick="AdminService.approveCar(${carId})">Duyệt xe</button>
                  <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="AdminService.openRejectCarModal(${carId})">Từ chối</button>
                </div>
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  // Modal xem chi tiết xe trong Admin
  async openCarDetailModal(carId) {
    this.openModal(`Chi tiết xe #${carId}`, `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block; color: var(--primary);">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải thông tin chi tiết xe...
      </div>
    `);

    let car = null;
    try {
      if (typeof ApiService !== 'undefined') {
        if (ApiService.getAdminCarById) {
          const res = await ApiService.getAdminCarById(carId);
          if (res && res.success && res.data) car = res.data;
        } else if (ApiService.getCarById) {
          const res = await ApiService.getCarById(carId);
          if (res && res.success && res.data) car = res.data;
        }
      }
      if (!car && typeof CarAPI !== 'undefined' && CarAPI.getPublicCarDetail) {
        const res = await CarAPI.getPublicCarDetail(carId);
        if (res && res.success && res.data) car = res.data;
      }
      if (!car && typeof StorageService !== 'undefined') {
        car = StorageService.getCarById(carId);
      }
    } catch (e) {
      console.warn('openCarDetailModal error:', e);
    }

    if (!car) {
      const modalBody = document.getElementById('generalModalBody');
      if (modalBody) {
        modalBody.innerHTML = `
          <div style="padding: 2rem; text-align: center;">
            <p style="color: var(--danger); font-weight: 600;">Không tìm thấy thông tin xe #${carId}</p>
            <button class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Đóng</button>
          </div>
        `;
      }
      return;
    }

    const modalBody = document.getElementById('generalModalBody');
    if (modalBody) {
      const thumb = car.thumbnail_url || car.thumbnailUrl || car.image_url || car.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
      const brand = car.brand || 'Xe';
      const model = car.model || '';
      const year = car.year || '';
      const plate = car.license_plate || car.licensePlate || car.plate_number || car.plateNumber || 'N/A';
      const owner = car.owner_name || car.ownerName || 'Chủ xe';
      const price = car.base_price_per_day || car.basePricePerDay || car.price_per_day || car.pricePerDay || 0;
      const seats = car.seat_count || car.seatCount || car.seats || 4;
      const trans = (car.transmission === 'AUTOMATIC' || car.transmission === 'Số tự động') ? 'Tự động' : 'Số sàn';
      const fuel = car.fuel_type || car.fuelType || car.fuel || 'Xăng';
      const addr = car.pickup_address || car.pickupAddress || car.address || 'Chưa cập nhật';
      const priceStr = typeof StorageService !== 'undefined' ? StorageService.formatCurrency(price) : (Number(price).toLocaleString('vi-VN') + ' đ');

      modalBody.innerHTML = `
        <div style="padding: 1.25rem;">
          <div style="display: flex; gap: 1.25rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
            <img src="${thumb}" alt="${brand} ${model}" style="width: 240px; height: 160px; object-fit: cover; border-radius: 10px; border: 1px solid var(--slate-200);" />
            <div style="flex: 1; min-width: 220px;">
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--slate-900); margin: 0 0 0.4rem 0;">${brand} ${model} (${year})</h3>
              <div style="font-size: 0.88rem; color: var(--slate-500); margin-bottom: 0.5rem;">Biển số: <strong style="font-family: monospace; color: var(--slate-800);">${plate}</strong></div>
              <div style="font-size: 0.88rem; color: var(--slate-500); margin-bottom: 0.5rem;">Chủ xe: <strong style="color: var(--slate-800);">${owner}</strong></div>
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary); margin-top: 0.5rem;">${priceStr} <span style="font-size: 0.8rem; font-weight: 500; color: var(--slate-500);">/ ngày</span></div>
            </div>
          </div>
          <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
              <div><span style="color: var(--slate-500);">Số chỗ:</span> <strong>${seats} chỗ</strong></div>
              <div><span style="color: var(--slate-500);">Hộp số:</span> <strong>${trans}</strong></div>
              <div><span style="color: var(--slate-500);">Nhiên liệu:</span> <strong>${fuel}</strong></div>
              <div><span style="color: var(--slate-500);">Địa điểm đón:</span> <strong>${addr}</strong></div>
            </div>
          </div>
          <div style="text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Đóng</button>
            <button class="btn btn-primary btn-sm" onclick="AdminService.closeModal(); AdminService.approveCar(${carId});">Duyệt xe này</button>
            <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="AdminService.closeModal(); AdminService.openRejectCarModal(${carId});">Từ chối xe</button>
          </div>
        </div>
      `;
    }
  },

  // Duyệt xe thành công (PUT /api/v1/admin/cars/{carId}/approve)
  async approveCar(carId) {
    if (typeof ApiService !== 'undefined') {
      await ApiService.approveCar(carId, 'APPROVED');
    } else {
      try {
        await fetch(`http://localhost:8080/api/v1/admin/cars/${carId}/approve`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' })
        });
      } catch (e) {
        console.warn('API approveCar offline:', e);
      }
    }
    if (typeof StorageService !== 'undefined') {
      StorageService.updateCarStatus(carId, 'ACTIVE');
    }
    const msg = Đã duyệt xe #! Xe đã được xuất bản và sẵn sàng cho thuê.;
    if (typeof showToast === 'function') showToast(msg, 'success', 2500);
    else if (typeof App !== 'undefined' && App.showToast) App.showToast(msg, 'success');

    this.renderCarsList();
    this.loadAdminStats();
  },

  rejectCar(carId) {
    this.openRejectCarModal(carId);
  },

  // BR-04-6: Mở modal yêu cầu nhập lý do từ chối xe
  openRejectCarModal(carId) {
    const html = `
      <div style="padding: 0.5rem 0;">
        <p style="color: #475569; font-size: 0.9rem; margin-bottom: 1rem;">
          Bạn đang từ chối duyệt xe <strong>#${carId}</strong>. Theo quy định (BR-04-6), <strong>bắt buộc phải nhập lý do từ chối</strong> để thông báo cho chủ xe.
        </p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px; color: #1e293b;">
            Lý do từ chối * (Bắt buộc)
          </label>
          <textarea id="carRejectReasonInput" class="form-control" rows="3" placeholder="Ví dụ: Giấy tờ cavet chưa rõ nét, hình ảnh xe thực tế không khớp với thông số..." style="width: 100%; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 0.9rem; box-sizing: border-box;"></textarea>
          <div id="carRejectReasonError" style="color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-top: 5px; display: none;"></div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 1.25rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Hủy</button>
          <button type="button" class="btn btn-primary btn-sm" style="background: #ef4444; border-color: #dc2626;" onclick="AdminService.submitRejectCar(${carId})">Xác nhận từ chối</button>
        </div>
      </div>
    `;
    this.openModal(`Từ chối duyệt xe #${carId} (BR-04-6)`, html);
  },

  // BR-04-6: Xác nhận từ chối xe có lý do bắt buộc
  async submitRejectCar(carId) {
    const reasonInput = document.getElementById('carRejectReasonInput');
    const errorEl = document.getElementById('carRejectReasonError');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
      if (errorEl) {
        errorEl.innerText = 'Lý do từ chối là bắt buộc khi từ chối duyệt xe!';
        errorEl.style.display = 'block';
      }
      if (typeof showToast === 'function') {
        showToast('Lý do từ chối là bắt buộc khi từ chối duyệt xe!', 'error', 2500);
      }
      return;
    }

    if (typeof ApiService !== 'undefined') {
      await ApiService.approveCar(carId, 'REJECTED', reason);
    } else {
      try {
        await fetch(`http://localhost:8080/api/v1/admin/cars/${carId}/approve`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', reason })
        });
      } catch (e) {
        console.warn('API rejectCar offline:', e);
      }
    }

    if (typeof StorageService !== 'undefined') {
      StorageService.updateCarStatus(carId, 'REJECTED', reason);
    }
    const msg = `Đã từ chối xe #${carId}. Lý do: ${reason}`;
    if (typeof showToast === 'function') showToast(msg, 'info', 3000);
    else if (typeof App !== 'undefined' && App.showToast) App.showToast(msg, 'info');

    this.closeModal();
    this.renderCarsList();
    this.loadAdminStats();
  },

  // Tab 2: Duyệt CMND/CCCD (GET /api/v1/admin/users/pending-cccd)
  async renderCccdList() {
    const container = document.getElementById('adminCccdListContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải danh sách CMND/CCCD chờ duyệt từ cơ sở dữ liệu...
      </div>
    `;

    let pendingList = [];
    try {
      if (typeof ApiService !== 'undefined') {
        const res = await ApiService.getAdminPendingCccd();
        if (res && res.success && Array.isArray(res.data)) {
          pendingList = res.data;
        }
      } else {
        const res = await fetch('http://localhost:8080/api/v1/admin/users/pending-cccd', {
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : {}
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data && Array.isArray(data.data || data.result)) {
          pendingList = data.data || data.result;
        }
      }
    } catch (e) {
      console.warn('API pending-cccd offline:', e);
    }

    if (pendingList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: #64748b;">
          Hiện không có hồ sơ CMND/CCCD nào đang chờ xét duyệt.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        ${pendingList.map(u => {
          const userId = u.user_id || u.userId;
          const fullName = u.full_name || u.fullName;
          const email = u.email;
          const phone = u.phone || 'Chưa cập nhật';
          const role = u.role;
          const cccdFront = u.cccd_front_url || u.cccdFrontUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';
          const cccdBack = u.cccd_back_url || u.cccdBackUrl || 'https://images.unsplash.com/photo-1544717305-9e6b4e057115?auto=format&fit=crop&w=600&q=80';
          const submittedAt = u.submitted_at || u.submittedAt || 'Mới nộp';

          return `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; display: flex; flex-wrap: wrap; gap: 1.25rem; align-items: flex-start; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <strong style="font-size: 1.05rem; color: #0f172a;">${fullName}</strong>
                  <span class="badge ${role === 'OWNER' ? 'badge-warning' : 'badge-info'}" style="font-size: 0.72rem;">${role === 'OWNER' ? 'Chủ xe' : 'Khách thuê'}</span>
                  <span class="badge badge-warning" style="font-size: 0.72rem;">Chờ thẩm định CCCD</span>
                </div>
                <div style="font-size: 0.85rem; color: #475569; margin-bottom: 3px;">Email: <strong>${email}</strong></div>
                <div style="font-size: 0.85rem; color: #475569; margin-bottom: 3px;">Số điện thoại: <strong>${phone}</strong></div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Thời gian nộp: ${submittedAt}</div>
              </div>

              <!-- Ảnh CCCD 2 mặt -->
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <div style="text-align: center;">
                  <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Mặt trước CCCD</div>
                  <img src="${cccdFront}" alt="Mặt trước" style="width: 140px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer;" onclick="window.open('${cccdFront}', '_blank')" title="Nhấp để xem ảnh lớn" />
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Mặt sau CCCD</div>
                  <img src="${cccdBack}" alt="Mặt sau" style="width: 140px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer;" onclick="window.open('${cccdBack}', '_blank')" title="Nhấp để xem ảnh lớn" />
                </div>
              </div>

              <!-- Nút hành động -->
              <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center; min-width: 130px;">
                <button class="btn btn-primary btn-sm" onclick="AdminService.approveCccd(${userId})" style="font-weight: 700;">
                  Phê duyệt CCCD
                </button>
                <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #fca5a5;" onclick="AdminService.openRejectCccdModal(${userId})">
                  Từ chối hồ sơ
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // BR-02-5: Phê duyệt CCCD (PUT /api/v1/admin/users/{userId}/verify-cccd)
  async approveCccd(userId) {
    if (typeof ApiService !== 'undefined') {
      await ApiService.verifyCccd(userId, 'APPROVED');
    } else {
      try {
        await fetch(`http://localhost:8080/api/v1/admin/users/${userId}/verify-cccd`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' })
        });
      } catch (e) {
        console.warn('Approve CCCD API offline:', e);
      }
    }

    if (typeof showToast === 'function') {
      showToast(`Đã phê duyệt CMND/CCCD thành công cho user #${userId}!`, 'success', 2500);
    }
    this.renderCccdList();
    this.loadAdminStats();
  },

  // BR-02-6: Mở modal từ chối CCCD bắt buộc lý do
  openRejectCccdModal(userId) {
    const html = `
      <div style="padding: 0.5rem 0;">
        <p style="color: #475569; font-size: 0.9rem; margin-bottom: 1rem;">
          Từ chối hồ sơ CMND/CCCD của người dùng <strong>#${userId}</strong>. Vui lòng nhập lý do để thông báo cho người dùng tải lại ảnh.
        </p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px; color: #1e293b;">
            Lý do từ chối * (Bắt buộc)
          </label>
          <textarea id="cccdRejectReasonInput" class="form-control" rows="3" placeholder="Ví dụ: Ảnh chụp bị mờ số CMND, ảnh mặt sau bị lóa sáng không đọc được ngày cấp..." style="width: 100%; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 0.9rem; box-sizing: border-box;"></textarea>
          <div id="cccdRejectReasonError" style="color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-top: 5px; display: none;"></div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 1.25rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Hủy</button>
          <button type="button" class="btn btn-primary btn-sm" style="background: #ef4444; border-color: #dc2626;" onclick="AdminService.submitRejectCccd(${userId})">Xác nhận từ chối</button>
        </div>
      </div>
    `;
    this.openModal(`Từ chối hồ sơ CMND/CCCD #${userId}`, html);
  },

  // BR-02-6: Bắt buộc lý do từ chối CCCD
  async submitRejectCccd(userId) {
    const reasonInput = document.getElementById('cccdRejectReasonInput');
    const errorEl = document.getElementById('cccdRejectReasonError');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
      if (errorEl) {
        errorEl.innerText = 'Lý do từ chối là bắt buộc khi từ chối CMND/CCCD!';
        errorEl.style.display = 'block';
      }
      if (typeof showToast === 'function') {
        showToast('Lý do từ chối là bắt buộc khi từ chối CMND/CCCD!', 'error', 2500);
      }
      return;
    }

    if (typeof ApiService !== 'undefined') {
      await ApiService.verifyCccd(userId, 'REJECTED', reason);
    } else {
      try {
        await fetch(`http://localhost:8080/api/v1/admin/users/${userId}/verify-cccd`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', reason })
        });
      } catch (e) {
        console.warn('Reject CCCD API offline:', e);
      }
    }

    if (typeof showToast === 'function') {
      showToast(`Đã từ chối CMND/CCCD user #${userId}. Lý do: ${reason}`, 'info', 3000);
    }
    this.closeModal();
    this.renderCccdList();
    this.loadAdminStats();
  },

  // Tab 3: Xác minh bằng lái GPLX (GET /api/v1/admin/users/pending-licenses)
  async renderLicensesList() {
    const container = document.getElementById('adminLicensesContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải danh sách hồ sơ GPLX từ cơ sở dữ liệu...
      </div>
    `;

    let licenses = [];
    try {
      if (typeof ApiService !== 'undefined') {
        const res = await ApiService.getAdminLicenses();
        if (res && res.success && Array.isArray(res.data)) {
          licenses = res.data;
        }
      } else if (typeof StorageService !== 'undefined') {
        const allRenters = StorageService.getRenters();
        licenses = allRenters.map(r => ({
          user_id: r.id,
          full_name: r.name,
          phone: r.phone,
          email: r.email,
          license_number: r.license_number,
          license_image_url: r.license_image,
          license_status: r.license_status
        }));
      }
    } catch (e) {
      console.warn('renderLicensesList error:', e);
    }

    if (licenses.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: #64748b;">
          Hiện không có hồ sơ Giấy phép lái xe (GPLX) nào cần xác minh.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${licenses.map(r => {
          const userId = r.user_id || r.userId || r.id;
          const status = r.license_status || r.licenseStatus || 'PENDING';
          const isPending = status === 'PENDING';
          return `
            <div class="license-card">
              <img class="license-thumb" src="${r.license_image_url || r.licenseImageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80'}" alt="GPLX ${r.full_name || r.fullName}" onclick="window.open(this.src, '_blank')" style="cursor: pointer;" title="Nhấp để xem ảnh lớn" />
              <div>
                <div style="display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.3rem; flex-wrap: wrap;">
                  <h4 style="font-size: 1rem; font-weight: 700;">${r.full_name || r.fullName}</h4>
                  <span class="badge ${status === 'VERIFIED' || status === 'APPROVED' ? 'badge-success' : (isPending ? 'badge-warning' : 'badge-danger')}">
                    ${status === 'VERIFIED' || status === 'APPROVED' ? 'Đã duyệt hợp lệ' : (isPending ? 'Chờ xác thực' : 'Bị từ chối')}
                  </span>
                </div>
                <div style="font-size: 0.82rem; color: var(--slate-600); margin-bottom: 0.2rem;">
                  Số GPLX: <strong style="font-family: monospace;">${r.license_number || r.licenseNumber || 'Chưa cung cấp'}</strong>
                </div>
                <div style="font-size: 0.82rem; color: var(--slate-500);">
                  SĐT: ${r.phone || 'Chưa cập nhật'} · Email: ${r.email || 'Chưa cập nhật'}
                </div>
                ${r.submitted_at || r.submittedAt ? `<div style="font-size: 0.76rem; color: var(--slate-400); margin-top: 0.2rem;">Thời gian gửi: ${r.submitted_at || r.submittedAt}</div>` : ''}
              </div>
              <div>
                ${isPending ? `
                  <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-sm" onclick="AdminService.approveLicense(${userId})">Phê duyệt GPLX</button>
                    <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="AdminService.openRejectLicenseModal(${userId})">Yêu cầu chụp lại</button>
                  </div>
                ` : `
                  <span style="color: var(--slate-400); font-size: 0.82rem;">Đã hoàn thành xác minh</span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // Phê duyệt GPLX (PATCH /api/v1/admin/users/{userId}/approve-license)
  async approveLicense(userId) {
    if (typeof ApiService !== 'undefined') {
      await ApiService.approveLicense(userId, 'verified');
    }
    if (typeof StorageService !== 'undefined') {
      StorageService.updateRenterLicense(userId, 'APPROVED');
    }
    const msg = `Đã xác minh GPLX hợp lệ cho khách thuê #${userId}!`;
    if (typeof showToast === 'function') showToast(msg, 'success', 2500);
    else if (typeof App !== 'undefined' && App.showToast) App.showToast(msg, 'success');

    this.renderLicensesList();
    this.loadAdminStats();
  },

  // Mở modal yêu cầu chụp lại GPLX kèm lý do
  openRejectLicenseModal(userId) {
    const html = `
      <div style="padding: 0.5rem 0;">
        <p style="color: #475569; font-size: 0.9rem; margin-bottom: 1rem;">
          Bạn đang từ chối GPLX của khách thuê <strong>#${userId}</strong>. Vui lòng nhập lý do để thông báo cho khách hàng:
        </p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px; color: #1e293b;">
            Lý do từ chối * (Bắt buộc)
          </label>
          <textarea id="licenseRejectReasonInput" class="form-control" rows="3" placeholder="Ví dụ: Ảnh chụp bị lóa sáng, số bằng lái không đọc được, giấy phép hết hạn..." style="width: 100%; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 0.9rem; box-sizing: border-box;"></textarea>
          <div id="licenseRejectReasonError" style="color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-top: 5px; display: none;"></div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 1.25rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Hủy</button>
          <button type="button" class="btn btn-primary btn-sm" style="background: #ef4444; border-color: #dc2626;" onclick="AdminService.submitRejectLicense(${userId})">Xác nhận từ chối</button>
        </div>
      </div>
    `;
    this.openModal(`Từ chối GPLX #${userId}`, html);
  },

  // Xác nhận từ chối GPLX có lý do bắt buộc
  async submitRejectLicense(userId) {
    const input = document.getElementById('licenseRejectReasonInput');
    const reason = input ? input.value.trim() : '';
    if (!reason) {
      const err = document.getElementById('licenseRejectReasonError');
      if (err) {
        err.innerText = 'Lý do từ chối là bắt buộc!';
        err.style.display = 'block';
      }
      return;
    }

    if (typeof ApiService !== 'undefined') {
      await ApiService.approveLicense(userId, 'rejected', reason);
    }
    if (typeof StorageService !== 'undefined') {
      StorageService.updateRenterLicense(userId, 'REJECTED');
    }
    const msg = `Đã yêu cầu khách thuê #${userId} chụp lại GPLX.`;
    if (typeof showToast === 'function') showToast(msg, 'warning', 3000);
    else if (typeof App !== 'undefined' && App.showToast) App.showToast(msg, 'warning');

    this.closeModal();
    this.renderLicensesList();
    this.loadAdminStats();
  },

  // Tab 4: Toàn bộ đơn đặt xe (GET /api/v1/admin/rentals)
  async renderBookingsList() {
    const wrapper = document.getElementById('adminBookingsTableWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải toàn bộ đơn đặt xe từ cơ sở dữ liệu...
      </div>
    `;

    let bookings = [];
    try {
      if (typeof ApiService !== 'undefined') {
        const res = await ApiService.getAdminRentals();
        if (res && res.success && Array.isArray(res.data)) {
          bookings = res.data;
        }
      } else if (typeof StorageService !== 'undefined') {
        bookings = StorageService.getBookings();
      }
    } catch (e) {
      console.warn('renderBookingsList error:', e);
    }

    const getStatusBadge = (st) => {
      switch (String(st).toUpperCase()) {
        case 'CONFIRMED':
        case 'DEPOSIT_PAID':
          return '<span class="badge badge-success">Đã đặt cọc (30%)</span>';
        case 'ACTIVE':
          return '<span class="badge badge-primary">Đang thuê</span>';
        case 'COMPLETED':
          return '<span class="badge badge-neutral">Đã hoàn thành</span>';
        case 'CANCELLED':
          return '<span class="badge badge-danger">Đã hủy</span>';
        case 'PENDING':
          return '<span class="badge badge-warning">Chờ chủ xe duyệt</span>';
        default:
          return `<span class="badge badge-warning">${st}</span>`;
      }
    };

    wrapper.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Phương tiện</th>
            <th>Khách thuê</th>
            <th>Lịch trình thuê</th>
            <th>Tổng tiền</th>
            <th>Tiền cọc (30%)</th>
            <th>Trạng thái đơn</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--slate-500);">
                Chưa có giao dịch thuê xe nào trên hệ thống DriveShare.
              </td>
            </tr>
          ` : bookings.map(b => `
            <tr>
              <td><span class="booking-code">#${b.rental_id || b.rentalId || b.id}</span></td>
              <td>
                <strong>${b.car_name || b.carName || 'Phương tiện'}</strong><br/>
                <span style="font-size: 0.76rem; color: var(--slate-500); font-family: monospace;">${b.car_plate || b.carPlate || b.license_plate || b.licensePlate || 'N/A'}</span>
              </td>
              <td>
                ${b.renter_name || b.renterName || 'Khách thuê'}<br/>
                <span style="font-size: 0.76rem; color: var(--slate-500);">${b.renter_phone || b.renterPhone || b.renter_email || ''}</span>
              </td>
              <td style="font-size: 0.8rem;">
                ${b.start_date || b.startDate || b.start_time || ''} <br/>đến ${b.end_date || b.endDate || b.end_time || ''} (${b.total_days || b.totalDays || 1} ngày)
              </td>
              <td style="font-weight: 700;">${StorageService.formatCurrency(b.total_price || b.totalPrice || b.total_amount || b.totalAmount || 0)}</td>
              <td style="color: var(--primary); font-weight: 700;">${StorageService.formatCurrency(b.deposit_amount || b.depositAmount || 0)}</td>
              <td>${getStatusBadge(b.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  // Task 14: Chọn 2 tab Khách thuê / Chủ xe
  setUserRoleTab(role) {
    this.userState.role = role;
    this.userState.page = 1;

    // Cập nhật giao diện nút sub-tab
    const btnAll = document.getElementById('btnSubtabAll');
    const btnRenter = document.getElementById('btnSubtabRenter');
    const btnOwner = document.getElementById('btnSubtabOwner');

    if (btnAll) {
      btnAll.className = role === 'all' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
    }
    if (btnRenter) {
      btnRenter.className = role === 'renter' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
    }
    if (btnOwner) {
      btnOwner.className = role === 'owner' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
    }

    // Cập nhật select dropdown tương ứng
    const roleSelect = document.getElementById('adminUserRoleFilter');
    if (roleSelect) roleSelect.value = role;

    this.renderUsersTable();
  },

  // Chuyển Tab Admin
  switchTab(tabName) {
    document.getElementById('adminTabCars')?.classList.toggle('active', tabName === 'CARS');
    document.getElementById('adminTabCccd')?.classList.toggle('active', tabName === 'CCCD');
    document.getElementById('adminTabLicenses')?.classList.toggle('active', tabName === 'LICENSES');
    document.getElementById('adminTabBookings')?.classList.toggle('active', tabName === 'BOOKINGS');
    document.getElementById('adminTabUsers')?.classList.toggle('active', tabName === 'USERS');

    const tabCars = document.getElementById('adminTabCarsContent');
    const tabCccd = document.getElementById('adminTabCccdContent');
    const tabLicenses = document.getElementById('adminTabLicensesContent');
    const tabBookings = document.getElementById('adminTabBookingsContent');
    const tabUsers = document.getElementById('adminTabUsersContent');

    if (tabCars) {
      tabCars.style.display = tabName === 'CARS' ? 'block' : 'none';
      if (tabName === 'CARS') this.renderCarsList();
    }
    if (tabCccd) {
      tabCccd.style.display = tabName === 'CCCD' ? 'block' : 'none';
      if (tabName === 'CCCD') this.renderCccdList();
    }
    if (tabLicenses) {
      tabLicenses.style.display = tabName === 'LICENSES' ? 'block' : 'none';
      if (tabName === 'LICENSES') this.renderLicensesList();
    }
    if (tabBookings) {
      tabBookings.style.display = tabName === 'BOOKINGS' ? 'block' : 'none';
      if (tabName === 'BOOKINGS') this.renderBookingsList();
    }
    if (tabUsers) {
      tabUsers.style.display = tabName === 'USERS' ? 'block' : 'none';
      if (tabName === 'USERS') this.renderUsersTable();
    }
  },

  async rejectLicense(renterId) {
    const reason = prompt('Nhập lý do từ chối hoặc yêu cầu chụp lại GPLX:', 'Ảnh chụp GPLX bị mờ hoặc không rõ số seri. Vui lòng chụp lại hai mặt rõ nét.');
    if (!reason || !reason.trim()) {
      if (typeof showToast === 'function') showToast('Bạn đã hủy thao tác từ chối GPLX', 'info');
      else if (typeof App !== 'undefined' && App.showToast) App.showToast('Bạn đã hủy thao tác từ chối GPLX', 'info');
      return;
    }

    if (typeof ApiService !== 'undefined') {
      await ApiService.approveLicense(renterId, {
        verification_status: 'rejected',
        rejection_reason: reason.trim()
      });
    }
    if (typeof StorageService !== 'undefined') {
      StorageService.updateRenterLicense(renterId, 'REJECTED');
    }
    const msg = Đã yêu cầu khách thuê # chụp lại GPLX.;
    if (typeof showToast === 'function') showToast(msg, 'warning', 3000);
    else if (typeof App !== 'undefined' && App.showToast) App.showToast(msg, 'warning');

    this.renderLicensesList();
    this.loadAdminStats();
  },

  // Mở modal xem chi tiết người dùng (Admin View User Detail - AC1, AC2, AC3)
  async openUserDetailModal(userId) {
    // 1. Mở modal với trạng thái đang tải
    this.openModal(`Chi tiết người dùng #${userId}`, `
      <div style="padding: 3rem 1.5rem; text-align: center; color: var(--slate-500);">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.75rem auto; display: block; color: var(--primary);">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <div style="font-weight: 600; font-size: 0.95rem; color: var(--slate-700);">Đang tải thông tin tài khoản #${userId}...</div>
        <div style="font-size: 0.8rem; color: var(--slate-400); margin-top: 0.25rem;">Kết nối qua REST API Spring Boot (GET /api/v1/admin/users/${userId})</div>
      </div>
    `);

    // 2. Gọi API lấy dữ liệu chi tiết
    const res = typeof ApiService !== 'undefined' 
      ? await ApiService.getAdminUserById(userId) 
      : { success: true, data: StorageService.getUserById(userId) };

    // 3. Xử lý trường hợp không tìm thấy (AC3: 404 Not Found)
    if (!res || !res.success || !res.data) {
      const errorMsg = res?.message || `Không tìm thấy người dùng #${userId} (Mã lỗi: 404 - USER_NOT_FOUND)`;
      const modalBody = document.getElementById('generalModalBody');
      if (modalBody) {
        modalBody.innerHTML = `
          <div style="padding: 2.5rem 1.5rem; text-align: center;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; color: #ef4444; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--slate-800); margin-bottom: 0.35rem;">
              Tài khoản không tồn tại (HTTP 404)
            </h3>
            <p style="color: var(--slate-500); font-size: 0.88rem; max-width: 440px; margin: 0 auto 1.5rem auto;">
              ${errorMsg}
            </p>
            <div style="padding: 0.75rem; background: var(--slate-50); border: 1px dashed var(--slate-300); border-radius: 8px; font-size: 0.8rem; color: var(--slate-600); margin-bottom: 1.5rem; font-family: monospace;">
              GET /api/v1/admin/users/${userId} &rarr; 404 Not Found (USER_NOT_FOUND)
            </div>
            <button class="btn btn-primary" onclick="AdminService.closeModal()">Đã hiểu & Đóng</button>
          </div>
        `;
      }
      return;
    }

    // 4. Hiển thị dữ liệu chi tiết người dùng (AC1: Profile, Role, Status, Approval Status; AC2: No password hash)
    const u = res.data;
    const isOwner = Array.isArray(u.roles) && u.roles.some(r => String(r).toLowerCase().includes('owner'));
    const isRenter = Array.isArray(u.roles) && u.roles.some(r => String(r).toLowerCase().includes('renter'));
    const owner = u.owner_profile || u.ownerProfile;
    const renter = u.renter_profile || u.renterProfile;

    let roleBadgeClass = (r) => {
      switch(String(r).toLowerCase()) {
        case 'admin': return 'badge-danger';
        case 'staff': return 'badge-primary';
        case 'owner': return 'badge-success';
        default: return 'badge-neutral';
      }
    };

    let roleLabel = (r) => {
      switch(String(r).toLowerCase()) {
        case 'admin': return 'Quản trị viên (Admin)';
        case 'staff': return 'Nhân viên hệ thống (Staff)';
        case 'owner': return 'Chủ xe (Owner)';
        default: return 'Khách thuê xe (Renter)';
      }
    };

    const statusBadge = (u.status === 'ACTIVE' || u.status === 'active')
      ? '<span class="badge badge-success" style="font-size: 0.82rem; padding: 0.3rem 0.75rem;">Đang hoạt động (ACTIVE)</span>'
      : ((u.status === 'PENDING' || u.status === 'pending')
        ? '<span class="badge badge-warning" style="font-size: 0.82rem; padding: 0.3rem 0.75rem;">Chờ kích hoạt (PENDING)</span>'
        : '<span class="badge badge-danger" style="font-size: 0.82rem; padding: 0.3rem 0.75rem;">Đã bị khóa (LOCKED)</span>');

    const modalBody = document.getElementById('generalModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="padding: 1.25rem;">
        <!-- Header User Card -->
        <div style="display: flex; gap: 1.25rem; align-items: center; padding-bottom: 1.25rem; border-bottom: 1px solid var(--slate-200); margin-bottom: 1.25rem; flex-wrap: wrap;">
          <img 
            src="${u.avatar_url || u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}" 
            alt="${u.full_name || u.fullName}" 
            style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid var(--slate-100); box-shadow: var(--shadow-sm);"
          />
          <div style="flex: 1; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.25rem;">
              <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--slate-900); margin: 0;">
                ${u.full_name || u.fullName || u.username}
              </h3>
              ${statusBadge}
            </div>
            <div style="font-size: 0.84rem; color: var(--slate-500); display: flex; gap: 0.8rem; flex-wrap: wrap;">
              <span>Tên đăng nhập: <strong style="color: var(--slate-700);">@${u.username}</strong></span>
              <span>·</span>
              <span>ID Tài khoản: <strong>#${u.user_id || u.userId}</strong></span>
              <span>·</span>
              <span>Ngày tạo: <strong>${u.created_at || u.createdAt || 'N/A'}</strong></span>
            </div>
          </div>
        </div>

        <!-- Section 1: Vai trò trong hệ thống (Roles) -->
        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500); letter-spacing: 0.5px; margin-bottom: 0.5rem;">
            Vai trò tài khoản (Roles)
          </h4>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${(u.roles || []).map(r => `
              <span class="badge ${roleBadgeClass(r)}" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">
                ${roleLabel(r)}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Section 2: Thông tin cá nhân & Hồ sơ liên hệ (Profile Fields) -->
        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500); letter-spacing: 0.5px; margin-bottom: 0.5rem;">
            Thông tin liên hệ & Căn cước (Profile Details)
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; background: var(--slate-50); padding: 1rem; border-radius: 10px; border: 1px solid var(--slate-200);">
            <div>
              <div style="font-size: 0.76rem; color: var(--slate-500);">Địa chỉ Email</div>
              <div style="font-size: 0.9rem; font-weight: 600; color: var(--slate-800); word-break: break-all;">
                ${u.email || 'Chưa cập nhật'}
              </div>
            </div>
            <div>
              <div style="font-size: 0.76rem; color: var(--slate-500);">Số điện thoại liên hệ</div>
              <div style="font-size: 0.9rem; font-weight: 600; color: var(--slate-800);">
                ${u.phone || 'Chưa cập nhật'}
              </div>
            </div>
            <div>
              <div style="font-size: 0.76rem; color: var(--slate-500);">Số CMND / Căn cước công dân</div>
              <div style="font-size: 0.9rem; font-weight: 600; color: var(--slate-800); font-family: monospace;">
                ${u.id_card_number || u.idCardNumber || 'Chưa định danh'}
              </div>
            </div>
            <div>
              <div style="font-size: 0.76rem; color: var(--slate-500);">Địa chỉ thường trú / Nơi ở</div>
              <div style="font-size: 0.9rem; font-weight: 600; color: var(--slate-800);">
                ${u.address || 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Trạng thái phê duyệt & Giấy tờ (Approval Status) -->
        ${isOwner ? `
          <div style="margin-bottom: 1.25rem;">
            <h4 style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500); letter-spacing: 0.5px; margin-bottom: 0.5rem;">
              Hồ sơ Chủ xe & Tài khoản nhận tiền (Owner Approval Status)
            </h4>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                <span style="font-weight: 700; font-size: 0.9rem; color: #166534;">Trạng thái thẩm định Chủ xe:</span>
                ${(owner?.verification_status === 'VERIFIED' || owner?.verificationStatus === 'VERIFIED') ? `
                  <span class="badge badge-success" style="font-size: 0.82rem; padding: 0.3rem 0.7rem;">
                    ✓ Đã phê duyệt hồ sơ chủ xe
                  </span>
                ` : ((owner?.verification_status === 'REJECTED' || owner?.verificationStatus === 'REJECTED') ? `
                  <span class="badge badge-danger" style="font-size: 0.82rem; padding: 0.3rem 0.7rem;">
                    ✗ Bị từ chối phê duyệt
                  </span>
                ` : `
                  <span class="badge badge-warning" style="font-size: 0.82rem; padding: 0.3rem 0.7rem;">
                    ⏳ Đang chờ Admin thẩm định
                  </span>
                `)}
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.84rem;">
                <div>
                  <span style="color: var(--slate-500);">Ngân hàng thụ hưởng:</span>
                  <div style="font-weight: 600; color: var(--slate-800);">${owner?.bank_name || owner?.bankName || 'Chưa khai báo'}</div>
                </div>
                <div>
                  <span style="color: var(--slate-500);">Số tài khoản ngân hàng:</span>
                  <div style="font-weight: 600; color: var(--slate-800); font-family: monospace;">${owner?.bank_account_number || owner?.bankAccountNumber || 'Chưa khai báo'}</div>
                </div>
              </div>

              ${(owner?.rejection_reason || owner?.rejectionReason) ? `
                <div style="margin-top: 0.75rem; padding: 0.6rem 0.85rem; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; font-size: 0.82rem; color: #991b1b;">
                  <strong>Lý do từ chối hồ sơ:</strong> ${owner?.rejection_reason || owner?.rejectionReason}
                </div>
              ` : ''}

              <!-- Thao tác Duyệt / Từ chối dành cho Admin -->
              <div style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed #bbf7d0; display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--slate-600); margin-right: 0.25rem;">Thao tác Quản trị:</span>
                <button class="btn btn-primary btn-sm" onclick="AdminService.approveOwnerAction(${u.user_id || u.userId}, '${u.username}')" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Phê duyệt Chủ xe (Active)
                </button>
                <button class="btn btn-outline btn-sm" onclick="AdminService.rejectOwnerAction(${u.user_id || u.userId}, '${u.username}')" style="color: var(--danger); border-color: var(--danger); display: inline-flex; align-items: center; gap: 0.35rem;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Từ chối hồ sơ (Nhập lý do)
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        ${isRenter ? `
          <div style="margin-bottom: 1.25rem;">
            <h4 style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--slate-500); letter-spacing: 0.5px; margin-bottom: 0.5rem;">
              Hồ sơ Bằng lái xe (Renter License Status)
            </h4>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <span style="font-weight: 700; font-size: 0.9rem; color: #1e40af;">Trạng thái Giấy phép lái xe (GPLX):</span>
                ${(renter?.license_verification_status === 'VERIFIED' || renter?.licenseVerificationStatus === 'VERIFIED') ? `
                  <span class="badge badge-success" style="font-size: 0.82rem; padding: 0.3rem 0.7rem;">
                    ✓ Đã xác minh GPLX hợp lệ
                  </span>
                ` : `
                  <span class="badge badge-warning" style="font-size: 0.82rem; padding: 0.3rem 0.7rem;">
                    ⏳ Đang chờ xác minh GPLX
                  </span>
                `}
              </div>
              <div style="font-size: 0.84rem;">
                <span style="color: var(--slate-500);">Mã số GPLX:</span>
                <strong style="color: var(--slate-800); font-family: monospace; margin-left: 0.3rem;">
                  ${renter?.license_number || renter?.licenseNumber || 'Chưa cung cấp'}
                </strong>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Section 4: Tiêu chí an toàn thông tin (AC2: Zero Sensitive Data Exposed) -->
        <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; background: #f8fafc; border: 1px solid var(--slate-200); border-radius: 8px; font-size: 0.8rem; color: var(--slate-600); margin-bottom: 1.5rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="flex-shrink: 0;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <div>
            <strong>Đảm bảo an toàn thông tin (AC2):</strong> Dữ liệu API trả về tuyệt đối không chứa trường nhạy cảm như mã băm mật khẩu (<code style="background: #f1f5f9; padding: 1px 4px; border-radius: 3px;">password_hash</code>).
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--slate-200); padding-top: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.78rem; color: var(--slate-400);">Nguồn cấp: <strong>${res.source || 'BACKEND_API'}</strong></span>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${(u.status === 'LOCKED' || u.status === 'locked') ? `
              <button class="btn btn-outline btn-sm" onclick="AdminService.unblockUserAction(${u.user_id || u.userId}, '${u.username}')" style="color: #059669; border-color: #059669; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                🔓 Mở khóa tài khoản (Unblock)
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" onclick="AdminService.blockUserAction(${u.user_id || u.userId}, '${u.username}')" style="color: var(--danger); border-color: var(--danger); font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                🔒 Khóa tài khoản (Block)
              </button>
            `}
            <button class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Đóng</button>
          </div>
        </div>
      </div>
    `;
  },

  // Hành động Phê duyệt Chủ xe (Admin Approve Owner - AC2)
  async approveOwnerAction(userId, username) {
    if (!confirm(`Bạn có chắc chắn muốn phê duyệt hồ sơ Chủ xe cho @${username}?\n\nSau khi phê duyệt, tài khoản sẽ chuyển sang Hoạt động (ACTIVE) và chủ xe có thể bắt đầu đăng nhập.`)) {
      return;
    }

    const res = await ApiService.approveOwner(userId, { verification_status: 'verified' });
    if (res && res.success) {
      this.showToast(`Đã phê duyệt hồ sơ Chủ xe @${username} thành công! Tài khoản đã ACTIVE.`, 'success');
      await this.openUserDetailModal(userId);
      this.renderUsersTable();
      this.loadAdminStats();
    } else {
      this.showToast(res?.message || 'Không thể phê duyệt hồ sơ chủ xe', 'error');
    }
  },

  // Hành động Từ chối hồ sơ Chủ xe (Admin Reject Owner - AC3)
  async rejectOwnerAction(userId, username) {
    const reason = prompt(`Nhập lý do từ chối hồ sơ Chủ xe @${username} (Bắt buộc):\n\nVí dụ: Ảnh chụp CCCD không rõ ràng hoặc số tài khoản ngân hàng không chính chủ.`);
    if (reason === null) return; // Người dùng bấm Hủy
    if (!reason.trim()) {
      alert('Lý do từ chối không được để trống!');
      return;
    }

    const res = await ApiService.approveOwner(userId, {
      verification_status: 'rejected',
      rejection_reason: reason.trim()
    });

    if (res && res.success) {
      this.showToast(`Đã từ chối hồ sơ Chủ xe @${username}. Lý do từ chối đã được gửi thông báo tới chủ xe!`, 'warning');
      await this.openUserDetailModal(userId);
      this.renderUsersTable();
      this.loadAdminStats();
    } else {
      this.showToast(res?.message || 'Không thể từ chối hồ sơ chủ xe', 'error');
    }
  },

  // Hành động Khóa tài khoản (Admin Block User - AC1, AC2)
  async blockUserAction(userId, username) {
    const reason = prompt(`Nhập lý do khóa tài khoản @${username} (Tùy chọn):\n\nVí dụ: Vi phạm điều khoản dịch vụ hoặc hành vi xấu.`);
    if (reason === null) return; // Người dùng ấn Hủy

    const res = await ApiService.updateUserStatus(userId, {
      status: 'locked',
      reason: reason.trim() || 'Admin thực hiện khóa tài khoản'
    });

    if (res && res.success) {
      this.showToast(`Đã khóa tài khoản @${username} thành công! Người dùng này không thể đăng nhập nữa.`, 'warning');
      const modal = document.getElementById('generalModalOverlay');
      if (modal && modal.classList.contains('open')) {
        await this.openUserDetailModal(userId);
      }
      this.renderUsersTable();
      this.loadAdminStats();
    } else {
      this.showToast(res?.message || 'Không thể khóa tài khoản', 'error');
    }
  },

  // Hành động Mở khóa tài khoản (Admin Unblock User - AC3)
  async unblockUserAction(userId, username) {
    if (!confirm(`Bạn có chắc chắn muốn mở khóa tài khoản @${username}?\n\nSau khi mở khóa, người dùng sẽ có thể đăng nhập bình thường trở lại.`)) {
      return;
    }

    const res = await ApiService.updateUserStatus(userId, {
      status: 'active'
    });

    if (res && res.success) {
      this.showToast(`Đã mở khóa tài khoản @${username} thành công! Đăng nhập hoạt động trở lại.`, 'success');
      const modal = document.getElementById('generalModalOverlay');
      if (modal && modal.classList.contains('open')) {
        await this.openUserDetailModal(userId);
      }
      this.renderUsersTable();
      this.loadAdminStats();
    } else {
      this.showToast(res?.message || 'Không thể mở khóa tài khoản', 'error');
    }
  }
};
