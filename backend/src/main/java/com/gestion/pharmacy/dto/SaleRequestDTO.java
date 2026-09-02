package com.gestion.pharmacy.dto;

import lombok.Data;

@Data
public class SaleRequestDTO {
    private Long pharmacyId;
    private Long medicationId;
    private Long stockId;
    private Integer quantity;
    private String customerName;
    private String lotNumber;
}
