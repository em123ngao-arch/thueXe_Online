package com.driveshare.modules.rental.application.port.out;

public interface CarLockingPort {

    CarBookingLockResult lockCarForBooking(Long carId);
}
