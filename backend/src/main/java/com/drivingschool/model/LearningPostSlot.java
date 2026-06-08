package com.drivingschool.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "learning_post_slots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningPostSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @Column(nullable = false)
    private Integer postNumber; // 1 to 15

    @Column(nullable = false)
    private LocalDateTime slotDateTime;

    private Integer durationMinutes = 60;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.BOOKED;
}
