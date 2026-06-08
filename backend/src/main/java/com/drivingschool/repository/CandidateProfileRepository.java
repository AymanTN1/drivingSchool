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
}
