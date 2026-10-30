package com.driveshare.modules.ai.adapter.out.observability;

import com.driveshare.modules.ai.application.port.out.AiObservabilityPort;
import com.driveshare.modules.ai.service.LangfuseService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LangfuseObservabilityAdapter implements AiObservabilityPort {

    @Autowired(required = false)
    private LangfuseService langfuseService;

    @Override
    public void recordGeneration(String traceId, String name, String sessionId, String userId,
                                 String model, String systemPrompt, String input, String output,
                                 Long latencyMs, boolean success, String errorMessage) {
        if (langfuseService != null) {
            langfuseService.recordGeneration(traceId, name, sessionId, userId, model,
                    systemPrompt, input, output, latencyMs, success, errorMessage);
        }
    }
}

