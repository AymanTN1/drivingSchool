package com.drivingschool.dto;

import lombok.Data;

@Data
public class SupportLessonRequest {
    private Long candidateId;
    private Long moniteurId;
    private Long vehicleId;         // Optional
    private String sessionDate;     // ISO format: "2026-07-10T10:00"
    private Integer durationMinutes; // 60, 90, or 120
    private Double pricePerSession;
    private String lessonType;      // PERFECTIONNEMENT, PREPARATION_EXAMEN, POST_ECHEC, etc.
    private String comments;        // Optional notes
}
