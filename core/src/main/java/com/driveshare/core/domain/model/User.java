package com.driveshare.core.domain.model;

import com.driveshare.core.domain.vo.Email;

import java.time.Instant;
import java.util.Objects;
import java.util.Set;

public class User {
    private final Long id;
    private final String username;
    private final Email email;
    private String fullName;
    private String phone;
    private Set<String> roles;
    private boolean active;
    private final Instant createdAt;

    public User(Long id, String username, Email email, String fullName, String phone,
                Set<String> roles, boolean active, Instant createdAt) {
        this.id = id;
        this.username = Objects.requireNonNull(username, "username must not be null");
        this.email = Objects.requireNonNull(email, "email must not be null");
        this.fullName = fullName;
        this.phone = phone;
        this.roles = roles != null ? roles : Set.of("ROLE_CUSTOMER");
        this.active = active;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public Email getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public Set<String> getRoles() { return roles; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
