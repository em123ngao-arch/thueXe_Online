package com.driveshare.core.application.port.in;

import com.driveshare.core.application.dto.CarSuggestion;
import com.driveshare.core.application.dto.CarSuggestionCommand;

public interface CarSuggestionUseCase {
    CarSuggestion suggest(CarSuggestionCommand command);
}
