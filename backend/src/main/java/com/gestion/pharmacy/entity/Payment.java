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
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    /** ORANGE_MONEY | AIRTEL_MONEY | CASH */
    private String provider;

    private String phoneNumber;
    private Double amount;

    /** PENDING | PAID | FAILED | CANCELLED */
    private String status;

    /** Référence transaction (simulée ou réelle) */
    private String externalReference;

    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @PrePersist
    public void init() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING";
        }
    }
}
