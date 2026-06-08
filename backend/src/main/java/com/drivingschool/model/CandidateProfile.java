package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "candidate_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(nullable = false)
    private String cin;

    @Column(nullable = false)
    private String phone;

    private LocalDate birthDate;

    private LocalDate registrationDate = LocalDate.now();

    private String permitNumber; // Permis d'apprendre

    private LocalDate permitExpiryDate; // Alerts trigger on proximity

    private Double totalAmount = 3550.0; // Default standard cost in Morocco

    private Double amountPaid = 0.0;

    private Integer maxWeeklyLessons = 3; // Assigned by assistant to regulate slots

    @ManyToOne
    @JoinColumn(name = "moniteur_id")
    private User assignedMoniteur;

    private String registrationContractPath;

    private LocalDate narsaExamDate; // If set, candidate is presented to the exam
}
