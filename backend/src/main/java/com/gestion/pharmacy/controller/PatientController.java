package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.repository.ReservationRepository;
import com.gestion.pharmacy.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PatientController {

    private final ReservationRepository reservationRepository;

    @GetMapping("/reservations")
    public ResponseEntity<List<Reservation>> myReservations(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) String contact) {
        if (user != null) {
            List<Reservation> byEmail = reservationRepository.findByPatientEmailIgnoreCaseOrderByCreatedAtDesc(user.getUsername());
            if (!byEmail.isEmpty()) {
                return ResponseEntity.ok(byEmail);
            }
            // Fallback: contact téléphone ou email stocké dans patientContact
            return ResponseEntity.ok(
                    reservationRepository.findByPatientContactIgnoreCaseOrPatientEmailIgnoreCaseOrderByCreatedAtDesc(
                            user.getUsername(), user.getUsername()));
        }
        if (contact != null && !contact.isBlank()) {
            return ResponseEntity.ok(
                    reservationRepository.findByPatientContactIgnoreCaseOrPatientEmailIgnoreCaseOrderByCreatedAtDesc(
                            contact.trim(), contact.trim()));
        }
        return ResponseEntity.badRequest().build();
    }
}
