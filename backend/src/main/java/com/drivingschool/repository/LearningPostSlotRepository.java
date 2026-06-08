package com.drivingschool.repository;

import com.drivingschool.model.BookingStatus;
import com.drivingschool.model.LearningPostSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LearningPostSlotRepository extends JpaRepository<LearningPostSlot, Long> {
    List<LearningPostSlot> findBySlotDateTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, BookingStatus status);
    List<LearningPostSlot> findByCandidateId(Long candidateId);
    long countBySlotDateTimeAndStatus(LocalDateTime dateTime, BookingStatus status);
    List<LearningPostSlot> findBySlotDateTimeAndStatus(LocalDateTime dateTime, BookingStatus status);
    boolean existsByPostNumberAndSlotDateTimeAndStatus(Integer postNumber, LocalDateTime dateTime, BookingStatus status);
}
