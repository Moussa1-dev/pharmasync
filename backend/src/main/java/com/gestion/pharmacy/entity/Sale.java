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
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pharmacy_id")
    private Pharmacy pharmacy;

    @ManyToOne
    @JoinColumn(name = "medication_id")
    private Medication medication;

    private Integer quantity;
    
    private Double totalPrice;

    private String customerName; // Optional

    private String lotNumber;
    private String serialNumber;

    private LocalDateTime saleDate;

    @PrePersist
    public void onCreate() {
        this.saleDate = LocalDateTime.now();
    }
}
