package com.drivingschool.repository;

import com.drivingschool.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByLicensePlate(String licensePlate);
    List<Vehicle> findByStatus(String status);
    
    List<Vehicle> findByNextTechnicalVisitBetween(java.time.LocalDate start, java.time.LocalDate end);
    List<Vehicle> findByVignetteExpiryDateBetween(java.time.LocalDate start, java.time.LocalDate end);
    List<Vehicle> findByInsuranceExpiryDateBetween(java.time.LocalDate start, java.time.LocalDate end);
}
