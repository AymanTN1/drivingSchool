package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false, unique = true)
    private String licensePlate;

    private Integer currentMileage = 0;

    private LocalDate lastTechnicalVisit;

    private LocalDate nextTechnicalVisit; // Critical date

    private LocalDate insuranceExpiryDate;

    private LocalDate vignetteExpiryDate;

    private String status = "ACTIVE"; // ACTIVE, IN_MAINTENANCE, RETIRED
}
