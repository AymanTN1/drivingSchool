package com.drivingschool.repository;

import com.drivingschool.model.NarsaQuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NarsaQuotaRepository extends JpaRepository<NarsaQuota, Long> {
    Optional<NarsaQuota> findByMonthYear(String monthYear);
}
