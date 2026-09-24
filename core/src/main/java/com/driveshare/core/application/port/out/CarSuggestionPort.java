package com.driveshare.core.application.port.out;

import com.driveshare.core.application.dto.CarSuggestion;
import com.driveshare.core.application.dto.CarSuggestionCommand;

public interface CarSuggestionPort {
    CarSuggestion suggest(CarSuggestionCommand command);
}
