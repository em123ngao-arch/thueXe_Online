package com.driveshare.modules.ai;

import com.driveshare.modules.ai.service.LangfuseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class LangfuseServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("When Langfuse is disabled or keys empty, isEnabled() returns false and getStatus() reflects this")
    void testLangfuseDisabled() {
        LangfuseService service = new LangfuseService(false, "http://localhost:3001", "", "", objectMapper);

        assertThat(service.isEnabled()).isFalse();

        Map<String, Object> status = service.getStatus();
        assertThat(status).isNotNull();
        assertThat(status.get("enabled")).isEqualTo(false);
        assertThat(status.get("host")).isEqualTo("http://localhost:3001");
        assertThat(status.get("hasPublicKey")).isEqualTo(false);
        assertThat(status.get("hasSecretKey")).isEqualTo(false);

        // Does not throw when calling generation while disabled
        assertDoesNotThrow(() -> service.recordGeneration(
                "trace-1", "chat-intent", "sess-1", "user-1", "gemini-1.5",
                "system-prompt", "Hello", "Hi", 100, true, null
        ));
    }

    @Test
    @DisplayName("When Langfuse is enabled with valid keys, isEnabled() returns true and status has keys")
    void testLangfuseEnabled() {
        LangfuseService service = new LangfuseService(true, "http://localhost:3001/", "pk-lf-test", "sk-lf-test", objectMapper);

        assertThat(service.isEnabled()).isTrue();

        Map<String, Object> status = service.getStatus();
        assertThat(status).isNotNull();
        assertThat(status.get("enabled")).isEqualTo(true);
        assertThat(status.get("host")).isEqualTo("http://localhost:3001"); // Trailing slash stripped
        assertThat(status.get("hasPublicKey")).isEqualTo(true);
        assertThat(status.get("hasSecretKey")).isEqualTo(true);

        // Record generation does not throw exception even if server is unreachable (async graceful catch)
        assertDoesNotThrow(() -> service.recordGeneration(
                "trace-1", "chat-intent", "sess-1", "user-1", "gemini-1.5",
                "system-prompt", "Hello", "Hi", 120, true, null
        ));
    }
}
