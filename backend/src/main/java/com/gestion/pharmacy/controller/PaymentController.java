package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.dto.PaymentInitRequest;
import com.gestion.pharmacy.entity.Payment;
import com.gestion.pharmacy.repository.PaymentRepository;
import com.gestion.pharmacy.service.MobileMoneyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

    private final MobileMoneyService mobileMoneyService;
    private final PaymentRepository paymentRepository;

    @PostMapping("/init")
    public ResponseEntity<?> initPayment(@RequestBody PaymentInitRequest request) {
        try {
            Payment payment = mobileMoneyService.initiate(
                    request.getReservationId(),
                    request.getProvider(),
                    request.getPhoneNumber()
            );
            return ResponseEntity.ok(Map.of(
                    "id", payment.getId(),
                    "status", payment.getStatus(),
                    "provider", payment.getProvider(),
                    "amount", payment.getAmount(),
                    "phoneNumber", payment.getPhoneNumber(),
                    "externalReference", payment.getExternalReference(),
                    "message", "Demande envoyée. Validez sur votre téléphone (" + payment.getProvider() + ")."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Simulation confirmation opérateur (demo PFE). */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, Object> body) {
        try {
            String ref = body.get("externalReference") != null
                    ? body.get("externalReference").toString()
                    : null;
            boolean success = body.get("success") == null || Boolean.parseBoolean(body.get("success").toString());

            Payment payment;
            if (ref != null && !ref.isBlank()) {
                payment = mobileMoneyService.confirm(ref, success);
            } else if (body.get("reservationId") != null) {
                Long reservationId = Long.valueOf(body.get("reservationId").toString());
                payment = mobileMoneyService.confirmByReservation(reservationId, success);
            } else {
                return ResponseEntity.badRequest().body("externalReference ou reservationId requis");
            }

            return ResponseEntity.ok(Map.of(
                    "id", payment.getId(),
                    "status", payment.getStatus(),
                    "externalReference", payment.getExternalReference(),
                    "paidAt", payment.getPaidAt() != null ? payment.getPaidAt().toString() : ""
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<?> getByReservation(@PathVariable Long reservationId) {
        return paymentRepository.findByReservationId(reservationId)
                .<ResponseEntity<?>>map(p -> ResponseEntity.ok(Map.of(
                        "id", p.getId(),
                        "status", p.getStatus(),
                        "provider", p.getProvider() != null ? p.getProvider() : "",
                        "amount", p.getAmount() != null ? p.getAmount() : 0,
                        "phoneNumber", p.getPhoneNumber() != null ? p.getPhoneNumber() : "",
                        "externalReference", p.getExternalReference() != null ? p.getExternalReference() : "",
                        "paidAt", p.getPaidAt() != null ? p.getPaidAt().toString() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
