package com.driveshare.modules.auth.application.port.out;

import com.driveshare.modules.auth.domain.model.EmailChangeTokenRecord;

import java.util.Optional;

public interface EmailChangeTokenPort {
    Optional<EmailChangeTokenRecord> findByTokenHash(String tokenHash);
    EmailChangeTokenRecord save(EmailChangeTokenRecord token);
}

