package com.gestion.pharmacy.dto;

import lombok.Data;

@Data
public class PaymentInitRequest {
    private Long reservationId;
    /** ORANGE_MONEY | AIRTEL_MONEY */
    private String provider;
    private String phoneNumber;
}
