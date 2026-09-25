package com.driveshare.config;

import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.RenterProfile;
import com.driveshare.modules.user.entity.Role;
import com.driveshare.modules.user.entity.User;
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
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;

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
        initDefaultCarsAndRentals();
    }

    private void fixDatabaseConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_status_check");
            jdbcTemplate.execute("ALTER TABLE cars ADD CONSTRAINT cars_status_check CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'DRAFT'))");
            log.info("Successfully updated cars_status_check constraint for PostgreSQL");
        } catch (Exception e) {
            log.warn("Could not update cars_status_check constraint: {}", e.getMessage());
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

    private void initDefaultCarsAndRentals() {
        User owner = userRepository.findByEmail("owner@driveshare.com").orElse(null);
        User renter = userRepository.findByEmail("renter@driveshare.com").orElse(null);

        if (owner == null) {
            return;
        }

        Car car1 = null;
        if (!carRepository.existsByPlateNumberAndDeletedAtIsNull("51K-12345")) {
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
            car1 = carRepository.findAll().stream()
                    .filter(c -> "51K-12345".equals(c.getPlateNumber()))
                    .findFirst().orElse(null);
        }

        if (!carRepository.existsByPlateNumberAndDeletedAtIsNull("30H-67890")) {
            Car car2 = Car.builder()
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
            carRepository.save(car2);
            log.info("Initialized default car 2: Mazda CX-5 (Plate: 30H-67890, Status: ACTIVE)");
        }

        // Tạo 1 đơn thuê mẫu PENDING để Khiêm test duyệt (CRP-47/48) và Quân test lọc ngày (CRP-38)
        if (rentalRepository.count() == 0 && car1 != null && renter != null) {
            LocalDate start = LocalDate.now().plusDays(3);
            LocalDate end = LocalDate.now().plusDays(5);
            BigDecimal pricePerDay = car1.getPricePerDay();
            BigDecimal totalPrice = pricePerDay.multiply(BigDecimal.valueOf(2));
            BigDecimal deposit = totalPrice.multiply(new BigDecimal("0.30"));

            Rental sampleRental = Rental.builder()
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

            rentalRepository.save(sampleRental);
            log.info("Initialized sample rental: ID={}, CarId={}, Status=PENDING, Dates={} to {}",
                    sampleRental.getRentalId(), car1.getCarId(), start, end);
        }
    }
}
