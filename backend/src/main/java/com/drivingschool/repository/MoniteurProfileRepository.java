package com.drivingschool.repository;

import com.drivingschool.model.MoniteurProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface MoniteurProfileRepository extends JpaRepository<MoniteurProfile, Long> {
    Optional<MoniteurProfile> findByUserId(Long userId);
    List<MoniteurProfile> findByCapExpiryDateBetween(java.time.LocalDate start, java.time.LocalDate end);
}
