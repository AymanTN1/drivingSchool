package com.drivingschool.dto;

import lombok.Data;

@Data
public class CandidateRiskRequest {
    private Long candidate_id;
    private Integer theoretical_test_score;
    private Integer classes_attended;
    private Integer classes_missed;
    private Integer instructor_evaluation_score;
}
