package com.drivingschool.repository;

import com.drivingschool.model.BookingStatus;
import com.drivingschool.model.DrivingLessonSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DrivingLessonSlotRepository extends JpaRepository<DrivingLessonSlot, Long> {
    List<DrivingLessonSlot> findByCandidateId(Long candidateId);
    List<DrivingLessonSlot> findByMoniteurId(Long moniteurId);
    List<DrivingLessonSlot> findBySlotDateTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, BookingStatus status);
    
    long countByVehicleIdAndStatus(Long vehicleId, BookingStatus status);

    @Query("SELECT COUNT(d) FROM DrivingLessonSlot d WHERE d.candidate.id = :candidateId " +
           "AND d.slotDateTime >= :start AND d.slotDateTime <= :end AND d.status <> 'CANCELLED'")
    long countWeeklyLessonsForCandidate(
            @Param("candidateId") Long candidateId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT d FROM DrivingLessonSlot d WHERE d.moniteur.id = :moniteurId " +
           "AND d.slotDateTime >= :start AND d.slotDateTime <= :end AND d.status <> 'CANCELLED'")
    List<DrivingLessonSlot> findMoniteurLessonsInPeriod(
            @Param("moniteurId") Long moniteurId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
