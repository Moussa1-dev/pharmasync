package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.Payment;
import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.repository.PaymentRepository;
import com.gestion.pharmacy.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MobileMoneyService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;

    @Transactional
    public Payment initiate(Long reservationId, String provider, String phoneNumber) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));

        String normalizedProvider = provider == null ? "" : provider.toUpperCase(Locale.ROOT);
        if (!normalizedProvider.equals("ORANGE_MONEY") && !normalizedProvider.equals("AIRTEL_MONEY")) {
            throw new IllegalArgumentException("Fournisseur invalide (ORANGE_MONEY ou AIRTEL_MONEY)");
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Numéro de téléphone requis");
        }

        double amount = reservation.getAmountDue() != null
                ? reservation.getAmountDue()
                : computeAmount(reservation);

        reservation.setAmountDue(amount);
        reservation.setPaymentMethod(normalizedProvider);
        reservation.setPaymentPhone(phoneNumber.trim());
        reservation.setPaymentStatus("PENDING");

        Payment payment = paymentRepository.findByReservationId(reservationId).orElse(new Payment());
        payment.setReservation(reservation);
        payment.setProvider(normalizedProvider);
        payment.setPhoneNumber(phoneNumber.trim());
        payment.setAmount(amount);
        payment.setStatus("PENDING");
        payment.setExternalReference(generateReference(normalizedProvider));
        payment.setPaidAt(null);

        Payment saved = paymentRepository.save(payment);
        reservation.setPaymentReference(saved.getExternalReference());
        reservationRepository.save(reservation);
        return saved;
    }

    /**
     * Simulation du callback opérateur (Orange / Airtel).
     * En production, remplacé par un webhook signé.
     */
    @Transactional
    public Payment confirm(String externalReference, boolean success) {
        Payment payment = paymentRepository.findByExternalReference(externalReference)
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable"));

        Reservation reservation = payment.getReservation();
        if (success) {
            payment.setStatus("PAID");
            payment.setPaidAt(LocalDateTime.now());
            reservation.setPaymentStatus("PAID");
        } else {
            payment.setStatus("FAILED");
            reservation.setPaymentStatus("FAILED");
        }
        reservationRepository.save(reservation);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment confirmByReservation(Long reservationId, boolean success) {
        Payment payment = paymentRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable"));
        return confirm(payment.getExternalReference(), success);
    }

    public double computeAmount(Reservation reservation) {
        double unit = reservation.getStock() != null
                && reservation.getStock().getMedication() != null
                && reservation.getStock().getMedication().getIndicativePrice() != null
                ? reservation.getStock().getMedication().getIndicativePrice()
                : 0;
        int qty = reservation.getQuantity() != null ? reservation.getQuantity() : 1;
        double total = unit * qty;
        if ("LIVRAISON".equalsIgnoreCase(reservation.getDeliveryMode())) {
            total += 1000;
        }
        return total;
    }

    private String generateReference(String provider) {
        String prefix = provider.startsWith("ORANGE") ? "OM" : "AM";
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }
}
