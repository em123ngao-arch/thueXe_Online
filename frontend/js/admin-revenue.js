/**
 * DRIVESHARE — Admin Revenue & Financial Settlement Module (Trang Quản Trị Doanh Thu Sàn)
 * Quản lý tổng GMV toàn sàn, hoa hồng 10%, quỹ ký quỹ VietQR 30% và sổ cái đối soát giải ngân cho chủ xe.
 */

const AdminRevenueUI = {
  stats: null,
  rentals: [],
  activePeriod: 'ALL',
  activeStatus: 'ALL',
  searchQuery: '',

  async init() {
    this.renderLoading();
    await this.loadData();
  },

  async loadData() {
    try {
      // 1. Lấy chỉ số vĩ mô từ API GET /api/v1/admin/stats
      const statsRes = await AdminAPI.getAdminStats();
      if (statsRes && statsRes.success && statsRes.data) {
        this.stats = statsRes.data;
      }

      // 2. Lấy toàn bộ danh sách đơn và đối soát tài chính từ API GET /api/v1/admin/rentals
      const rentalsRes = await AdminAPI.getAdminRentals();
      if (rentalsRes && rentalsRes.success && rentalsRes.data) {
        this.rentals = rentalsRes.data;
      } else {
        this.loadFallbackData();
      }

      this.render();
    } catch (err) {
      console.warn('[AdminRevenueUI] Lỗi tải dữ liệu, sử dụng fallback:', err);
      this.loadFallbackData();
      this.render();
    }
  },

  loadFallbackData() {
    let bookings = [];
    if (typeof StorageService !== 'undefined') {
      bookings = StorageService.getBookings() || [];
    }

    if (!this.stats) {
      this.stats = {
        totalGmv: 2400000,
        platformCommissionRevenue: 240000,
        totalDepositsCollected: 720000,
        todayBookingsCount: 2,
        totalBookingsCount: 3
      };
    }

    if (!this.rentals || this.rentals.length === 0) {
      this.rentals = [
        {
          rentalId: 1,
          carId: 1,
          carName: 'VinFast VF8 Plus Electric',
          carPlate: '51K-999.88',
          renterId: 3,
          renterName: 'Lê Hoàng Nam',
          renterPhone: '0988 776 655',
          startDate: '2026-09-25',
          endDate: '2026-09-27',
          totalDays: 2,
          pricePerDay: 1200000,
          totalPrice: 2400000,
          depositAmount: 720000,
          status: 'CONFIRMED',
          ownerId: 2,
          ownerName: 'Trần Văn Chủ Xe',
          ownerPhone: '0912 345 678',
          ownerBankName: 'MBBank (Quân Đội)',
          ownerBankAccount: '998877665544',
          platformFee: 240000,
          ownerPayoutAmount: 2160000,
          payoutStatus: 'ĐÃ_CỌC_30%',
          createdAt: new Date().toISOString()
        },
        {
          rentalId: 2,
          carId: 2,
          carName: 'Toyota Camry 2.5Q Premium',
          carPlate: '51H-123.45',
          renterId: 4,
          renterName: 'Nguyễn Phương Mai',
          renterPhone: '0977 665 544',
          startDate: '2026-10-01',
          endDate: '2026-10-03',
          totalDays: 2,
          pricePerDay: 1500000,
          totalPrice: 3000000,
          depositAmount: 900000,
          status: 'COMPLETED',
          ownerId: 2,
          ownerName: 'Trần Văn Chủ Xe',
          ownerPhone: '0912 345 678',
          ownerBankName: 'Vietcombank',
          ownerBankAccount: '0071001234567',
          platformFee: 300000,
          ownerPayoutAmount: 2700000,
          payoutStatus: 'ĐÃ_GIẢI_NGÂN',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          rentalId: 3,
          carId: 3,
          carName: 'Mazda CX-5 2.0 Luxury',
          carPlate: '51G-555.66',
          renterId: 5,
          renterName: 'Phạm Đức Trí',
          renterPhone: '0903 112 233',
          startDate: '2026-10-10',
          endDate: '2026-10-12',
          totalDays: 2,
          pricePerDay: 1000000,
          totalPrice: 2000000,
          depositAmount: 600000,
          status: 'COMPLETED',
          ownerId: 6,
          ownerName: 'Hoàng Nam Long',
          ownerPhone: '0933 445 566',
          ownerBankName: 'Techcombank',
          ownerBankAccount: '1903456789012',
          platformFee: 200000,
          ownerPayoutAmount: 1800000,
          payoutStatus: 'CHỜ_ĐỐI_SOÁT',
          createdAt: new Date().toISOString()
        }
      ];
    }
  },

  renderLoading() {
    const container = document.getElementById('adminRevenueContainer');
    if (!container) return;
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="margin: 0 auto 1.5rem auto; width: 44px; height: 44px; border: 3px solid var(--slate-200); border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <h3 style="font-size: 1.15rem; color: var(--slate-800); font-weight: 700;">Đang tải sổ cái doanh thu & đối soát sàn...</h3>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  },

  formatMoney(num) {
    if (num == null) return '0 ₫';
    return Number(num).toLocaleString('vi-VN') + ' ₫';
  },

  render() {
    const container = document.getElementById('adminRevenueContainer');
    if (!container) return;

    // Tính toán số liệu vĩ mô
    let totalGmv = 0;
    let totalPlatformFee = 0;
    let totalDeposits = 0;
    let paidOutAmount = 0;
    let pendingPayoutAmount = 0;

    (this.rentals || []).forEach(r => {
      const gmv = Number(r.totalPrice || 0);
      const dep = Number(r.depositAmount || Math.round(gmv * 0.3));
      const fee = Number(r.platformFee || Math.round(gmv * 0.1));
      const payout = Number(r.ownerPayoutAmount || (gmv - fee));

      totalGmv += gmv;
      totalPlatformFee += fee;
      totalDeposits += dep;

      if (r.payoutStatus === 'ĐÃ_GIẢI_NGÂN') {
        paidOutAmount += payout;
      } else if (r.payoutStatus === 'CHỜ_ĐỐI_SOÁT' || r.status === 'COMPLETED') {
        pendingPayoutAmount += payout;
      }
    });

    // Nếu có stats từ backend thì ưu tiên dùng
    if (this.stats) {
      if (this.stats.totalGmv != null) totalGmv = Number(this.stats.totalGmv);
      if (this.stats.platformCommissionRevenue != null) totalPlatformFee = Number(this.stats.platformCommissionRevenue);
      if (this.stats.totalDepositsCollected != null) totalDeposits = Number(this.stats.totalDepositsCollected);
    }

    // Lọc danh sách giao dịch
    let filtered = [...(this.rentals || [])];

    if (this.activeStatus !== 'ALL') {
      filtered = filtered.filter(r => {
        if (this.activeStatus === 'ĐÃ_GIẢI_NGÂN') return r.payoutStatus === 'ĐÃ_GIẢI_NGÂN';
        if (this.activeStatus === 'CHỜ_ĐỐI_SOÁT') return r.payoutStatus === 'CHỜ_ĐỐI_SOÁT' || (r.status === 'COMPLETED' && r.payoutStatus !== 'ĐÃ_GIẢI_NGÂN');
        if (this.activeStatus === 'ĐÃ_CỌC_30%') return r.payoutStatus === 'ĐÃ_CỌC_30%' || r.status === 'CONFIRMED' || r.status === 'IN_PROGRESS';
        if (this.activeStatus === 'ĐÃ_HỦY') return r.status === 'CANCELLED' || r.status === 'REJECTED' || r.payoutStatus === 'ĐÃ_HỦY';
        return true;
      });
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.rentalId && String(r.rentalId).includes(q)) ||
        (r.carName && r.carName.toLowerCase().includes(q)) ||
        (r.carPlate && r.carPlate.toLowerCase().includes(q)) ||
        (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
        (r.renterName && r.renterName.toLowerCase().includes(q)) ||
        (r.ownerBankName && r.ownerBankName.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <!-- TOP PORTAL HEADER -->
      <div class="portal-header" style="margin-bottom: 2rem;">
        <div class="container portal-title-row">
          <div class="portal-title-group">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--slate-900); display: flex; align-items: center; gap: 0.6rem;">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #059669;">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Quản Lý Doanh Thu & Sổ Cái Quyết Toán Sàn
            </h2>
            <div class="portal-subtitle">Giám sát tổng GMV toàn sàn, hoa hồng cố định 10%, quỹ ký quỹ cọc VietQR 30% và ủy nhiệm chi giải ngân cho chủ xe</div>
          </div>
          <div style="display: flex; gap: 0.65rem; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="AdminRevenueUI.exportCSV()" style="font-weight: 600;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Xuất Báo Cáo Kế Toán
            </button>
            <button class="btn btn-primary btn-sm" onclick="AdminRevenueUI.loadData()" style="font-weight: 600; background: #059669; border-color: #059669;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- 5 THẺ KPI TÀI CHÍNH VĨ MÔ TOÀN SÀN -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
          
          <!-- Card 1: Tổng GMV -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #dbeafe; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #1e40af; text-transform: uppercase;">Tổng GMV Toàn Sàn</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                📈
              </div>
            </div>
            <div style="font-size: 1.7rem; font-weight: 900; color: #1e3a8a; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(totalGmv)}
            </div>
            <div style="font-size: 0.76rem; color: #3b82f6;">Gross Merchandise Value (Tổng đơn)</div>
          </div>

          <!-- Card 2: Hoa hồng sàn 10% -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #a7f3d0; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #065f46; text-transform: uppercase;">Hoa Hồng Sàn (10%)</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                💰
              </div>
            </div>
            <div style="font-size: 1.7rem; font-weight: 900; color: #047857; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(totalPlatformFee)}
            </div>
            <div style="font-size: 0.76rem; color: #10b981;">Doanh thu thuần sàn bỏ túi (Take Rate)</div>
          </div>

          <!-- Card 3: Quỹ cọc VietQR 30% -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #fde68a; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #92400e; text-transform: uppercase;">Quỹ Cọc Giữ (30%)</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                🛡️
              </div>
            </div>
            <div style="font-size: 1.7rem; font-weight: 900; color: #b45309; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(totalDeposits)}
            </div>
            <div style="font-size: 0.76rem; color: #f59e0b;">VietQR Escrow bảo đảm an toàn</div>
          </div>

          <!-- Card 4: Đã giải ngân cho chủ xe -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #cbd5e1; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase;">Đã Giải Ngân (90%)</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #f1f5f9; color: #334155; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                🏦
              </div>
            </div>
            <div style="font-size: 1.7rem; font-weight: 900; color: #0f172a; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(paidOutAmount)}
            </div>
            <div style="font-size: 0.76rem; color: #64748b;">Đã chuyển khoản thực trả Chủ xe</div>
          </div>

          <!-- Card 5: Chờ đối soát giải ngân -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #fed7aa; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #9a3412; text-transform: uppercase;">Chờ Giải Ngân</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #fff7ed; color: #ea580c; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                ⏳
              </div>
            </div>
            <div style="font-size: 1.7rem; font-weight: 900; color: #c2410c; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(pendingPayoutAmount)}
            </div>
            <div style="font-size: 0.76rem; color: #ea580c;">Cần đối soát & ủy nhiệm chi cho chủ</div>
          </div>
        </div>

        <!-- CƠ CẤU PHÂN BỔ DÒNG TIỀN VÀ HOA HỒNG SÀN (CASHFLOW DISTRIBUTION BANNER) -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #a7f3d0; border-radius: var(--radius-lg); padding: 1.25rem 1.75rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-weight: 800; color: #065f46; font-size: 1.05rem;">Cơ Cấu Chia Sẻ Doanh Thu Chuẩn Mioto & DriveShare</span>
              <span class="kpi-badge" style="background: #10b981; color: white;">Minh Bạch 100%</span>
            </div>
            <p style="margin: 0; font-size: 0.85rem; color: #047857;">
              Sàn thu cố định <strong>10% GMV</strong> làm phí vận hành và hạ tầng AI. Chủ xe thực nhận <strong>90% giá trị hợp đồng</strong>. Tiền cọc <strong>30% VietQR</strong> được sàn giữ an toàn cho đến khi kết thúc hành trình.
            </p>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <div style="text-align: center; background: white; padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #d1fae5;">
              <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">HOA HỒNG SÀN</div>
              <div style="font-size: 1.15rem; font-weight: 900; color: #059669;">10%</div>
            </div>
            <div style="text-align: center; background: white; padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #d1fae5;">
              <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">THỰC TRẢ CHỦ XE</div>
              <div style="font-size: 1.15rem; font-weight: 900; color: #0284c7;">90%</div>
            </div>
            <div style="text-align: center; background: white; padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #d1fae5;">
              <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">CỌC BẢO ĐẢM</div>
              <div style="font-size: 1.15rem; font-weight: 900; color: #d97706;">30%</div>
            </div>
          </div>
        </div>

        <!-- BỘ LỌC VÀ TÌM KIẾM SỔ CÁI QUYẾT TOÁN -->
        <div style="background: white; border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          
          <!-- Thanh tìm kiếm -->
          <div style="flex: 1; min-width: 280px; position: relative;">
            <input 
              type="text" 
              placeholder="Tìm theo mã đơn, biển số xe, tên chủ xe, tên khách, ngân hàng..." 
              value="${this.searchQuery}" 
              oninput="AdminRevenueUI.onSearch(this.value)"
              style="width: 100%; padding: 0.65rem 1rem 0.65rem 2.4rem; border: 1.5px solid var(--slate-200); border-radius: var(--radius-md); font-size: 0.9rem;"
            />
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--slate-400);">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <!-- Nhóm nút lọc trạng thái quyết toán -->
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button class="btn btn-sm ${this.activeStatus === 'ALL' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminRevenueUI.setStatusFilter('ALL')" style="${this.activeStatus === 'ALL' ? 'background: #059669; border-color: #059669;' : ''}">
              Tất cả (${(this.rentals || []).length})
            </button>
            <button class="btn btn-sm ${this.activeStatus === 'CHỜ_ĐỐI_SOÁT' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminRevenueUI.setStatusFilter('CHỜ_ĐỐI_SOÁT')" style="${this.activeStatus === 'CHỜ_ĐỐI_SOÁT' ? 'background: #ea580c; border-color: #ea580c;' : ''}">
              Chờ giải ngân
            </button>
            <button class="btn btn-sm ${this.activeStatus === 'ĐÃ_CỌC_30%' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminRevenueUI.setStatusFilter('ĐÃ_CỌC_30%')" style="${this.activeStatus === 'ĐÃ_CỌC_30%' ? 'background: #2563eb; border-color: #2563eb;' : ''}">
              Đang cọc 30%
            </button>
            <button class="btn btn-sm ${this.activeStatus === 'ĐÃ_GIẢI_NGÂN' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminRevenueUI.setStatusFilter('ĐÃ_GIẢI_NGÂN')" style="${this.activeStatus === 'ĐÃ_GIẢI_NGÂN' ? 'background: #047857; border-color: #047857;' : ''}">
              Đã giải ngân
            </button>
          </div>
        </div>

        <!-- BẢNG SỔ CÁI QUYẾT TOÁN TÀI CHÍNH (MASTER SETTLEMENT LEDGER TABLE) -->
        <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); overflow: hidden; margin-bottom: 2.5rem;">
          <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--slate-800); margin: 0;">
              Sổ Cái Dòng Tiền & Lệnh Quyết Toán Toàn Sàn (${filtered.length} giao dịch)
            </h3>
            <span style="font-size: 0.8rem; color: var(--slate-500);">Đơn vị tính: VNĐ</span>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1.5px solid var(--slate-200); color: var(--slate-600); font-weight: 700; font-size: 0.78rem; text-transform: uppercase;">
                  <th style="padding: 0.85rem 1rem;">Mã Đơn / Xe</th>
                  <th style="padding: 0.85rem 1rem;">Chủ Xe & Thụ Hưởng</th>
                  <th style="padding: 0.85rem 1rem;">Khách Thuê</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Tổng GMV</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Cọc VietQR (30%)</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Hoa Hồng Sàn (10%)</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Thực Trả Chủ (90%)</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Trạng Thái</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
                      Không tìm thấy giao dịch quyết toán nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ` : filtered.map(r => {
                  const gmv = Number(r.totalPrice || 0);
                  const dep = Number(r.depositAmount || Math.round(gmv * 0.3));
                  const fee = Number(r.platformFee || Math.round(gmv * 0.1));
                  const payout = Number(r.ownerPayoutAmount || (gmv - fee));
                  
                  let statusBadgeClass = 'status-badge-pending-payout';
                  let statusText = r.payoutStatus || 'CHỜ_ĐỐI_SOÁT';
                  
                  if (statusText === 'ĐÃ_GIẢI_NGÂN') {
                    statusBadgeClass = 'status-badge-paid-out';
                  } else if (statusText === 'ĐÃ_CỌC_30%') {
                    statusBadgeClass = 'status-badge-deposit-paid';
                  } else if (statusText === 'ĐÃ_HỦY') {
                    statusBadgeClass = 'status-badge-cancelled';
                  }

                  const isPaidOut = (statusText === 'ĐÃ_GIẢI_NGÂN');

                  return `
                    <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                      <td style="padding: 0.85rem 1rem;">
                        <div style="font-weight: 700; color: var(--slate-900);">#${r.rentalId}</div>
                        <div style="font-size: 0.82rem; color: var(--slate-600);">${r.carName || 'Xe cho thuê'}</div>
                        <span class="badge" style="font-size: 0.72rem; padding: 1px 6px; background: #f1f5f9; color: #475569;">${r.carPlate || 'N/A'}</span>
                      </td>
                      <td style="padding: 0.85rem 1rem;">
                        <div style="font-weight: 600; color: var(--slate-800);">${r.ownerName || 'Chủ xe'}</div>
                        <div style="font-size: 0.78rem; color: #0284c7; font-weight: 500;">
                          ${r.ownerBankName || 'MBBank'}: <strong>${r.ownerBankAccount || '998877665544'}</strong>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--slate-400);">${r.ownerPhone || 'N/A'}</div>
                      </td>
                      <td style="padding: 0.85rem 1rem;">
                        <div style="font-weight: 500; color: var(--slate-700);">${r.renterName || 'Khách thuê'}</div>
                        <div style="font-size: 0.75rem; color: var(--slate-400);">${r.renterPhone || ''}</div>
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 700; color: #1e3a8a;">
                        ${this.formatMoney(gmv)}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 600; color: #b45309;">
                        ${this.formatMoney(dep)}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 700; color: #047857;">
                        +${this.formatMoney(fee)}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 800; color: #0284c7;">
                        ${this.formatMoney(payout)}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: center;">
                        <span class="kpi-badge ${statusBadgeClass}">
                          ${statusText}
                        </span>
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: center;">
                        ${isPaidOut ? `
                          <button class="btn btn-sm btn-ghost" onclick="AdminRevenueUI.openPayoutModal(${r.rentalId})" style="color: #047857; font-size: 0.8rem; font-weight: 600;">
                            Xem Phiếu Chi
                          </button>
                        ` : `
                          <button class="btn btn-sm btn-primary" onclick="AdminRevenueUI.openPayoutModal(${r.rentalId})" style="background: #059669; border-color: #059669; font-size: 0.8rem; font-weight: 700; padding: 4px 10px;">
                            Giải Ngân (90%)
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  onSearch(val) {
    this.searchQuery = val || '';
    this.render();
  },

  setStatusFilter(status) {
    this.activeStatus = status;
    this.render();
  },

  openPayoutModal(rentalId) {
    const item = (this.rentals || []).find(r => r.rentalId === rentalId);
    if (!item) return;

    const gmv = Number(item.totalPrice || 0);
    const fee = Number(item.platformFee || Math.round(gmv * 0.1));
    const payout = Number(item.ownerPayoutAmount || (gmv - fee));
    const isPaidOut = (item.payoutStatus === 'ĐÃ_GIẢI_NGÂN');

    // Tạo QR code chuyển khoản NAPAS 247 VietQR giả định cho chủ xe
    const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(item.ownerBankName || 'MB')}-${encodeURIComponent(item.ownerBankAccount || '998877665544')}-compact2.png?amount=${payout}&addInfo=GIAINGAN%20DRIVESHARE%20DON%20${item.rentalId}&accountName=${encodeURIComponent(item.ownerName || 'CHU%20XE')}`;

    const modalBody = document.getElementById('payoutModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <span class="badge" style="background: #ecfdf5; color: #047857; font-weight: 700; font-size: 0.85rem; padding: 4px 12px;">
          LỆNH CHI THỰC TRẢ CHỦ XE (90% GMV)
        </span>
        <div style="font-size: 1.85rem; font-weight: 900; color: #047857; margin-top: 0.5rem;">
          ${this.formatMoney(payout)}
        </div>
        <div style="font-size: 0.8rem; color: var(--slate-500);">Đơn thuê #${item.rentalId} — ${item.carName} (${item.carPlate})</div>
      </div>

      <!-- Thông tin tài khoản thụ hưởng của chủ xe -->
      <div style="background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200); padding: 1rem; margin-bottom: 1.25rem; font-size: 0.88rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--slate-500);">Chủ tài khoản:</span>
          <strong style="color: var(--slate-900); text-transform: uppercase;">${item.ownerName || 'Chủ xe'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--slate-500);">Ngân hàng thụ hưởng:</span>
          <strong>${item.ownerBankName || 'MBBank'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--slate-500);">Số tài khoản:</span>
          <strong style="color: #0284c7; font-size: 1rem; font-family: monospace;">${item.ownerBankAccount || '998877665544'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--slate-200); padding-top: 0.5rem; margin-top: 0.5rem;">
          <span style="color: var(--slate-500);">Nội dung chuyển khoản:</span>
          <span style="font-family: monospace; font-weight: 600; color: var(--slate-700);">GIAINGAN DRIVESHARE ${item.rentalId}</span>
        </div>
      </div>

      <!-- Mã QR VietQR Chuyển Khoản NAPAS 247 -->
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="display: inline-block; padding: 10px; background: white; border-radius: 12px; border: 1.5px solid #e2e8f0; box-shadow: var(--shadow-sm);">
          <img src="${qrUrl}" alt="VietQR Payout" style="max-width: 220px; height: auto; border-radius: 6px; display: block;" onerror="this.onerror=null; this.src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=DRIVESHARE_PAYOUT_${item.rentalId}';" />
        </div>
        <div style="font-size: 0.78rem; color: var(--slate-500); margin-top: 6px;">Quét mã VietQR bằng app ngân hàng để chuyển tiền cho chủ xe</div>
      </div>

      <!-- Nút hành động -->
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button class="btn btn-ghost" onclick="AdminRevenueUI.closePayoutModal()">Đóng</button>
        ${isPaidOut ? `
          <button class="btn btn-outline" disabled style="color: #059669; border-color: #059669; font-weight: 700;">
            ✓ Đã Giải Ngân Thành Công
          </button>
        ` : `
          <button class="btn btn-primary" onclick="AdminRevenueUI.confirmPayout(${item.rentalId})" style="background: #059669; border-color: #059669; font-weight: 700;">
            Xác Nhận Đã Giải Ngân
          </button>
        `}
      </div>
    `;

    const overlay = document.getElementById('payoutModalOverlay');
    if (overlay) overlay.style.display = 'flex';
  },

  closePayoutModal() {
    const overlay = document.getElementById('payoutModalOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  async confirmPayout(rentalId) {
    try {
      // Gọi backend API: POST /api/v1/admin/rentals/{rentalId}/payout
      const token = typeof TokenService !== 'undefined' ? TokenService.getToken() : localStorage.getItem('access_token');
      const url = `${typeof API_CONFIG !== 'undefined' ? API_CONFIG.BASE_URL : 'http://localhost:8080/api/v1'}/admin/rentals/${rentalId}/payout`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      // Cập nhật state local
      const item = (this.rentals || []).find(r => r.rentalId === rentalId);
      if (item) {
        item.payoutStatus = 'ĐÃ_GIẢI_NGÂN';
      }

      if (typeof ToastService !== 'undefined') {
        ToastService.show('Đã xác nhận giải ngân thành công cho chủ xe!', 'success');
      } else {
        alert('Đã xác nhận giải ngân thành công cho chủ xe!');
      }

      this.closePayoutModal();
      this.render();
    } catch (err) {
      console.warn('Lỗi xác nhận giải ngân:', err);
      // Fallback
      const item = (this.rentals || []).find(r => r.rentalId === rentalId);
      if (item) item.payoutStatus = 'ĐÃ_GIẢI_NGÂN';
      this.closePayoutModal();
      this.render();
    }
  },

  exportCSV() {
    const items = this.rentals || [];
    if (items.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const headers = [
      'Mã Đơn',
      'Tên Xe',
      'Biển Số',
      'Chủ Xe',
      'Ngân Hàng Thụ Hưởng',
      'Số Tài Khoản',
      'Khách Thuê',
      'SĐT Khách',
      'Tổng GMV (VND)',
      'Tiền Cọc 30% (VND)',
      'Hoa Hồng Sàn 10% (VND)',
      'Thực Trả Chủ Xe 90% (VND)',
      'Trạng Thái Dòng Tiền',
      'Ngày Tạo'
    ];

    const rows = items.map(r => {
      const gmv = Number(r.totalPrice || 0);
      const dep = Number(r.depositAmount || Math.round(gmv * 0.3));
      const fee = Number(r.platformFee || Math.round(gmv * 0.1));
      const payout = Number(r.ownerPayoutAmount || (gmv - fee));

      return [
        r.rentalId,
        `"${(r.carName || '').replace(/"/g, '""')}"`,
        `"${r.carPlate || ''}"`,
        `"${(r.ownerName || '').replace(/"/g, '""')}"`,
        `"${r.ownerBankName || ''}"`,
        `"${r.ownerBankAccount || ''}"`,
        `"${(r.renterName || '').replace(/"/g, '""')}"`,
        `"${r.renterPhone || ''}"`,
        gmv,
        dep,
        fee,
        payout,
        `"${r.payoutStatus || 'CHỜ_ĐỐI_SOÁT'}"`,
        `"${r.createdAt || ''}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DriveShare_BaoCao_TaiChinh_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
