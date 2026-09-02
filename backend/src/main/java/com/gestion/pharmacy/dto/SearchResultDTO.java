package com.gestion.pharmacy.dto;

import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.entity.Stock;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SearchResultDTO {
    private Stock stock;
    private Pharmacy pharmacy;
    private Double distanceKm;
    private boolean isAlternative;

    public SearchResultDTO(Stock stock, Pharmacy pharmacy, Double distanceKm) {
        this.stock = stock;
        this.pharmacy = pharmacy;
        this.distanceKm = distanceKm;
        this.isAlternative = false;
    }
}
