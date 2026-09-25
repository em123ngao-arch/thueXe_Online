package com.driveshare.modules.user.entity;

import com.driveshare.common.entity.BaseEntity;
import com.driveshare.common.enums.EAuthProvider;
import com.driveshare.common.enums.EUserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 50, unique = true, nullable = false)
    private String username;

    @Column(name = "email", length = 150, unique = true, nullable = false)
    private String email;

    @Column(name = "phone", length = 20, unique = true)
    private String phone;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "id_card_number", length = 20, unique = true)
    private String idCardNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private EUserStatus status = EUserStatus.PENDING;

    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private java.time.Instant lockedUntil;

    /** Tăng mỗi khi mật khẩu thay đổi; dùng để vô hiệu hóa các JWT cũ. */
    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private long tokenVersion = 0L;

    /** Google OAuth2 user ID — null nếu đăng ký bằng email/password (BR-03). */
    @Column(name = "google_id", length = 255, unique = true)
    private String googleId;

    /** Nhà cung cấp xác thực: LOCAL (mặc định) hoặc GOOGLE (BR-03). */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", length = 20, nullable = false)
    @Builder.Default
    private EAuthProvider authProvider = EAuthProvider.LOCAL;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private OwnerProfile ownerProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private RenterProfile renterProfile;
}
