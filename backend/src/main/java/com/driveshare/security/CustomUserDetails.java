package com.driveshare.security;

import com.driveshare.common.enums.EUserStatus;
import com.driveshare.modules.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String email;
    private final String password;
    private final EUserStatus status;
    private final Collection<? extends GrantedAuthority> authorities;
    private final long tokenVersion;

    public CustomUserDetails(Long userId, String username, String email, String password, EUserStatus status, Collection<? extends GrantedAuthority> authorities) {
        this(userId, username, email, password, status, authorities, 0L);
    }

    public static CustomUserDetails build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getRoleName().name()))
                .collect(Collectors.toList());

        return new CustomUserDetails(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getStatus(),
                authorities,
                user.getTokenVersion()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != EUserStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == EUserStatus.ACTIVE;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public EUserStatus getStatus() {
        return status;
    }

    public long getTokenVersion() {
        return tokenVersion;
    }
}
