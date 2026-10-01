/**
 * DRIVESHARE — Dữ liệu ban đầu (Seed Data)
 * Toàn bộ dữ liệu được tải động từ Backend API (PostgreSQL DB).
 * Đã dọn dẹp toàn bộ dữ liệu mẫu cục bộ (mock data).
 */

const INITIAL_DATA = {
  // 1. Danh sách xe — ĐÃ XÓA DỮ LIỆU ẢO (Load từ API: GET /api/v1/public/cars/search)
  cars: [],

  // 2. Danh sách Chủ xe — ĐÃ XÓA DỮ LIỆU ẢO (Load từ API: GET /api/v1/admin/users)
  owners: [],

  // 2.1. Danh sách người dùng toàn sàn — ĐÃ XÓA DỮ LIỆU ẢO (Load từ API: GET /api/v1/admin/users)
  users: [],

  // 3. Khách thuê — ĐÃ XÓA DỮ LIỆU ẢO (Load từ API: GET /api/v1/admin/users)
  renters: [],

  // 4. Danh sách đơn đặt xe — ĐÃ XÓA DỮ LIỆU ẢO (Load từ API: GET /api/v1/admin/rentals)
  bookings: [],

  // 5. Cấu hình hệ thống (System Configs)
  configs: {
    deposit_rate: 0.3,
    insurance_fee_per_day: 100000,
    free_cancellation_hours: 1,
    bank_info: {
      bank_name: "Ngân hàng Quân Đội (MB Bank)",
      account_number: "090123456789",
      account_name: "CONG TY CP DRIVESHARE VIETNAM"
    }
  }
};
