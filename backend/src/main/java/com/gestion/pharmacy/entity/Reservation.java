package com.gestion.pharmacy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;
    private String patientContact;
    /** Email du compte patient (si connecté) pour l'espace personnel */
    private String patientEmail;

    @ManyToOne
    @JoinColumn(name = "stock_id")
    private Stock stock;

    private Integer quantity;
    private String status; // PENDING, CONFIRMED, CANCELLED

    @Lob
    @Column(columnDefinition = "TEXT")
    private String prescriptionBase64; // Pour stocker la photo de l'ordonnance

    private String deliveryMode; // RETRAIT, LIVRAISON
    private String deliveryAddress;

    /** ORANGE_MONEY | AIRTEL_MONEY | CASH | null */
    private String paymentMethod;
    private String paymentPhone;
    /** UNPAID | PENDING | PAID | FAILED */
    private String paymentStatus;
    private String paymentReference;
    private Double amountDue;

    /** true si un SMS de rappel d'expiration a déjà été envoyé */
    private Boolean smsReminderSent = false;

    private LocalDateTime createdAt;

    @PrePersist
    public void init() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING";
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = "UNPAID";
        }
    }
}
