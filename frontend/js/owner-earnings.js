/**
 * DRIVESHARE — Owner Earnings & Payment History (Chí Tín: CRP-54)
 * Quản lý thống kê tổng doanh thu, tiền cọc và lịch sử dòng tiền của chủ xe
 */

const OwnerEarningsUI = {
  data: null,
  activeFilter: 'ALL',
  searchQuery: '',

  async init() {
    const container = document.getElementById('ownerEarningsContainer');
    if (!container) return;

    this.renderLoading();

    // Gọi API Backend: GET /api/v1/owner/earnings
    const res = await PaymentAPI.getOwnerEarnings();

    if (res.success && res.data) {
      this.data = res.data;
      this.render();
    } else {
      // Fallback lấy dữ liệu local storage nếu offline/mock
      this.loadFallbackData();
      this.render();
    }
  },

  loadFallbackData() {
    let bookings = [];
    if (typeof StorageService !== 'undefined') {
      bookings = StorageService.getBookings() || [];
    }

    // Mock calculations
    let totalEarnings = 0;
    let pendingEarnings = 0;
    const txs = [];

    bookings.forEach((b, idx) => {
      const dep = b.deposit_amount || Math.round(b.total_amount * 0.3);
      const isSuccess = (b.status === 'CONFIRMED' || b.status === 'DEPOSIT_PAID' || b.deposit_status === 'PAID');
      
      if (isSuccess) {
        totalEarnings += dep;
      } else if (b.status === 'APPROVED' || b.status === 'PENDING') {
        pendingEarnings += dep;
      }

      txs.push({
        payment_id: 100 + idx,
        rental_id: b.id,
        car_brand: b.car_name ? b.car_name.split(' ')[0] : 'VinFast',
        car_model: b.car_name ? b.car_name.split(' ').slice(1).join(' ') : 'VF8',
        plate_number: b.car_plate || '51K-999.88',
        renter_name: b.renter_name || 'Khách thuê',
        renter_phone: b.renter_phone || '0988 776 655',
        amount: dep,
        payment_type: 'DEPOSIT',
        payment_method: 'VIETQR',
        status: isSuccess ? 'SUCCESS' : (b.status === 'REJECTED' || b.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING'),
        transaction_code: `DSPAY_${b.id}_${Date.now()}`,
        created_at: new Date().toISOString(),
        start_date: b.start_time,
        end_date: b.end_time
      });
    });

    this.data = {
      owner_id: 2,
      total_earnings: totalEarnings || 2700000,
      pending_earnings: pendingEarnings || 900000,
      completed_rentals: bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'DEPOSIT_PAID').length || 2,
      total_transactions: txs.length || 3,
      transactions: txs.length > 0 ? txs : [
        {
          payment_id: 101,
          rental_id: 1,
          car_brand: "VinFast",
          car_model: "VF8",
          plate_number: "51K-999.88",
          renter_name: "Lê Hoàng Nam",
          renter_phone: "0988 776 655",
          amount: 720000,
          payment_type: "DEPOSIT",
          payment_method: "VIETQR",
          status: "SUCCESS",
          transaction_code: "DSPAY1_172728900",
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
          renter_phone: "0977 665 544",
          amount: 900000,
          payment_type: "DEPOSIT",
          payment_method: "VIETQR",
          status: "PENDING",
          transaction_code: "DSPAY2_172728955",
          created_at: new Date().toISOString(),
          start_date: "2026-10-01",
          end_date: "2026-10-03"
        }
      ]
    };
  },

  renderLoading() {
    const container = document.getElementById('ownerEarningsContainer');
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="margin: 0 auto 1.5rem auto; width: 44px; height: 44px; border: 3px solid var(--slate-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <h3 style="font-size: 1.15rem; color: var(--slate-800); font-weight: 700;">Đang tải dữ liệu doanh thu...</h3>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  },

  render() {
    const container = document.getElementById('ownerEarningsContainer');
    if (!this.data) return;

    const { total_earnings, pending_earnings, completed_rentals, total_transactions, transactions } = this.data;

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

    container.innerHTML = `
      <!-- TOP HEADER -->
      <div class="portal-header" style="margin-bottom: 2rem;">
        <div class="container portal-title-row">
          <div class="portal-title-group">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--slate-900);">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Doanh Thu & Lịch Sử Thanh Toán
            </h2>
            <div class="portal-subtitle">Theo dõi dòng tiền cọc VietQR và thu nhập từ các xe cho thuê (CRP-54)</div>
          </div>
          <div style="display: flex; gap: 0.65rem; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="OwnerEarningsUI.exportCSV()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Xuất Excel / CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="OwnerEarningsUI.init()">
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- 4 CARDS THỐNG KÊ DOANH THU -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
          
          <!-- Card 1: Tổng doanh thu đã nhận -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Doanh thu đã nhận</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #ecfdf5; color: #10b981; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ₫
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #059669; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(total_earnings)}
            </div>
            <div style="font-size: 0.78rem; color: #10b981;">Đã thanh toán cọc thành công (SUCCESS)</div>
          </div>

          <!-- Card 2: Tiền cọc đang chờ duyệt/chuyển -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Cọc chờ thanh toán</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #fffbeb; color: #f59e0b; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ⏳
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #d97706; margin: 0.65rem 0 0.2rem 0;">
              ${this.formatMoney(pending_earnings)}
            </div>
            <div style="font-size: 0.78rem; color: #d97706;">Đơn APPROVED chờ khách quét QR (PENDING)</div>
          </div>

          <!-- Card 3: Số chuyến đã xác nhận -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Số chuyến giữ chỗ</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                🚗
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #1d4ed8; margin: 0.65rem 0 0.2rem 0;">
              ${completed_rentals || 0}
            </div>
            <div style="font-size: 0.78rem; color: #3b82f6;">Trạng thái CONFIRMED / DEPOSIT_PAID</div>
          </div>

          <!-- Card 4: Tổng giao dịch thanh toán -->
          <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.35rem; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Tổng số giao dịch</span>
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                🧾
              </div>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: var(--slate-800); margin: 0.65rem 0 0.2rem 0;">
              ${total_transactions || (transactions ? transactions.length : 0)}
            </div>
            <div style="font-size: 0.78rem; color: var(--slate-500);">Bao gồm VietQR, Chuyển khoản</div>
          </div>
        </div>

        <!-- BẢNG LỊCH SỬ GIAO DỊCH -->
        <div style="background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm); overflow: hidden; margin-bottom: 3rem;">
          
          <!-- Thanh công cụ tìm kiếm và lọc -->
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            
            <!-- Tabs lọc trạng thái -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.activeFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}" onclick="OwnerEarningsUI.setFilter('ALL')">Tất cả (${transactions ? transactions.length : 0})</button>
              <button class="btn btn-sm ${this.activeFilter === 'SUCCESS' ? 'btn-primary' : 'btn-outline'}" onclick="OwnerEarningsUI.setFilter('SUCCESS')">Thành công</button>
              <button class="btn btn-sm ${this.activeFilter === 'PENDING' ? 'btn-primary' : 'btn-outline'}" onclick="OwnerEarningsUI.setFilter('PENDING')">Chờ cọc</button>
              <button class="btn btn-sm ${this.activeFilter === 'CANCELLED' ? 'btn-primary' : 'btn-outline'}" onclick="OwnerEarningsUI.setFilter('CANCELLED')">Đã hủy / Lỗi</button>
            </div>

            <!-- Ô tìm kiếm -->
            <div style="min-width: 240px; position: relative;">
              <input type="text" class="form-control" placeholder="Tìm theo xe, biển số, khách..." value="${this.searchQuery}" oninput="OwnerEarningsUI.setSearch(this.value)" style="padding-left: 2rem; font-size: 0.85rem;" />
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--slate-400)" stroke-width="2" style="position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>

          <!-- Bảng chi tiết -->
          <div style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
              <thead>
                <tr style="background: var(--slate-50); border-bottom: 1.5px solid var(--slate-200); text-align: left; color: var(--slate-600); font-size: 0.8rem; text-transform: uppercase;">
                  <th style="padding: 0.85rem 1.25rem;">Mã GD</th>
                  <th style="padding: 0.85rem 1rem;">Phương tiện</th>
                  <th style="padding: 0.85rem 1rem;">Khách thuê</th>
                  <th style="padding: 0.85rem 1rem;">Lịch thuê</th>
                  <th style="padding: 0.85rem 1rem;">Tiền cọc (30%)</th>
                  <th style="padding: 0.85rem 1rem;">Phương thức</th>
                  <th style="padding: 0.85rem 1rem;">Trạng thái</th>
                  <th style="padding: 0.85rem 1.25rem;">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTxs.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--slate-500);">
                      Không tìm thấy giao dịch nào phù hợp
                    </td>
                  </tr>
                ` : filteredTxs.map(t => {
                  let badge = `<span class="badge badge-warning">Đang chờ</span>`;
                  if (t.status === 'SUCCESS') badge = `<span class="badge badge-success" style="background: #10b981; color: white;">Thành công</span>`;
                  else if (t.status === 'FAILED') badge = `<span class="badge badge-danger" style="background: #ef4444; color: white;">Thất bại</span>`;
                  else if (t.status === 'CANCELLED') badge = `<span class="badge" style="background: #94a3b8; color: white;">Đã hủy</span>`;

                  return `
                    <tr style="border-bottom: 1px solid var(--slate-100); transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                      <td style="padding: 1rem 1.25rem;">
                        <span style="font-family: monospace; font-weight: 700; color: var(--slate-900); font-size: 0.84rem;">#${t.payment_id}</span>
                        <div style="font-size: 0.72rem; color: var(--slate-400);">${t.transaction_code || ''}</div>
                      </td>
                      <td style="padding: 1rem;">
                        <div style="font-weight: 700; color: var(--slate-900);">${t.car_brand || ''} ${t.car_model || ''}</div>
                        <span class="badge badge-outline" style="font-size: 0.72rem; margin-top: 2px;">${t.plate_number || 'N/A'}</span>
                      </td>
                      <td style="padding: 1rem;">
                        <div style="font-weight: 600; color: var(--slate-900);">${t.renter_name || 'Khách vãng lai'}</div>
                        <div style="font-size: 0.75rem; color: var(--slate-500);">${t.renter_phone || ''}</div>
                      </td>
                      <td style="padding: 1rem; font-size: 0.82rem; color: var(--slate-600);">
                        ${t.start_date || 'N/A'} &rarr; ${t.end_date || 'N/A'}
                      </td>
                      <td style="padding: 1rem;">
                        <span style="font-weight: 800; color: ${t.status === 'SUCCESS' ? '#059669' : 'var(--slate-900)'}; font-size: 0.95rem;">
                          ${this.formatMoney(t.amount)}
                        </span>
                      </td>
                      <td style="padding: 1rem;">
                        <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
                          ${t.payment_method || 'VIETQR'}
                        </span>
                      </td>
                      <td style="padding: 1rem;">
                        ${badge}
                      </td>
                      <td style="padding: 1rem 1.25rem; font-size: 0.78rem; color: var(--slate-500);">
                        ${t.paid_at ? new Date(t.paid_at).toLocaleString('vi-VN') : (t.created_at ? new Date(t.created_at).toLocaleString('vi-VN') : 'Hôm nay')}
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

  setFilter(filter) {
    this.activeFilter = filter;
    this.render();
  },

  setSearch(val) {
    this.searchQuery = val;
    this.render();
  },

  exportCSV() {
    if (!this.data || !this.data.transactions || this.data.transactions.length === 0) {
      if (typeof showToast === 'function') showToast('Không có dữ liệu giao dịch để xuất file', 'warning');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Mã GD,Mã đơn thuê,Xe,Biển số,Khách thuê,SĐT,Số tiền cọc,Phương thức,Trạng thái,Thời gian\n';

    this.data.transactions.forEach(t => {
      const row = [
        `"${t.payment_id}"`,
        `"${t.rental_id}"`,
        `"${t.car_brand} ${t.car_model}"`,
        `"${t.plate_number}"`,
        `"${t.renter_name || ''}"`,
        `"${t.renter_phone || ''}"`,
        `"${t.amount}"`,
        `"${t.payment_method}"`,
        `"${t.status}"`,
        `"${t.created_at || ''}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DriveShare_DoanhThu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof showToast === 'function') showToast('Đã xuất file báo cáo doanh thu thành công!', 'success');
  },

  formatMoney(num) {
    if (!num) return '0 ₫';
    return Number(num).toLocaleString('vi-VN') + ' ₫';
  }
};
