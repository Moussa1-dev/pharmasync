package com.gestion.pharmacy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_notification")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Destinataire : email utilisateur, ou "pharmacy:{id}", ou contact patient */
    private String recipientKey;

    private String title;

    @Column(length = 1000)
    private String message;

    /** RESERVATION, STOCK, ORDER, SYSTEM */
    private String type;

    private String link;

    private boolean readFlag = false;

    private LocalDateTime createdAt;

    @PrePersist
    public void init() {
        this.createdAt = LocalDateTime.now();
    }
}
