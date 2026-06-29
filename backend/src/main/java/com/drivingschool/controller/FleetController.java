package com.drivingschool.controller;

import com.drivingschool.dto.FuelRecordRequest;
import com.drivingschool.model.*;
import com.drivingschool.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
public class FleetController {

    @Autowired
    FuelRecordRepository fuelRecordRepository;

    @Autowired
    VehicleRepository vehicleRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DrivingLessonSlotRepository drivingLessonSlotRepository;

    // --- MONITEUR / ADMIN: Record a fuel fill-up ---
    @PreAuthorize("hasRole('ADMIN') or hasRole('MONITEUR')")
    @PostMapping("/fleet/fuel")
    public ResponseEntity<?> recordFuel(@RequestBody FuelRecordRequest request, Principal principal) {
        User moniteur = userRepository.findByUsername(principal.getName()).orElseThrow();
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        FuelRecord record = new FuelRecord();
        record.setVehicle(vehicle);
        record.setMoniteur(moniteur);
        record.setDate(LocalDateTime.now());
        record.setLiters(request.getLiters());
        record.setPricePerLiter(request.getPricePerLiter());
        record.setTotalCost(request.getTotalCost());
        record.setOdometerKm(request.getOdometerKm());
        record.setStation(request.getStation());
        record.setNotes(request.getNotes());

        fuelRecordRepository.save(record);
        return ResponseEntity.ok(Map.of("message", "Plein de carburant enregistré avec succès !"));
    }

    // --- ADMIN: Get all fuel records ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fleet/fuel")
    public ResponseEntity<?> getAllFuelRecords() {
        return ResponseEntity.ok(fuelRecordRepository.findAllByOrderByDateDesc());
    }

    // --- ADMIN: Get fuel records for a specific vehicle ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fleet/fuel/vehicle/{vehicleId}")
    public ResponseEntity<?> getFuelByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(fuelRecordRepository.findByVehicleIdOrderByDateDesc(vehicleId));
    }

    // --- ADMIN: Full Fleet Analytics (Consumption, Cost per hour, Alerts) ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fleet/analytics")
    public ResponseEntity<?> getFleetAnalytics() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Map<String, Object>> vehicleAnalytics = new ArrayList<>();

        double totalFuelCost = 0;
        double totalLiters = 0;

        for (Vehicle vehicle : vehicles) {
            Map<String, Object> va = new LinkedHashMap<>();
            va.put("vehicleId", vehicle.getId());
            va.put("label", vehicle.getBrand() + " " + vehicle.getModel() + " (" + vehicle.getLicensePlate() + ")");
            va.put("status", vehicle.getStatus());

            // Get fuel records sorted by odometer
            List<FuelRecord> fuelRecords = fuelRecordRepository.findByVehicleIdOrderByOdometerAsc(vehicle.getId());

            double vehicleTotalCost = 0;
            double vehicleTotalLiters = 0;
            double avgConsumption = 0; // L/100km
            double lastConsumption = 0;
            boolean consumptionAlert = false;

            if (fuelRecords.size() >= 2) {
                // Calculate consumption between consecutive fill-ups
                List<Double> consumptions = new ArrayList<>();
                for (int i = 1; i < fuelRecords.size(); i++) {
                    FuelRecord prev = fuelRecords.get(i - 1);
                    FuelRecord curr = fuelRecords.get(i);
                    int kmDiff = curr.getOdometerKm() - prev.getOdometerKm();
                    if (kmDiff > 0) {
                        double consumption = (curr.getLiters() / kmDiff) * 100;
                        consumptions.add(consumption);
                    }
                }

                if (!consumptions.isEmpty()) {
                    avgConsumption = consumptions.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                    lastConsumption = consumptions.get(consumptions.size() - 1);

                    // Alert if last consumption is 50% higher than average
                    if (avgConsumption > 0 && lastConsumption > avgConsumption * 1.5) {
                        consumptionAlert = true;
                    }
                }
            }

            for (FuelRecord fr : fuelRecords) {
                vehicleTotalCost += fr.getTotalCost();
                vehicleTotalLiters += fr.getLiters();
            }

            totalFuelCost += vehicleTotalCost;
            totalLiters += vehicleTotalLiters;

            // Calculate cost per driving hour
            long totalDrivingHours = drivingLessonSlotRepository.countByVehicleIdAndStatus(vehicle.getId(), BookingStatus.COMPLETED);

            double costPerHour = totalDrivingHours > 0 ? vehicleTotalCost / totalDrivingHours : 0;

            // Calculate total km driven
            int totalKm = 0;
            if (fuelRecords.size() >= 2) {
                totalKm = fuelRecords.get(fuelRecords.size() - 1).getOdometerKm() - fuelRecords.get(0).getOdometerKm();
            }

            va.put("totalFuelCost", Math.round(vehicleTotalCost * 100.0) / 100.0);
            va.put("totalLiters", Math.round(vehicleTotalLiters * 100.0) / 100.0);
            va.put("avgConsumption", Math.round(avgConsumption * 100.0) / 100.0);
            va.put("lastConsumption", Math.round(lastConsumption * 100.0) / 100.0);
            va.put("consumptionAlert", consumptionAlert);
            va.put("totalDrivingHours", totalDrivingHours);
            va.put("costPerHour", Math.round(costPerHour * 100.0) / 100.0);
            va.put("totalKmDriven", totalKm);
            va.put("fuelRecordsCount", fuelRecords.size());

            vehicleAnalytics.add(va);
        }

        // Build monthly fuel cost trends (last 6 months)
        List<Map<String, Object>> monthlyTrends = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
            List<FuelRecord> monthRecords = fuelRecordRepository.findByDateBetween(monthStart, monthEnd);

            double monthCost = monthRecords.stream().mapToDouble(FuelRecord::getTotalCost).sum();
            double monthLiters = monthRecords.stream().mapToDouble(FuelRecord::getLiters).sum();

            String label = monthStart.getMonth().toString().substring(0, 3) + " " + monthStart.getYear();

            monthlyTrends.add(Map.of(
                    "name", label,
                    "cout", Math.round(monthCost * 100.0) / 100.0,
                    "litres", Math.round(monthLiters * 100.0) / 100.0
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("vehicles", vehicleAnalytics);
        result.put("monthlyFuelTrends", monthlyTrends);
        result.put("totalFuelCost", Math.round(totalFuelCost * 100.0) / 100.0);
        result.put("totalLiters", Math.round(totalLiters * 100.0) / 100.0);

        return ResponseEntity.ok(result);
    }
}
