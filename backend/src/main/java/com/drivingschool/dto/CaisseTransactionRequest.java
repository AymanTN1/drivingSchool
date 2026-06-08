package com.drivingschool.dto;

import lombok.Data;

@Data
public class CaisseTransactionRequest {
    private Double amount;
    private String type; // CASH, CHECK, TRANSFER
    private Long candidateId;
    private String description;
}
