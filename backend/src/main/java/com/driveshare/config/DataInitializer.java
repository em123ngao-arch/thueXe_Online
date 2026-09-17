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

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RenterProfileRepository renterProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        initRoles();
        initDefaultAdmin();
        initDefaultOwner();
        initDefaultRenter();
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
}
