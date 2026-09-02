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
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "stock_id")
    private Stock stock;

    private String type; // "ENTREE", "SORTIE"
    private Integer quantity;
    private String reason; // "ACHAT", "VENTE", "RESERVATION", "INVENTAIRE", "IMPORT"

    private LocalDateTime movementDate;
    
    // Utilisateur ayant effectué le mouvement (optionnel)
    private String userEmail;

    @PrePersist
    public void init() {
        this.movementDate = LocalDateTime.now();
    }
}
