package com.driveshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

@EnableScheduling
@SpringBootApplication
public class DriveShareApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(DriveShareApplication.class, args);
    }

    private static void loadDotEnv() {
        File[] candidates = new File[] {
                new File(".env"),
                new File("../.env"),
                new File(System.getProperty("user.dir"), ".env"),
                new File(System.getProperty("user.dir"), "../.env")
        };
        for (File f : candidates) {
            if (f.exists() && f.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(f))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String val = line.substring(eq + 1).trim();
                            System.setProperty(key, val);
                        }
                    }
                    System.out.println("✅ Loaded environment variables from: " + f.getCanonicalPath());
                    break;
                } catch (Exception e) {
                    System.err.println("⚠️ Could not load .env: " + e.getMessage());
                }
            }
        }
    }
}