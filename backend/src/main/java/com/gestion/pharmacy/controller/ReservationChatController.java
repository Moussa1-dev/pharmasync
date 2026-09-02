package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.entity.ReservationChatMessage;
import com.gestion.pharmacy.repository.ReservationChatMessageRepository;
import com.gestion.pharmacy.repository.ReservationRepository;
import com.gestion.pharmacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations/{reservationId}/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ReservationChatController {

    private final ReservationRepository reservationRepository;
    private final ReservationChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> list(@PathVariable Long reservationId) {
        if (!reservationRepository.existsById(reservationId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(chatMessageRepository.findByReservationIdOrderByCreatedAtAsc(reservationId));
    }

    @PostMapping
    public ResponseEntity<?> send(@PathVariable Long reservationId, @RequestBody Map<String, String> body) {
        Reservation reservation = reservationRepository.findById(reservationId).orElse(null);
        if (reservation == null) {
            return ResponseEntity.notFound().build();
        }

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body("Message vide");
        }

        String senderRole = body.getOrDefault("senderRole", "PATIENT");
        String senderName = body.getOrDefault("senderName",
                "PATIENT".equalsIgnoreCase(senderRole) ? reservation.getPatientName() : "Pharmacie");

        ReservationChatMessage msg = new ReservationChatMessage();
        msg.setReservation(reservation);
        msg.setSenderRole(senderRole.toUpperCase());
        msg.setSenderName(senderName);
        msg.setContent(content.trim());
        ReservationChatMessage saved = chatMessageRepository.save(msg);

        messagingTemplate.convertAndSend("/topic/reservations/" + reservationId + "/chat", saved);

        Long pharmacyId = reservation.getStock() != null && reservation.getStock().getPharmacy() != null
                ? reservation.getStock().getPharmacy().getId() : null;

        if ("PATIENT".equalsIgnoreCase(senderRole) && pharmacyId != null) {
            notificationService.notify(
                    "pharmacy:" + pharmacyId,
                    "Nouveau message réservation N°" + reservationId,
                    senderName + " : " + truncate(content),
                    "CHAT",
                    "/dashboard?tab=reservations"
            );
        } else {
            String patientKey = reservation.getPatientEmail() != null && !reservation.getPatientEmail().isBlank()
                    ? reservation.getPatientEmail()
                    : reservation.getPatientContact();
            if (patientKey != null) {
                notificationService.notify(
                        patientKey,
                        "Message pharmacie — réservation N°" + reservationId,
                        truncate(content),
                        "CHAT",
                        "/patient"
                );
            }
        }

        return ResponseEntity.ok(saved);
    }

    private String truncate(String s) {
        return s.length() > 120 ? s.substring(0, 117) + "…" : s;
    }
}
