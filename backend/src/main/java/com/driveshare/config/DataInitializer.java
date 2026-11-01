package com.driveshare.config;

import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
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

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.modules.car.adapter.out.persistence.Car;
import com.driveshare.common.enums.EInspectionType;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.notification.adapter.out.persistence.Notification;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.modules.rental.adapter.out.persistence.Rental;
import com.driveshare.modules.rental.adapter.out.persistence.RentalInspection;
import com.driveshare.modules.rental.adapter.out.persistence.Review;
import com.driveshare.modules.rental.repository.RentalInspectionRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.repository.ReviewRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

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
        initSecondRenter();
        initDefaultCarsAndRentals();
    }

    private void fixDatabaseConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_status_check");
            jdbcTemplate.execute("ALTER TABLE cars ADD CONSTRAINT cars_status_check CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'DRAFT'))");
            log.info("Successfully updated cars_status_check constraint for PostgreSQL");
            jdbcTemplate.execute("UPDATE users SET email_verified = true WHERE email_verified IS NULL");
            jdbcTemplate.execute("ALTER TABLE email_otps DROP COLUMN IF EXISTS code_hash;");
        } catch (Exception e) {
            log.warn("Could not update cars_status_check constraint: {}", e.getMessage());
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
                    .roles(new HashSet<>(Set.of(adminRole)))
                    .build();

            userRepository.save(admin);
            log.info("Initialized default admin user: admin@driveshare.com (Password: Admin123@)");
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
            log.info("Initialized default owner user: owner@driveshare.com (Password: Owner123@)");
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
            log.info("Initialized default renter user: renter@driveshare.com (Password: Renter123@)");
        }
    }

    /**
     * Tạo người thuê xe thứ 2 để test nhiều chuyến đi và đánh giá từ nhiều người dùng.
     */
    private void initSecondRenter() {
        if (!userRepository.existsByEmail("renter2@driveshare.com")) {
            Role renterRole = roleRepository.findByRoleName(ERole.ROLE_RENTER)
                    .orElseGet(() -> roleRepository.save(Role.builder().roleName(ERole.ROLE_RENTER).build()));

            User renter2 = User.builder()
                    .username("renter2_demo")
                    .email("renter2@driveshare.com")
                    .passwordHash(passwordEncoder.encode("Renter2@123"))
                    .fullName("Lê Thị Mai")
                    .phone("0900000004")
                    .idCardNumber("001200000003")
                    .status(EUserStatus.ACTIVE)
                    .roles(new HashSet<>(Set.of(renterRole)))
                    .build();

            User savedRenter2 = userRepository.save(renter2);

            RenterProfile profile = RenterProfile.builder()
                    .user(savedRenter2)
                    .licenseNumber("B2-11223344")
                    .licenseFullName("Lê Thị Mai")
                    .licenseVerificationStatus(EVerificationStatus.VERIFIED)
                    .licenseVerifiedAt(Instant.now())
                    .build();

            renterProfileRepository.save(profile);
            log.info("Initialized second renter user: renter2@driveshare.com (Password: Renter2@123)");
        }
    }

    private void initDefaultCarsAndRentals() {
        User owner = userRepository.findByEmail("owner@driveshare.com").orElse(null);
        User renter = userRepository.findByEmail("renter@driveshare.com").orElse(null);
        User renter2 = userRepository.findByEmail("renter2@driveshare.com").orElse(null);

        if (owner == null) {
            return;
        }

        Car car1 = null;
        if (!carRepository.existsByPlateNumber("51K-12345")) {
            car1 = Car.builder()
                    .ownerId(owner.getUserId())
                    .plateNumber("51K-12345")
                    .brand("VinFast")
                    .model("VF8")
                    .year(2023)
                    .color("Đen")
                    .seats(5)
                    .transmission(ETransmission.AUTOMATIC)
                    .fuelType(EFuelType.ELECTRIC)
                    .pricePerDay(new BigDecimal("1200000.00"))
                    .address("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1")
                    .province("Hồ Chí Minh")
                    .description("Xe điện thông minh VinFast VF8, nội thất da cao cấp, pin khỏe, trợ lái ADAS.")
                    .features("GPS,Bluetooth,Camera360,Sunroof,AppleCarPlay")
                    .thumbnailUrl("https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80")
                    .status(ECarStatus.ACTIVE)
                    .build();
            car1 = carRepository.save(car1);
            log.info("Initialized default car 1: VinFast VF8 (Plate: 51K-12345, Status: ACTIVE)");
        } else {
            car1 = carRepository.findByPlateNumber("51K-12345").orElse(null);
        }

        Car car2 = null;
        if (!carRepository.existsByPlateNumber("30H-67890")) {
            car2 = Car.builder()
                    .ownerId(owner.getUserId())
                    .plateNumber("30H-67890")
                    .brand("Mazda")
                    .model("CX-5")
                    .year(2022)
                    .color("Trắng")
                    .seats(5)
                    .transmission(ETransmission.AUTOMATIC)
                    .fuelType(EFuelType.GASOLINE)
                    .pricePerDay(new BigDecimal("900000.00"))
                    .address("456 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy")
                    .province("Hà Nội")
                    .description("Xe SUV gia đình 5 chỗ gầm cao Mazda CX-5, êm ái, máy xăng tiết kiệm.")
                    .features("GPS,Bluetooth,BackCamera,CruiseControl")
                    .thumbnailUrl("https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80")
                    .status(ECarStatus.ACTIVE)
                    .build();
            car2 = carRepository.save(car2);
            log.info("Initialized default car 2: Mazda CX-5 (Plate: 30H-67890, Status: ACTIVE)");
        } else {
            car2 = carRepository.findByPlateNumber("30H-67890").orElse(null);
        }

        // Xe 3: Toyota Fortuner Legender 7 chỗ (Phục vụ khách tìm xe 7 chỗ, du lịch Đà Lạt, gia đình)
        if (!carRepository.existsByPlateNumber("51G-777.99")) {
            Car car3 = Car.builder()
                    .ownerId(owner.getUserId())
                    .plateNumber("51G-777.99")
                    .brand("Toyota")
                    .model("Fortuner Legender")
                    .year(2023)
                    .color("Đen")
                    .seats(7)
                    .transmission(ETransmission.AUTOMATIC)
                    .fuelType(EFuelType.DIESEL)
                    .pricePerDay(new BigDecimal("1350000.00"))
                    .address("789 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7")
                    .province("Hồ Chí Minh")
                    .description("SUV 7 chỗ gầm cao máy dầu mạnh mẽ, bứt tốc êm ái, cực kỳ phù hợp cho chuyến du lịch Đà Lạt, Vũng Tàu gia đình.")
                    .features("GPS,Bluetooth,Camera360,CruiseControl,AppleCarPlay")
                    .thumbnailUrl("https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80")
                    .hasDriverService(true)
                    .driverFeePerDay(new BigDecimal("500000.00"))
                    .status(ECarStatus.ACTIVE)
                    .build();
            carRepository.save(car3);
            log.info("Initialized default car 3: Toyota Fortuner Legender 7 chỗ (Plate: 51G-777.99, Status: ACTIVE)");
        }

        // Xe 4: Mitsubishi Xpander Premium 7 chỗ (Phục vụ khách tìm xe 7 chỗ giá rẻ tiết kiệm)
        if (!carRepository.existsByPlateNumber("51K-555.66")) {
            Car car4 = Car.builder()
                    .ownerId(owner.getUserId())
                    .plateNumber("51K-555.66")
                    .brand("Mitsubishi")
                    .model("Xpander Premium")
                    .year(2023)
                    .color("Trắng")
                    .seats(7)
                    .transmission(ETransmission.AUTOMATIC)
                    .fuelType(EFuelType.GASOLINE)
                    .pricePerDay(new BigDecimal("850000.00"))
                    .address("234 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức")
                    .province("Hồ Chí Minh")
                    .description("MPV 7 chỗ hiện đại, gầm cao 225mm vượt ngập tốt, điều hòa làm mát nhanh, giá thuê tiết kiệm cho cả nhà.")
                    .features("GPS,Bluetooth,BackCamera,AppleCarPlay")
                    .thumbnailUrl("https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80")
                    .hasDriverService(true)
                    .driverFeePerDay(new BigDecimal("400000.00"))
                    .status(ECarStatus.ACTIVE)
                    .build();
            carRepository.save(car4);
            log.info("Initialized default car 4: Mitsubishi Xpander 7 chỗ (Plate: 51K-555.66, Status: ACTIVE)");
        }

        // Xe 5: Hyundai Accent 1.4 AT (Phục vụ khách tìm xe 5 chỗ phân khúc giá rẻ dưới 800k)
        Car car5 = null;
        if (!carRepository.existsByPlateNumber("30E-888.22")) {
            car5 = Car.builder()
                    .ownerId(owner.getUserId())
                    .plateNumber("30E-888.22")
                    .brand("Hyundai")
                    .model("Accent 1.4 AT")
                    .year(2023)
                    .color("Đỏ")
                    .seats(5)
                    .transmission(ETransmission.AUTOMATIC)
                    .fuelType(EFuelType.GASOLINE)
                    .pricePerDay(new BigDecimal("650000.00"))
                    .address("12 Chùa Bộc, Phường Quang Trung, Quận Đống Đa")
                    .province("Hà Nội")
                    .description("Sedan 5 chỗ trẻ trung, tiết kiệm nhiên liệu tối đa, chi phí thuê siêu hợp lý cho các chuyến đi ngắn ngày.")
                    .features("GPS,Bluetooth,BackCamera,Sunroof")
                    .thumbnailUrl("https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80")
                    .hasDriverService(false)
                    .status(ECarStatus.ACTIVE)
                    .build();
            car5 = carRepository.save(car5);
            log.info("Initialized default car 5: Hyundai Accent (Plate: 30E-888.22, Status: ACTIVE)");
        } else {
            car5 = carRepository.findByPlateNumber("30E-888.22").orElse(null);
        }

        // Xe 6: Toyota Vios 1.5 G (Phục vụ khách tìm xe phổ thông giá rẻ, bền bỉ)
        Car car6 = null;
        if (!carRepository.existsByPlateNumber("43A-666.88")) {
            car6 = Car.builder()
                    .ownerId(owner.getUserId())
                    .plateNumber("43A-666.88")
                    .brand("Toyota")
                    .model("Vios 1.5 G")
                    .year(2022)
                    .color("Bạc")
                    .seats(5)
                    .transmission(ETransmission.AUTOMATIC)
                    .fuelType(EFuelType.GASOLINE)
                    .pricePerDay(new BigDecimal("600000.00"))
                    .address("88 Nguyễn Văn Linh, Quận Hải Châu")
                    .province("Đà Nẵng")
                    .description("Dòng sedan quốc dân bền bỉ, êm ái, máy 1.5L vận hành bền bỉ và tiết kiệm xăng tối ưu.")
                    .features("GPS,Bluetooth,BackCamera")
                    .thumbnailUrl("https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80")
                    .hasDriverService(false)
                    .status(ECarStatus.ACTIVE)
                    .build();
            car6 = carRepository.save(car6);
            log.info("Initialized default car 6: Toyota Vios (Plate: 43A-666.88, Status: ACTIVE)");
        } else {
            car6 = carRepository.findByPlateNumber("43A-666.88").orElse(null);
        }

        // Xe 7: VinFast VF e34 (Phục vụ khách tìm xe điện nội thành phân khúc dưới 800k)
        if (!carRepository.existsByPlateNumber("51H-333.44")) {
            Car car7 = Car.builder()
                    .ownerId(owner.getUserId())
                    .plateNumber("51H-333.44")
                    .brand("VinFast")
                    .model("VF e34")
                    .year(2023)
                    .color("Xanh dương")
                    .seats(5)
                    .transmission(ETransmission.AUTOMATIC)
                    .fuelType(EFuelType.ELECTRIC)
                    .pricePerDay(new BigDecimal("750000.00"))
                    .address("101 Mai Chí Thọ, Phường An Phú, TP. Thủ Đức")
                    .province("Hồ Chí Minh")
                    .description("Crossover điện thông minh, trợ lý ảo ViVi tiếng Việt, không mùi xăng xe, vận hành êm ái trong đô thị.")
                    .features("GPS,Bluetooth,Camera360,VoiceControl,AppleCarPlay")
                    .thumbnailUrl("https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80")
                    .hasDriverService(false)
                    .status(ECarStatus.ACTIVE)
                    .build();
            carRepository.save(car7);
            log.info("Initialized default car 7: VinFast VF e34 (Plate: 51H-333.44, Status: ACTIVE)");
        }

        // Cập nhật dịch vụ tài xế Sprint 3 cho xe VinFast VF8 (KHÔNG set fake rating)
        if (car1 != null && (car1.getHasDriverService() == null || !Boolean.TRUE.equals(car1.getHasDriverService()))) {
            car1.setHasDriverService(true);
            car1.setDriverFeePerDay(new BigDecimal("500000.00"));
            car1 = carRepository.save(car1);
        }

        // Tạo 1 đơn thuê mẫu PENDING để test duyệt (CRP-47/48) và test lọc ngày (CRP-38)
        Rental sampleRental = null;
        if (rentalRepository.count() == 0 && car1 != null && renter != null) {
            LocalDate start = LocalDate.now().plusDays(3);
            LocalDate end = LocalDate.now().plusDays(5);
            BigDecimal pricePerDay = car1.getPricePerDay();
            BigDecimal totalPrice = pricePerDay.multiply(BigDecimal.valueOf(2));
            BigDecimal deposit = totalPrice.multiply(new BigDecimal("0.30"));

            sampleRental = Rental.builder()
                    .carId(car1.getCarId())
                    .renterId(renter.getUserId())
                    .startDate(start)
                    .endDate(end)
                    .totalDays(2)
                    .pricePerDay(pricePerDay)
                    .totalPrice(totalPrice)
                    .depositAmount(deposit)
                    .status(ERentalStatus.PENDING)
                    .note("Đơn đặt xe mẫu tự động phục vụ test chức năng Sprint 2 (CRP-47, CRP-48, CRP-38)")
                    .build();

            sampleRental = rentalRepository.save(sampleRental);
            log.info("Initialized sample rental: ID={}, CarId={}, Status=PENDING, Dates={} to {}",
                    sampleRental.getRentalId(), car1.getCarId(), start, end);
        }

        // Sprint 3: Tạo nhiều đơn thuê COMPLETED có đủ biên bản (Check-in, Check-out) nhưng KHÔNG có review
        // => Người dùng sẽ tự viết đánh giá, khi đánh giá thì ratingCount sẽ tăng lên thực tế
        if (car1 != null && renter != null && rentalInspectionRepository.count() == 0) {

            // === Chuyến 1: Renter thuê VinFast VF8 (car1) - 10 ngày trước ===
            Rental completedRental1 = rentalRepository.save(Rental.builder()
                    .carId(car1.getCarId())
                    .renterId(renter.getUserId())
                    .startDate(LocalDate.now().minusDays(10))
                    .endDate(LocalDate.now().minusDays(8))
                    .totalDays(2)
                    .pricePerDay(car1.getPricePerDay())
                    .totalPrice(new BigDecimal("2400000.00"))
                    .depositAmount(new BigDecimal("720000.00"))
                    .status(ERentalStatus.COMPLETED)
                    .withDriver(true)
                    .driverFee(new BigDecimal("1000000.00"))
                    .note("Chuyến hoàn tất - Renter thuê VF8 có tài xế")
                    .build());
            createInspections(completedRental1, owner, 15200, 15450);
            log.info("Initialized completed rental 1: Renter -> VinFast VF8");

            // === Chuyến 2: Renter2 thuê VinFast VF8 (car1) - 6 ngày trước ===
            if (renter2 != null) {
                Rental completedRental2 = rentalRepository.save(Rental.builder()
                        .carId(car1.getCarId())
                        .renterId(renter2.getUserId())
                        .startDate(LocalDate.now().minusDays(6))
                        .endDate(LocalDate.now().minusDays(4))
                        .totalDays(2)
                        .pricePerDay(car1.getPricePerDay())
                        .totalPrice(new BigDecimal("2400000.00"))
                        .depositAmount(new BigDecimal("720000.00"))
                        .status(ERentalStatus.COMPLETED)
                        .withDriver(false)
                        .note("Chuyến hoàn tất - Renter2 thuê VF8 tự lái")
                        .build());
                createInspections(completedRental2, owner, 15450, 15730);
                log.info("Initialized completed rental 2: Renter2 -> VinFast VF8");
            }

            // === Chuyến 3: Renter2 thuê Mazda CX-5 (car2) - 8 ngày trước ===
            if (renter2 != null && car2 != null) {
                Rental completedRental3 = rentalRepository.save(Rental.builder()
                        .carId(car2.getCarId())
                        .renterId(renter2.getUserId())
                        .startDate(LocalDate.now().minusDays(8))
                        .endDate(LocalDate.now().minusDays(5))
                        .totalDays(3)
                        .pricePerDay(car2.getPricePerDay())
                        .totalPrice(new BigDecimal("2700000.00"))
                        .depositAmount(new BigDecimal("810000.00"))
                        .status(ERentalStatus.COMPLETED)
                        .withDriver(false)
                        .note("Chuyến hoàn tất - Renter2 thuê Mazda CX-5 tự lái")
                        .build());
                createInspections(completedRental3, owner, 32000, 32480);
                log.info("Initialized completed rental 3: Renter2 -> Mazda CX-5");
            }

            // === Chuyến 4: Renter thuê Hyundai Accent (car5) - 4 ngày trước ===
            if (car5 != null) {
                Rental completedRental4 = rentalRepository.save(Rental.builder()
                        .carId(car5.getCarId())
                        .renterId(renter.getUserId())
                        .startDate(LocalDate.now().minusDays(4))
                        .endDate(LocalDate.now().minusDays(2))
                        .totalDays(2)
                        .pricePerDay(car5.getPricePerDay())
                        .totalPrice(new BigDecimal("1300000.00"))
                        .depositAmount(new BigDecimal("390000.00"))
                        .status(ERentalStatus.COMPLETED)
                        .withDriver(false)
                        .note("Chuyến hoàn tất - Renter thuê Hyundai Accent tự lái")
                        .build());
                createInspections(completedRental4, owner, 8000, 8220);
                log.info("Initialized completed rental 4: Renter -> Hyundai Accent");
            }

            // === Chuyến 5: Renter2 thuê Toyota Vios (car6) - 3 ngày trước ===
            if (renter2 != null && car6 != null) {
                Rental completedRental5 = rentalRepository.save(Rental.builder()
                        .carId(car6.getCarId())
                        .renterId(renter2.getUserId())
                        .startDate(LocalDate.now().minusDays(3))
                        .endDate(LocalDate.now().minusDays(1))
                        .totalDays(2)
                        .pricePerDay(car6.getPricePerDay())
                        .totalPrice(new BigDecimal("1200000.00"))
                        .depositAmount(new BigDecimal("360000.00"))
                        .status(ERentalStatus.COMPLETED)
                        .withDriver(false)
                        .note("Chuyến hoàn tất - Renter2 thuê Toyota Vios tự lái")
                        .build());
                createInspections(completedRental5, owner, 45000, 45310);
                log.info("Initialized completed rental 5: Renter2 -> Toyota Vios");
            }

            // Thông báo mẫu cho chuyến 1 (thông báo nhắc đánh giá)
            if (notificationRepository.count() == 0) {
                notificationRepository.save(Notification.builder()
                        .userId(renter.getUserId())
                        .title("Chuyến đi hoàn tất")
                        .content("Chuyến đi xe VinFast VF8 (51K-12345) đã hoàn tất thành công. Hãy để lại đánh giá của bạn!")
                        .type("RENTAL_COMPLETED")
                        .referenceId(completedRental1.getRentalId())
                        .isRead(false)
                        .build());
            }
            log.info("Initialized Sprint 3 seed data: {} completed rentals with inspections, NO pre-seeded reviews.", 5);
        }
    }

    /**
     * Tạo biên bản nhận xe (CHECK_IN) và trả xe (CHECK_OUT) cho 1 chuyến đi.
     */
    private void createInspections(Rental rental, User owner, int odoStart, int odoEnd) {
        rentalInspectionRepository.save(RentalInspection.builder()
                .rentalId(rental.getRentalId())
                .inspectionType(EInspectionType.CHECK_IN)
                .odoMeter(odoStart)
                .fuelLevel(95)
                .images("https://images.unsplash.com/photo-1549399542-7e3f8b79c341")
                .notes("Bàn giao xe đúng hẹn, ngoại thất sạch đẹp không trầy xước.")
                .performedBy(owner.getUserId())
                .build());

        rentalInspectionRepository.save(RentalInspection.builder()
                .rentalId(rental.getRentalId())
                .inspectionType(EInspectionType.CHECK_OUT)
                .odoMeter(odoEnd)
                .fuelLevel(90)
                .extraFee(BigDecimal.ZERO)
                .images("https://images.unsplash.com/photo-1549399542-7e3f8b79c341")
                .notes("Nghiệm thu trả xe thành công, hoàn cọc đầy đủ.")
                .performedBy(owner.getUserId())
                .build());
    }
}
