package com.drivingschool.repository;

import com.drivingschool.model.FuelRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FuelRecordRepository extends JpaRepository<FuelRecord, Long> {

    List<FuelRecord> findByVehicleIdOrderByDateDesc(Long vehicleId);

    List<FuelRecord> findByMoniteurIdOrderByDateDesc(Long moniteurId);

    @Query("SELECT f FROM FuelRecord f WHERE f.vehicle.id = :vehicleId ORDER BY f.odometerKm ASC")
    List<FuelRecord> findByVehicleIdOrderByOdometerAsc(@Param("vehicleId") Long vehicleId);

    @Query("SELECT f FROM FuelRecord f WHERE f.date >= :start AND f.date <= :end ORDER BY f.date ASC")
    List<FuelRecord> findByDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<FuelRecord> findAllByOrderByDateDesc();
}
