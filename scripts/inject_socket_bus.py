import os

# 1. Update frontend/js/api.js
api_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\api.js'
with open(api_path, 'r', encoding='utf-8') as f:
    api = f.read()

# Define DriveShareSocket
socket_code = '''
// ─────────────────────────────────────────────────────────────
// DRIVESHARE REALTIME SOCKET BUS (Cross-Tab & BroadcastChannel)
// Đảm bảo 0ms độ trễ: Đặt đơn là bên kia nhận được ngay lập tức không cần F5!
// ─────────────────────────────────────────────────────────────
const DriveShareSocket = {
  channel: null,
  listeners: [],

  init() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('driveshare_realtime_socket');
        this.channel.onmessage = (event) => {
          if (event && event.data) {
            this._dispatch(event.data);
          }
        };
      }
    } catch (e) {
      console.warn('[DriveShareSocket] BroadcastChannel not supported:', e);
    }

    // Cross-window fallback (storage event fires across different tabs/windows)
    window.addEventListener('storage', (e) => {
      if (e.key === 'driveshare_socket_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          this._dispatch(data);
        } catch (_) {}
      }
    });
    console.log('[DriveShareSocket] Realtime socket bus initialized');
  },

  emit(type, payload = {}) {
    const message = { type, payload, timestamp: Date.now() };
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (_) {}
    }
    try {
      localStorage.setItem('driveshare_socket_event', JSON.stringify(message));
    } catch (_) {}
    // Dispatch locally too
    this._dispatch(message, true);
  },

  on(type, callback) {
    this.listeners.push({ type, callback });
  },

  _dispatch(data, isLocal = false) {
    if (!data || !data.type) return;
    console.log(`[DriveShareSocket ${isLocal ? 'Local' : 'Remote'}]`, data.type, data.payload);

    // Tự động làm mới chuông thông báo
    if (typeof NotificationCenter !== 'undefined' && NotificationCenter.refresh) {
      setTimeout(() => NotificationCenter.refresh(), 100);
    }

    this.listeners
      .filter(l => l.type === data.type || l.type === '*')
      .forEach(l => {
        try {
          l.callback(data.payload, data.type, isLocal);
        } catch (err) {
          console.error('[DriveShareSocket Error in listener]:', err);
        }
      });
  }
};
DriveShareSocket.init();
'''

if 'const DriveShareSocket =' not in api:
    api = socket_code + '\n' + api

# Emit in RentalAPI.createRental
old_create_return = 'return res;'
# In RentalAPI:
target_create_rental = '''  createRental(rentalData) {
    return apiCall('/rentals', 'POST', rentalData);
  },'''

repl_create_rental = '''  async createRental(rentalData) {
    const res = await apiCall('/rentals', 'POST', rentalData);
    if (res && (res.code === 200 || res.success || res.status === 201)) {
      if (typeof DriveShareSocket !== 'undefined') {
        DriveShareSocket.emit('RENTAL_CREATED', res.data || {});
      }
    }
    return res;
  },'''

if target_create_rental in api:
    api = api.replace(target_create_rental, repl_create_rental)

# Emit in RentalAPI.approveRental
target_approve_return = 'return data;'
repl_approve_return = '''if (data && (data.success || data.code === 200)) {
        if (typeof DriveShareSocket !== 'undefined') {
          DriveShareSocket.emit('RENTAL_APPROVED', data.data || { rental_id: rentalId });
        }
      }
      return data;'''

if 'DriveShareSocket.emit(\'RENTAL_APPROVED\'' not in api:
    api = api.replace('return data;\n    } catch (err) {\n      console.warn(\'[RentalAPI] approveRental offline/error:\'', repl_approve_return + '\n    } catch (err) {\n      console.warn(\'[RentalAPI] approveRental offline/error:\'')

# Emit in RentalAPI.rejectRental
target_reject_return = 'return data;\n    } catch (err) {\n      console.warn(\'[RentalAPI] rejectRental offline/error:\''
repl_reject_return = '''if (data && (data.success || data.code === 200)) {
        if (typeof DriveShareSocket !== 'undefined') {
          DriveShareSocket.emit('RENTAL_REJECTED', data.data || { rental_id: rentalId, reason: reason });
        }
      }
      return data;\n    } catch (err) {\n      console.warn(\'[RentalAPI] rejectRental offline/error:\''''

