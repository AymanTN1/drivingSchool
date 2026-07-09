package com.drivingschool.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    private String username;
    
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}
