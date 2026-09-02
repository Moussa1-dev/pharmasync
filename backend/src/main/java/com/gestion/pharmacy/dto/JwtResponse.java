package com.gestion.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private Long id;
    private String email;
    private List<String> roles;
    private List<PharmacySummary> pharmacies;
    private Long activePharmacyId;

    @Data
    @AllArgsConstructor
    public static class PharmacySummary {
        private Long id;
        private String name;
        private String address;
    }
}
