import re

path = r'thueXe_Online\frontend\js\app.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update App.init routing check and add hashchange + autoSync
old_init_check = """    // 6. Kiểm tra URL param hoặc hash để mở trực tiếp Chuyến đi
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'trips' || window.location.hash === '#trips' || window.location.hash === '#my-trips') {
      setTimeout(() => this.showMyBookingsView(), 150);
    }"""

new_init_check = """    // 6. Kiểm tra URL param hoặc hash để mở trực tiếp Chuyến đi (giữ vững trang hiện tại, tuyệt đối không nhảy về trang chủ ngoài ý muốn)
    const urlParams = new URLSearchParams(window.location.search);
    const hash = (window.location.hash || '').toLowerCase();
    const savedView = sessionStorage.getItem('driveshare_renter_view');
    const isTripsTarget = (
      urlParams.get('tab') === 'trips' ||
      hash === '#trips' ||
      hash === '#my-trips' ||
      hash === '#my-bookings' ||
      hash === '#bookings' ||
      savedView === 'myBookings'
    );
    if (isTripsTarget) {
      setTimeout(() => this.showMyBookingsView(), 80);
    }

    // Lắng nghe hashchange để điều hướng mượt mà không reload
    window.addEventListener('hashchange', () => {
      const h = (window.location.hash || '').toLowerCase();
      if (h === '#my-bookings' || h === '#trips' || h === '#my-trips' || h === '#bookings') {
        this.showMyBookingsView();
      } else if (h === '' || h === '#home' || h === '#catalog') {
        this.showCatalogView();
      }
    });

    // Khởi chạy vòng đồng bộ thời gian thực tự động
    this.startAutoSync();"""

assert old_init_check in text, "old_init_check not found"
text = text.replace(old_init_check, new_init_check, 1)

# 2. Update showMyBookingsView to persist view and hash
old_show_bookings = """  // Hiển thị màn hình "Chuyến của tôi" (cho Renter - Giai đoạn 1 v2.0.0)
  async showMyBookingsView() {
    const renterView = document.getElementById('renterSection');"""

new_show_bookings = """  // Hiển thị màn hình "Chuyến của tôi" (cho Renter - Giai đoạn 1 v2.0.0)
  async showMyBookingsView() {
    try {
      sessionStorage.setItem('driveshare_renter_view', 'myBookings');
      history.replaceState(null, '', '#my-bookings');
    } catch (_) {}
    const renterView = document.getElementById('renterSection');"""

assert old_show_bookings in text, "old_show_bookings not found"
text = text.replace(old_show_bookings, new_show_bookings, 1)

# 3. Update showCatalogView to persist view and clear hash
old_show_catalog = """  showCatalogView() {
    // Ẩn Chuyến đi của tôi, hiện lại renterSection
    const renterView = document.getElementById('renterSection');"""

new_show_catalog = """  showCatalogView() {
    try {
      sessionStorage.setItem('driveshare_renter_view', 'catalog');
      history.replaceState(null, '', window.location.pathname);
    } catch (_) {}
    // Ẩn Chuyến đi của tôi, hiện lại renterSection
    const renterView = document.getElementById('renterSection');"""

assert old_show_catalog in text, "old_show_catalog not found"
text = text.replace(old_show_catalog, new_show_catalog, 1)

# 4. Add refreshMyBookings and startAutoSync right before showCatalogView
target_before_catalog = """  showCatalogView() {"""
methods_to_add = """  // Làm mới danh sách đơn thuê của tôi tức thời (Realtime & Silent Sync)
  async refreshMyBookings(silent = true) {
    if (typeof RentalAPI === 'undefined' || !RentalAPI.getMyRentals) return;
    try {
      const res = await RentalAPI.getMyRentals();
      if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
        this.cachedMyBookings = res.data;
        const myBookingsView = document.getElementById('myBookingsSection');
        if (myBookingsView && myBookingsView.style.display !== 'none') {
          RenderService.renderMyBookings(
            this.cachedMyBookings,
            'myBookingsListContainer',
            this.currentTripTab || 'ALL',
            this.currentTripSearch || ''
          );
        }
        // Nếu Shopee Trip Tracker Modal đang mở thì đồng bộ luôn tiến trình bên trong
        if (typeof TripTrackerService !== 'undefined' && TripTrackerService.currentRentalId) {
          const trackerEl = document.getElementById('tripTrackerModal');
          if (trackerEl && trackerEl.style.display !== 'none') {
            await TripTrackerService.openTrackerModal(TripTrackerService.currentRentalId);
          }
        }
        this.updateBookingCountBadge();
      }
    } catch (err) {
      if (!silent) console.warn('[App] refreshMyBookings error:', err);
    }
  },

  startAutoSync() {
    if (this._autoSyncTimer) return;
    this._autoSyncTimer = setInterval(async () => {
      const myBookingsView = document.getElementById('myBookingsSection');
      const isVisible = myBookingsView && myBookingsView.style.display !== 'none';
      const isTrackerOpen = typeof TripTrackerService !== 'undefined' && Boolean(TripTrackerService.currentRentalId);
      if (isVisible || isTrackerOpen) {
        await this.refreshMyBookings(true);
      }
    }, 1500);
  },

  showCatalogView() {"""

text = text.replace(target_before_catalog, methods_to_add, 1)

# 5. Fix confirmHandoverInspection: remove window.location.reload()
old_inspection_reload = """        // Tải lại danh sách chuyến đi của khách
        if (this.renderMyBookings) {
          this.renderMyBookings();
        } else {
          setTimeout(() => window.location.reload(), 1000);
        }"""

