package com.driveshare.common.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Database schema stores role_name as renter/owner/staff/admin; Java uses Spring Security friendly ROLE_* names. */
@Converter(autoApply = true)
public class ERoleConverter implements AttributeConverter<ERole, String> {
    @Override public String convertToDatabaseColumn(ERole role) {
        if (role == null) return null;
        return role.name().replaceFirst("^ROLE_", "").toLowerCase();
    }
    @Override public ERole convertToEntityAttribute(String value) {
        if (value == null) return null;
        return ERole.fromString(value);
    }
}
