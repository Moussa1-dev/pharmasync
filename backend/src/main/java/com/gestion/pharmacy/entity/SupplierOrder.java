package com.gestion.pharmacy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pharmacyId;

    private String supplierName;
    private String medicationName;
    private Integer quantity;
    private Double unitPrice;
    private Double total;
    private LocalDate expectedDate;

    /** PENDING, CONFIRMED, RECEIVED, CANCELLED */
    private String status;

    private LocalDateTime createdAt;

    @PrePersist
    public void init() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING";
        }
        if (this.unitPrice != null && this.quantity != null) {
            this.total = this.unitPrice * this.quantity;
        }
    }
}
