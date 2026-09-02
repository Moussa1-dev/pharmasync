package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.AppNotification;
import com.gestion.pharmacy.security.UserDetailsImpl;
import com.gestion.pharmacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.gestion.pharmacy.entity.AlertSubscription;
import com.gestion.pharmacy.repository.AlertSubscriptionRepository;
import com.gestion.pharmacy.repository.MedicationRepository;
import com.gestion.pharmacy.repository.PharmacyRepository;
import com.gestion.pharmacy.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    private final NotificationService notificationService;
    private final AlertSubscriptionRepository subscriptionRepository;
    private final MedicationRepository medicationRepository;
    private final PharmacyRepository pharmacyRepository;
    private final UserRepository userRepository;


    @GetMapping("/me")
    public ResponseEntity<List<AppNotification>> myNotifications(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) Long pharmacyId) {
        String key = resolveKey(user, pharmacyId);
        return ResponseEntity.ok(notificationService.listFor(key));
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) Long pharmacyId) {
        String key = resolveKey(user, pharmacyId);
        Map<String, Long> body = new HashMap<>();
        body.put("count", notificationService.unreadCount(key));
        return ResponseEntity.ok(body);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) Long pharmacyId) {
        String key = resolveKey(user, pharmacyId);
        AppNotification updated = notificationService.markRead(id, key);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/me/read-all")
    public ResponseEntity<?> markAllRead(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) Long pharmacyId) {
        String key = resolveKey(user, pharmacyId);
        notificationService.markAllRead(key);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private String resolveKey(UserDetailsImpl user, Long pharmacyId) {
        if (user == null) {
            return "anonymous";
        }
        boolean isPharmacist = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PHARMACIEN") || a.getAuthority().equals("ROLE_ADMIN"));
        if (isPharmacist && pharmacyId != null) {
            return "pharmacy:" + pharmacyId;
        }
        return user.getUsername();
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> broadcast(@RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        String title = payload.get("title");
        userRepository.findAll().forEach(u -> {
            notificationService.notify(u.getEmail(), title, message, "GLOBAL", null);
        });
        return ResponseEntity.ok(Map.of("message", "Alerte diffusée à tous les utilisateurs."));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribeAlert(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Long> payload) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        Long medicationId = payload.get("medicationId");
        Long pharmacyId = payload.get("pharmacyId");

        var patient = userRepository.findById(user.getId()).orElse(null);
        var medication = medicationRepository.findById(medicationId).orElse(null);
        if (patient == null || medication == null) return ResponseEntity.badRequest().build();

        if (subscriptionRepository.existsByPatientIdAndMedicationIdAndPharmacyIdAndActiveTrue(patient.getId(), medicationId, pharmacyId)) {
            return ResponseEntity.badRequest().body("Déjà abonné à cette alerte.");
        }

        AlertSubscription sub = new AlertSubscription();
        sub.setPatient(patient);
        sub.setMedication(medication);
        if (pharmacyId != null) {
            sub.setPharmacy(pharmacyRepository.findById(pharmacyId).orElse(null));
        }
        subscriptionRepository.save(sub);
        
        return ResponseEntity.ok(Map.of("message", "Abonnement enregistré avec succès."));
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<List<AlertSubscription>> getSubscriptions(@AuthenticationPrincipal UserDetailsImpl user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(subscriptionRepository.findByPatientIdOrderByCreatedAtDesc(user.getId()));
    }
}

