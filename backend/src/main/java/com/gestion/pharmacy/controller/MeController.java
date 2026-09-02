package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.entity.User;
import com.gestion.pharmacy.repository.PharmacyRepository;
import com.gestion.pharmacy.repository.UserRepository;
import com.gestion.pharmacy.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class MeController {

    private final UserRepository userRepository;
    private final PharmacyRepository pharmacyRepository;

    @GetMapping("/pharmacies")
    public ResponseEntity<?> myPharmacies(@AuthenticationPrincipal UserDetailsImpl principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Non authentifié");
        }
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // Admin voit toutes les pharmacies
        if (user.getRole() != null && user.getRole().name().equals("ROLE_ADMIN")) {
            return ResponseEntity.ok(pharmacyRepository.findAll().stream().map(this::toMap).collect(Collectors.toList()));
        }

        Set<Pharmacy> pharmacies = user.getPharmacies() != null ? user.getPharmacies() : Set.of();
        if (pharmacies.isEmpty()) {
            // fallback démo : toutes les pharmacies pour un pharmacien non lié
            return ResponseEntity.ok(pharmacyRepository.findAll().stream().map(this::toMap).collect(Collectors.toList()));
        }
        return ResponseEntity.ok(pharmacies.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @PostMapping("/pharmacies/{pharmacyId}/assign")
    public ResponseEntity<?> assignPharmacy(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @PathVariable Long pharmacyId,
            @RequestParam Long userId
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User admin = userRepository.findById(principal.getId()).orElse(null);
        if (admin == null || admin.getRole() == null || !admin.getRole().name().equals("ROLE_ADMIN")) {
            return ResponseEntity.status(403).body("Réservé à l'admin");
        }
        User target = userRepository.findById(userId).orElse(null);
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId).orElse(null);
        if (target == null || pharmacy == null) {
            return ResponseEntity.notFound().build();
        }
        target.getPharmacies().add(pharmacy);
        userRepository.save(target);
        return ResponseEntity.ok(Map.of("message", "Pharmacie assignée", "userId", userId, "pharmacyId", pharmacyId));
    }

    private Map<String, Object> toMap(Pharmacy p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("address", p.getAddress());
        m.put("contact", p.getContact());
        m.put("isOnCall", p.getIsOnCall());
        return m;
    }
}
