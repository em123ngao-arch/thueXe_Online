package com.driveshare.modules.ai.application.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.Set;

/**
 * Result DTO returned by UserQueryPort.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResult {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String role;

    @Builder.Default
    private Set<String> roles = Collections.emptySet();

    public UserSummaryResult(Long userId, String email, String fullName, String role) {
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.username = email;
        this.roles = role != null ? Collections.singleton(role) : Collections.emptySet();
    }

    public Long userId() { return userId; }
    public String username() { return username; }
    public String email() { return email; }
    public String fullName() { return fullName; }
    public String role() { return role; }
    public Set<String> roles() { return roles; }
}
