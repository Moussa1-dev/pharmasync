package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.repository.ReservationRepository;
import com.gestion.pharmacy.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationScheduler {

    private final ReservationRepository reservationRepository;
    private final StockRepository stockRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final SmsService smsService;
    private static final Logger logger = LoggerFactory.getLogger(ReservationScheduler.class);

    /** Expire les PENDING > 24h */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void expireOldReservations() {
        logger.info("Exécution : expiration des réservations (EF-28)");
        LocalDateTime expirationThreshold = LocalDateTime.now().minusHours(24);

        List<Reservation> expiredReservations = reservationRepository
                .findByStatusAndCreatedAtBefore("PENDING", expirationThreshold);

        if (!expiredReservations.isEmpty()) {
            for (Reservation res : expiredReservations) {
                res.setStatus("EXPIRED");

                Stock stock = res.getStock();
                stock.setQuantity(stock.getQuantity() + res.getQuantity());
                stockRepository.save(stock);

                logger.info("Réservation N°{} expirée. Stock restitué.", res.getId());

                String patientKey = res.getPatientEmail() != null && !res.getPatientEmail().isBlank()
                        ? res.getPatientEmail()
                        : (res.getPatientContact() != null ? res.getPatientContact() : res.getPatientName());

                notificationService.notify(
                        patientKey,
                        "Réservation expirée N°" + res.getId(),
                        "Votre réservation a expiré faute de retrait. Le stock a été libéré.",
                        "RESERVATION",
                        "/patient"
                );
                notificationService.notify(
                        "pharmacy:" + stock.getPharmacy().getId(),
                        "Réservation expirée N°" + res.getId(),
                        "Le stock a été restitué automatiquement.",
                        "RESERVATION",
                        "/dashboard?tab=reservations"
                );

                smsService.send(res.getPatientContact(),
                        "PharmaSync: votre réservation N°" + res.getId() + " a expiré. Stock libéré.");

                messagingTemplate.convertAndSend("/topic/patient/" + res.getPatientName() + "/reservations",
                        "Votre réservation N°" + res.getId() + " a expiré faute de retrait.");
                messagingTemplate.convertAndSend("/topic/pharmacy/" + stock.getPharmacy().getId() + "/reservations",
                        "La réservation N°" + res.getId() + " a expiré. Le stock a été restitué.");
            }
            reservationRepository.saveAll(expiredReservations);
        }
    }

    /**
     * Rappel SMS ~2h avant expiration (PENDING créées entre 22h et 24h).
     * Exécuté toutes les 30 minutes.
     */
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void sendExpiryReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = now.minusHours(24);
        LocalDateTime to = now.minusHours(22);

        List<Reservation> toRemind = reservationRepository
                .findByStatusAndCreatedAtBetweenAndSmsReminderSentFalse("PENDING", from, to);

        for (Reservation res : toRemind) {
            String med = res.getStock() != null && res.getStock().getMedication() != null
                    ? res.getStock().getMedication().getName() : "médicament";
            String pharmacy = res.getStock() != null && res.getStock().getPharmacy() != null
                    ? res.getStock().getPharmacy().getName() : "pharmacie";

            String sms = "PharmaSync: rappel — votre réservation N°" + res.getId()
                    + " (" + med + ") à " + pharmacy
                    + " expire bientôt. Merci de retirer sous 2h.";

            smsService.send(res.getPatientContact(), sms);

            String patientKey = res.getPatientEmail() != null && !res.getPatientEmail().isBlank()
                    ? res.getPatientEmail()
                    : (res.getPatientContact() != null ? res.getPatientContact() : res.getPatientName());

            notificationService.notify(
                    patientKey,
                    "Rappel réservation N°" + res.getId(),
                    "Votre réservation expire bientôt (~2h). Présentez-vous en pharmacie.",
                    "SMS_REMINDER",
                    "/patient"
            );

            res.setSmsReminderSent(true);
            logger.info("SMS rappel envoyé pour réservation N°{}", res.getId());
        }

        if (!toRemind.isEmpty()) {
            reservationRepository.saveAll(toRemind);
        }
    }
}
