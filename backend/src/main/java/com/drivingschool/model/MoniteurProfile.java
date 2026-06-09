package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "moniteur_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoniteurProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String phone;

    private String capNumber; // Certificat d'Aptitude Professionnelle

    private LocalDate capExpiryDate;

    private Long activeVehicleId; // Vehicle associated with driving lessons

    // --- Payroll Configuration ---
    private String payFrequency = "MONTHLY"; // WEEKLY, BIWEEKLY, MONTHLY

    private Double hourlyRate = 50.0; // DH per hour of driving lesson

    private Double fixedSalary = 0.0; // Optional fixed base salary (DH)

    private Double bonusPerExamSuccess = 50.0; // Prime per candidate passing NARSA exam
}
