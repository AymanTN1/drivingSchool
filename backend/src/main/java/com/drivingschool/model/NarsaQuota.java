package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "narsa_quotas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NarsaQuota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String monthYear; // Format: MM-yyyy (e.g. "06-2026")

    @Column(nullable = false)
    private Integer totalQuota = 15; // Standard default

    @Column(nullable = false)
    private Integer usedQuota = 0;
}
