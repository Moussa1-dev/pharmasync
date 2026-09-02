package com.gestion.pharmacy.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pharmacy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    private String name;
    
    @NotBlank(message = "L'adresse est obligatoire")
    private String address;
    
    private String contact;

    // Coordonnées GPS pour la localisation et calcul de distance
    private Double latitude;
    private Double longitude;

    // Pharmacie de garde
    private Boolean isOnCall = false;
}
