package com.driveshare.config;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.EInspectionType;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.modules.car.adapter.out.persistence.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.notification.adapter.out.persistence.Notification;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.modules.rental.adapter.out.persistence.Rental;
import com.driveshare.modules.rental.adapter.out.persistence.RentalInspection;
import com.driveshare.modules.rental.adapter.out.persistence.Review;
import com.driveshare.modules.rental.repository.RentalInspectionRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.repository.ReviewRepository;
import com.driveshare.modules.user.adapter.out.persistence.OwnerProfile;
import com.driveshare.modules.user.adapter.out.persistence.RenterProfile;
import com.driveshare.modules.user.adapter.out.persistence.Role;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.RoleRepository;
import com.driveshare.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RenterProfileRepository renterProfileRepository;
    private final CarRepository carRepository;
    private final RentalRepository rentalRepository;
    private final RentalInspectionRepository rentalInspectionRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        fixDatabaseConstraints();
        initRoles();
        initDefaultAdmin();
        initDefaultOwner();
        initDefaultRenter();
        initAuxiliaryReviewers();
        initAllCarsAndRentals();
    }

    private void fixDatabaseConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_status_check");
            jdbcTemplate.execute("ALTER TABLE cars ADD CONSTRAINT cars_status_check CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'DRAFT'))");
            log.info("Successfully updated cars_status_check constraint for PostgreSQL");
            jdbcTemplate.execute("UPDATE users SET email_verified = true WHERE email_verified IS NULL OR email_verified = false");
            jdbcTemplate.execute("ALTER TABLE email_otps DROP COLUMN IF EXISTS code_hash;");
        } catch (Exception e) {
            log.warn("Could not update database constraints: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE rental_inspections ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'CONFIRMED'");
            log.info("Successfully ensured status column exists in rental_inspections for PostgreSQL");
        } catch (Exception e) {
            log.warn("Could not add status column to rental_inspections: {}", e.getMessage());
        }
    }

    private void initRoles() {
        for (ERole eRole : ERole.values()) {
            if (roleRepository.findByRoleName(eRole).isEmpty()) {
                roleRepository.save(Role.builder().roleName(eRole).build());
                log.info("Initialized role: {}", eRole);
            }
        }
    }

    private void initDefaultAdmin() {
        if (!userRepository.existsByEmail("admin@driveshare.com")) {
            Role adminRole = roleRepository.findByRoleName(ERole.ROLE_ADMIN)
                    .orElseGet(() -> roleRepository.save(Role.builder().roleName(ERole.ROLE_ADMIN).build()));

            User admin = User.builder()
                    .username("admin")
                    .email("admin@driveshare.com")
                    .passwordHash(passwordEncoder.encode("Admin123@"))
                    .fullName("System Administrator")
                    .phone("0900000001")
                    .status(EUserStatus.ACTIVE)
                    .emailVerified(true)
                    .roles(new HashSet<>(Set.of(adminRole)))
                    .build();

            userRepository.save(admin);
            log.info("Initialized default admin: admin@driveshare.com");
        }
    }

    private void initDefaultOwner() {
        if (!userRepository.existsByEmail("owner@driveshare.com")) {
            Role ownerRole = roleRepository.findByRoleName(ERole.ROLE_OWNER)
                    .orElseGet(() -> roleRepository.save(Role.builder().roleName(ERole.ROLE_OWNER).build()));

            User owner = User.builder()
                    .username("owner_demo")
                    .email("owner@driveshare.com")
                    .passwordHash(passwordEncoder.encode("Owner123@"))
                    .fullName("Chủ xe Nguyễn Văn A")
                    .phone("0900000002")
                    .idCardNumber("001200000001")
                    .status(EUserStatus.ACTIVE)
                    .emailVerified(true)
                    .roles(new HashSet<>(Set.of(ownerRole)))
                    .build();

            User savedOwner = userRepository.save(owner);

            OwnerProfile profile = OwnerProfile.builder()
                    .user(savedOwner)
                    .bankName("Vietcombank")
                    .bankAccountNumber("0123456789")
                    .verificationStatus(EVerificationStatus.VERIFIED)
                    .verifiedAt(Instant.now())
                    .build();

            ownerProfileRepository.save(profile);
            log.info("Initialized default owner: owner@driveshare.com");
        }
    }

    private void initDefaultRenter() {
        if (!userRepository.existsByEmail("renter@driveshare.com")) {
            Role renterRole = roleRepository.findByRoleName(ERole.ROLE_RENTER)
                    .orElseGet(() -> roleRepository.save(Role.builder().roleName(ERole.ROLE_RENTER).build()));

            User renter = User.builder()
                    .username("renter_demo")
                    .email("renter@driveshare.com")
                    .passwordHash(passwordEncoder.encode("Renter123@"))
                    .fullName("Khách thuê Trần Văn B")
                    .phone("0900000003")
                    .idCardNumber("001200000002")
                    .status(EUserStatus.ACTIVE)
                    .emailVerified(true)
                    .roles(new HashSet<>(Set.of(renterRole)))
                    .build();

            User savedRenter = userRepository.save(renter);

            RenterProfile profile = RenterProfile.builder()
                    .user(savedRenter)
                    .licenseNumber("B2-99887766")
                    .licenseFullName("Trần Văn B")
                    .licenseVerificationStatus(EVerificationStatus.VERIFIED)
                    .licenseVerifiedAt(Instant.now())
                    .build();

            renterProfileRepository.save(profile);
            log.info("Initialized default renter: renter@driveshare.com");
        }
    }

    /**
     * Khởi tạo các khách hàng phụ phục vụ tạo dữ liệu đánh giá và bình luận chân thực cho các xe.
     */
    private void initAuxiliaryReviewers() {
        createAuxRenter("nam.nguyen@driveshare.com", "Nguyễn Hoàng Nam", "0901112233", "B2-11112222");
        createAuxRenter("linh.tran@driveshare.com", "Trần Thùy Linh", "0902223344", "B2-33334444");
        createAuxRenter("dung.pham@driveshare.com", "Phạm Quốc Dũng", "0903334455", "B2-55556666");
    }

    private User createAuxRenter(String email, String fullName, String phone, String license) {
        if (userRepository.existsByEmail(email)) {
            return userRepository.findByEmail(email).orElse(null);
        }
        Role renterRole = roleRepository.findByRoleName(ERole.ROLE_RENTER)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(ERole.ROLE_RENTER).build()));

        User user = User.builder()
                .username(email.split("@")[0])
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName(fullName)
                .phone(phone)
                .idCardNumber("0792000" + phone.substring(phone.length() - 5))
                .status(EUserStatus.ACTIVE)
                .emailVerified(true)
                .roles(new HashSet<>(Set.of(renterRole)))
                .build();

        User saved = userRepository.save(user);

        RenterProfile profile = RenterProfile.builder()
                .user(saved)
                .licenseNumber(license)
                .licenseFullName(fullName)
                .licenseVerificationStatus(EVerificationStatus.VERIFIED)
                .licenseVerifiedAt(Instant.now())
                .build();

        renterProfileRepository.save(profile);
        return saved;
    }

    private void initAllCarsAndRentals() {
        User owner = userRepository.findByEmail("owner@driveshare.com").orElse(null);
        User renter = userRepository.findByEmail("renter@driveshare.com").orElse(null);
        User reviewerNam = userRepository.findByEmail("nam.nguyen@driveshare.com").orElse(null);
        User reviewerLinh = userRepository.findByEmail("linh.tran@driveshare.com").orElse(null);
        User reviewerDung = userRepository.findByEmail("dung.pham@driveshare.com").orElse(null);

        if (owner == null) return;

        // =========================================================================
        // DANH SÁCH 18 XE MẪU (7 XE CŨ + 11 XE MỚI - ĐẦY ĐỦ 3 MIỀN)
        // =========================================================================

        // 1. VinFast VF8 (TP.HCM)
        Car car1 = createOrGetCar(owner.getUserId(), "51K-12345", "VinFast", "VF8", 2023, "Đen", 5,
                ETransmission.AUTOMATIC, EFuelType.ELECTRIC, new BigDecimal("1200000.00"),
                "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1", "Hồ Chí Minh",
                "Xe điện thông minh VinFast VF8, nội thất da cao cấp, pin khỏe, trợ lái ADAS.",
                "GPS,Bluetooth,Camera360,Sunroof,AppleCarPlay",
                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("500000.00"));

        // 2. Mazda CX-5 (Hà Nội)
        Car car2 = createOrGetCar(owner.getUserId(), "30H-67890", "Mazda", "CX-5", 2022, "Trắng", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("900000.00"),
                "456 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy", "Hà Nội",
                "Xe SUV gia đình 5 chỗ gầm cao Mazda CX-5, êm ái, máy xăng tiết kiệm.",
                "GPS,Bluetooth,BackCamera,CruiseControl",
                "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
                false, BigDecimal.ZERO);

        // 3. Toyota Fortuner Legender 7 chỗ (TP.HCM)
        Car car3 = createOrGetCar(owner.getUserId(), "51G-777.99", "Toyota", "Fortuner Legender", 2023, "Đen", 7,
                ETransmission.AUTOMATIC, EFuelType.DIESEL, new BigDecimal("1350000.00"),
                "789 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7", "Hồ Chí Minh",
                "SUV 7 chỗ gầm cao máy dầu mạnh mẽ, bứt tốc êm ái, cực kỳ phù hợp cho chuyến du lịch Đà Lạt, Vũng Tàu gia đình.",
                "GPS,Bluetooth,Camera360,CruiseControl,AppleCarPlay",
                "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("500000.00"));

        // 4. Mitsubishi Xpander Premium 7 chỗ (TP.HCM)
        Car car4 = createOrGetCar(owner.getUserId(), "51K-555.66", "Mitsubishi", "Xpander Premium", 2023, "Trắng", 7,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("850000.00"),
                "234 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức", "Hồ Chí Minh",
                "MPV 7 chỗ hiện đại, gầm cao 225mm vượt ngập tốt, điều hòa làm mát nhanh, giá thuê tiết kiệm cho cả nhà.",
                "GPS,Bluetooth,BackCamera,AppleCarPlay",
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("400000.00"));

        // 5. Hyundai Accent 1.4 AT (Hà Nội)
        Car car5 = createOrGetCar(owner.getUserId(), "30E-888.22", "Hyundai", "Accent 1.4 AT", 2023, "Đỏ", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("650000.00"),
                "12 Chùa Bộc, Phường Quang Trung, Quận Đống Đa", "Hà Nội",
                "Sedan 5 chỗ trẻ trung, tiết kiệm nhiên liệu tối đa, chi phí thuê siêu hợp lý cho các chuyến đi ngắn ngày.",
                "GPS,Bluetooth,BackCamera,Sunroof",
                "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
                false, BigDecimal.ZERO);

        // 6. Toyota Vios 1.5 G (Đà Nẵng)
        Car car6 = createOrGetCar(owner.getUserId(), "43A-666.88", "Toyota", "Vios 1.5 G", 2022, "Bạc", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("600000.00"),
                "88 Nguyễn Văn Linh, Quận Hải Châu", "Đà Nẵng",
                "Dòng sedan quốc dân bền bỉ, êm ái, máy 1.5L vận hành bền bỉ và tiết kiệm xăng tối ưu.",
                "GPS,Bluetooth,BackCamera",
                "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80",
                false, BigDecimal.ZERO);

        // 7. VinFast VF e34 (TP.HCM)
        Car car7 = createOrGetCar(owner.getUserId(), "51H-333.44", "VinFast", "VF e34", 2023, "Xanh dương", 5,
                ETransmission.AUTOMATIC, EFuelType.ELECTRIC, new BigDecimal("750000.00"),
                "101 Mai Chí Thọ, Phường An Phú, TP. Thủ Đức", "Hồ Chí Minh",
                "Crossover điện thông minh, trợ lý ảo ViVi tiếng Việt, không mùi xăng xe, vận hành êm ái trong đô thị.",
                "GPS,Bluetooth,Camera360,VoiceControl,AppleCarPlay",
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
                false, BigDecimal.ZERO);

        // 8. Ford Everest Titanium 4x4 (TP.HCM) - MỚI
        Car car8 = createOrGetCar(owner.getUserId(), "51L-888.99", "Ford", "Everest Titanium 4x4", 2023, "Đen", 7,
                ETransmission.AUTOMATIC, EFuelType.DIESEL, new BigDecimal("1450000.00"),
                "15 Lê Duẩn, Phường Bến Nghé, Quận 1", "Hồ Chí Minh",
                "SUV 7 chỗ cơ bắp Mỹ cao cấp, 2 cầu dẫn động 4x4, cách âm vượt trội, dàn âm thanh 12 loa B&O đỉnh cao.",
                "GPS,Bluetooth,Camera360,Sunroof,AppleCarPlay,CruiseControl",
                "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("500000.00"));

        // 9. Honda CR-V 1.5 L (Hà Nội) - MỚI
        Car car9 = createOrGetCar(owner.getUserId(), "30K-123.88", "Honda", "CR-V 1.5 L Sensing", 2023, "Trắng ngọc trai", 7,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("1150000.00"),
                "23 Phan Chu Trinh, Quận Hoàn Kiếm", "Hà Nội",
                "Crossover 7 chỗ Honda CR-V trang bị gói an toàn Honda Sensing, cửa sổ trời toàn cảnh, lái cực đầm chắc.",
                "GPS,Bluetooth,Camera360,Sunroof,AppleCarPlay",
                "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("450000.00"));

        // 10. Kia Carnival Signature 7 chỗ VIP (Đà Nẵng) - MỚI
        Car car10 = createOrGetCar(owner.getUserId(), "43A-999.11", "Kia", "Carnival Signature", 2023, "Trắng", 7,
                ETransmission.AUTOMATIC, EFuelType.DIESEL, new BigDecimal("1850000.00"),
                "45 Võ Văn Kiệt, Phường An Hải Đông, Quận Sơn Trà", "Đà Nẵng",
                "Chuyên cơ mặt đất 7 chỗ VIP, ghế thương gia ngả lưng chỉnh điện sưởi/làm mát, 2 cửa lùa điện, phục vụ đưa đón sân bay và hội nghị.",
                "GPS,Bluetooth,Camera360,Sunroof,VoiceControl,AppleCarPlay",
                "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("600000.00"));

        // 11. Mercedes-Benz C200 Avantgarde (TP.HCM) - MỚI
        Car car11 = createOrGetCar(owner.getUserId(), "51K-999.88", "Mercedes-Benz", "C200 Avantgarde", 2023, "Đen", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("1950000.00"),
                "88 Đồng Khởi, Phường Bến Nghé, Quận 1", "Hồ Chí Minh",
                "Sedan hạng sang nước Đức, màn hình dọc 11.9 inch, đèn viền nội thất 64 màu, phục vụ sự kiện, cưới hỏi và đón khách VIP.",
                "GPS,Bluetooth,Camera360,Sunroof,AppleCarPlay,CruiseControl",
                "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("700000.00"));

        // 12. BMW 320i Sport Line (Hà Nội) - MỚI
        Car car12 = createOrGetCar(owner.getUserId(), "30H-999.66", "BMW", "320i Sport Line", 2023, "Xanh dương", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("2050000.00"),
                "99 Liễu Giai, Phường Ngọc Khánh, Quận Ba Đình", "Hà Nội",
                "Sedan thể thao BMW Series 3 cảm giác lái chân thật, tăng tốc phấn khích, ngoại thất sắc sảo đậm chất thể thao.",
                "GPS,Bluetooth,Camera360,AppleCarPlay,CruiseControl",
                "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("700000.00"));

        // 13. VinFast VF9 Plus 6 chỗ Chủ tịch (TP.HCM) - MỚI
        Car car13 = createOrGetCar(owner.getUserId(), "51L-111.22", "VinFast", "VF9 Plus 6 chỗ", 2023, "Xám", 6,
                ETransmission.AUTOMATIC, EFuelType.ELECTRIC, new BigDecimal("2300000.00"),
                "208 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh", "Hồ Chí Minh",
                "SUV điện cỡ lớn Full-size hạng sang, hàng ghế thứ 2 cơ trưởng tích hợp massage sưởi, trần kính toàn cảnh, quãng đường 594km.",
                "GPS,Bluetooth,Camera360,Sunroof,VoiceControl,AppleCarPlay",
                "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("600000.00"));

        // 14. Hyundai SantaFe Cao cấp (Hà Nội) - MỚI
        Car car14 = createOrGetCar(owner.getUserId(), "30K-555.77", "Hyundai", "SantaFe 2.2D Cao cấp", 2023, "Đỏ mận", 7,
                ETransmission.AUTOMATIC, EFuelType.DIESEL, new BigDecimal("1350000.00"),
                "54 Nguyễn Chí Thanh, Quận Đống Đa", "Hà Nội",
                "SUV 7 chỗ máy dầu siêu tiết kiệm, hệ dẫn động HTRAC thông minh, nội thất bọc da Nappa nâu sang trọng.",
                "GPS,Bluetooth,Camera360,Sunroof,AppleCarPlay",
                "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("500000.00"));

        // 15. Toyota Camry 2.5Q (TP.HCM) - MỚI
        Car car15 = createOrGetCar(owner.getUserId(), "51G-888.66", "Toyota", "Camry 2.5Q", 2022, "Đen", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("1500000.00"),
                "102 Nam Kỳ Khởi Nghĩa, Phường Bến Nghé, Quận 1", "Hồ Chí Minh",
                "Sedan doanh nhân lịch lãm, hàng ghế sau có bệ tỳ tay điều khiển cảm ứng ngả lưng riêng biệt, chạy cực kỳ êm ái.",
                "GPS,Bluetooth,Camera360,Sunroof,AppleCarPlay",
                "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80",
                true, new BigDecimal("500000.00"));

        // 16. Kia Seltos 1.4 Turbo (TP.HCM) - MỚI
        Car car16 = createOrGetCar(owner.getUserId(), "51K-444.33", "Kia", "Seltos 1.4 Turbo", 2023, "Vàng cát", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("800000.00"),
                "36 Quang Trung, Phường 10, Quận Gò Vấp", "Hồ Chí Minh",
                "Crossover đô thị trẻ trung, động cơ Turbo bốc, gầm cao linh hoạt đi lại dễ dàng trong các tuyến phố đông đúc.",
                "GPS,Bluetooth,BackCamera,Sunroof,AppleCarPlay",
                "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
                false, BigDecimal.ZERO);

        // 17. Mazda 3 Premium (Đà Nẵng) - MỚI
        Car car17 = createOrGetCar(owner.getUserId(), "43A-777.22", "Mazda", "Mazda 3 Premium", 2023, "Đỏ", 5,
                ETransmission.AUTOMATIC, EFuelType.GASOLINE, new BigDecimal("750000.00"),
                "120 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu", "Đà Nẵng",
                "Thiết kế KODO đạt giải xe đẹp nhất thế giới, nội thất chuẩn xe sang tối giản, cách âm tốt, ngắm cảnh biển Đà Nẵng cực chill.",
                "GPS,Bluetooth,BackCamera,Sunroof,AppleCarPlay",
                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
                false, BigDecimal.ZERO);

        // 18. VinFast VF5 Plus (TP.HCM) - MỚI
        Car car18 = createOrGetCar(owner.getUserId(), "51L-222.11", "VinFast", "VF5 Plus", 2023, "Trắng nóc xanh", 5,
                ETransmission.AUTOMATIC, EFuelType.ELECTRIC, new BigDecimal("550000.00"),
                "55 Hoàng Văn Thụ, Phường 15, Quận Phú Nhuận", "Hồ Chí Minh",
                "Hatchback điện nhỏ gọn năng động, chi phí sạc pin siêu rẻ, bán kính quay vòng nhỏ xoay sở cực nhanh trong phố.",
                "GPS,Bluetooth,BackCamera,VoiceControl,AppleCarPlay",
                "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
                false, BigDecimal.ZERO);

        log.info("Successfully initialized all 18 cars across HCMC, Hanoi, and Da Nang.");

        // =========================================================================
        // NẠP DỮ LIỆU ĐÁNH GIÁ ẢO (REVIEWS & COMMENTS) THẬT TRONG DB CHO CÁC XE
        // =========================================================================
        if (reviewRepository.count() == 0 && reviewerNam != null && reviewerLinh != null && reviewerDung != null) {
            log.info("Seeding realistic completed rentals & reviews for cars...");

            // VinFast VF8 (car1) - 2 reviews
            createSeededReview(car1, reviewerNam, owner, 5,
                    "Xe điện VinFast VF8 chạy cực kỳ êm ái, pin đi từ Sài Gòn ra Vũng Tàu thoải mái không lo hết pin. Trợ lý ảo ViVi tiếng Việt nhận lệnh rất chuẩn xác!",
                    LocalDate.now().minusDays(20), LocalDate.now().minusDays(18));
            createSeededReview(car1, reviewerLinh, owner, 5,
                    "Bác tài rất lịch sự, đón đúng giờ tại quận 1, lái xe điềm đạm an toàn, nội thất da thơm tho sạch sẽ. Lần sau gia đình mình sẽ tiếp tục ủng hộ!",
                    LocalDate.now().minusDays(15), LocalDate.now().minusDays(13));

            // Mazda CX-5 (car2) - 1 review
            createSeededReview(car2, reviewerDung, owner, 5,
                    "Xe gia đình 5 chỗ chạy phố Hà Nội nhẹ nhàng, máy xăng tiết kiệm, camera lùi nét căng. Chủ xe hỗ trợ giao nhận xe cực kỳ nhiệt tình.",
                    LocalDate.now().minusDays(14), LocalDate.now().minusDays(12));

            // Toyota Fortuner Legender (car3) - 2 reviews
            createSeededReview(car3, reviewerDung, owner, 5,
                    "Gia đình mình 6 người thuê đi du lịch Đà Lạt 4 ngày 3 đêm, xe 7 chỗ máy dầu gầm cao leo đèo Prenn cực bốc và đầm chắc. Rất đáng đồng tiền!",
                    LocalDate.now().minusDays(25), LocalDate.now().minusDays(21));
            createSeededReview(car3, reviewerNam, owner, 5,
                    "Chủ xe giao nhận xe đúng hẹn ở sân bay Tân Sơn Nhất, xe sạch tinh tươm không một vết bẩn. Thủ tục hoàn cọc diễn ra ngay sau khi bàn giao.",
                    LocalDate.now().minusDays(12), LocalDate.now().minusDays(10));

            // Mitsubishi Xpander (car4) - 1 review
            createSeededReview(car4, reviewerLinh, owner, 5,
                    "Xe 7 chỗ rộng rãi, hàng ghế 3 người lớn ngồi vẫn thoải mái, điều hòa làm lạnh nhanh sâu, mức tiêu thụ xăng tiết kiệm bất ngờ. 5 sao uy tín!",
                    LocalDate.now().minusDays(18), LocalDate.now().minusDays(16));

            // Ford Everest Titanium (car8) - 1 review
            createSeededReview(car8, reviewerNam, owner, 5,
                    "Dòng SUV cơ bắp Mỹ cách âm đỉnh cao, hệ thống loa B&O nghe nhạc sống động như rạp hát. Máy 2.0 Bi-Turbo vượt xe dứt khoát và an toàn.",
                    LocalDate.now().minusDays(11), LocalDate.now().minusDays(9));

            // Kia Carnival Signature (car10) - 1 review
            createSeededReview(car10, reviewerDung, owner, 5,
                    "Thuê xe cho ban giám đốc đi công tác Đà Nẵng - Hội An, hàng ghế thương gia chỉnh điện ngả lưng cực kỳ thoải mái và sang trọng. Đối tác khen nức nở!",
                    LocalDate.now().minusDays(10), LocalDate.now().minusDays(8));

            // Mercedes C200 (car11) - 1 review
            createSeededReview(car11, reviewerLinh, owner, 5,
                    "Thuê xe sang phục vụ đám cưới em gái, xe bóng bẩy chụp ảnh ngoại cảnh siêu lung linh. Chủ xe bàn giao xe bóng loáng thơm phức.",
                    LocalDate.now().minusDays(16), LocalDate.now().minusDays(15));

            // BMW 320i (car12) - 1 review
            createSeededReview(car12, reviewerNam, owner, 5,
                    "Cảm giác lái BMW đúng là đỉnh chóp, vô lăng chính xác từng mi-li-mét, đạp ga dính lưng. Trải nghiệm thuê xe thể thao quá tuyệt vời trên DriveShare!",
                    LocalDate.now().minusDays(13), LocalDate.now().minusDays(11));

            // VinFast VF9 (car13) - 1 review
            createSeededReview(car13, reviewerDung, owner, 5,
                    "Xe điện Full-size đẳng cấp chủ tịch, trần kính toàn cảnh ngắm hoàng hôn siêu đẹp, ghế massage êm ru. Bác tài chu đáo phục vụ 5 sao.",
                    LocalDate.now().minusDays(9), LocalDate.now().minusDays(7));

            // Hyundai SantaFe (car14) - 1 review
            createSeededReview(car14, reviewerLinh, owner, 5,
                    "Xe 7 chỗ máy dầu chạy đầm chắc, hệ thống phanh khẩn cấp và cảnh báo điểm mù hoạt động rất nhạy, đi đường dài Tây Bắc an tâm tuyệt đối.",
                    LocalDate.now().minusDays(14), LocalDate.now().minusDays(12));

            // Toyota Camry 2.5Q (car15) - 1 review
            createSeededReview(car15, reviewerNam, owner, 5,
                    "Camry 2.5Q êm ru như thảm bay, hàng ghế sau VIP có điều khiển cảm ứng ngả lưng riêng. Chủ xe rất chuyên nghiệp và uy tín.",
                    LocalDate.now().minusDays(8), LocalDate.now().minusDays(6));

            log.info("Successfully seeded reviews for cars with actual DB records.");
        }

        // =========================================================================
        // CÁC CHUYẾN ĐI HOÀN TẤT DÀNH RIÊNG CHO TÀI KHOẢN RENTER ĐỂ TỰ VIẾT ĐÁNH GIÁ
        // (COMPLETED nhưng CHƯA CÓ REVIEW để người dùng tự tay viết và kiểm tra)
        // =========================================================================
        if (renter != null) {
            boolean hasRenterCompletedRentals = rentalRepository.findAll().stream()
                    .anyMatch(r -> r.getRenterId().equals(renter.getUserId()) && r.getStatus() == ERentalStatus.COMPLETED);

            if (!hasRenterCompletedRentals) {
                // Chuyến 1 của renter: Thuê Hyundai Accent (30E-888.22) - 3 ngày trước
                Rental renterTrip1 = rentalRepository.save(Rental.builder()
                        .carId(car5.getCarId())
                        .renterId(renter.getUserId())
                        .startDate(LocalDate.now().minusDays(5))
                        .endDate(LocalDate.now().minusDays(3))
                        .totalDays(2)
                        .pricePerDay(car5.getPricePerDay())
                        .totalPrice(car5.getPricePerDay().multiply(BigDecimal.valueOf(2)))
                        .depositAmount(car5.getPricePerDay().multiply(BigDecimal.valueOf(2)).multiply(new BigDecimal("0.30")))
                        .status(ERentalStatus.COMPLETED)
                        .withDriver(false)
                        .note("Chuyến đi Hà Nội - Ninh Bình của Khách thuê Trần Văn B (Chờ bạn tự viết đánh giá)")
                        .build());
                createInspections(renterTrip1, owner, 8200, 8450);

                // Chuyến 2 của renter: Thuê Toyota Vios (43A-666.88) - 5 ngày trước
                Rental renterTrip2 = rentalRepository.save(Rental.builder()
                        .carId(car6.getCarId())
                        .renterId(renter.getUserId())
                        .startDate(LocalDate.now().minusDays(8))
                        .endDate(LocalDate.now().minusDays(5))
                        .totalDays(3)
                        .pricePerDay(car6.getPricePerDay())
                        .totalPrice(car6.getPricePerDay().multiply(BigDecimal.valueOf(3)))
                        .depositAmount(car6.getPricePerDay().multiply(BigDecimal.valueOf(3)).multiply(new BigDecimal("0.30")))
                        .status(ERentalStatus.COMPLETED)
                        .withDriver(false)
                        .note("Chuyến du lịch Đà Nẵng - Hội An của Khách thuê Trần Văn B (Chờ bạn tự viết đánh giá)")
                        .build());
                createInspections(renterTrip2, owner, 45200, 45580);

                // Chuyến 3 của renter: Thuê VinFast VF e34 (51H-333.44) - 7 ngày trước
                Rental renterTrip3 = rentalRepository.save(Rental.builder()
                        .carId(car7.getCarId())
                        .renterId(renter.getUserId())
                        .startDate(LocalDate.now().minusDays(10))
                        .endDate(LocalDate.now().minusDays(8))
                        .totalDays(2)
                        .pricePerDay(car7.getPricePerDay())
                        .totalPrice(car7.getPricePerDay().multiply(BigDecimal.valueOf(2)))
                        .depositAmount(car7.getPricePerDay().multiply(BigDecimal.valueOf(2)).multiply(new BigDecimal("0.30")))
                        .status(ERentalStatus.COMPLETED)
                        .withDriver(false)
                        .note("Chuyến đi nội ô Sài Gòn của Khách thuê Trần Văn B (Chờ bạn tự viết đánh giá)")
                        .build());
                createInspections(renterTrip3, owner, 18200, 18390);

                // Thông báo nhắc nhở đánh giá gửi tới tài khoản renter
                notificationRepository.save(Notification.builder()
                        .userId(renter.getUserId())
                        .title("⭐ Bạn có chuyến đi vừa hoàn tất!")
                        .content("Chuyến đi xe Hyundai Accent (30E-888.22) đã hoàn tất. Hãy dành ít giây viết đánh giá và chấm điểm xe nhé!")
                        .type("RENTAL_COMPLETED")
                        .referenceId(renterTrip1.getRentalId())
                        .isRead(false)
                        .build());

                log.info("Initialized 3 COMPLETED rentals for renter@driveshare.com WITHOUT reviews (Ready for user testing).");
            }

            // Đơn mẫu PENDING để test đặt xe
            boolean hasPendingRental = rentalRepository.findAll().stream()
                    .anyMatch(r -> r.getRenterId().equals(renter.getUserId()) && r.getStatus() == ERentalStatus.PENDING);
            if (!hasPendingRental) {
                Rental sampleRental = Rental.builder()
                        .carId(car1.getCarId())
                        .renterId(renter.getUserId())
                        .startDate(LocalDate.now().plusDays(2))
                        .endDate(LocalDate.now().plusDays(4))
                        .totalDays(2)
                        .pricePerDay(car1.getPricePerDay())
                        .totalPrice(car1.getPricePerDay().multiply(BigDecimal.valueOf(2)))
                        .depositAmount(car1.getPricePerDay().multiply(BigDecimal.valueOf(2)).multiply(new BigDecimal("0.30")))
                        .status(ERentalStatus.PENDING)
                        .note("Đơn đặt xe mẫu chờ chủ xe duyệt (VinFast VF8)")
                        .build();
                rentalRepository.save(sampleRental);
                log.info("Initialized 1 sample PENDING rental for VinFast VF8.");
            }
        }

        // Tự động tính toán lại rating và ratingCount cho tất cả 18 xe theo review thực tế trong DB
        recalculateAllCarRatings();
    }

    private Car createOrGetCar(Long ownerId, String plateNumber, String brand, String model, int year,
                               String color, int seats, ETransmission transmission, EFuelType fuelType,
                               BigDecimal pricePerDay, String address, String province,
                               String description, String features, String thumbnailUrl,
                               boolean hasDriverService, BigDecimal driverFeePerDay) {
        return carRepository.findByPlateNumber(plateNumber).orElseGet(() -> {
            Car car = Car.builder()
                    .ownerId(ownerId)
                    .plateNumber(plateNumber)
                    .brand(brand)
                    .model(model)
                    .year(year)
                    .color(color)
                    .seats(seats)
                    .transmission(transmission)
                    .fuelType(fuelType)
                    .pricePerDay(pricePerDay)
                    .address(address)
                    .province(province)
                    .description(description)
                    .features(features)
                    .thumbnailUrl(thumbnailUrl)
                    .hasDriverService(hasDriverService)
                    .driverFeePerDay(driverFeePerDay)
                    .status(ECarStatus.ACTIVE)
                    .build();
            Car saved = carRepository.save(car);
            log.info("Initialized car: {} {} ({}, Plate: {})", brand, model, province, plateNumber);
            return saved;
        });
    }

    private void createSeededReview(Car car, User renter, User owner, int rating, String comment,
                                    LocalDate startDate, LocalDate endDate) {
        long days = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate));
        BigDecimal totalPrice = car.getPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal deposit = totalPrice.multiply(new BigDecimal("0.30"));

        Rental completedRental = rentalRepository.save(Rental.builder()
                .carId(car.getCarId())
                .renterId(renter.getUserId())
                .startDate(startDate)
                .endDate(endDate)
                .totalDays((int) days)
                .pricePerDay(car.getPricePerDay())
                .totalPrice(totalPrice)
                .depositAmount(deposit)
                .status(ERentalStatus.COMPLETED)
                .withDriver(car.getHasDriverService() != null && car.getHasDriverService())
                .driverFee(car.getDriverFeePerDay() != null ? car.getDriverFeePerDay().multiply(BigDecimal.valueOf(days)) : BigDecimal.ZERO)
                .note("Chuyến đi hoàn tất có đánh giá của khách hàng " + renter.getFullName())
                .build());

        createInspections(completedRental, owner, 15000, 15300);

        reviewRepository.save(Review.builder()
                .rentalId(completedRental.getRentalId())
                .carId(car.getCarId())
                .renterId(renter.getUserId())
                .rating(rating)
                .comment(comment)
                .build());
    }

    private void createInspections(Rental rental, User owner, int odoStart, int odoEnd) {
        rentalInspectionRepository.save(RentalInspection.builder()
                .rentalId(rental.getRentalId())
                .inspectionType(EInspectionType.CHECK_IN)
                .odoMeter(odoStart)
                .fuelLevel(95)
                .images("https://images.unsplash.com/photo-1549399542-7e3f8b79c341")
                .notes("Bàn giao xe đúng hẹn, ngoại thất sạch sẽ không trầy xước.")
                .performedBy(owner.getUserId())
                .build());

        rentalInspectionRepository.save(RentalInspection.builder()
                .rentalId(rental.getRentalId())
                .inspectionType(EInspectionType.CHECK_OUT)
                .odoMeter(odoEnd)
                .fuelLevel(90)
                .extraFee(BigDecimal.ZERO)
                .images("https://images.unsplash.com/photo-1549399542-7e3f8b79c341")
                .notes("Nghiệm thu trả xe thành công, đã hoàn trả tiền cọc đầy đủ cho khách thuê.")
                .performedBy(owner.getUserId())
                .build());
    }

    /**
     * Tự động tính toán lại điểm rating và số lượt ratingCount trên từng xe theo các đánh giá thực tế trong DB.
     */
    private void recalculateAllCarRatings() {
        List<Car> allCars = carRepository.findAll();
        for (Car car : allCars) {
            Double avg = reviewRepository.calculateAverageRatingByCarId(car.getCarId());
            long count = reviewRepository.countByCarId(car.getCarId());

            if (count > 0 && avg != null) {
                car.setRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
                car.setRatingCount((int) count);
            } else {
                car.setRating(new BigDecimal("5.00"));
                car.setRatingCount(0);
            }
            carRepository.save(car);
        }
        log.info("Recalculated ratings for {} cars according to actual review database.", allCars.size());
    }
}
