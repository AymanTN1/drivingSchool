package com.drivingschool.dto;

import lombok.Data;

@Data
public class CandidateRiskResponse {
    private Long candidate_id;
    private Double risk_score; // 0.0 to 1.0
    private String risk_level; // LOW, MEDIUM, HIGH, CRITICAL
    private String alert_message;
}
