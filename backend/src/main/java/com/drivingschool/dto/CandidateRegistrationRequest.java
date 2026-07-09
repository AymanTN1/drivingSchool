package com.drivingschool.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
public class CandidateRegistrationRequest {
    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    private String username;
    
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;
    
    @NotBlank(message = "Le nom complet est obligatoire")
    private String fullName;
    
    @NotBlank(message = "Le CIN est obligatoire")
    private String cin;
    
    @NotBlank(message = "Le téléphone est obligatoire")
    private String phone;
    
    @NotNull(message = "La date de naissance est obligatoire")
    private LocalDate birthDate;
    
    private String permitNumber;
    private LocalDate permitExpiryDate;
    
    @NotNull(message = "Le montant total est obligatoire")
    private Double totalAmount;
    
    @NotNull(message = "Le montant payé est obligatoire")
    private Double amountPaid;
    
    private Integer maxWeeklyLessons;
    private Long assignedMoniteurId;
}
