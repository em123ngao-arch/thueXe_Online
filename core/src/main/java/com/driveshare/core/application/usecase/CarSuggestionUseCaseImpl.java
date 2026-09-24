package com.driveshare.core.application.usecase;

import com.driveshare.core.application.dto.CarSuggestion;
import com.driveshare.core.application.dto.CarSuggestionCommand;
import com.driveshare.core.application.port.in.CarSuggestionUseCase;
import com.driveshare.core.application.port.out.CarSuggestionPort;

import java.util.Objects;

public class CarSuggestionUseCaseImpl implements CarSuggestionUseCase {

    private final CarSuggestionPort carSuggestionPort;

    public CarSuggestionUseCaseImpl(CarSuggestionPort carSuggestionPort) {
        this.carSuggestionPort = Objects.requireNonNull(carSuggestionPort, "carSuggestionPort must not be null");
    }

    @Override
    public CarSuggestion suggest(CarSuggestionCommand command) {
        return carSuggestionPort.suggest(command);
    }
}
