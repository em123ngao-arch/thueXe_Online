package com.driveshare.modules.ai.application.port.out;

public interface AiObservabilityPort {
    void recordGeneration(String traceId, String name, String sessionId, String userId,
                          String model, String systemPrompt, String input, String output,
                          Long latencyMs, boolean success, String errorMessage);
}

