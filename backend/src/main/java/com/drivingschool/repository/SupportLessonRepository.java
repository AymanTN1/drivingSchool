package com.drivingschool.repository;

import com.drivingschool.model.BookingStatus;
import com.drivingschool.model.SupportLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SupportLessonRepository extends JpaRepository<SupportLesson, Long> {

    List<SupportLesson> findByCandidateId(Long candidateId);

    List<SupportLesson> findByMoniteurId(Long moniteurId);

    List<SupportLesson> findByStatus(BookingStatus status);

    List<SupportLesson> findBySessionDateBetween(LocalDateTime start, LocalDateTime end);

    // Check for scheduling conflicts: is this moniteur already booked at this time?
    @Query("SELECT s FROM SupportLesson s WHERE s.moniteur.id = :moniteurId " +
           "AND s.status <> com.drivingschool.model.BookingStatus.CANCELLED " +
           "AND s.sessionDate BETWEEN :start AND :end")
    List<SupportLesson> findConflictsForMoniteur(Long moniteurId, LocalDateTime start, LocalDateTime end);

    // Total revenue from completed & paid support lessons
    @Query("SELECT COALESCE(SUM(s.pricePerSession), 0) FROM SupportLesson s WHERE s.status = com.drivingschool.model.BookingStatus.COMPLETED AND s.paid = true")
    Double sumCompletedRevenue();

    // Total hours delivered
    @Query("SELECT COALESCE(SUM(s.durationMinutes), 0) FROM SupportLesson s WHERE s.status = com.drivingschool.model.BookingStatus.COMPLETED")
    Integer sumCompletedDurationMinutes();

    // Count by status
    long countByStatus(BookingStatus status);

    // Revenue after a date (for monthly trends)
    List<SupportLesson> findByStatusAndSessionDateAfter(BookingStatus status, LocalDateTime after);

    @Query("SELECT COUNT(s) FROM SupportLesson s WHERE s.candidate.id = :candidateId AND s.status = com.drivingschool.model.BookingStatus.COMPLETED")
    long countCompletedByCandidateId(Long candidateId);

    // Candidate rating stats per moniteur (for admin analytics)
    @Query("SELECT AVG(s.candidateRating) FROM SupportLesson s WHERE s.moniteur.id = :moniteurId AND s.candidateRating IS NOT NULL")
    Double avgCandidateRatingByMoniteur(Long moniteurId);

    @Query("SELECT COUNT(s) FROM SupportLesson s WHERE s.moniteur.id = :moniteurId AND s.candidateRating IS NOT NULL")
    Long countCandidateRatingsByMoniteur(Long moniteurId);

    // All rated sessions (for admin global view)
    @Query("SELECT s FROM SupportLesson s WHERE s.candidateRating IS NOT NULL ORDER BY s.sessionDate DESC")
    List<SupportLesson> findAllRatedByCandidate();
}
