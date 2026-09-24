package com.driveshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class DriveShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(DriveShareApplication.class, args);
    }
}
