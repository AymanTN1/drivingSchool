package com.drivingschool.repository;

import com.drivingschool.model.CandidateProfile;
import com.drivingschool.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, Long> {
    Optional<CandidateProfile> findByUserId(Long userId);
    List<CandidateProfile> findByAssignedMoniteurId(Long moniteurId);
    
    List<CandidateProfile> findByPermitExpiryDateBetween(java.time.LocalDate start, java.time.LocalDate end);
    List<CandidateProfile> findByRegistrationDateAfter(java.time.LocalDate date);
    List<CandidateProfile> findByNarsaExamDateAfter(java.time.LocalDate date);
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(c.totalAmount - c.amountPaid), 0) FROM CandidateProfile c WHERE c.totalAmount > c.amountPaid")
    Double sumOutstandingBalances();
}
