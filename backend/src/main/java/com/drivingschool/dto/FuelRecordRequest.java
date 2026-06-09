package com.drivingschool.dto;

import lombok.Data;

@Data
public class FuelRecordRequest {
    private Long vehicleId;
    private Double liters;
    private Double pricePerLiter;
    private Double totalCost;
    private Integer odometerKm;
    private String station;
    private String notes;
}
