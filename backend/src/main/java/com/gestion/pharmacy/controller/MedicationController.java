package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.Medication;
import com.gestion.pharmacy.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class MedicationController {

    private final MedicationRepository medicationRepository;

    @GetMapping
    public ResponseEntity<List<Medication>> getAllMedications() {
        return ResponseEntity.ok(medicationRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medication> getMedicationById(@PathVariable Long id) {
        return medicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-barcode/{code}")
    public ResponseEntity<Medication> getByBarcode(@PathVariable String code) {
        return medicationRepository.findByBarcode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Medication> createMedication(@RequestBody Medication medication) {
        return ResponseEntity.ok(medicationRepository.save(medication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medication> updateMedication(@PathVariable Long id, @RequestBody Medication medication) {
        return medicationRepository.findById(id)
                .map(existing -> {
                    existing.setName(medication.getName());
                    existing.setDescription(medication.getDescription());
                    existing.setIndicativePrice(medication.getIndicativePrice());
                    existing.setCategory(medication.getCategory());
                    existing.setBarcode(medication.getBarcode());
                    return ResponseEntity.ok(medicationRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long id) {
        if (!medicationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        medicationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
