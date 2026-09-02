package com.gestion.pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PharmacyBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PharmacyBackendApplication.class, args);
	}

}
