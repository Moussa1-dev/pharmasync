package com.gestion.pharmacy.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StockRequestDTO {
    
    @NotNull(message = "L'ID du médicament est requis")
    private Long medicationId;
    
    @NotNull(message = "La quantité est requise")
    @Min(value = 1, message = "La quantité doit être supérieure à 0")
    private Integer quantity;
    
    @NotNull(message = "La date d'expiration est requise")
    @Future(message = "La date d'expiration doit être dans le futur")
    private LocalDate expirationDate;

    private String lotNumber;
    private String serialNumber;
}
