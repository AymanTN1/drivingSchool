package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_lessons", indexes = {
    @Index(name = "idx_support_candidate", columnList = "candidate_id"),
    @Index(name = "idx_support_moniteur", columnList = "moniteur_id"),
    @Index(name = "idx_support_session_date", columnList = "sessionDate")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @ManyToOne
    @JoinColumn(name = "moniteur_id", nullable = false)
    private User moniteur;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDateTime sessionDate;

    @Column(nullable = false)
    private Integer durationMinutes = 60;

    @Column(nullable = false)
    private Double pricePerSession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupportLessonType lessonType = SupportLessonType.PERFECTIONNEMENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.BOOKED;

    private Boolean paid = false;

    @Lob
    private String comments;

    // Moniteur fills this after the session to track candidate progress
    @Lob
    private String moniteurFeedback;

    // Rating of candidate performance during this session (1-5)
    private Integer performanceRating;

    private LocalDateTime createdAt = LocalDateTime.now();
}
