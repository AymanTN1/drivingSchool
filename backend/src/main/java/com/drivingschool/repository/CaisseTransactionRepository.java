package com.drivingschool.repository;

import com.drivingschool.model.CaisseTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CaisseTransactionRepository extends JpaRepository<CaisseTransaction, Long> {
    List<CaisseTransaction> findByCandidateId(Long candidateId);
    List<CaisseTransaction> findByDateBetween(LocalDateTime start, LocalDateTime end);
}
