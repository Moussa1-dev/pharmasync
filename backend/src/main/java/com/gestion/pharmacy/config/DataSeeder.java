package com.gestion.pharmacy.config;

import com.gestion.pharmacy.entity.DutySchedule;
import com.gestion.pharmacy.entity.Medication;
import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.entity.Role;
import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.entity.Supplier;
import com.gestion.pharmacy.entity.User;
import com.gestion.pharmacy.repository.DutyScheduleRepository;
import com.gestion.pharmacy.repository.MedicationRepository;
import com.gestion.pharmacy.repository.PharmacyRepository;
import com.gestion.pharmacy.repository.StockRepository;
import com.gestion.pharmacy.repository.SupplierRepository;
import com.gestion.pharmacy.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class DataSeeder {

    private static final String[] DEMO_BARCODES = {
            "3400930000001", "3400930000002", "3400930000003", "3400930000004", "3400930000005",
            "3400930000006", "3400930000007", "3400930000008", "3400930000009", "3400930000010"
    };

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            MedicationRepository medicationRepository,
            PharmacyRepository pharmacyRepository,
            DutyScheduleRepository dutyScheduleRepository,
            StockRepository stockRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("admin@pharmasync.com")) {
                User admin = new User();
                admin.setNom("System");
                admin.setPrenom("Admin");
                admin.setEmail("admin@pharmasync.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(Role.ROLE_ADMIN);
                admin.setTelephone("0000000000");
                admin.setEmailVerified(true);
                userRepository.save(admin);
                System.out.println("===============================================");
                System.out.println("✅ UTILISATEUR ADMIN CRÉÉ AVEC SUCCÈS !");
                System.out.println("Email: admin@pharmasync.com");
                System.out.println("Mot de passe: admin123");
                System.out.println("===============================================");
            }

            if (!userRepository.existsByEmail("contact@pharmasalut.td")) {
                User pharma = new User();
                pharma.setNom("Pharmacie");
                pharma.setPrenom("Salut");
                pharma.setEmail("contact@pharmasalut.td");
                pharma.setPassword(passwordEncoder.encode("pharma123"));
                pharma.setRole(Role.ROLE_PHARMACIEN);
                pharma.setTelephone("66895418");
                pharma.setEmailVerified(true);
                userRepository.save(pharma);
            }

            if (!userRepository.existsByEmail("patient@gmail.com")) {
                User patient = new User();
                patient.setNom("Test");
                patient.setPrenom("Patient");
                patient.setEmail("patient@gmail.com");
                patient.setPassword(passwordEncoder.encode("patient123"));
                patient.setRole(Role.ROLE_PATIENT);
                patient.setTelephone("60000000");
                patient.setEmailVerified(true);
                userRepository.save(patient);
            }

            if (supplierRepository.count() == 0) {
                supplierRepository.save(new Supplier(null, "Pharmadelta", "66223344", "contact@pharmadelta.td", "Génériques"));
                supplierRepository.save(new Supplier(null, "BioSanté", "66554433", "cmd@biosante.td", "Antibiotiques"));
                supplierRepository.save(new Supplier(null, "Medisupply", "66778899", "info@medisupply.td", "Vitamines & OTC"));
            }

            List<Medication> medications = medicationRepository.findAll();
            for (int i = 0; i < medications.size() && i < DEMO_BARCODES.length; i++) {
                Medication med = medications.get(i);
                if (med.getBarcode() == null || med.getBarcode().isBlank()) {
                    med.setBarcode(DEMO_BARCODES[i]);
                    medicationRepository.save(med);
                }
            }

            // Multi-pharmacies : pharmacien Salut gère pharmacie 1 et 2
            userRepository.findByEmail("contact@pharmasalut.td").ifPresent(pharma -> {
                List<Pharmacy> all = pharmacyRepository.findAll();
                if (all.size() >= 2 && (pharma.getPharmacies() == null || pharma.getPharmacies().isEmpty())) {
                    Set<Pharmacy> assigned = new HashSet<>();
                    assigned.add(all.get(0));
                    assigned.add(all.get(1));
                    pharma.setPharmacies(assigned);
                    userRepository.save(pharma);
                    System.out.println("✅ Pharmacien lié aux pharmacies : " + all.get(0).getName() + ", " + all.get(1).getName());
                }
            });

            // Lots démo sur stocks sans lot
            List<Stock> stocks = stockRepository.findAll();
            int lotIdx = 1;
            for (Stock s : stocks) {
                if (s.getLotNumber() == null || s.getLotNumber().isBlank()) {
                    s.setLotNumber(String.format("LOT-TD-%04d", lotIdx++));
                    if (s.getMedication() != null && s.getMedication().getId() != null && s.getMedication().getId() == 1L) {
                        s.setSerialNumber("SN-COARTEM-" + s.getId());
                    }
                    stockRepository.save(s);
                }
            }

            if (dutyScheduleRepository.count() == 0 && pharmacyRepository.count() > 0) {
                List<Pharmacy> pharmacies = pharmacyRepository.findAll();
                LocalDate today = LocalDate.now();
                for (int d = 0; d < 7; d++) {
                    LocalDate date = today.plusDays(d);
                    Pharmacy pharmacy = pharmacies.get(d % pharmacies.size());
                    boolean weekend = date.getDayOfWeek().getValue() >= 6;
                    DutySchedule schedule = new DutySchedule();
                    schedule.setPharmacy(pharmacy);
                    schedule.setDutyDate(date);
                    if (weekend) {
                        schedule.setShiftType("WEEKEND");
                        schedule.setStartTime(LocalTime.of(8, 0));
                        schedule.setEndTime(LocalTime.of(20, 0));
                        schedule.setNotes("Garde week-end");
                    } else if (d % 2 == 0) {
                        schedule.setShiftType("NUIT");
                        schedule.setStartTime(LocalTime.of(20, 0));
                        schedule.setEndTime(LocalTime.of(8, 0));
                        schedule.setNotes("Garde de nuit");
                    } else {
                        schedule.setShiftType("JOUR");
                        schedule.setStartTime(LocalTime.of(8, 0));
                        schedule.setEndTime(LocalTime.of(20, 0));
                        schedule.setNotes("Garde de jour");
                    }
                    dutyScheduleRepository.save(schedule);
                }
            }
        };
    }
}
