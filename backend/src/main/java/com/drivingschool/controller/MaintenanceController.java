package com.drivingschool.controller;

import com.drivingschool.dto.AiPredictionResponse;
import com.drivingschool.model.MaintenanceRecord;
import com.drivingschool.repository.MaintenanceRecordRepository;
import com.drivingschool.service.PredictiveMaintenanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fleet/maintenance")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MaintenanceController {

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private PredictiveMaintenanceService predictiveMaintenanceService;

    @GetMapping("/{vehicleId}/records")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    public ResponseEntity<List<MaintenanceRecord>> getVehicleMaintenanceHistory(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceRecordRepository.findByVehicleIdOrderByDateDesc(vehicleId));
    }

    @PostMapping("/{vehicleId}/records")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceRecord> addMaintenanceRecord(@PathVariable Long vehicleId, @RequestBody MaintenanceRecord record) {
        // vehicle association is assumed to be handled in a real service, but for demo we can save it directly
        // if vehicle object has the id set
        return ResponseEntity.ok(maintenanceRecordRepository.save(record));
    }

    @GetMapping("/{vehicleId}/predict")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, AiPredictionResponse>> getAiPredictions(@PathVariable Long vehicleId) {
        Map<String, AiPredictionResponse> predictions = predictiveMaintenanceService.getMaintenancePredictions(vehicleId);
        return ResponseEntity.ok(predictions);
    }
}