new_inspection_reload = """        // Tải lại danh sách chuyến đi của khách (tại chỗ, không reload web)
        if (typeof this.refreshMyBookings === 'function') {
          await this.refreshMyBookings();
        } else if (typeof this.showMyBookingsView === 'function') {
          await this.showMyBookingsView();
        }"""

assert old_inspection_reload in text, "old_inspection_reload not found"
text = text.replace(old_inspection_reload, new_inspection_reload, 1)

# 6. Update Realtime Socket listeners and alias at bottom
old_socket_block = """// Lắng nghe sự kiện Realtime Socket cho Phân hệ Khách thuê (Renter)
if (typeof DriveShareSocket !== 'undefined') {
  DriveShareSocket.on('RENTAL_APPROVED', async (data) => {
    console.log('[RenterRealtime] Nhận tín hiệu RENTAL_APPROVED tức thì qua Socket:', data);
    if (typeof App !== 'undefined' && App.renderMyBookings) {
      await App.renderMyBookings();
    }
    if (typeof showToast === 'function') {
      showToast('🎉 Chủ xe đã duyệt yêu cầu thuê xe #' + (data?.rental_id || data?.id || '') + '! Bạn có thể bấm Đặt cọc 30% ngay.', 'success', 6000);
    } else if (typeof toast !== 'undefined' && toast.success) {
      toast.success('🎉 Chủ xe đã duyệt yêu cầu thuê xe #' + (data?.rental_id || data?.id || '') + '!');
    }
  });

  DriveShareSocket.on('RENTAL_REJECTED', async (data) => {
    console.log('[RenterRealtime] Nhận tín hiệu RENTAL_REJECTED tức thì qua Socket:', data);
    if (typeof App !== 'undefined' && App.renderMyBookings) {
      await App.renderMyBookings();
    }
    if (typeof showToast === 'function') {
      showToast('Đơn thuê xe #' + (data?.rental_id || data?.id || '') + ' đã bị từ chối.', 'warning', 4000);
    }
  });

  DriveShareSocket.on('PAYMENT_CONFIRMED', async (data) => {
    console.log('[RenterRealtime] Nhận tín hiệu PAYMENT_CONFIRMED tức thì qua Socket:', data);
    if (typeof App !== 'undefined' && App.renderMyBookings) {
      await App.renderMyBookings();
    }
  });
}"""

new_socket_block = """// Alias an toàn
if (typeof App !== 'undefined') {
  App.renderMyBookings = App.refreshMyBookings;
}

// Lắng nghe sự kiện Realtime Socket cho Phân hệ Khách thuê (Renter)
if (typeof DriveShareSocket !== 'undefined') {
  DriveShareSocket.on('RENTAL_APPROVED', async (data) => {
    console.log('[RenterRealtime] Nhận tín hiệu RENTAL_APPROVED tức thì qua Socket:', data);
    if (typeof App !== 'undefined') {
      if (App.refreshMyBookings) await App.refreshMyBookings();
      else if (App.showMyBookingsView) await App.showMyBookingsView();
    }
    if (typeof TripTrackerService !== 'undefined' && TripTrackerService.currentRentalId) {
      await TripTrackerService.openTrackerModal(TripTrackerService.currentRentalId);
    }
    if (typeof NotificationCenter !== 'undefined' && NotificationCenter.refresh) {
      NotificationCenter.refresh();
    }
    if (typeof showToast === 'function') {
      showToast('🎉 Chủ xe đã duyệt yêu cầu thuê xe #' + (data?.rental_id || data?.id || '') + '! Tiến trình đã nhảy sang bước Cọc 30%.', 'success', 6000);
    } else if (typeof toast !== 'undefined' && toast.success) {
      toast.success('🎉 Chủ xe đã duyệt yêu cầu thuê xe #' + (data?.rental_id || data?.id || '') + '!');
    }
  });

  DriveShareSocket.on('RENTAL_REJECTED', async (data) => {
    console.log('[RenterRealtime] Nhận tín hiệu RENTAL_REJECTED tức thì qua Socket:', data);
    if (typeof App !== 'undefined' && App.refreshMyBookings) {
      await App.refreshMyBookings();
    }
    if (typeof NotificationCenter !== 'undefined' && NotificationCenter.refresh) {
      NotificationCenter.refresh();
    }
    if (typeof showToast === 'function') {
      showToast('Đơn thuê xe #' + (data?.rental_id || data?.id || '') + ' đã bị từ chối.', 'warning', 4000);
    }
  });

  DriveShareSocket.on('PAYMENT_CONFIRMED', async (data) => {
    console.log('[RenterRealtime] Nhận tín hiệu PAYMENT_CONFIRMED tức thì qua Socket:', data);
    if (typeof App !== 'undefined') {
      if (App.refreshMyBookings) await App.refreshMyBookings();
      else if (App.showMyBookingsView) await App.showMyBookingsView();
    }
    if (typeof TripTrackerService !== 'undefined' && TripTrackerService.currentRentalId) {
      await TripTrackerService.openTrackerModal(TripTrackerService.currentRentalId);
    }
    if (typeof NotificationCenter !== 'undefined' && NotificationCenter.refresh) {
      NotificationCenter.refresh();
    }
    if (typeof showToast === 'function') {
      showToast('🚗 Ngân hàng xác nhận tiền về! Đặt cọc 30% thành công.', 'success', 5000);
    }
  });
}"""

assert old_socket_block in text, "old_socket_block not found"
text = text.replace(old_socket_block, new_socket_block, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("app.js updated successfully!")

