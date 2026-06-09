package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pay_slips")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaySlip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "moniteur_id", nullable = false)
    private User moniteur;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    private Integer totalHours; // Total hours worked in the period

    private Double hourlyRate; // Rate at time of generation

    private Double hoursPayment; // totalHours * hourlyRate

    private Double fixedSalary; // Base salary component

    private Integer examSuccessCount; // Number of candidates who passed NARSA

    private Double bonusPerExam; // Bonus rate at time of generation

    private Double totalBonus; // examSuccessCount * bonusPerExam

    private Double totalPay; // hoursPayment + fixedSalary + totalBonus

    private String status = "GENERATED"; // GENERATED, PAID, CANCELLED

    private String payFrequency; // WEEKLY, BIWEEKLY, MONTHLY
}
