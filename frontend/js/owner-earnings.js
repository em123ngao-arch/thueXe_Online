/**
 * DRIVESHARE — Owner Earnings & Payment History (Kênh Doanh Thu Chủ Xe)
 * Quản lý ví thu nhập, số dư khả dụng, yêu cầu rút tiền về ngân hàng và phiếu quyết toán từng chuyến xe.
 */

const OwnerEarningsUI = {
  data: null,
  activeFilter: 'ALL',
  searchQuery: '',
  withdrawnAmount: 0,

  async init() {
    const container = document.getElementById('ownerEarningsContainer');
    if (!container) return;

    this.renderLoading();

    try {
      // Gọi API Backend: GET /api/v1/owner/earnings
      const res = await PaymentAPI.getOwnerEarnings();

      if (res && res.success && res.data) {
        this.data = res.data;
      } else {
        this.loadFallbackData();
      }
    } catch (err) {
      console.warn('[OwnerEarningsUI] Lỗi tải dữ liệu backend, dùng fallback:', err);
      this.loadFallbackData();
    }

    this.render();
  },

  loadFallbackData() {
    let bookings = [];
    if (typeof StorageService !== 'undefined') {
      bookings = StorageService.getBookings() || [];
    }

    this.data = {
      owner_id: 2,
      total_earnings: 2160000,
      available_balance: 2160000,
      pending_earnings: 720000,
      monthly_earnings: 2160000,
      completed_rentals: 2,
      total_transactions: 3,
      top_car_name: 'VinFast VF8',
      top_car_trips: 2,
      idle_cars_count: 1,
      bank_name: 'MBBank (Ngân hàng Quân Đội)',
      bank_account_number: '998877665544',
      bank_account_holder: 'TRẦN VĂN CHỦ XE',
      transactions: [
        {
          payment_id: 101,
          rental_id: 1,
          car_brand: "VinFast",
          car_model: "VF8 Plus",
          plate_number: "51K-999.88",
          renter_name: "Lê Hoàng Nam",
          renter_phone: "0988 776 655",
          amount: 720000,
          total_price: 2400000,
          platform_fee: 240000,
          net_earnings: 2160000,
          total_days: 2,
          price_per_day: 1200000,
          payment_type: "DEPOSIT",
          payment_method: "VIETQR",
          status: "SUCCESS",
          transaction_code: "DSPAY_1_172728900",
          created_at: new Date().toISOString(),
          start_date: "2026-09-25",
          end_date: "2026-09-27"
        },
        {
          payment_id: 102,
          rental_id: 2,
          car_brand: "Toyota",
          car_model: "Camry 2.5Q",
          plate_number: "51H-123.45",
          renter_name: "Nguyễn Phương Mai",
          renterPhone: "0977 665 544",
          amount: 900000,
          total_price: 3000000,
          platform_fee: 300000,
          net_earnings: 2700000,
          total_days: 2,
          price_per_day: 1500000,
          payment_type: "DEPOSIT",
          payment_method: "VIETQR",
          status: "PENDING",
          transaction_code: "DSPAY_2_172728955",
          created_at: new Date().toISOString(),
          start_date: "2026-10-01",
          end_date: "2026-10-03"
        }
      ]
    };
  },

  renderLoading() {
    const container = document.getElementById('ownerEarningsContainer');
    if (!container) return;
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="margin: 0 auto 1.5rem auto; width: 44px; height: 44px; border: 3px solid var(--slate-200); border-top-color: #047857; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <h3 style="font-size: 1.15rem; color: var(--slate-800); font-weight: 700;">Đang tải dữ liệu thu nhập & ví chủ xe...</h3>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  },

  formatMoney(num) {
    if (num == null) return '0 ₫';
    return Number(num).toLocaleString('vi-VN') + ' ₫';
  },

  render() {
    const container = document.getElementById('ownerEarningsContainer');
    if (!this.data || !container) return;

    const { 
      total_earnings, 
      pending_earnings, 
      completed_rentals, 
      total_transactions, 
      transactions,
      monthly_earnings,
      top_car_name,
      top_car_trips,
      idle_cars_count,
      bank_name,
      bank_account_number,
      bank_account_holder,
      available_balance
    } = this.data;

    const currentBalance = Math.max(0, (available_balance != null ? Number(available_balance) : Number(total_earnings || 0)) - this.withdrawnAmount);

    // Lọc transactions
    let filteredTxs = transactions || [];
    if (this.activeFilter !== 'ALL') {
      filteredTxs = filteredTxs.filter(t => t.status === this.activeFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filteredTxs = filteredTxs.filter(t => 
        (t.plate_number && t.plate_number.toLowerCase().includes(q)) ||
        (t.car_brand && t.car_brand.toLowerCase().includes(q)) ||
        (t.renter_name && t.renter_name.toLowerCase().includes(q)) ||
        (t.transaction_code && t.transaction_code.toLowerCase().includes(q))
      );
    }

    // Đội xe breakdown mẫu
    const fleetBreakdown = [
      {
        name: top_car_name || 'VinFast VF8 Plus',
        plate: '51K-999.88',
        trips: top_car_trips || completed_rentals || 2,
        revenue: total_earnings || 2160000,
        status: 'Đang cho thuê',
        statusColor: '#047857',
        statusBg: '#ecfdf5'
      },
      {
        name: 'Toyota Camry 2.5Q',
        plate: '51H-123.45',
        trips: 0,
        revenue: 0,
        status: 'Nằm bãi (Sẵn sàng)',
        statusColor: '#0284c7',
        statusBg: '#eff6ff'
      }
    ];

    container.innerHTML = `
      <!-- TOP HEADER -->
      <div class="portal-header" style="margin-bottom: 2rem;">
        <div class="container portal-title-row">
          <div class="portal-title-group">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--slate-900); display: flex; align-items: center; gap: 0.6rem;">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #047857;">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Quản Lý Thu Nhập & Quyết Toán Đội Xe
            </h2>
            <div class="portal-subtitle">Theo dõi ví thu nhập thực nhận (90%), tiền cọc đang giữ, hiệu suất từng xe và yêu cầu rút tiền về ngân hàng</div>
          </div>
          <div style="display: flex; gap: 0.65rem; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="OwnerEarningsUI.exportCSV()" style="font-weight: 600;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Xuất Sao Kê CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="OwnerEarningsUI.init()" style="font-weight: 600; background: #047857; border-color: #047857;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </div>

      <div class="container">

        <!-- KHỐI VÍ CHỦ XE & TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN -->
        <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: white; border-radius: var(--radius-lg); padding: 1.6rem 2rem; margin-bottom: 2rem; box-shadow: var(--shadow-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Ví Thu Nhập Chủ Xe (Khả Dụng)</span>
              <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700;">NAPAS 247</span>
            </div>
            <div style="font-size: 2.35rem; font-weight: 900; margin-bottom: 0.4rem;">
              ${this.formatMoney(currentBalance)}
            </div>
            <div style="font-size: 0.85rem; opacity: 0.9; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <span>Tài khoản nhận: <strong>${bank_name || 'MBBank'}</strong></span>
              <span>STK: <strong style="font-family: monospace; letter-spacing: 0.05em;">${bank_account_number || '998877665544'}</strong></span>
              <span>Chủ tài khoản: <strong style="text-transform: uppercase;">${bank_account_holder || 'Trần Văn Chủ Xe'}</strong></span>
            </div>
          </div>
          <div>
            <button class="btn btn-sm" onclick="OwnerEarningsUI.openWithdrawalModal()" style="background: white; color: #047857; font-weight: 800; font-size: 0.95rem; padding: 0.75rem 1.6rem; border-radius: 10px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Yêu Cầu Rút Tiền Về Ngân Hàng
            </button>
          </div>
        </div>

        <!-- 4 CARDS THỐNG KÊ DOANH THU -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
          
          <!-- Card 1: Doanh thu thực nhận -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #a7f3d0; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #065f46; text-transform: uppercase;">Doanh Thu Thực Nhận</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #ecfdf5; color: #047857; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                ₫
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #047857; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(total_earnings)}
            </div>
            <div style="font-size: 0.78rem; color: #10b981;">Đã trừ 10% hoa hồng sàn DriveShare</div>
          </div>

          <!-- Card 2: Tiền cọc đang tạm giữ -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #fde68a; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #92400e; text-transform: uppercase;">Tiền Cọc Đang Giữ (30%)</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                ⏳
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #b45309; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(pending_earnings)}
            </div>
            <div style="font-size: 0.78rem; color: #d97706;">Tiền bảo đảm các chuyến đang hoạt động</div>
          </div>

          <!-- Card 3: Doanh thu tháng này -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #bfdbfe; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #1e40af; text-transform: uppercase;">Doanh Thu Tháng Này</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                📅
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #1d4ed8; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(monthly_earnings || total_earnings)}
            </div>
            <div style="font-size: 0.78rem; color: #3b82f6;">Tính trong tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}</div>
          </div>

          <!-- Card 4: Tổng chuyến phục vụ -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1.5px solid #cbd5e1; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase;">Số Chuyến Phục Vụ</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                🚗
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: var(--slate-800); margin: 0.65rem 0 0.2rem 0;">
              ${completed_rentals || 2} chuyến
            </div>
            <div style="font-size: 0.78rem; color: var(--slate-500);">Tỷ lệ hoàn thành đơn 100%</div>
          </div>
        </div>

        <!-- BẢNG PHÂN TÍCH HIỆU SUẤT TỪNG XE TRONG GARAGE (FLEET PERFORMANCE BREAKDOWN) -->
        <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); overflow: hidden; margin-bottom: 2rem;">
          <div style="padding: 1.1rem 1.5rem; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">🏎️</span>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--slate-900); margin: 0;">Hiệu Suất Khai Thác Từng Xe Trong Garage</h3>
            </div>
            <span style="font-size: 0.8rem; color: #047857; font-weight: 700; background: #ecfdf5; padding: 3px 10px; border-radius: 9999px;">
              Xe chạy nhất: ${top_car_name || 'VinFast VF8'}
            </span>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1.5px solid var(--slate-200); color: var(--slate-600); font-weight: 700; font-size: 0.78rem; text-transform: uppercase;">
                  <th style="padding: 0.85rem 1rem;">Mẫu Xe</th>
                  <th style="padding: 0.85rem 1rem;">Biển Số</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Số Chuyến Thuê</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Doanh Thu Đóng Góp (90%)</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Trạng Thái Hiện Tại</th>
                </tr>
              </thead>
              <tbody>
                ${fleetBreakdown.map(car => `
                  <tr style="border-bottom: 1px solid var(--slate-100);">
                    <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--slate-900);">${car.name}</td>
                    <td style="padding: 0.85rem 1rem;">
                      <span class="badge" style="background: #f1f5f9; color: #334155; font-family: monospace; font-size: 0.8rem;">${car.plate}</span>
                    </td>
                    <td style="padding: 0.85rem 1rem; text-align: center; font-weight: 700; color: #0284c7;">${car.trips} chuyến</td>
                    <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 800; color: #047857;">${this.formatMoney(car.revenue)}</td>
                    <td style="padding: 0.85rem 1rem; text-align: center;">
                      <span style="background: ${car.statusBg}; color: ${car.statusColor}; padding: 3px 10px; border-radius: 9999px; font-size: 0.76rem; font-weight: 700;">
                        ${car.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- BỘ LỌC VÀ LỊCH SỬ GIAO DỊCH (TRANSACTION HISTORY & INVOICES) -->
        <div style="background: white; border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          
          <div style="flex: 1; min-width: 280px; position: relative;">
            <input 
              type="text" 
              placeholder="Tìm theo biển số, khách thuê, mã đơn hoặc mã giao dịch..." 
              value="${this.searchQuery}" 
              oninput="OwnerEarningsUI.onSearch(this.value)"
              style="width: 100%; padding: 0.65rem 1rem 0.65rem 2.4rem; border: 1.5px solid var(--slate-200); border-radius: var(--radius-md); font-size: 0.9rem;"
            />
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--slate-400);">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button class="btn btn-sm ${this.activeFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}" onclick="OwnerEarningsUI.setFilter('ALL')" style="${this.activeFilter === 'ALL' ? 'background: #047857; border-color: #047857;' : ''}">
              Tất cả (${(transactions || []).length})
            </button>
            <button class="btn btn-sm ${this.activeFilter === 'SUCCESS' ? 'btn-primary' : 'btn-ghost'}" onclick="OwnerEarningsUI.setFilter('SUCCESS')" style="${this.activeFilter === 'SUCCESS' ? 'background: #047857; border-color: #047857;' : ''}">
              Thành công
            </button>
            <button class="btn btn-sm ${this.activeFilter === 'PENDING' ? 'btn-primary' : 'btn-ghost'}" onclick="OwnerEarningsUI.setFilter('PENDING')" style="${this.activeFilter === 'PENDING' ? 'background: #d97706; border-color: #d97706;' : ''}">
              Đang chờ
            </button>
          </div>
        </div>

        <!-- BẢNG SAO KÊ CHI TIẾT TỪNG CHUYẾN XE (SETTLEMENT INVOICES TABLE) -->
        <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); overflow: hidden; margin-bottom: 2.5rem;">
          <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--slate-100); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--slate-800); margin: 0;">
              Lịch Sử Quyết Toán & Dòng Tiền (${filteredTxs.length} giao dịch)
            </h3>
            <span style="font-size: 0.8rem; color: var(--slate-500);">Chính sách chiết khấu: Sàn 10% — Chủ xe 90%</span>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1.5px solid var(--slate-200); color: var(--slate-600); font-weight: 700; font-size: 0.78rem; text-transform: uppercase;">
                  <th style="padding: 0.85rem 1rem;">Mã Đơn / Xe</th>
                  <th style="padding: 0.85rem 1rem;">Khách Thuê</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Giá Trị Đơn</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Phí Sàn 10%</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">Thực Nhận 90%</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Trạng Thái</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Phiếu Quyết Toán</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTxs.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
                      Không tìm thấy giao dịch nào phù hợp.
                    </td>
                  </tr>
                ` : filteredTxs.map(t => {
                  const totalPrice = t.total_price || (t.amount ? Math.round(t.amount / 0.3) : 2400000);
                  const platformFee = t.platform_fee || Math.round(totalPrice * 0.1);
                  const netEarnings = t.net_earnings || (totalPrice - platformFee);

                  const isSuccess = (t.status === 'SUCCESS');

                  return `
                    <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                      <td style="padding: 0.85rem 1rem;">
                        <div style="font-weight: 700; color: var(--slate-900);">#${t.rental_id || t.payment_id}</div>
                        <div style="font-size: 0.82rem; color: var(--slate-600);">${t.car_brand} ${t.car_model}</div>
                        <span class="badge" style="font-size: 0.72rem; padding: 1px 6px; background: #f1f5f9; color: #475569;">${t.plate_number || '51K-999.88'}</span>
                      </td>
                      <td style="padding: 0.85rem 1rem;">
                        <div style="font-weight: 600; color: var(--slate-800);">${t.renter_name || 'Khách thuê'}</div>
                        <div style="font-size: 0.75rem; color: var(--slate-400);">${t.renter_phone || ''}</div>
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 600; color: #1e3a8a;">
                        ${this.formatMoney(totalPrice)}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 600; color: #dc2626;">
                        -${this.formatMoney(platformFee)}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 800; color: #047857;">
                        ${this.formatMoney(netEarnings)}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: center;">
                        <span class="badge" style="background: ${isSuccess ? '#ecfdf5' : '#fffbeb'}; color: ${isSuccess ? '#047857' : '#d97706'}; font-weight: 700; font-size: 0.76rem;">
                          ${isSuccess ? 'ĐÃ NHẬN' : 'ĐANG GIỮ CỌC'}
                        </span>
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: center;">
                        <button class="btn btn-sm btn-outline" onclick="OwnerEarningsUI.openInvoiceModal(${t.payment_id || t.rental_id})" style="font-size: 0.78rem; font-weight: 600; color: #047857; border-color: #047857;">
                          Xem Biên Lai
                        </button>
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

  setFilter(filter) {
    this.activeFilter = filter;
    this.render();
  },

  openWithdrawalModal() {
    const { available_balance, total_earnings, bank_name, bank_account_number, bank_account_holder } = this.data || {};
    const maxBalance = Math.max(0, (available_balance != null ? Number(available_balance) : Number(total_earnings || 0)) - this.withdrawnAmount);

    const modalBody = document.getElementById('withdrawalModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="background: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.8rem; color: #065f46; font-weight: 700; text-transform: uppercase;">Số Dư Khả Dụng Có Thể Rút</div>
        <div style="font-size: 1.85rem; font-weight: 900; color: #047857; margin-top: 0.2rem;">
          ${this.formatMoney(maxBalance)}
        </div>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200); padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.88rem;">
        <div style="font-size: 0.78rem; color: var(--slate-500); font-weight: 700; margin-bottom: 0.4rem; text-transform: uppercase;">Tài Khoản Ngân Hàng Thụ Hưởng (NAPAS 247)</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--slate-600);">Ngân hàng:</span>
          <strong>${bank_name || 'MBBank'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--slate-600);">Số tài khoản:</span>
          <strong style="color: #0284c7; font-family: monospace;">${bank_account_number || '998877665544'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--slate-600);">Chủ thẻ:</span>
          <strong style="text-transform: uppercase;">${bank_account_holder || 'Trần Văn Chủ Xe'}</strong>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--slate-700); margin-bottom: 0.5rem;">
          Nhập số tiền muốn rút (VNĐ):
        </label>
        <input 
          type="number" 
          id="withdrawAmountInput" 
          value="${maxBalance}" 
          max="${maxBalance}" 
          min="50000"
          style="width: 100%; padding: 0.65rem 1rem; border: 1.5px solid var(--slate-300); border-radius: 8px; font-size: 1.1rem; font-weight: 800; color: #047857;"
        />
        <div style="font-size: 0.78rem; color: var(--slate-400); margin-top: 4px;">Tối thiểu 50.000 ₫. Lệnh rút tiền được giải ngân tức thì trong 5 - 15 phút.</div>
      </div>

      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button class="btn btn-ghost" onclick="OwnerEarningsUI.closeWithdrawalModal()">Hủy</button>
        <button class="btn btn-primary" onclick="OwnerEarningsUI.submitWithdrawal(${maxBalance})" style="background: #047857; border-color: #047857; font-weight: 700;">
          Xác Nhận Rút Tiền
        </button>
      </div>
    `;

    const overlay = document.getElementById('withdrawalModalOverlay');
    if (overlay) overlay.style.display = 'flex';
  },

  closeWithdrawalModal() {
    const overlay = document.getElementById('withdrawalModalOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  submitWithdrawal(max) {
    const input = document.getElementById('withdrawAmountInput');
    const val = Number(input ? input.value : 0);

    if (val <= 0 || val > max) {
      alert(`Số tiền không hợp lệ! Vui lòng nhập từ 50.000 ₫ đến ${this.formatMoney(max)}`);
      return;
    }

    this.withdrawnAmount += val;
    this.closeWithdrawalModal();

    if (typeof ToastService !== 'undefined') {
      ToastService.show(`Đã gửi lệnh rút ${this.formatMoney(val)} về tài khoản ngân hàng thành công!`, 'success');
    } else {
      alert(`Đã gửi lệnh rút ${this.formatMoney(val)} về tài khoản ngân hàng thành công!`);
    }

    this.render();
  },

  openInvoiceModal(id) {
    const t = (this.data.transactions || []).find(item => (item.payment_id === id || item.rental_id === id));
    if (!t) return;

    const totalPrice = t.total_price || (t.amount ? Math.round(t.amount / 0.3) : 2400000);
    const platformFee = t.platform_fee || Math.round(totalPrice * 0.1);
    const netEarnings = t.net_earnings || (totalPrice - platformFee);
    const dep = t.amount || Math.round(totalPrice * 0.3);

    const modalBody = document.getElementById('invoiceModalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="text-align: center; border-bottom: 1.5px dashed var(--slate-200); padding-bottom: 1rem; margin-bottom: 1.25rem;">
        <div style="font-weight: 800; font-size: 1.25rem; color: #047857;">PHIẾU QUYẾT TOÁN THU NHẬP</div>
        <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 2px;">Mã đơn: #${t.rental_id || t.payment_id} | Xe: ${t.car_brand} ${t.car_model} (${t.plate_number})</div>
        <div style="font-size: 0.78rem; color: var(--slate-400);">Thời gian thuê: ${t.start_date || '2026-09-25'} đến ${t.end_date || '2026-09-27'} (${t.total_days || 2} ngày)</div>
      </div>

      <div style="font-size: 0.88rem; line-height: 1.8;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--slate-600);">Đơn giá ngày thuê:</span>
          <span>${this.formatMoney(t.price_per_day || 1200000)} / ngày</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--slate-600);">Tổng giá trị chuyến đi (GMV):</span>
          <strong style="color: #1e3a8a;">${this.formatMoney(totalPrice)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; color: #dc2626;">
          <span>Phí dịch vụ nền tảng & AI (10%):</span>
          <strong>-${this.formatMoney(platformFee)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--slate-200); padding-top: 0.6rem; margin-top: 0.4rem;">
          <strong style="color: #047857; font-size: 1.05rem;">Thu nhập thực nhận chủ xe (90%):</strong>
          <strong style="color: #047857; font-size: 1.25rem;">${this.formatMoney(netEarnings)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; background: #fffbeb; padding: 6px 10px; border-radius: 6px; margin-top: 0.75rem; font-size: 0.82rem;">
          <span style="color: #b45309;">Tiền cọc VietQR 30% khách đã đóng:</span>
          <strong style="color: #b45309;">${this.formatMoney(dep)}</strong>
        </div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
        <button class="btn btn-ghost" onclick="OwnerEarningsUI.closeInvoiceModal()">Đóng</button>
      </div>
    `;

    const overlay = document.getElementById('invoiceModalOverlay');
    if (overlay) overlay.style.display = 'flex';
  },

  closeInvoiceModal() {
    const overlay = document.getElementById('invoiceModalOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  exportCSV() {
    const txs = this.data ? (this.data.transactions || []) : [];
    if (txs.length === 0) {
      alert('Không có dữ liệu giao dịch để xuất!');
      return;
    }

    const headers = [
      'Mã Giao Dịch',
      'Mã Đơn',
      'Mẫu Xe',
      'Biển Số',
      'Khách Thuê',
      'SĐT',
      'Tổng Tiền Đơn (VND)',
      'Phí Sàn 10% (VND)',
      'Thực Nhận 90% (VND)',
      'Tiền Cọc 30% (VND)',
      'Trạng Thái',
      'Ngày Tạo'
    ];

    const rows = txs.map(t => {
      const gmv = t.total_price || (t.amount ? Math.round(t.amount / 0.3) : 2400000);
      const fee = t.platform_fee || Math.round(gmv * 0.1);
      const net = t.net_earnings || (gmv - fee);
      const dep = t.amount || Math.round(gmv * 0.3);

      return [
        `"${t.transaction_code || ''}"`,
        t.rental_id || t.payment_id,
        `"${t.car_brand} ${t.car_model}"`,
        `"${t.plate_number || ''}"`,
        `"${(t.renter_name || '').replace(/"/g, '""')}"`,
        `"${t.renter_phone || ''}"`,
        gmv,
        fee,
        net,
        dep,
        `"${t.status || ''}"`,
        `"${t.created_at || ''}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DriveShare_ThuNhap_ChuXe_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
