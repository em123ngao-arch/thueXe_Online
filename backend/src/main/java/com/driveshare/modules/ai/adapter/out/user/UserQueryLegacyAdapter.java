package com.driveshare.modules.ai.adapter.out.user;

import com.driveshare.modules.ai.application.port.out.UserQueryPort;
import com.driveshare.modules.ai.application.result.UserSummaryResult;
import com.driveshare.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

// @TechnicalDebt: calls legacy UserRepository directly until module user is refactored in Phase 2
@Component
public class UserQueryLegacyAdapter implements UserQueryPort {

    private final UserRepository userRepository;

    @Autowired
    public UserQueryLegacyAdapter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Optional<UserSummaryResult> findUserById(Long userId) {
        if (userRepository == null || userId == null) {
            return Optional.empty();
        }
        return userRepository.findById(userId).map(u -> {
            String roleName = null;
            if (u.getRoles() != null && !u.getRoles().isEmpty() && u.getRoles().iterator().next().getRoleName() != null) {
                roleName = u.getRoles().iterator().next().getRoleName().name();
            }
            return new UserSummaryResult(
                    u.getUserId(),
                    u.getEmail(),
                    u.getFullName(),
                    roleName
            );
        });
    }
}
