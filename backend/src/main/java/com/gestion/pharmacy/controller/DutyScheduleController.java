package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.dto.DutyScheduleDTO;
import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.service.DutyScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/duty-schedules")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class DutyScheduleController {

    private final DutyScheduleService dutyScheduleService;

    @GetMapping
    public ResponseEntity<List<DutyScheduleDTO>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) Long pharmacyId
    ) {
        if (pharmacyId != null) {
            return ResponseEntity.ok(dutyScheduleService.findByPharmacy(pharmacyId));
        }
        LocalDate from = start != null ? start : LocalDate.now().minusDays(7);
        LocalDate to = end != null ? end : LocalDate.now().plusDays(30);
        return ResponseEntity.ok(dutyScheduleService.findBetween(from, to));
    }

    @GetMapping("/on-call-now")
    public ResponseEntity<List<Pharmacy>> onCallNow() {
        return ResponseEntity.ok(dutyScheduleService.pharmaciesOnCallNow());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody DutyScheduleDTO dto) {
        try {
            return ResponseEntity.ok(dutyScheduleService.create(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DutyScheduleDTO dto) {
        try {
            return ResponseEntity.ok(dutyScheduleService.update(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dutyScheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
