package com.gestion.pharmacy.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String nom;
    private String prenom;
    private String email;
    private String password;
    private String telephone;
    private String role;
}
