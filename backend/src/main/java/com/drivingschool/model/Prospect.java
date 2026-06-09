package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "prospects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Prospect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String phone;

    private String licenseType = "B"; // B, C, D...

    @Enumerated(EnumType.STRING)
    private ProspectStatus status = ProspectStatus.NEW;

    private LocalDate createdAt = LocalDate.now();

    private LocalDate lastContactDate = LocalDate.now();
    
    private String notes; // Notes from assistant
}
