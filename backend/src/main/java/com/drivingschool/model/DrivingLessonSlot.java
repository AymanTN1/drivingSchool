package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "driving_lesson_slots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DrivingLessonSlot {

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
    private LocalDateTime slotDateTime;

    private Integer durationMinutes = 60;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.BOOKED;

    @Lob
    private String comments; // Moniteur logs progress details here (e.g. parallel park success)

    private Integer rating; // 1-5 scale of candidate driving capability in this lesson
}
