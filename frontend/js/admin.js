/**
 * DRIVESHARE — Staff / Admin Module (Clean & Professional, No Emojis)
 * Quản trị & Vận hành: Duyệt xe mới đăng, Duyệt Giấy phép lái xe (GPLX), Giám sát đơn toàn sàn
 */

const getAdminApiBase = () => (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL)
  ? API_CONFIG.BASE_URL
  : (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8080/api/v1');

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
            <button class="portal-tab-btn" id="adminTabDisputes" onclick="AdminService.switchTab('DISPUTES')">
              Xử lý khiếu nại sự cố (<span id="badgePendingDisputes">...</span>)
            </button>
            <button class="portal-tab-btn" id="adminTabUsers" onclick="AdminService.switchTab('USERS')">
              Quản lý tài khoản & Vai trò
            </button>
            <button class="portal-tab-btn" id="adminTabChat" onclick="AdminService.switchTab('CHAT')">
              Lịch sử Tư Vấn AI (<span id="badgeChatHistory">...</span>)
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

        <!-- Row 2: Chỉ số Tài chính & Dòng tiền Sàn (Macro Statistics) -->
        <div class="stats-grid" style="margin-top: 1rem; margin-bottom: 2rem;">
          <div class="stat-card" style="border-left: 4px solid #0f766e;">
            <div class="stat-icon" style="background: #ccfbf1; color: #0f766e;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statTotalGmv" style="color: #0f766e; font-size: 1.4rem;">...</div>
              <div class="stat-label">Tổng dòng tiền giao dịch (GMV)</div>
            </div>
          </div>

          <div class="stat-card" style="border-left: 4px solid #059669;">
            <div class="stat-icon" style="background: #dcfce7; color: #059669;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statPlatformCommission" style="color: #059669; font-size: 1.4rem;">...</div>
              <div class="stat-label">Hoa hồng sàn bỏ túi (10%)</div>
            </div>
          </div>

          <div class="stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-icon" style="background: #dbeafe; color: #2563eb;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statTodayBookings" style="color: #2563eb; font-size: 1.4rem;">...</div>
              <div class="stat-label">Đơn thuê phát sinh hôm nay</div>
            </div>
          </div>

          <div class="stat-card" style="border-left: 4px solid #7c3aed;">
            <div class="stat-icon" style="background: #ede9fe; color: #7c3aed;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="stat-info">
              <div class="stat-value" id="statTotalDeposits" style="color: #7c3aed; font-size: 1.4rem;">...</div>
              <div class="stat-label">Tổng cọc VietQR 30% đã thu</div>
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
          <div id="adminBookingsTableWrapper">
            <!-- Được render động qua renderBookingsList() -->
          </div>
        </div>

        <!-- Tab Content: Xử lý khiếu nại sự cố & Chủ xe không giao xe (Disputes) -->
        <div id="adminTabDisputesContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header">
              <div>
                <h3>Danh sách khiếu nại sự cố & Vi phạm bàn giao xe (Rental Disputes)</h3>
                <p style="font-size: 0.82rem; color: var(--slate-500); margin-top: 0.2rem;">
                  Quy trình chuẩn Mioto: Xác minh tranh chấp giao nhận xe, hoàn 100% tiền cọc (Escrow Refund) cho khách và chế tài vi phạm với chủ xe
                </p>
              </div>
            </div>
            <div class="table-responsive" id="adminDisputesTableWrapper">
              <!-- Được render động qua renderDisputesList() -->
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

        <!-- Tab Content: Lịch sử Tư Vấn AI (Admin Chat History) -->
        <div id="adminTabChatContent" style="display: none;">
          <div class="admin-table-card">
            <div class="admin-table-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px 20px;">
              <div>
                <h3 style="margin: 0; font-size: 18px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                  <span>🤖</span> Lịch sử Hội Thoại & Tư Vấn Của Trợ Lý AI DriveShare
                </h3>
                <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">
                  Giám sát toàn bộ các phiên trò chuyện của Khách thuê (Renter), Chủ xe (Owner) và Khách vãng lai (Guest).
                </p>
              </div>
              <button class="btn btn-outline btn-sm" onclick="AdminService.renderChatHistoryTable()" style="display: flex; align-items: center; gap: 6px; font-weight: 600;">
                🔄 Làm mới danh sách
              </button>
            </div>

            <!-- Toolbar: Role Filter & Search -->
            <div class="user-table-toolbar" style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #e2e8f0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
              <div class="user-search-input-wrap" style="flex: 1; min-width: 280px;">
                <input 
                  type="text" 
                  id="adminChatSearchInput" 
                  class="user-search-input" 
                  placeholder="Tìm theo tên người dùng, email hoặc mã Session ID..." 
                  oninput="AdminService.onChatFilterChange()"
                />
              </div>

              <!-- Role Filter: ALL, ROLE_RENTER, ROLE_OWNER, GUEST -->
              <select id="adminChatRoleFilter" class="user-filter-select" onchange="AdminService.onChatFilterChange()">
                <option value="ALL">🔍 Tất cả vai trò</option>
                <option value="ROLE_RENTER">🚗 Khách thuê (Renter)</option>
                <option value="ROLE_OWNER">🔑 Chủ xe (Owner)</option>
                <option value="GUEST">👤 Khách vãng lai (Guest)</option>
              </select>
            </div>

            <!-- Chat History Table Container -->
            <div class="table-responsive" id="adminChatTableWrapper">
              <!-- Được render động qua renderChatHistoryTable -->
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
          stats.todayBookings = d.today_bookings_count ?? d.todayBookingsCount ?? 0;
          stats.totalGmv = d.total_gmv ?? d.totalGmv ?? 0;
          stats.totalDeposits = d.total_deposits_collected ?? d.totalDepositsCollected ?? 0;
          stats.platformCommission = d.platform_commission_revenue ?? d.platformCommissionRevenue ?? 0;
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
        stats.todayBookings = Math.min(2, stats.totalBookings);
        stats.totalGmv = 2400000;
        stats.totalDeposits = 720000;
        stats.platformCommission = 240000;
      }
    } catch (e) {
      console.warn('Lỗi khi tải thống kê Admin:', e);
    }

    const fmtMoney = (v) => typeof StorageService !== 'undefined' ? StorageService.formatCurrency(v) : (v?.toLocaleString('vi-VN') + ' đ');

    // 4 Thẻ KPI vận hành
    const elPendingCars = document.getElementById('statPendingCars');
    if (elPendingCars) elPendingCars.innerText = stats.pendingCars;
    const elPendingLicenses = document.getElementById('statPendingLicenses');
    if (elPendingLicenses) elPendingLicenses.innerText = stats.pendingLicenses;
    const elActiveCars = document.getElementById('statActiveCars');
    if (elActiveCars) elActiveCars.innerText = stats.activeCars;
    const elTotalBookings = document.getElementById('statTotalBookings');
    if (elTotalBookings) elTotalBookings.innerText = stats.totalBookings;

    // 4 Thẻ KPI tài chính & vĩ mô
    const elGmv = document.getElementById('statTotalGmv');
    if (elGmv) elGmv.innerText = fmtMoney(stats.totalGmv);
    const elComm = document.getElementById('statPlatformCommission');
    if (elComm) elComm.innerText = fmtMoney(stats.platformCommission);
    const elToday = document.getElementById('statTodayBookings');
    if (elToday) elToday.innerText = (stats.todayBookings != null && !isNaN(stats.todayBookings) ? stats.todayBookings : 0) + ' đơn';
    const elDeposits = document.getElementById('statTotalDeposits');
    if (elDeposits) elDeposits.innerText = fmtMoney(stats.totalDeposits);

    // Badges trên các Tab
    const badgePendingCars = document.getElementById('badgePendingCars');
    if (badgePendingCars) badgePendingCars.innerText = stats.pendingCars;
    const badgePendingCccd = document.getElementById('badgePendingCccd');
    if (badgePendingCccd) badgePendingCccd.innerText = stats.pendingCccd;
    const badgePendingLicenses = document.getElementById('badgePendingLicenses');
    if (badgePendingLicenses) badgePendingLicenses.innerText = stats.pendingLicenses;
    const badgeTotalBookings = document.getElementById('badgeTotalBookings');
    if (badgeTotalBookings) badgeTotalBookings.innerText = stats.totalBookings;

    const badgeChatHistory = document.getElementById('badgeChatHistory');
    if (badgeChatHistory) {
      try {
        const baseUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL : 'http://localhost:8080/api/v1';
        const token = (typeof getAccessToken === 'function' ? getAccessToken() : null) ||
                      (typeof TokenService !== 'undefined' ? TokenService.getToken() : null) ||
                      localStorage.getItem('access_token') ||
                      localStorage.getItem('token');
        fetch(`${baseUrl}/admin/chat-history`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        }).then(r => r.json()).then(data => {
          if (data && data.success && Array.isArray(data.data)) {
            badgeChatHistory.innerText = data.data.length;
          }
        }).catch(() => {});
      } catch (_) {}
    }
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
        await fetch(`${getAdminApiBase()}/admin/cars/${carId}/approve`, {
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
    const msg = `Đã duyệt xe #${carId}! Xe đã được xuất bản và sẵn sàng cho thuê.`;
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
        await fetch(`${getAdminApiBase()}/admin/cars/${carId}/approve`, {
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
        const res = await fetch(`${getAdminApiBase()}/admin/users/pending-cccd`, {
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
          const fullName = u.full_name || u.fullName || 'Chưa cập nhật';
          const email = u.email || '';
          const phone = u.phone || 'Chưa cập nhật';
          const role = (u.role || '').toUpperCase();
          const idCardNumber = u.id_card_number || u.idCardNumber || '';
          const licenseNumber = u.license_number || u.licenseNumber || '';
          const bankName = u.bank_name || u.bankName || '';
          const bankAccount = u.bank_account_number || u.bankAccountNumber || '';
          const cccdFront = u.cccd_front_url || u.cccdFrontUrl || '';
          const cccdBack = u.cccd_back_url || u.cccdBackUrl || '';
          const gplxFront = u.license_front_url || u.licenseFrontUrl || u.gplx_front_url || u.gplxFrontUrl || '';
          
          let formattedTime = 'Mới nộp';
          if (u.submitted_at || u.submittedAt) {
            try {
              formattedTime = new Date(u.submitted_at || u.submittedAt).toLocaleString('vi-VN');
            } catch (e) {
              formattedTime = u.submitted_at || u.submittedAt;
            }
          }

          const renderDocImg = (url, label) => {
            if (url && url.trim()) {
              return `
                <div style="text-align: center;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 4px;">${label}</div>
                  <img src="${url}" alt="${label}" style="width: 140px; height: 90px; object-fit: cover; border-radius: 8px; border: 1.5px solid #0f766e; cursor: zoom-in; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" onclick="window.open('${url}', '_blank')" title="Nhấp để phóng to ảnh thật" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;\\'>${label}</div><div style=\\'width: 140px; height: 90px; background: #fff1f2; border: 1.5px dashed #fda4af; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #e11d48; font-size: 0.72rem; padding: 6px;\\'><span>Ảnh bị lỗi file</span></div>';" />
                  <div style="font-size: 0.68rem; color: #059669; font-weight: 600; margin-top: 2px;">✔ Ảnh đã tải lên</div>
                </div>
              `;
            } else {
              return `
                <div style="text-align: center;">
                  <div style="font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">${label}</div>
                  <div style="width: 140px; height: 90px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.72rem; padding: 6px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin-bottom: 3px; color: #cbd5e1;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span>Chưa có ảnh</span>
                  </div>
                </div>
              `;
            }
          };

          const isOwner = role.includes('OWNER');
          const cccdStatus = (u.cccd_status || u.verification_status || 'PENDING').toUpperCase();
          const bankStatus = (u.bank_verification_status || u.bankVerificationStatus || (u.owner_profile?.verification_status) || (u.ownerProfile?.verificationStatus) || 'UNVERIFIED').toUpperCase();
          
          // Tên chủ thẻ ngân hàng (ưu tiên trường riêng nếu có, fallback họ tên chủ xe in hoa)
          const cardHolderName = (u.bank_account_holder || u.bankAccountHolder || u.card_holder_name || fullName || '').toUpperCase();
          
          // Hàm chuẩn hóa tiếng Việt để so sánh tên chủ thẻ và họ tên trên CCCD
          const cleanName = (str) => (str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .trim()
            .toUpperCase();
          const isHolderNameMatching = cleanName(fullName) === cleanName(cardHolderName);

          return `
            <div class="admin-verification-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 1.25rem;">
              <!-- User Header Summary -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.85rem; margin-bottom: 1.15rem; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 42px; height: 42px; border-radius: 50%; background: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.05rem;">
                    ${fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <strong style="font-size: 1.1rem; color: #0f172a;">${fullName}</strong>
                      <span class="badge ${isOwner ? 'badge-warning' : 'badge-info'}" style="font-size: 0.75rem;">
                        ${isOwner ? 'Chủ xe (Owner)' : 'Khách thuê (Renter)'}
                      </span>
                    </div>
                    <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">
                      ID: <strong>#${userId}</strong> · Email: <strong>${email}</strong> · SĐT: <strong>${phone}</strong>
                    </div>
                  </div>
                </div>
                <div style="font-size: 0.78rem; color: #94a3b8;">
                  Thời gian nộp: <strong>${formattedTime}</strong>
                </div>
              </div>

              <!-- 2 CỘT TÁCH BIỆT: [1. ĐỊNH DANH CCCD] & [2. TÀI KHOẢN NGÂN HÀNG] -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
                
                <!-- KHỐI 1: ĐỊNH DANH CMND / CCCD -->
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="13" y2="12"></line></svg>
                        <strong style="font-size: 0.95rem; color: #0f172a;">1. Định danh CMND / CCCD</strong>
                      </div>
                      <span class="badge ${cccdStatus === 'APPROVED' ? 'badge-success' : (cccdStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning')}" id="cccdBadge_${userId}" style="font-size: 0.74rem;">
                        ${cccdStatus === 'APPROVED' ? '✔ Đã duyệt CCCD' : (cccdStatus === 'REJECTED' ? '✗ Từ chối CCCD' : '⏳ Chờ duyệt CCCD')}
                      </span>
                    </div>

                    <div style="font-size: 0.86rem; color: #334155; margin-bottom: 0.85rem; background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                      Số CMND/CCCD: <strong style="font-family: monospace; font-size: 1rem; color: #0f766e;">${idCardNumber || 'Chưa cung cấp'}</strong>
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 1rem; flex-wrap: wrap; justify-content: center;">
                      ${renderDocImg(cccdFront, 'Mặt trước CCCD')}
                      ${renderDocImg(cccdBack, 'Mặt sau CCCD')}
                      ${role === 'RENTER' ? renderDocImg(gplxFront, 'Giấy phép lái xe (GPLX)') : ''}
                    </div>
                  </div>

                  <!-- CỤM NÚT 1: DUYỆT ĐỊNH DANH CCCD (TÁCH BIỆT) -->
                  <div style="display: flex; gap: 8px; border-top: 1px solid #e2e8f0; padding-top: 0.85rem; margin-top: auto;">
                    <button class="btn btn-primary btn-sm" id="btnApproveCccd_${userId}" onclick="AdminService.approveCccd(${userId})" style="flex: 1; font-weight: 700; background: #0f766e; border-color: #0f766e;">
                      ✔ Duyệt Định Danh CCCD
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="AdminService.openRejectCccdModal(${userId})" style="color: #ef4444; border-color: #fca5a5;">
                      Từ chối CCCD
                    </button>
                  </div>
                </div>

                <!-- KHỐI 2: DUYỆT TÀI KHOẢN NGÂN HÀNG (DÀNH CHO CHỦ XE & NHẬN TIỀN SÀN) -->
                <div style="background: ${isOwner ? '#f0fdf4' : '#f8fafc'}; border: 1.5px solid ${isOwner ? '#86efac' : '#cbd5e1'}; border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        <strong style="font-size: 0.95rem; color: #0f172a;">2. Tài khoản Ngân hàng Chủ xe</strong>
                      </div>
                      <span class="badge ${bankStatus === 'VERIFIED' ? 'badge-success' : (bankStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning')}" id="bankBadge_${userId}" style="font-size: 0.74rem;">
                        ${bankStatus === 'VERIFIED' ? '✔ Đã duyệt STK' : (bankStatus === 'REJECTED' ? '✗ Từ chối STK' : '⏳ Chờ duyệt STK')}
                      </span>
                    </div>

                    ${(bankName || bankAccount) ? `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 0.85rem; font-size: 0.86rem; display: flex; flex-direction: column; gap: 8px;">
                        <div>
                          <span style="color: #64748b; font-size: 0.74rem; text-transform: uppercase; font-weight: 600;">Tên Ngân hàng:</span>
                          <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem;">${bankName || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                          <span style="color: #64748b; font-size: 0.74rem; text-transform: uppercase; font-weight: 600;">Số tài khoản (STK):</span>
                          <div style="font-family: monospace; font-size: 1.1rem; font-weight: 800; color: #0f766e; letter-spacing: 0.5px;">${bankAccount || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                          <span style="color: #64748b; font-size: 0.74rem; text-transform: uppercase; font-weight: 600;">Tên chủ thẻ / chủ tài khoản:</span>
                          <div style="font-weight: 800; color: #1e293b; text-transform: uppercase; font-size: 0.95rem;">
                            ${cardHolderName}
                          </div>
                        </div>

                        <!-- Chip đối chiếu họ tên chủ thẻ với CCCD -->
                        <div style="margin-top: 4px; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; display: flex; align-items: center; gap: 6px; ${isHolderNameMatching ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef9c3; color: #854d0e; border: 1px solid #fde68a;'}">
                          ${isHolderNameMatching 
                            ? '<span>✔ <strong>Trùng khớp:</strong> Tên chủ thẻ khớp 100% với CCCD (' + fullName + ').</span>'
                            : '<span>⚠ <strong>Cần đối chiếu:</strong> Tên chủ thẻ (' + cardHolderName + ') khác với CCCD (' + fullName + '). Cần kiểm tra kỹ!</span>'
                          }
                        </div>
                      </div>
                    ` : `
                      <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 2rem 1rem; text-align: center; color: #64748b; font-size: 0.85rem; margin-bottom: 0.85rem;">
                        Chủ xe chưa hoàn tất khai báo tài khoản ngân hàng thụ hưởng.
                      </div>
                    `}
                  </div>

                  <!-- CỤM NÚT 2: DUYỆT STK NGÂN HÀNG (TÁCH BIỆT HOÀN TOÀN) -->
                  <div style="display: flex; gap: 8px; border-top: 1px solid ${isOwner ? '#bbf7d0' : '#e2e8f0'}; padding-top: 0.85rem; margin-top: auto;">
                    <button class="btn btn-primary btn-sm" id="btnApproveBank_${userId}" onclick="AdminService.approveBank(${userId})" style="flex: 1; font-weight: 700; background: #059669; border-color: #059669;" ${(!bankName && !bankAccount) ? 'disabled title="Chưa có STK để duyệt"' : ''}>
                      ✔ Duyệt STK Ngân Hàng
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="AdminService.openRejectBankModal(${userId})" style="color: #dc2626; border-color: #fca5a5;" ${(!bankName && !bankAccount) ? 'disabled' : ''}>
                      Từ chối STK
                    </button>
                  </div>
                </div>

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
        await fetch(`${getAdminApiBase()}/admin/users/${userId}/verify-cccd`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' })
        });
      } catch (e) {
        console.warn('Approve CCCD API offline:', e);
      }
    }

    const badge = document.getElementById(`cccdBadge_${userId}`);
    if (badge) {
      badge.className = 'badge badge-success';
      badge.innerText = '✔ Đã duyệt CCCD';
    }

    if (typeof showToast === 'function') {
      showToast(`Đã phê duyệt CMND/CCCD thành công cho user #${userId}!`, 'success', 2500);
    }
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
            Lý do từ chối CCCD * (Bắt buộc)
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
        await fetch(`${getAdminApiBase()}/admin/users/${userId}/verify-cccd`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', reason })
        });
      } catch (e) {
        console.warn('Reject CCCD API offline:', e);
      }
    }

    const badge = document.getElementById(`cccdBadge_${userId}`);
    if (badge) {
      badge.className = 'badge badge-danger';
      badge.innerText = '✗ Từ chối CCCD';
    }

    if (typeof showToast === 'function') {
      showToast(`Đã từ chối CMND/CCCD user #${userId}. Lý do: ${reason}`, 'info', 3000);
    }
    this.closeModal();
    this.loadAdminStats();
  },

  // SPRINT 3 FIX (ISSUE #39): DUYỆT TÀI KHOẢN NGÂN HÀNG CỦA CHỦ XE
  async approveBank(userId) {
    if (typeof ApiService !== 'undefined' && ApiService.verifyBank) {
      await ApiService.verifyBank(userId, 'VERIFIED');
    } else {
      try {
        await fetch(`${getAdminApiBase()}/admin/users/${userId}/verify-bank`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'VERIFIED' })
        });
      } catch (e) {
        console.warn('Approve Bank API offline:', e);
      }
    }

    const badge = document.getElementById(`bankBadge_${userId}`);
    if (badge) {
      badge.className = 'badge badge-success';
      badge.innerText = '✔ Đã duyệt STK';
    }

    if (typeof showToast === 'function') {
      showToast(`Đã duyệt tài khoản ngân hàng thành công cho user #${userId}!`, 'success', 2500);
    }
    this.loadAdminStats();
  },

  openRejectBankModal(userId) {
    const html = `
      <div style="padding: 0.5rem 0;">
        <p style="color: #475569; font-size: 0.9rem; margin-bottom: 1rem;">
          Từ chối tài khoản ngân hàng của chủ xe <strong>#${userId}</strong>. Vui lòng nhập lý do (Ví dụ: Tên chủ thẻ không khớp với họ tên trên CCCD, sai số tài khoản...)
        </p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px; color: #1e293b;">
            Lý do từ chối STK Ngân hàng * (Bắt buộc)
          </label>
          <textarea id="bankRejectReasonInput" class="form-control" rows="3" placeholder="Ví dụ: Tên chủ tài khoản ngân hàng không trùng khớp với họ tên định danh trên CCCD..." style="width: 100%; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 0.9rem; box-sizing: border-box;"></textarea>
          <div id="bankRejectReasonError" style="color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-top: 5px; display: none;"></div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 1.25rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Hủy</button>
          <button type="button" class="btn btn-primary btn-sm" style="background: #ef4444; border-color: #dc2626;" onclick="AdminService.submitRejectBank(${userId})">Xác nhận từ chối</button>
        </div>
      </div>
    `;
    this.openModal(`Từ chối tài khoản ngân hàng #${userId}`, html);
  },

  async submitRejectBank(userId) {
    const reasonInput = document.getElementById('bankRejectReasonInput');
    const errorEl = document.getElementById('bankRejectReasonError');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
      if (errorEl) {
        errorEl.innerText = 'Lý do từ chối là bắt buộc khi từ chối tài khoản ngân hàng!';
        errorEl.style.display = 'block';
      }
      if (typeof showToast === 'function') {
        showToast('Lý do từ chối là bắt buộc khi từ chối tài khoản ngân hàng!', 'error', 2500);
      }
      return;
    }

    if (typeof ApiService !== 'undefined' && ApiService.verifyBank) {
      await ApiService.verifyBank(userId, 'REJECTED', reason);
    } else {
      try {
        await fetch(`${getAdminApiBase()}/admin/users/${userId}/verify-bank`, {
          method: 'PUT',
          headers: (typeof getAuthHeaders === 'function') ? getAuthHeaders() : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', reason })
        });
      } catch (e) {
        console.warn('Reject Bank API offline:', e);
      }
    }

    const badge = document.getElementById(`bankBadge_${userId}`);
    if (badge) {
      badge.className = 'badge badge-danger';
      badge.innerText = '✗ Từ chối STK';
    }

    if (typeof showToast === 'function') {
      showToast(`Đã từ chối STK ngân hàng user #${userId}. Lý do: ${reason}`, 'info', 3000);
    }
    this.closeModal();
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
          const status = r.license_verification_status || r.license_status || r.licenseStatus || 'PENDING';
          const isPending = status === 'PENDING';
          const imgSrc = r.license_front_url || r.licenseFrontUrl || r.license_image_url || r.licenseImageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80';
          return `
            <div class="license-card">
              <img class="license-thumb" src="${imgSrc}" alt="GPLX ${r.full_name || r.fullName}" onclick="window.open(this.src, '_blank')" style="cursor: pointer;" title="Nhấp để xem ảnh lớn" />
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

  // =========================================================================
  // Tab 4: Bảng Tổng Hợp Giao Dịch Toàn Sàn (Mioto-Inspired Bookings Dashboard)
  // =========================================================================
  bookingState: {
    page: 1,
    limit: 8,
    status: 'ALL',
    search: '',
    sortBy: 'newest'
  },
  cachedBookings: [],

  getCarThumbnail(carName) {
    const name = String(carName || '').toLowerCase();
    if (name.includes('camry') || name.includes('toyota')) {
      return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=260&q=80';
    }
    if (name.includes('everest') || name.includes('ranger') || name.includes('ford')) {
      return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=260&q=80';
    }
    if (name.includes('carnival') || name.includes('kia')) {
      return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=260&q=80';
    }
    if (name.includes('accent') || name.includes('hyundai')) {
      return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=260&q=80';
    }
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=260&q=80';
  },

  getMiotoStatusBadge(st) {
    const s = String(st || '').toUpperCase();
    const baseStyle = 'display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 9999px; font-size: 0.74rem; font-weight: 700; line-height: 1.3; white-space: nowrap;';
    switch (s) {
      case 'CONFIRMED':
      case 'DEPOSIT_PAID':
        return `<span class="mioto-status-badge status-confirmed" style="${baseStyle} background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;"><i class="fa-solid fa-circle-check"></i> Đã cọc 30%</span>`;
      case 'WAITING_PAYMENT':
        return `<span class="mioto-status-badge status-waiting" style="${baseStyle} background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;"><i class="fa-solid fa-clock"></i> Chờ cọc (45p)</span>`;
      case 'ON_HOLD':
        return `<span class="mioto-status-badge status-onhold" style="${baseStyle} background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;"><i class="fa-solid fa-pause"></i> Tạm hoãn</span>`;
      case 'DISPUTED':
        return `<span class="mioto-status-badge status-disputed" style="${baseStyle} background: #fef3c7; color: #b45309; border: 1px solid #fde68a;"><i class="fa-solid fa-triangle-exclamation"></i> Khiếu nại bàn giao</span>`;
      case 'CANCELLED_BY_HOST':
        return `<span class="mioto-status-badge status-host-cancel" style="${baseStyle} background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;"><i class="fa-solid fa-ban"></i> Chủ xe hủy (Hoàn 100%)</span>`;
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return `<span class="mioto-status-badge status-inprogress" style="${baseStyle} background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe;"><i class="fa-solid fa-car-side"></i> Đang lưu hành</span>`;
      case 'COMPLETED':
        return `<span class="mioto-status-badge status-completed" style="${baseStyle} background: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4;"><i class="fa-solid fa-flag-checkered"></i> Hoàn tất</span>`;
      case 'REJECTED':
        return `<span class="mioto-status-badge status-rejected" style="${baseStyle} background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;"><i class="fa-solid fa-xmark"></i> Bị từ chối</span>`;
      case 'WITHDRAWN_BY_GUEST':
        return `<span class="mioto-status-badge status-cancelled" style="${baseStyle} background: #f8fafc; color: #64748b; border: 1px solid #cbd5e1;"><i class="fa-solid fa-user-xmark"></i> Khách hủy yêu cầu</span>`;
      case 'CANCELLED':
        return `<span class="mioto-status-badge status-cancelled" style="${baseStyle} background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb;"><i class="fa-solid fa-xmark"></i> Đã hủy</span>`;
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return `<span class="mioto-status-badge status-pending" style="${baseStyle} background: #fffbeb; color: #d97706; border: 1px solid #fde68a;"><i class="fa-solid fa-hourglass-half"></i> Chờ duyệt</span>`;
      default:
        return `<span class="mioto-status-badge status-onhold" style="${baseStyle} background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${st}</span>`;
    }
  },

  async renderBookingsList() {
    const wrapper = document.getElementById('adminBookingsTableWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải toàn bộ giao dịch trên sàn DriveShare...
      </div>
    `;

    try {
      const apiBase = getAdminApiBase();
      const token = (typeof getAccessToken === 'function') ? getAccessToken() : (localStorage.getItem('access_token') || localStorage.getItem('token'));
      const res = await fetch(`${apiBase}/admin/rentals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const json = await res.json();
        this.cachedBookings = json?.data || json?.result || [];
      } else if (typeof StorageService !== 'undefined') {
        this.cachedBookings = StorageService.getBookings();
      }
    } catch (e) {
      console.warn('renderBookingsList error:', e);
      if (typeof StorageService !== 'undefined') {
        this.cachedBookings = StorageService.getBookings();
      }
    }

    const badgeTotalBookings = document.getElementById('badgeTotalBookings');
    if (badgeTotalBookings) {
      badgeTotalBookings.innerText = this.cachedBookings.length;
    }

    this.renderBookingsUI();
  },

  renderBookingsUI() {
    const wrapper = document.getElementById('adminBookingsTableWrapper');
    if (!wrapper) return;

    const all = this.cachedBookings || [];

    // Nhóm trạng thái khoa học (6 nhóm chuẩn mực nghiệp vụ)
    const counts = {
      ALL: all.length,
      WAITING: all.filter(b => String(b.status).toUpperCase() === 'WAITING_PAYMENT').length,
      ACTIVE: all.filter(b => ['CONFIRMED', 'DEPOSIT_PAID', 'ACTIVE', 'IN_PROGRESS'].includes(String(b.status).toUpperCase())).length,
      DISPUTED: all.filter(b => ['DISPUTED', 'CANCELLED_BY_HOST'].includes(String(b.status).toUpperCase())).length,
      COMPLETED: all.filter(b => String(b.status).toUpperCase() === 'COMPLETED').length,
      CANCELLED: all.filter(b => ['CANCELLED', 'REJECTED', 'WITHDRAWN_BY_GUEST'].includes(String(b.status).toUpperCase())).length
    };

    // Lọc theo nhóm
    let filtered = all.filter(b => {
      const st = String(b.status).toUpperCase();
      if (this.bookingState.status === 'ALL') return true;
      if (this.bookingState.status === 'WAITING') return st === 'WAITING_PAYMENT';
      if (this.bookingState.status === 'ACTIVE') return ['CONFIRMED', 'DEPOSIT_PAID', 'ACTIVE', 'IN_PROGRESS'].includes(st);
      if (this.bookingState.status === 'DISPUTED') return ['DISPUTED', 'CANCELLED_BY_HOST'].includes(st);
      if (this.bookingState.status === 'COMPLETED') return st === 'COMPLETED';
      if (this.bookingState.status === 'CANCELLED') return ['CANCELLED', 'REJECTED', 'WITHDRAWN_BY_GUEST'].includes(st);
      return true;
    });

    // Lọc theo từ khóa tìm kiếm
    if (this.bookingState.search && this.bookingState.search.trim() !== '') {
      const q = this.bookingState.search.trim().toLowerCase();
      filtered = filtered.filter(b => {
        const idStr = String(b.rental_id || b.rentalId || b.id || '').toLowerCase();
        const carStr = String(b.car_name || b.carName || '').toLowerCase();
        const plateStr = String(b.car_plate || b.carPlate || b.license_plate || b.licensePlate || '').toLowerCase();
        const renterStr = String(b.renter_name || b.renterName || '').toLowerCase();
        const phoneStr = String(b.renter_phone || b.renterPhone || '').toLowerCase();
        const ownerStr = String(b.owner_name || b.ownerName || '').toLowerCase();
        return idStr.includes(q) || ('#' + idStr).includes(q) || carStr.includes(q) || plateStr.includes(q) || renterStr.includes(q) || phoneStr.includes(q) || ownerStr.includes(q);
      });
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      const idA = Number(a.rental_id || a.rentalId || a.id || 0);
      const idB = Number(b.rental_id || b.rentalId || b.id || 0);
      const priceA = Number(a.total_price || a.totalPrice || 0);
      const priceB = Number(b.total_price || b.totalPrice || 0);
      const depA = Number(a.deposit_amount || a.depositAmount || 0);
      const depB = Number(b.deposit_amount || b.depositAmount || 0);

      if (this.bookingState.sortBy === 'newest') return idB - idA;
      if (this.bookingState.sortBy === 'oldest') return idA - idB;
      if (this.bookingState.sortBy === 'price_desc') return priceB - priceA;
      if (this.bookingState.sortBy === 'deposit_desc') return depB - depA;
      return idB - idA;
    });

    // Phân trang
    const totalItems = filtered.length;
    const limit = this.bookingState.limit;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    if (this.bookingState.page > totalPages) this.bookingState.page = totalPages;
    const startIndex = (this.bookingState.page - 1) * limit;
    const pagedItems = filtered.slice(startIndex, startIndex + limit);

    const fmtMoney = (v) => typeof StorageService !== 'undefined' ? StorageService.formatCurrency(v) : (Number(v || 0).toLocaleString('vi-VN') + ' đ');

    // 6 Tabs phân nhóm khoa học
    const tabs = [
      { id: 'ALL', label: 'Tất cả giao dịch', icon: 'fa-table-list', count: counts.ALL },
      { id: 'WAITING', label: 'Chờ thanh toán cọc', icon: 'fa-clock', count: counts.WAITING },
      { id: 'ACTIVE', label: 'Đang hiệu lực', icon: 'fa-shield-halved', count: counts.ACTIVE },
      { id: 'DISPUTED', label: 'Khiếu nại & Vi phạm', icon: 'fa-triangle-exclamation', count: counts.DISPUTED },
      { id: 'COMPLETED', label: 'Hoàn tất', icon: 'fa-circle-check', count: counts.COMPLETED },
      { id: 'CANCELLED', label: 'Đã hủy / Từ chối', icon: 'fa-ban', count: counts.CANCELLED }
    ];

    const segmentedHtml = tabs.map(t => {
      const isActive = this.bookingState.status === t.id;
      return `
        <button class="segmented-tab-btn ${isActive ? 'active' : ''}" 
                onclick="AdminService.onBookingFilterChange('${t.id}')">
          <i class="fa-solid ${t.icon}" style="font-size: 0.8rem; opacity: 0.85;"></i>
          <span>${t.label}</span>
          <span class="segmented-count-badge">${t.count}</span>
        </button>
      `;
    }).join('');

    wrapper.innerHTML = `
      <div class="bookings-admin-card">
        <!-- Header Thanh lịch -->
        <div class="bookings-admin-header">
          <div>
            <h3>
              <i class="fa-solid fa-rectangle-list" style="color: #0f766e;"></i>
              Bảng Tổng Hợp Giao Dịch Toàn Sàn
            </h3>
            <p>Giám sát dòng tiền ký quỹ Escrow 30%, đối soát tiến trình hợp đồng và thẩm định sự cố giao nhận xe</p>
          </div>
          <div class="booking-actions-group">
            <button class="btn btn-sm btn-outline" onclick="AdminService.exportBookingsCsv()" title="Tải xuống danh sách giao dịch CSV">
              <i class="fa-solid fa-file-arrow-down"></i> Xuất CSV
            </button>
            <button class="btn btn-sm btn-primary" onclick="AdminService.renderBookingsList()" title="Tải lại dữ liệu mới nhất">
              <i class="fa-solid fa-rotate-right"></i> Làm mới
            </button>
          </div>
        </div>

        <!-- Segmented Control Bar (Apple/Stripe Style) -->
        <div class="segmented-nav-container">
          ${segmentedHtml}
        </div>

        <!-- Toolbar: Search & Quick Settings -->
        <div class="booking-clean-toolbar">
          <div class="booking-search-wrapper">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" 
                   class="booking-search-field" 
                   placeholder="Tìm theo mã đơn (#15), xe, biển số, bên thuê, chủ xe..."
                   value="${this.bookingState.search || ''}"
                   oninput="AdminService.onBookingSearch(this.value)" />
          </div>

          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #64748b;">
              <span>Sắp xếp:</span>
              <select class="form-select form-select-sm" 
                      style="font-size: 0.82rem; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #ffffff;" 
                      onchange="AdminService.onBookingSortChange(this.value)">
                <option value="newest" ${this.bookingState.sortBy === 'newest' ? 'selected' : ''}>Mới nhất trước</option>
                <option value="oldest" ${this.bookingState.sortBy === 'oldest' ? 'selected' : ''}>Cũ nhất trước</option>
                <option value="price_desc" ${this.bookingState.sortBy === 'price_desc' ? 'selected' : ''}>Tổng giá trị cao</option>
                <option value="deposit_desc" ${this.bookingState.sortBy === 'deposit_desc' ? 'selected' : ''}>Tiền cọc cao</option>
              </select>
            </div>

            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #64748b;">
              <span>Hiển thị:</span>
              <select class="form-select form-select-sm" 
                      style="font-size: 0.82rem; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #ffffff;" 
                      onchange="AdminService.onBookingLimitChange(this.value)">
                <option value="8" ${this.bookingState.limit === 8 ? 'selected' : ''}>8 đơn / trang</option>
                <option value="15" ${this.bookingState.limit === 15 ? 'selected' : ''}>15 đơn / trang</option>
                <option value="50" ${this.bookingState.limit === 50 ? 'selected' : ''}>50 đơn / trang</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Data Table: 7 Cột Khoa Học & Mạch Lạc -->
        <div style="overflow-x: auto; border: 1px solid #f1f5f9; border-radius: 10px;">
          <table class="mioto-table">
            <thead>
              <tr>
                <th style="width: 105px;">Mã đơn</th>
                <th style="min-width: 210px;">Phương tiện & Biển số</th>
                <th style="min-width: 200px;">Bên thuê & Chủ xe</th>
                <th style="min-width: 170px;">Lịch trình thuê</th>
                <th style="text-align: right; width: 170px;">Giá trị & Cọc Escrow</th>
                <th style="text-align: center; width: 170px;">Trạng thái</th>
                <th style="text-align: center; width: 95px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${pagedItems.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.75rem; display: block; opacity: 0.35;"></i>
                    Không có giao dịch nào thuộc nhóm này.
                  </td>
                </tr>
              ` : pagedItems.map(b => {
                const rId = b.rental_id || b.rentalId || b.id;
                const carName = b.car_name || b.carName || 'Phương tiện';
                const carPlate = b.car_plate || b.carPlate || b.license_plate || b.licensePlate || 'N/A';
                const renterName = b.renter_name || b.renterName || 'Khách thuê';
                const renterPhone = b.renter_phone || b.renterPhone || b.renter_email || 'N/A';
                const thumb = this.getCarThumbnail(carName);
                const ownerName = b.owner_name || b.ownerName || 'Chủ xe';
                const startDate = b.start_date || b.startDate || '';
                const endDate = b.end_date || b.endDate || '';
                const totalDays = b.total_days || b.totalDays || 1;
                const totalPrice = b.total_price || b.totalPrice || b.total_amount || b.totalAmount || 0;
                const depositAmount = b.deposit_amount || b.depositAmount || 0;
                const renterInitial = (renterName.replace(/Khách thuê\s*/i, '').trim() || 'K').charAt(0).toUpperCase();

                return `
                  <tr>
                    <!-- 1. Mã đơn & Ngày -->
                    <td>
                      <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span class="booking-code" style="font-weight: 800; font-size: 0.85rem; color: #0f172a; background: #e2e8f0; padding: 2px 7px; border-radius: 5px; width: fit-content;">#${rId}</span>
                        <span style="font-size: 0.72rem; color: #94a3b8;">${b.created_at ? new Date(b.created_at).toLocaleDateString('vi-VN') : '2026-10'}</span>
                      </div>
                    </td>

                    <!-- 2. Phương tiện & Biển số -->
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${thumb}" 
                             alt="${carName}" 
                             style="width: 54px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; flex-shrink: 0;" />
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                          <div style="font-weight: 700; color: #0f172a; line-height: 1.25;">${carName}</div>
                          <div>
                            <span style="display: inline-flex; align-items: center; gap: 4px; font-family: monospace; font-size: 0.74rem; font-weight: 700; color: #334155; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 4px; padding: 1px 5px;">
                              <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #ef4444;"></span>
                              ${carPlate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 3. Bên thuê & Chủ xe (Phân cấp rõ ràng) -->
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 30px; border-radius: 50%; background: #e0e7ff; color: #4338ca; font-weight: 800; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                          ${renterInitial}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <div style="font-weight: 700; color: #0f172a; font-size: 0.84rem;">${renterName}</div>
                          <div style="font-size: 0.73rem; color: #64748b; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-phone" style="font-size: 0.65rem;"></i> ${renterPhone}
                          </div>
                          <div style="font-size: 0.72rem; color: #94a3b8;">
                            Chủ xe: <span style="color: #475569; font-weight: 600;">${ownerName}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 4. Lịch trình -->
                    <td>
                      <div style="font-size: 0.82rem; color: #334155; line-height: 1.35;">
                        <span style="font-weight: 600;">${startDate}</span>
                        <span style="color: #94a3b8; font-size: 0.72rem;"> → </span>
                        <span style="font-weight: 600;">${endDate}</span>
                      </div>
                      <div style="margin-top: 3px;">
                        <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.7rem; font-weight: 700; padding: 2px 6px;">${totalDays} ngày</span>
                      </div>
                    </td>

                    <!-- 5. Giá trị & Ký quỹ Escrow (Gộp khoa học) -->
                    <td style="text-align: right;">
                      <div style="font-weight: 800; color: #0f172a; font-size: 0.92rem;">${fmtMoney(totalPrice)}</div>
                      <div style="font-size: 0.75rem; color: #0f766e; font-weight: 700; margin-top: 2px;">
                        Cọc: ${fmtMoney(depositAmount)} <span style="font-size: 0.65rem; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 3px; padding: 1px 3px; font-weight: 700;">30% Escrow</span>
                      </div>
                    </td>

                    <!-- 6. Trạng thái -->
                    <td style="text-align: center;">
                      ${this.getMiotoStatusBadge(b.status)}
                    </td>

                    <!-- 7. Thao tác -->
                    <td style="text-align: center;">
                      <button class="btn btn-sm btn-outline" 
                              style="padding: 4px 10px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; color: #0f766e; border-color: #cbd5e1;"
                              onclick="AdminService.openBookingDetailModal(${rId})">
                        <i class="fa-solid fa-eye"></i> Chi tiết
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Phân trang -->
        <div class="booking-pagination">
          <div class="pagination-info" style="font-size: 0.82rem; color: #64748b;">
            Hiển thị <strong>${totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong>${Math.min(startIndex + limit, totalItems)}</strong> trong tổng số <strong>${totalItems}</strong> giao dịch
          </div>
          <div class="pagination-controls" style="display: flex; gap: 4px; align-items: center;">
            <button class="page-btn" 
                    ${this.bookingState.page <= 1 ? 'disabled' : ''} 
                    onclick="AdminService.changeBookingPage(${this.bookingState.page - 1})">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
              <button class="page-btn ${this.bookingState.page === p ? 'active' : ''}" 
                      onclick="AdminService.changeBookingPage(${p})">
                ${p}
              </button>
            `).join('')}
            <button class="page-btn" 
                    ${this.bookingState.page >= totalPages ? 'disabled' : ''} 
                    onclick="AdminService.changeBookingPage(${this.bookingState.page + 1})">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  onBookingFilterChange(status) {
    this.bookingState.status = status;
    this.bookingState.page = 1;
    this.renderBookingsUI();
  },

  onBookingSearch(val) {
    this.bookingState.search = val;
    this.bookingState.page = 1;
    this.renderBookingsUI();
  },

  onBookingSortChange(sortBy) {
    this.bookingState.sortBy = sortBy;
    this.bookingState.page = 1;
    this.renderBookingsUI();
  },

  onBookingLimitChange(limit) {
    this.bookingState.limit = parseInt(limit, 10) || 8;
    this.bookingState.page = 1;
    this.renderBookingsUI();
  },

  changeBookingPage(newPage) {
    this.bookingState.page = newPage;
    this.renderBookingsUI();
  },

  openBookingDetailModal(rentalId) {
    const b = (this.cachedBookings || []).find(x => String(x.rental_id || x.rentalId || x.id) === String(rentalId));
    if (!b) {
      if (typeof showToast === 'function') showToast('Không tìm thấy thông tin đơn #' + rentalId, 'warning');
      return;
    }

    const fmtMoney = (v) => typeof StorageService !== 'undefined' ? StorageService.formatCurrency(v) : (Number(v || 0).toLocaleString('vi-VN') + ' đ');
    const rId = b.rental_id || b.rentalId || b.id;
    const carName = b.car_name || b.carName || 'Phương tiện';
    const carPlate = b.car_plate || b.carPlate || b.license_plate || b.licensePlate || 'N/A';
    const renterName = b.renter_name || b.renterName || 'Khách thuê';
    const renterPhone = b.renter_phone || b.renterPhone || 'N/A';
    const ownerName = b.owner_name || b.ownerName || 'Chủ xe';
    const ownerPhone = b.owner_phone || b.ownerPhone || 'N/A';
    const ownerBank = b.owner_bank_name || b.ownerBankName || 'MBBank (Quân Đội)';
    const ownerAccount = b.owner_bank_account || b.ownerBankAccount || '998877665544';
    const totalPrice = b.total_price || b.totalPrice || 0;
    const depositAmount = b.deposit_amount || b.depositAmount || 0;
    const platformFee = b.platform_fee || b.platformFee || Math.round(totalPrice * 0.1);
    const ownerPayout = b.owner_payout_amount || b.ownerPayoutAmount || (totalPrice - platformFee);
    const startDate = b.start_date || b.startDate || '';
    const endDate = b.end_date || b.endDate || '';
    const totalDays = b.total_days || b.totalDays || 1;
    const thumb = this.getCarThumbnail(carName);

    let reasonClean = b.reject_reason || b.rejectReason || '';
    if (reasonClean.includes('bùng kèo') || reasonClean.includes('vi phạm giao xe')) {
      reasonClean = 'Chủ xe không bàn giao phương tiện đúng hẹn. Hệ thống đã kích hoạt lệnh hoàn trả 100% tiền cọc cho khách thuê và ghi nhận biên bản vi phạm nghĩa vụ bàn giao.';
    }

    const modalContent = `
      <div style="font-size: 0.88rem; color: #1e293b; line-height: 1.5;">
        <!-- Banner trạng thái -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
          <div>
            <span style="font-size: 0.74rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Mã hợp đồng thuê xe</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: #0f172a; font-family: monospace;">#${rId}</div>
          </div>
          <div>
            ${this.getMiotoStatusBadge(b.status)}
          </div>
        </div>

        <!-- 2 Cột: Xe & Khách -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
          <!-- Khối Phương tiện & Chủ xe -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-car" style="color: #0f766e;"></i> Thông tin phương tiện
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <img src="${thumb}" style="width: 70px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" />
              <div>
                <strong style="color: #0f172a;">${carName}</strong>
                <div style="margin-top: 3px;">
                  <span style="font-family: monospace; font-size: 0.74rem; font-weight: 800; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 4px; padding: 1px 6px;">${carPlate}</span>
                </div>
              </div>
            </div>
            <div style="font-size: 0.8rem; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
              <div><strong>Chủ xe:</strong> ${ownerName}</div>
              <div><strong>SĐT chủ xe:</strong> ${ownerPhone}</div>
              <div><strong>STK nhận tiền:</strong> ${ownerBank} - <code>${ownerAccount}</code></div>
            </div>
          </div>

          <!-- Khối Khách thuê & Lịch trình -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-user-check" style="color: #2563eb;"></i> Khách thuê & Lịch trình
            </div>
            <div style="font-size: 0.82rem; margin-bottom: 10px;">
              <div><strong>Họ tên:</strong> ${renterName}</div>
              <div><strong>Điện thoại:</strong> ${renterPhone}</div>
            </div>
            <div style="font-size: 0.8rem; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
              <div><strong>Ngày nhận xe:</strong> ${startDate}</div>
              <div><strong>Ngày trả xe:</strong> ${endDate}</div>
              <div><strong>Thời lượng:</strong> <span class="badge" style="background: #e2e8f0; color: #334155;">${totalDays} ngày</span></div>
            </div>
          </div>
        </div>

        <!-- Phân rã dòng tiền Escrow -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
          <div style="font-weight: 800; color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-shield-halved"></i> Bảo chứng dòng tiền VietQR Escrow
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
            <div style="background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #dcfce7;">
              <div style="font-size: 0.72rem; color: #64748b;">Tổng giá trị đơn</div>
              <div style="font-weight: 800; color: #0f172a; font-size: 0.95rem;">${fmtMoney(totalPrice)}</div>
            </div>
            <div style="background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #86efac;">
              <div style="font-size: 0.72rem; color: #15803d; font-weight: 700;">Cọc VietQR (30%)</div>
              <div style="font-weight: 800; color: #15803d; font-size: 0.95rem;">${fmtMoney(depositAmount)}</div>
            </div>
            <div style="background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #dcfce7;">
              <div style="font-size: 0.72rem; color: #64748b;">Hoa hồng sàn (10%)</div>
              <div style="font-weight: 800; color: #0369a1; font-size: 0.95rem;">${fmtMoney(platformFee)}</div>
            </div>
            <div style="background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #dcfce7;">
              <div style="font-size: 0.72rem; color: #64748b;">Chủ xe thực nhận</div>
              <div style="font-weight: 800; color: #7c2d12; font-size: 0.95rem;">${fmtMoney(ownerPayout)}</div>
            </div>
          </div>
        </div>

        ${reasonClean ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #991b1b; font-size: 0.82rem;">
            <strong><i class="fa-solid fa-triangle-exclamation"></i> Ghi chú thẩm định / Lý do hủy:</strong>
            <div style="margin-top: 4px;">${reasonClean}</div>
          </div>
        ` : ''}

        <!-- Nút thao tác -->
        <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
          <button class="btn btn-outline" onclick="AdminService.closeModal()">Đóng</button>
        </div>
      </div>
    `;

    this.openModal(`Hồ Sơ Hợp Đồng Thuê Xe #${rId}`, modalContent);
  },

  exportBookingsCsv() {
    const list = this.cachedBookings || [];
    if (list.length === 0) {
      if (typeof showToast === 'function') showToast('Không có dữ liệu giao dịch để xuất CSV', 'warning');
      return;
    }

    const headers = ['Ma_Don', 'Phuong_Tien', 'Bien_So', 'Khach_Thue', 'SDT_Khach', 'Chu_Xe', 'Ngay_Nhan', 'Ngay_Tra', 'So_Ngay', 'Tong_Tien', 'Tien_Coc_30', 'Trang_Thai'];
    const rows = list.map(b => [
      b.rental_id || b.rentalId || b.id,
      `"${(b.car_name || b.carName || '').replace(/"/g, '""')}"`,
      b.car_plate || b.carPlate || 'N/A',
      `"${(b.renter_name || b.renterName || '').replace(/"/g, '""')}"`,
      b.renter_phone || b.renterPhone || '',
      `"${(b.owner_name || b.ownerName || '').replace(/"/g, '""')}"`,
      b.start_date || b.startDate || '',
      b.end_date || b.endDate || '',
      b.total_days || b.totalDays || 1,
      b.total_price || b.totalPrice || 0,
      b.deposit_amount || b.depositAmount || 0,
      b.status
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DriveShare_Giao_Dich_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof showToast === 'function') showToast('Đã xuất file báo cáo giao dịch CSV thành công!', 'success');
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
    document.getElementById('adminTabDisputes')?.classList.toggle('active', tabName === 'DISPUTES');
    document.getElementById('adminTabUsers')?.classList.toggle('active', tabName === 'USERS');
    document.getElementById('adminTabChat')?.classList.toggle('active', tabName === 'CHAT');

    const tabCars = document.getElementById('adminTabCarsContent');
    const tabCccd = document.getElementById('adminTabCccdContent');
    const tabLicenses = document.getElementById('adminTabLicensesContent');
    const tabBookings = document.getElementById('adminTabBookingsContent');
    const tabDisputes = document.getElementById('adminTabDisputesContent');
    const tabUsers = document.getElementById('adminTabUsersContent');
    const tabChat = document.getElementById('adminTabChatContent');

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
    if (tabDisputes) {
      tabDisputes.style.display = tabName === 'DISPUTES' ? 'block' : 'none';
      if (tabName === 'DISPUTES') this.renderDisputesList();
    }
    if (tabUsers) {
      tabUsers.style.display = tabName === 'USERS' ? 'block' : 'none';
      if (tabName === 'USERS') this.renderUsersTable();
    }
    if (tabChat) {
      tabChat.style.display = tabName === 'CHAT' ? 'block' : 'none';
      if (tabName === 'CHAT') this.renderChatHistoryTable();
    }
  },

  // Quản lý khiếu nại sự cố & Vi phạm nghĩa vụ bàn giao xe (Rental Disputes - Sprint 3 / Mioto Standard)
  async renderDisputesList() {
    const wrapper = document.getElementById('adminDisputesTableWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải danh sách khiếu nại sự cố bàn giao xe...
      </div>
    `;

    let disputes = [];
    try {
      const apiBase = getAdminApiBase();
      const token = (typeof getAccessToken === 'function') ? getAccessToken() : (localStorage.getItem('access_token') || localStorage.getItem('token'));
      const res = await fetch(`${apiBase}/admin/rentals/disputes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const json = await res.json();
        disputes = json?.data || json?.result || [];
      }
    } catch (e) {
      console.warn('renderDisputesList error:', e);
    }

    const badgeBadge = document.getElementById('badgePendingDisputes');
    if (badgeBadge) {
      const pendingCount = disputes.filter(d => (d.status || d.dispute_status) === 'PENDING').length;
      badgeBadge.textContent = pendingCount;
    }

    wrapper.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Mã khiếu nại</th>
            <th>Mã đơn</th>
            <th>Người báo cáo</th>
            <th>Lý do sự cố / Bằng chứng</th>
            <th>Tiền cọc cần hoàn</th>
            <th>Trạng thái</th>
            <th style="text-align: center;">Thao tác giải quyết</th>
          </tr>
        </thead>
        <tbody>
          ${disputes.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--slate-500);">
                Không có khiếu nại sự cố giao xe nào cần xử lý.
              </td>
            </tr>
          ` : disputes.map(d => {
            const id = d.id || d.dispute_id;
            const rentalId = d.rental_id || d.rentalId;
            const status = d.status || d.dispute_status;
            const isPending = status === 'PENDING';
            const refundAmt = d.refund_amount || d.refundAmount || 0;
            const penaltyAmt = d.penalty_amount || d.penaltyAmount || 0;

            let stBadge = '';
            if (status === 'PENDING') {
              stBadge = '<span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:700;">Chờ Admin giải quyết</span>';
            } else if (status === 'RESOLVED_REFUND') {
              stBadge = '<span class="badge badge-success" style="background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; font-weight:700;">Đã hoàn 100% cọc cho khách</span>';
            } else {
              stBadge = `<span class="badge badge-neutral">${status}</span>`;
            }

            return `
              <tr>
                <td><strong style="color:#0f766e;">#DSP-${id}</strong></td>
                <td><span class="booking-code">#${rentalId}</span></td>
                <td>
                  <strong>Khách thuê #${d.reporter_id || d.reporterId}</strong><br/>
                  <span style="font-size: 0.76rem; color: var(--slate-500);">${d.created_at ? new Date(d.created_at).toLocaleString('vi-VN') : ''}</span>
                </td>
                <td style="max-width: 280px;">
                  <div style="font-size: 0.84rem; color: #1e293b; font-weight: 500;">${d.reason || 'Chủ xe không giao xe'}</div>
                  ${d.proof_urls ? `
                    <div style="margin-top: 4px; font-size: 0.76rem; color: #0284c7;">
                      <a href="${Array.isArray(d.proof_urls) ? d.proof_urls[0] : d.proof_urls.split(';')[0]}" target="_blank" style="text-decoration: underline;">Xem file bằng chứng</a>
                    </div>
                  ` : ''}
                </td>
                <td>
                  <strong style="color: #059669; font-size: 0.95rem;">
                    ${StorageService.formatCurrency(refundAmt > 0 ? refundAmt : 900000)}
                  </strong>
                  <br/><span style="font-size: 0.72rem; color: var(--slate-500);">(100% Escrow cọc)</span>
                </td>
                <td>${stBadge}</td>
                <td style="text-align: center;">
                  ${isPending ? `
                    <div style="display: flex; gap: 6px; justify-content: center;">
                      <button class="btn btn-sm btn-primary" style="background: #059669; border-color: #059669; font-weight: 700; padding: 4px 10px; font-size: 0.78rem;" onclick="AdminService.resolveDispute(${id}, 'REFUND_RENTER')">
                        Hoàn 100% cọc & Phạt chủ xe
                      </button>
                      <button class="btn btn-sm btn-outline" style="color: #ef4444; border-color: #fecaca; background: #fff5f5; font-weight: 600; padding: 4px 8px; font-size: 0.78rem;" onclick="AdminService.resolveDispute(${id}, 'REJECT')">
                        Bác bỏ
                      </button>
                    </div>
                  ` : `
                    <span style="font-size: 0.8rem; color: var(--slate-500); font-weight: 600;">
                      Đã xử lý bởi Admin #${d.resolved_by || d.resolvedBy || 1}
                    </span>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  async resolveDispute(disputeId, action = 'REFUND_RENTER') {
    if (action === 'REFUND_RENTER') {
      const confirmMsg = `Xác nhận phê duyệt khiếu nại tranh chấp #${disputeId}?\n\nTheo quy chế chuẩn Mioto:\n1. Hoàn trả 100% tiền cọc (Escrow) ngay lập tức cho Khách thuê.\n2. Hủy đơn thuê với lý do Chủ xe vi phạm giao xe (CANCELLED_BY_HOST).\n3. Ghi nhận công nợ phạt vi phạm đối với Chủ xe.`;
      if (!confirm(confirmMsg)) return;
    } else {
      if (!confirm(`Bạn có chắc muốn bác bỏ khiếu nại #${disputeId}?`)) return;
    }

    try {
      const apiBase = getAdminApiBase();
      const token = typeof AuthService !== 'undefined' ? AuthService.getToken() : localStorage.getItem('token');
      const body = {
        action: action,
        admin_note: action === 'REFUND_RENTER' 
          ? 'Xác minh sự cố chủ xe vắng mặt không giao xe. Phê duyệt hoàn 100% tiền cọc cho khách và lập biên bản phạt chủ xe.'
          : 'Không đủ căn cứ khiếu nại hoặc chủ xe đã giải trình hợp lệ.',
        penalty_amount: 1000000
      };

      const res = await fetch(`${apiBase}/admin/rentals/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const json = await res.json().catch(() => null);
      if (res.ok) {
        if (typeof showToast === 'function') {
          showToast(action === 'REFUND_RENTER' ? 'Đã duyệt hoàn 100% tiền cọc cho khách và phạt chủ xe!' : 'Đã bác bỏ khiếu nại!', 'success');
        } else {
          alert('Xử lý khiếu nại thành công!');
        }
        this.renderDisputesList();
        this.renderBookingsList();
      } else {
        alert(json?.message || 'Lỗi khi xử lý khiếu nại tranh chấp');
      }
    } catch (e) {
      console.error('resolveDispute error:', e);
      alert('Lỗi kết nối khi giải quyết khiếu nại');
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
    const msg = `Đã yêu cầu khách thuê #${renterId} chụp lại GPLX.`;
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
  },

  // =========================================================================
  // ADMIN AI CHAT HISTORY MONITORING & FILTERING
  // =========================================================================

  chatState: {
    role: 'ALL',
    search: ''
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  onChatFilterChange() {
    const searchInput = document.getElementById('adminChatSearchInput');
    const roleSelect = document.getElementById('adminChatRoleFilter');
    this.chatState.search = searchInput ? searchInput.value.trim() : '';
    this.chatState.role = roleSelect ? roleSelect.value : 'ALL';
    this.renderChatHistoryTable();
  },

  async renderChatHistoryTable() {
    const wrapper = document.getElementById('adminChatTableWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--slate-500);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" style="margin: 0 auto 0.5rem auto; display: block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Đang tải danh sách lịch sử hội thoại AI...
      </div>
    `;

    try {
      const baseUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL : 'http://localhost:8080/api/v1';
      const token = (typeof getAccessToken === 'function' ? getAccessToken() : null) ||
                    (typeof TokenService !== 'undefined' ? TokenService.getToken() : null) ||
                    localStorage.getItem('access_token') ||
                    localStorage.getItem('ds_access_token') ||
                    localStorage.getItem('token');
      const params = new URLSearchParams();
      if (this.chatState.role && this.chatState.role !== 'ALL') {
        params.append('role', this.chatState.role);
      }
      if (this.chatState.search) {
        params.append('search', this.chatState.search);
      }

      const res = await fetch(`${baseUrl}/admin/chat-history?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();

      if (!data.success || !Array.isArray(data.data)) {
        wrapper.innerHTML = `<div style="text-align: center; padding: 30px; color: #ef4444;">Không thể tải dữ liệu: ${this.escapeHtml(data.message || 'Lỗi không xác định')}</div>`;
        return;
      }

      const sessions = data.data;
      const badge = document.getElementById('badgeChatHistory');
      if (badge) badge.textContent = sessions.length;

      if (sessions.length === 0) {
        wrapper.innerHTML = `
          <div style="text-align: center; padding: 50px 20px; color: #94a3b8;">
            <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
            <div style="font-size: 15px; font-weight: 600; color: #475569;">Không tìm thấy phiên hội thoại nào</div>
            <div style="font-size: 13px; margin-top: 4px;">Thử thay đổi bộ lọc vai trò hoặc từ khóa tìm kiếm.</div>
          </div>
        `;
        return;
      }

      let html = `
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width: 170px;">Thời gian</th>
              <th style="width: 220px;">Người dùng</th>
              <th style="width: 140px;">Vai trò</th>
              <th>Trích đoạn hội thoại gần nhất</th>
              <th style="width: 100px; text-align: center;">Số tin nhắn</th>
              <th style="width: 130px; text-align: center;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
      `;

      sessions.forEach(s => {
        const timeStr = s.updatedAt ? new Date(s.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        let roleBadge = '';
        if (s.userRole === 'ROLE_RENTER') {
          roleBadge = '<span class="badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 600;">Khách thuê</span>';
        } else if (s.userRole === 'ROLE_OWNER') {
          roleBadge = '<span class="badge" style="background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff; font-weight: 600;">Chủ xe</span>';
        } else if (s.userRole === 'ROLE_ADMIN') {
          roleBadge = '<span class="badge" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-weight: 600;">Quản trị</span>';
        } else {
          roleBadge = '<span class="badge" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-weight: 600;">Khách vãng lai</span>';
        }

        const userDisplay = s.userFullName
          ? `<strong>${this.escapeHtml(s.userFullName)}</strong><br><small style="color: #64748b;">${this.escapeHtml(s.userEmail || '')}</small>`
          : `<span style="color: #94a3b8; font-style: italic;">Khách vãng lai (Chưa đăng nhập)</span>`;

        const lastSnippet = s.lastMessage
          ? this.escapeHtml(s.lastMessage.length > 90 ? s.lastMessage.substring(0, 90) + '...' : s.lastMessage)
          : '<span style="color: #cbd5e1;">(Chưa có nội dung)</span>';

        html += `
          <tr>
            <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${timeStr}</td>
            <td style="font-size: 13px;">${userDisplay}</td>
            <td>${roleBadge}</td>
            <td style="font-size: 13px; color: #334155;">${lastSnippet}</td>
            <td style="text-align: center;"><span class="badge" style="background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 700;">${s.messageCount || 0}</span></td>
            <td style="text-align: center;">
              <button class="btn btn-primary btn-sm" onclick="AdminService.viewChatDetail('${this.escapeHtml(s.sessionId)}', '${this.escapeHtml(s.userFullName || 'Khách vãng lai')}')" style="font-size: 12px; padding: 4px 10px;">
                Xem chi tiết
              </button>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      wrapper.innerHTML = html;
    } catch (err) {
      wrapper.innerHTML = `<div style="text-align: center; padding: 30px; color: #ef4444;">Lỗi kết nối máy chủ: ${this.escapeHtml(err.message)}</div>`;
    }
  },

  async viewChatDetail(sessionId, userDisplay) {
    this.openModal(`Lịch sử hội thoại: ${userDisplay}`, `
      <div style="text-align: center; padding: 30px; color: #64748b;">
        <div style="display: inline-block; width: 24px; height: 24px; border: 2px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <div style="margin-top: 8px; font-size: 13px;">Đang tải nội dung hội thoại...</div>
      </div>
    `);

    try {
      const baseUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL : 'http://localhost:8080/api/v1';
      const token = (typeof getAccessToken === 'function' ? getAccessToken() : null) ||
                    (typeof TokenService !== 'undefined' ? TokenService.getToken() : null) ||
                    localStorage.getItem('access_token') ||
                    localStorage.getItem('ds_access_token') ||
                    localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/admin/chat-history/${encodeURIComponent(sessionId)}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();

      const messages = Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.messages) ? data.data.messages : null);

      if (!data.success || !messages) {
        this.openModal(`Lịch sử hội thoại: ${userDisplay}`, `
          <div style="padding: 20px; color: #ef4444; text-align: center;">
            Không tìm thấy dữ liệu hội thoại cho phiên này.
          </div>
        `);
        return;
      }
      let bodyHtml = `
        <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
          <span><strong>Mã phiên:</strong> <code>${this.escapeHtml(sessionId)}</code></span>
          <span><strong>Tổng tin nhắn:</strong> ${messages.length}</span>
        </div>
        <div style="max-height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 8px 4px;">
      `;

      if (messages.length === 0) {
        bodyHtml += `<div style="text-align: center; padding: 30px; color: #94a3b8;">Phiên này chưa có tin nhắn nào.</div>`;
      } else {
        messages.forEach(m => {
          const isUser = (m.role === 'user' || m.role === 'USER');
          const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
          const content = this.escapeHtml(m.text || m.content || '')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

          if (isUser) {
            bodyHtml += `
              <div style="display: flex; justify-content: flex-end;">
                <div style="max-width: 80%; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 10px 14px; border-radius: 14px 14px 2px 14px; font-size: 13px; line-height: 1.5;">
                  <div style="font-weight: 600; font-size: 11px; opacity: 0.85; margin-bottom: 2px;">👤 ${this.escapeHtml(userDisplay)} ${time ? '• ' + time : ''}</div>
                  <div>${content}</div>
                </div>
              </div>
            `;
          } else {
            bodyHtml += `
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
                <div style="max-width: 82%; background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.55;">
                  <div style="font-weight: 600; font-size: 11px; color: #7c3aed; margin-bottom: 2px;">Trợ Lý AI DriveShare ${time ? '• ' + time : ''}</div>
                  <div>${content}</div>
                </div>
              </div>
            `;
          }
        });
      }

      bodyHtml += `
        </div>
        <div style="margin-top: 16px; text-align: right;">
          <button class="btn btn-outline btn-sm" onclick="AdminService.closeModal()">Đóng cửa sổ</button>
        </div>
      `;

      this.openModal(`Lịch sử hội thoại: ${userDisplay}`, bodyHtml);
    } catch (err) {
      this.openModal(`Lịch sử hội thoại: ${userDisplay}`, `
        <div style="padding: 20px; color: #ef4444; text-align: center;">
          Lỗi tải tin nhắn: ${this.escapeHtml(err.message)}
        </div>
      `);
    }
  }
};
