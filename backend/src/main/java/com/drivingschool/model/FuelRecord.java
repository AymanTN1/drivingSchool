package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "fuel_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FuelRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "moniteur_id", nullable = false)
    private User moniteur;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(nullable = false)
    private Double liters; // Litres de carburant

    @Column(nullable = false)
    private Double pricePerLiter; // Prix au litre (DH)

    @Column(nullable = false)
    private Double totalCost; // Coût total du plein (DH)

    @Column(nullable = false)
    private Integer odometerKm; // Kilométrage au compteur

    private String station; // Afriquia, Total, Shell, etc.

    private String notes; // Notes optionnelles
}
