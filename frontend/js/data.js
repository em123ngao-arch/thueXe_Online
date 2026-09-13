/**
 * DRIVESHARE — Dữ liệu ban đầu (Seed Data)
 * Bám sát 100% Cơ sở dữ liệu docs/database_schema.sql và thực tế thị trường xe tại Việt Nam
 * Không sử dụng emoji, giữ phong cách chuyên nghiệp chuẩn mực
 */

const INITIAL_DATA = {
  // 1. Danh sách xe mẫu đa dạng các phân khúc
  cars: [
    {
      id: 1,
      owner_id: 1,
      brand: "Toyota",
      model: "Vios 1.5 G CVT",
      year: 2022,
      license_plate: "51H-123.45",
      seat_count: 5,
      car_type: "SEDAN",
      transmission: "AUTOMATIC",
      fuel_type: "GASOLINE",
      fuel_consumption: "5.8L / 100km",
      price_per_day: 750000,
      pickup_address: "123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM",
      city: "TP. Hồ Chí Minh",
      district: "Quận 1",
      amenities: ["Bản đồ dẫn đường", "Camera lùi", "Bluetooth", "Cảm biến lốp", "Thu phí VETC"],
      description: "Xe gia đình giữ gìn rất kỹ, bảo dưỡng định kỳ chính hãng. Nội thất bọc da sạch sẽ, máy êm ru, siêu tiết kiệm xăng, cốp để được 3 vali cỡ lớn.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 4.9,
      trip_count: 56,
      owner_name: "Nguyễn Văn Hùng",
      owner_phone: "0901 234 567",
      owner_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 2,
      owner_id: 1,
      brand: "Hyundai",
      model: "Accent 1.4 AT Đặc Biệt",
      year: 2023,
      license_plate: "51K-987.65",
      seat_count: 5,
      car_type: "SEDAN",
      transmission: "AUTOMATIC",
      fuel_type: "GASOLINE",
      fuel_consumption: "6.2L / 100km",
      price_per_day: 700000,
      pickup_address: "245 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM",
      city: "TP. Hồ Chí Minh",
      district: "Quận 3",
      amenities: ["Apple CarPlay / Android Auto", "Camera lùi", "Cửa sổ trời", "Thu phí ePass"],
      description: "Dòng xe trẻ trung, kiểu dáng hiện đại. Đã khử mùi ozon thơm tho, trang bị sẵn tẩu sạc nhanh và giá đỡ điện thoại cho khách tiện tra cứu bản đồ.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 4.8,
      trip_count: 42,
      owner_name: "Nguyễn Văn Hùng",
      owner_phone: "0901 234 567",
      owner_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 3,
      owner_id: 2,
      brand: "VinFast",
      model: "VF8 Plus (Điện)",
      year: 2023,
      license_plate: "51A-888.88",
      seat_count: 5,
      car_type: "SUV",
      transmission: "AUTOMATIC",
      fuel_type: "ELECTRIC",
      fuel_consumption: "Pin 420km / lần sạc",
      price_per_day: 1200000,
      pickup_address: "Khu đô thị Phú Mỹ Hưng, Nguyễn Văn Linh, Quận 7, TP.HCM",
      city: "TP. Hồ Chí Minh",
      district: "Quận 7",
      amenities: ["Hệ thống lái ADAS cấp 2", "Camera 360", "Ghế massage & thông gió", "Cửa sổ trời toàn cảnh", "Thu phí VETC"],
      description: "Trải nghiệm SUV điện hạng D cao cấp, bứt tốc êm ái, cách âm vượt trội. Tặng kèm thẻ sạc xe miễn phí tại trạm sạc VinFast trên toàn quốc.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 5.0,
      trip_count: 31,
      owner_name: "Trần Thị Lan",
      owner_phone: "0912 345 678",
      owner_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 4,
      owner_id: 2,
      brand: "Mitsubishi",
      model: "Xpander Premium 7 Chỗ",
      year: 2023,
      license_plate: "51L-456.78",
      seat_count: 7,
      car_type: "MPV",
      transmission: "AUTOMATIC",
      fuel_type: "GASOLINE",
      fuel_consumption: "6.9L / 100km",
      price_per_day: 900000,
      pickup_address: "18 Huỳnh Tấn Phát, Tân Thuận Đông, Quận 7, TP.HCM",
      city: "TP. Hồ Chí Minh",
      district: "Quận 7",
      amenities: ["Khoang ngồi 7 chỗ rộng rãi", "Camera 360", "Apple CarPlay", "Cổng sạc hàng ghế sau", "Thu phí VETC"],
      description: "Xe 7 chỗ lý tưởng cho gia đình đi du lịch Vũng Tàu, Hồ Tràm, Đà Lạt. Gầm cao 225mm vượt ngập tốt, điều hòa 2 dàn lạnh cực sâu.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 4.9,
      trip_count: 68,
      owner_name: "Trần Thị Lan",
      owner_phone: "0912 345 678",
      owner_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 5,
      owner_id: 3,
      brand: "Mazda",
      model: "CX-5 2.0 Premium",
      year: 2022,
      license_plate: "30H-678.90",
      seat_count: 5,
      car_type: "SUV",
      transmission: "AUTOMATIC",
      fuel_type: "GASOLINE",
      fuel_consumption: "7.1L / 100km",
      price_per_day: 1100000,
      pickup_address: "Tòa nhà Keangnam, Phạm Hùng, Quận Cầu Giấy, Hà Nội",
      city: "Hà Nội",
      district: "Cầu Giấy",
      amenities: ["Âm thanh 10 loa Bose", "HUD kính lái", "Cốp điện thông minh", "Camera 360", "Thu phí VETC"],
      description: "Màu đỏ pha lê Soul Red cao cấp, thiết kế Kodo cuốn hút. Xe đi công tác, gặp đối tác cực kỳ sang trọng và lịch thiệp.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 4.9,
      trip_count: 39,
      owner_name: "Lê Tuấn Kiệt",
      owner_phone: "0988 123 456",
      owner_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 6,
      owner_id: 3,
      brand: "Kia",
      model: "Carnival Signature 7 Chỗ VIP",
      year: 2023,
      license_plate: "30K-112.34",
      seat_count: 7,
      car_type: "MPV",
      transmission: "AUTOMATIC",
      fuel_type: "DIESEL",
      fuel_consumption: "7.5L / 100km",
      price_per_day: 1650000,
      pickup_address: "Vinhomes Skylake, Phạm Hùng, Nam Từ Liêm, Hà Nội",
      city: "Hà Nội",
      district: "Nam Từ Liêm",
      amenities: ["Ghế thương gia ngả lưng điện", "Màn hình giải trí kép", "Cửa lùa điện 2 bên", "Sạc không dây", "Thu phí VETC"],
      description: "Chuyên cơ mặt đất, nội thất thương gia siêu rộng. Ghế giữa có sưởi, làm mát, ngả chân. Rất phù hợp đoàn đón VIP, gia đình về quê.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 5.0,
      trip_count: 27,
      owner_name: "Lê Tuấn Kiệt",
      owner_phone: "0988 123 456",
      owner_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 7,
      owner_id: 1,
      brand: "Ford",
      model: "Ranger Wildtrak 2.0 Bi-Turbo",
      year: 2022,
      license_plate: "51D-998.21",
      seat_count: 5,
      car_type: "PICKUP",
      transmission: "AUTOMATIC",
      fuel_type: "DIESEL",
      fuel_consumption: "8.2L / 100km",
      price_per_day: 1050000,
      pickup_address: "58 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP.HCM",
      city: "TP. Hồ Chí Minh",
      district: "Tân Bình",
      amenities: ["Dẫn động 4x4 hai cầu", "Nắp thùng cuộn điện", "Camera 360", "Màn hình Sync 4A 12 inch", "Thu phí VETC"],
      description: "Bán tải địa hình mạnh mẽ, thùng hàng rộng rãi. Phù hợp cho chuyến cắm trại, phượt cung đường Tây Nguyên, biển miền Trung.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 4.8,
      trip_count: 33,
      owner_name: "Nguyễn Văn Hùng",
      owner_phone: "0901 234 567",
      owner_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 8,
      owner_id: 2,
      brand: "Honda",
      model: "City RS 1.5 CVT",
      year: 2023,
      license_plate: "43A-567.89",
      seat_count: 5,
      car_type: "SEDAN",
      transmission: "AUTOMATIC",
      fuel_type: "GASOLINE",
      fuel_consumption: "5.7L / 100km",
      price_per_day: 750000,
      pickup_address: "Sân bay Đà Nẵng, Đường Duy Tân, Quận Hải Châu, Đà Nẵng",
      city: "Đà Nẵng",
      district: "Hải Châu",
      amenities: ["Gói an toàn Honda Sensing", "Lẫy chuyển số vô lăng", "Khởi động từ xa", "Thu phí VETC"],
      description: "Bàn giao xe tận cổng Sân bay Quốc tế Đà Nẵng. Xe bản RS thể thao, máy 1.5 i-VTEC bốc và đầm chắc, hỗ trợ du lịch Hội An - Huế.",
      status: "ACTIVE",
      image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 4.9,
      trip_count: 51,
      owner_name: "Trần Thị Lan",
      owner_phone: "0912 345 678",
      owner_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 9,
      owner_id: 1,
      brand: "Toyota",
      model: "Corolla Cross 1.8V",
      year: 2024,
      license_plate: "51M-334.55",
      seat_count: 5,
      car_type: "SUV",
      transmission: "AUTOMATIC",
      fuel_type: "GASOLINE",
      fuel_consumption: "6.5L / 100km",
      price_per_day: 950000,
      pickup_address: "32 Song Hành, Phường An Phú, TP. Thủ Đức, TP.HCM",
      city: "TP. Hồ Chí Minh",
      district: "Thủ Đức",
      amenities: ["Toyota Safety Sense", "Cửa sổ trời", "Camera 360", "Màn hình 9 inch", "Cốp điện"],
      description: "Xe mới đập hộp 2024 chạy lướt 5.000km, màu trắng ngọc trai bóng bẩy. Gầm cao dễ quan sát, điều hòa mát lạnh đặc trưng của Toyota.",
      status: "PENDING_APPROVAL", // Chờ nhân viên duyệt để demo luồng
      image_url: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=80"
      ],
      rating: 5.0,
      trip_count: 0,
      owner_name: "Nguyễn Văn Hùng",
      owner_phone: "0901 234 567",
      owner_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    }
  ],

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
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 2,
      name: "Trần Thị Lan",
      email: "owner.lan@gmail.com",
      phone: "0912 345 678",
      address: "Quận 7, TP.HCM",
      cars_count: 3,
      rating: 4.95,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
    },
    {
      id: 3,
      name: "Lê Tuấn Kiệt",
      email: "owner.kiet@gmail.com",
      phone: "0988 123 456",
      address: "Cầu Giấy, Hà Nội",
      cars_count: 2,
      rating: 5.0,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
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