if 'DriveShareSocket.emit(\'RENTAL_REJECTED\'' not in api:
    api = api.replace(target_reject_return, repl_reject_return)

# Emit in PaymentAPI.confirmPayment
target_pay_confirm = '''  confirmPayment(paymentId) {
    return apiCall(`/payments/${paymentId}/confirm`, 'POST');
  },'''

repl_pay_confirm = '''  async confirmPayment(paymentId) {
    const res = await apiCall(`/payments/${paymentId}/confirm`, 'POST');
    if (res && (res.code === 200 || res.success)) {
      if (typeof DriveShareSocket !== 'undefined') {
        DriveShareSocket.emit('PAYMENT_CONFIRMED', res.data || { payment_id: paymentId });
      }
    }
    return res;
  },'''

if target_pay_confirm in api:
    api = api.replace(target_pay_confirm, repl_pay_confirm)

# NotificationCenter polling interval -> 2000ms
api = api.replace('this._interval = setInterval(() => this.refresh(), 3000);', 'this._interval = setInterval(() => this.refresh(), 2000);')

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(api)
print("Updated frontend/js/api.js with DriveShareSocket")

# 2. Update frontend/js/owner.js
owner_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\owner.js'
with open(owner_path, 'r', encoding='utf-8') as f:
    ow = f.read()

# Make interval 1500ms
ow = ow.replace('}, 5000);', '}, 1500);')

# Register socket listener in owner.js
owner_socket_listener = '''
// Lắng nghe sự kiện Realtime Socket cho Phân hệ Chủ xe
if (typeof DriveShareSocket !== 'undefined') {
  DriveShareSocket.on('RENTAL_CREATED', async (data) => {
    console.log('[OwnerRealtime] Nhận tín hiệu RENTAL_CREATED tức thì qua Socket:', data);
    if (typeof OwnerService !== 'undefined') {
      await OwnerService.renderOwnerPortal();
      OwnerService.showToast('🔔 Khách vừa gửi yêu cầu thuê xe mới #' + (data?.rental_id || data?.id || '') + '!', 'info', 4000);
    }
  });

  DriveShareSocket.on('PAYMENT_CONFIRMED', async (data) => {
    console.log('[OwnerRealtime] Nhận tín hiệu PAYMENT_CONFIRMED tức thì qua Socket:', data);
    if (typeof OwnerService !== 'undefined') {
      await OwnerService.renderOwnerPortal();
      OwnerService.showToast('💰 Khách đã đặt cọc 30% cho đơn #' + (data?.rental_id || '') + '! Đơn xe đã xác nhận (CONFIRMED).', 'success', 5000);
    }
  });
}
'''

if 'Nhận tín hiệu RENTAL_CREATED tức thì' not in ow:
    ow = ow + '\n' + owner_socket_listener
    with open(owner_path, 'w', encoding='utf-8') as f:
        f.write(ow)
    print("Updated frontend/js/owner.js with realtime listeners")

# 3. Update frontend/js/app.js
app_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    ap = f.read()

app_socket_listener = '''
// Lắng nghe sự kiện Realtime Socket cho Phân hệ Khách thuê (Renter)
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
}
'''

if 'Nhận tín hiệu RENTAL_APPROVED tức thì' not in ap:
    ap = ap + '\n' + app_socket_listener
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(ap)
    print("Updated frontend/js/app.js with realtime listeners")

# 4. Update frontend/js/payment.js
pay_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\payment.js'
with open(pay_path, 'r', encoding='utf-8') as f:
    py = f.read()

pay_socket_listener = '''
// Lắng nghe sự kiện PAYMENT_CONFIRMED tức thì qua Socket tại Cổng thanh toán
if (typeof DriveShareSocket !== 'undefined') {
  DriveShareSocket.on('PAYMENT_CONFIRMED', (data) => {
    console.log('[PaymentRealtime] Nhận tín hiệu PAYMENT_CONFIRMED qua Socket:', data);
    if (typeof PaymentView !== 'undefined' && PaymentView.handlePaymentSuccessTransition) {
      PaymentView.handlePaymentSuccessTransition(data);
    }
  });
}
'''

if 'Nhận tín hiệu PAYMENT_CONFIRMED qua Socket' not in py:
    py = py + '\n' + pay_socket_listener
    with open(pay_path, 'w', encoding='utf-8') as f:
        f.write(py)
    print("Updated frontend/js/payment.js with realtime listeners")

