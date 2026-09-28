/**
 * DRIVESHARE — Dữ liệu ban đầu (Seed Data)
 * Bám sát 100% Cơ sở dữ liệu docs/database_schema.sql và thực tế thị trường xe tại Việt Nam
 * Không sử dụng emoji, giữ phong cách chuyên nghiệp chuẩn mực
 */

const INITIAL_DATA = {
  // 1. Danh sách xe — ĐÃ XÓA DỮ LIỆU ẢO
  // Toàn bộ xe được load từ Backend API: GET /api/v1/public/cars/search
  // StorageService.getCars() sẽ trả về mảng rỗng khi backend online
  // 1. Danh sách xe — ĐÃ XÓA DỮ LIỆU ẢO
  // Toàn bộ xe được load từ Backend API: GET /api/v1/public/cars/search
  // StorageService.getCars() sẽ trả về [] rỗng khi backend online.
  cars: [],

  // 2. Danh sách Chủ xe (Owners)
  owners: [
    {
      id: 1,
      name: "Nguyễn Văn Hùng",
      email: "owner.hung@gmail.com",
      phone: "0901 234 567",
      address: "Quận 1, TP.HCM",
      cars_count: 3,
      rating: 4.9,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      verification_status: "VERIFIED"
    },
    {
      id: 2,
      name: "Trần Thị Lan",
      email: "owner.lan@gmail.com",
      phone: "0912 345 678",
      address: "Quận 7, TP.HCM",
      cars_count: 3,
      rating: 4.95,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      verification_status: "VERIFIED"
    },
    {
      id: 3,
      name: "Lê Tuấn Kiệt",
      email: "owner.kiet@gmail.com",
      phone: "0988 123 456",
      address: "Cầu Giấy, Hà Nội",
      cars_count: 2,
      rating: 5.0,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      verification_status: "PENDING"
    }
  ],

  // 2.1. Danh sách người dùng toàn sàn (Users & Roles)
  users: [
    {
      user_id: 1,
      username: "hung_toyota",
      email: "owner.hung@gmail.com",
      phone: "0901 234 567",
      full_name: "Nguyễn Văn Hùng",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      roles: ["owner"],
      created_at: "2026-08-10 08:30",
      owner_profile: {
        bank_name: "Techcombank",
        bank_account_number: "1903345678901",
        verification_status: "VERIFIED"
      }
    },
    {
      user_id: 2,
      username: "lan_vinfast",
      email: "owner.lan@gmail.com",
      phone: "0912 345 678",
      full_name: "Trần Thị Lan",
      avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      roles: ["owner"],
      created_at: "2026-08-12 14:15",
      owner_profile: {
        bank_name: "Vietcombank",
        bank_account_number: "0071001234567",
        verification_status: "VERIFIED"
      }
    },
    {
      user_id: 3,
      username: "kiet_sedan",
      email: "owner.kiet@gmail.com",
      phone: "0988 123 456",
      full_name: "Lê Tuấn Kiệt",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      status: "PENDING",
      roles: ["owner"],
      created_at: "2026-09-01 10:20",
      owner_profile: {
        bank_name: "MB Bank",
        bank_account_number: "0988123456",
        verification_status: "PENDING"
      }
    },
    {
      user_id: 4,
      username: "nam_renter",
      email: "renter.nam@gmail.com",
      phone: "0988 776 655",
      full_name: "Lê Hoàng Nam",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      roles: ["renter"],
      created_at: "2026-08-15 09:00",
      renter_profile: {
        license_number: "B2-790123456789",
        license_verification_status: "VERIFIED"
      }
    },
    {
      user_id: 5,
      username: "mai_phuong",
      email: "renter.mai@gmail.com",
      phone: "0977 665 544",
      full_name: "Nguyễn Phương Mai",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      roles: ["renter"],
      created_at: "2026-08-25 16:40",
      renter_profile: {
        license_number: "B1-790987654321",
        license_verification_status: "PENDING"
      }
    },
    {
      user_id: 6,
      username: "hoang_owner_new",
      email: "owner.hoang@gmail.com",
      phone: "0933 112 233",
      full_name: "Đỗ Hoàng Gia",
      avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
      status: "PENDING",
      roles: ["owner"],
      created_at: "2026-09-12 11:30",
      owner_profile: {
        bank_name: "VPBank",
        bank_account_number: "1122334455",
        verification_status: "PENDING"
      }
    },
    {
      user_id: 7,
      username: "admin_tin",
      email: "admin.tin@driveshare.vn",
      phone: "0909 999 888",
      full_name: "Nguyễn Trọng Tín",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      roles: ["admin", "staff"],
      created_at: "2026-07-01 08:00"
    },
    {
      user_id: 8,
      username: "staff_huong",
      email: "staff.huong@driveshare.vn",
      phone: "0908 777 666",
      full_name: "Võ Thu Hương",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      roles: ["staff"],
      created_at: "2026-07-15 09:30"
    },
    {
      user_id: 9,
      username: "bad_renter",
      email: "spammer@gmail.com",
      phone: "0903 000 111",
      full_name: "Phạm Văn Cảnh Cáo",
      avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
      status: "LOCKED",
      roles: ["renter"],
      created_at: "2026-08-05 13:20"
    },
    {
      user_id: 10,
      username: "owner_rejected",
      email: "owner.tuan@gmail.com",
      phone: "0904 444 333",
      full_name: "Trần Anh Tuấn",
      avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      roles: ["owner"],
      created_at: "2026-08-18 10:00",
      owner_profile: {
        bank_name: "ACB",
        bank_account_number: "888999123",
        verification_status: "REJECTED"
      }
    }
  ],

  // 3. Khách thuê (Renters)
  renters: [
    {
      id: 1,
      name: "Lê Hoàng Nam",
      email: "renter.nam@gmail.com",
      phone: "0988 776 655",
      license_number: "B2-790123456789",
      license_status: "APPROVED",
      license_image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80",
      status: "ACTIVE"
    },
    {
      id: 2,
      name: "Nguyễn Phương Mai",
      email: "renter.mai@gmail.com",
      phone: "0977 665 544",
      license_number: "B1-790987654321",
      license_status: "PENDING",
      license_image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80",
      status: "ACTIVE"
    }
  ],

  // 4. Danh sách đơn đặt xe (Bookings)
  bookings: [
    {
      id: "BK-88219",
      renter_id: 1,
      renter_name: "Lê Hoàng Nam",
      renter_phone: "0988 776 655",
      car_id: 1,
      car_name: "Toyota Vios 1.5 G CVT",
      car_plate: "51H-123.45",
      car_image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80",
      pickup_address: "123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM",
      start_time: "2026-09-15 08:00",
      end_time: "2026-09-17 20:00",
      total_days: 3,
      price_per_day: 750000,
      rental_amount: 2250000,
      insurance_fee: 300000,
      total_amount: 2550000,
      deposit_amount: 765000, // 30%
      deposit_status: "PAID",
      status: "DEPOSIT_PAID",
      payment_method: "VIETQR",
      created_at: "2026-09-11 09:30"
    },
    {
      id: "BK-55102",
      renter_id: 1,
      renter_name: "Lê Hoàng Nam",
      renter_phone: "0988 776 655",
      car_id: 4,
      car_name: "Mitsubishi Xpander Premium 7 Chỗ",
      car_plate: "51L-456.78",
      car_image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
      pickup_address: "18 Huỳnh Tấn Phát, Tân Thuận Đông, Quận 7, TP.HCM",
      start_time: "2026-08-20 07:00",
      end_time: "2026-08-22 19:00",
      total_days: 3,
      price_per_day: 900000,
      rental_amount: 2700000,
      insurance_fee: 300000,
      total_amount: 3000000,
      deposit_amount: 900000,
      deposit_status: "PAID",
      status: "COMPLETED",
      payment_method: "MOMO",
      created_at: "2026-08-18 14:15"
    }
  ],

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
