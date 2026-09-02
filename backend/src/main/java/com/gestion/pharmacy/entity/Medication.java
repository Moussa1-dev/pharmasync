package com.gestion.pharmacy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    
    // Prix indicatif du médicament
    private Double indicativePrice;
    
    // Catégorie pour proposer des alternatives
    private String category;

    /** Code-barres EAN-13 / QR produit */
    @Column(unique = true)
    private String barcode;
}
