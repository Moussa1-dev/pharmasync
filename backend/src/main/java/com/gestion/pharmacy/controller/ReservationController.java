package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.service.StockAlertScheduler;
import com.gestion.pharmacy.security.PharmacyAccessService;
import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.repository.ReservationRepository;
import com.gestion.pharmacy.repository.StockRepository;
import com.gestion.pharmacy.service.MobileMoneyService;
import com.gestion.pharmacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final StockRepository stockRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final MobileMoneyService mobileMoneyService;
    private final PharmacyAccessService pharmacyAccessService;
    private final StockAlertScheduler stockAlertScheduler;

    @GetMapping
    public ResponseEntity<List<Reservation>> getAllReservations() {
        return ResponseEntity.ok(reservationRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getReservationById(@PathVariable Long id) {
        return reservationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    public ResponseEntity<List<Reservation>> getReservationsByPharmacy(@PathVariable Long pharmacyId) {
        return ResponseEntity.ok(reservationRepository.findByStockPharmacyId(pharmacyId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createReservation(@RequestBody @Valid Reservation reservation) {
        if (reservation.getStock() == null || reservation.getStock().getId() == null) {
            return ResponseEntity.badRequest().body("Stock manquant");
        }
        if (reservation.getQuantity() == null || reservation.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body("La quantité doit être supérieure à zéro");
        }
        Stock stock = stockRepository.findById(reservation.getStock().getId()).orElse(null);
        if (stock == null) {
            return ResponseEntity.badRequest().body("Stock introuvable");
        }

        if (stock.getQuantity() == null || stock.getQuantity() < reservation.getQuantity()) {
            return ResponseEntity.badRequest().body("Quantité insuffisante en stock");
        }

        stock.setQuantity(stock.getQuantity() - reservation.getQuantity());
        stockRepository.save(stock);
        stockAlertScheduler.checkStock(stock); // alerte en temps réel

        // Champs fixés par le serveur : le client ne peut pas choisir
        // lui-même le statut, le montant ou l'état du paiement.
        reservation.setId(null);
        reservation.setStock(stock);
        reservation.setStatus("PENDING");
        reservation.setPaymentStatus("UNPAID");
        reservation.setPaymentReference(null);
        reservation.setSmsReminderSent(false);
        reservation.setAmountDue(mobileMoneyService.computeAmount(reservation));

        // Paiement mobile demandé à la création
        boolean wantsMobilePay = reservation.getPaymentMethod() != null
                && ("ORANGE_MONEY".equalsIgnoreCase(reservation.getPaymentMethod())
                || "AIRTEL_MONEY".equalsIgnoreCase(reservation.getPaymentMethod()));

        Reservation saved = reservationRepository.save(reservation);

        if (wantsMobilePay && reservation.getPaymentPhone() != null && !reservation.getPaymentPhone().isBlank()) {
            try {
                var payment = mobileMoneyService.initiate(
                        saved.getId(),
                        reservation.getPaymentMethod(),
                        reservation.getPaymentPhone()
                );
                saved = reservationRepository.findById(saved.getId()).orElse(saved);
                saved.setPaymentReference(payment.getExternalReference());
            } catch (IllegalArgumentException ignored) {
                // réservation créée même si init paiement échoue
            }
        }

        String medName = stock.getMedication().getName();
        String pharmacyName = stock.getPharmacy().getName();
        Long pharmacyId = stock.getPharmacy().getId();

        notificationService.notify(
                "pharmacy:" + pharmacyId,
                "Nouvelle réservation N°" + saved.getId(),
                saved.getPatientName() + " a réservé " + saved.getQuantity() + "x " + medName,
                "RESERVATION",
                "/dashboard?tab=reservations"
        );

        String patientKey = saved.getPatientEmail() != null && !saved.getPatientEmail().isBlank()
                ? saved.getPatientEmail()
                : (saved.getPatientContact() != null ? saved.getPatientContact() : saved.getPatientName());

        notificationService.notify(
                patientKey,
                "Réservation reçue N°" + saved.getId(),
                "Votre demande pour " + saved.getQuantity() + "x " + medName + " a été envoyée à " + pharmacyName + ".",
                "RESERVATION",
                "/patient"
        );

        messagingTemplate.convertAndSend("/topic/pharmacy/" + pharmacyId + "/reservations",
                "Nouvelle réservation (N°" + saved.getId() + ") de " + saved.getPatientName() + " pour " + medName);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        Reservation res = reservationRepository.findById(id).orElse(null);
        if (res == null) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = payload.get("status");
        if (newStatus == null || !java.util.Set.of("PENDING", "CONFIRMED", "COMPLETED", "CANCELLED").contains(newStatus)) {
            return ResponseEntity.badRequest().body("Statut invalide");
        }
        if (res.getStock() != null && res.getStock().getPharmacy() != null
                && !pharmacyAccessService.canManage(res.getStock().getPharmacy().getId())) {
            return ResponseEntity.status(403).body("Vous ne gérez pas cette pharmacie");
        }
        // Le stock n'est "retenu" que tant que la réservation est en attente ou confirmée.
        // Une réservation expirée ou déjà annulée a déjà rendu son stock.
        String oldStatus = res.getStatus();
        boolean stockStillReserved = "PENDING".equals(oldStatus) || "CONFIRMED".equals(oldStatus);
        String patientKey = res.getPatientEmail() != null && !res.getPatientEmail().isBlank()
                ? res.getPatientEmail()
                : (res.getPatientContact() != null ? res.getPatientContact() : res.getPatientName());

        if ("CANCELLED".equals(newStatus) && stockStillReserved) {
            Stock stock = res.getStock();
            stock.setQuantity(stock.getQuantity() + res.getQuantity());
            stockRepository.save(stock);

            notificationService.notify(
                    patientKey,
                    "Réservation annulée N°" + res.getId(),
                    "Votre réservation a été annulée. Le stock a été libéré.",
                    "RESERVATION",
                    "/patient"
            );
            messagingTemplate.convertAndSend("/topic/patient/" + res.getPatientName() + "/reservations",
                    "Votre réservation N°" + res.getId() + " a été ANNULÉE.");

        } else if ("CONFIRMED".equals(newStatus) || "COMPLETED".equals(newStatus)) {
            String label = "CONFIRMED".equals(newStatus) ? "confirmée" : "terminée";
            notificationService.notify(
                    patientKey,
                    "Réservation " + label + " N°" + res.getId(),
                    "Votre réservation est maintenant " + newStatus + ". Présentez-vous en pharmacie ou suivez la livraison.",
                    "RESERVATION",
                    "/patient"
            );
            messagingTemplate.convertAndSend("/topic/patient/" + res.getPatientName() + "/reservations",
                    "Votre réservation N°" + res.getId() + " est maintenant " + newStatus + ".");
        }

        res.setStatus(newStatus);
        return ResponseEntity.ok(reservationRepository.save(res));
    }
}
