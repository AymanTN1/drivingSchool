package com.drivingschool.dto;

import lombok.Data;

@Data
public class AiPredictionResponse {
    private String type;
    private Double risk_score;
    private Integer estimated_days_remaining;
    private String recommendation;
}
