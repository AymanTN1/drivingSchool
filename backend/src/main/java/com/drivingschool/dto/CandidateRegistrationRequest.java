package com.drivingschool.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CandidateRegistrationRequest {
    private String username;
    private String password;
    private String email;
    private String fullName;
    private String cin;
    private String phone;
    private LocalDate birthDate;
    private String permitNumber;
    private LocalDate permitExpiryDate;
    private Double totalAmount;
    private Double amountPaid;
    private Integer maxWeeklyLessons;
    private Long assignedMoniteurId;
}
