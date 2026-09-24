package com.driveshare.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.driveshare")
@EntityScan(basePackages = "com.driveshare")
@EnableJpaRepositories(basePackages = "com.driveshare")
public class DriveShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(DriveShareApplication.class, args);
    }
}
