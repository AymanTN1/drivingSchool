package com.drivingschool.service;

import com.drivingschool.dto.AiPredictionResponse;
import com.drivingschool.dto.AiVehicleDataRequest;
import com.drivingschool.model.MaintenanceRecord;
import com.drivingschool.model.MaintenanceType;
import com.drivingschool.model.Vehicle;
import com.drivingschool.repository.MaintenanceRecordRepository;
import com.drivingschool.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PredictiveMaintenanceService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://ai-service:8000}")
    private String aiServiceUrl;

    public Map<String, AiPredictionResponse> getMaintenancePredictions(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        List<MaintenanceRecord> records = maintenanceRecordRepository.findByVehicleIdOrderByDateDesc(vehicleId);

        Map<String, Integer> lastMaintenanceMileage = new HashMap<>();
        for (MaintenanceType type : MaintenanceType.values()) {
            lastMaintenanceMileage.put(type.name(), 0); // Default to 0
        }

        // Find the most recent mileage for each maintenance type
        for (MaintenanceRecord record : records) {
            String typeName = record.getType().name();
            if (lastMaintenanceMileage.get(typeName) == 0 && record.getMileageAtMaintenance() != null) {
                lastMaintenanceMileage.put(typeName, record.getMileageAtMaintenance());
            }
        }

        AiVehicleDataRequest requestData = new AiVehicleDataRequest();
        requestData.setVehicle_id(vehicle.getId());
        requestData.setCurrent_mileage(vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0);
        
        // Calculate a rough average daily mileage (mock logic for demo: 50 km/day)
        // In a real app, this would be calculated from FuelRecords or GPS logs.
        requestData.setAvg_daily_mileage(50.0);
        
        requestData.setLast_maintenance_mileage(lastMaintenanceMileage);

        // Make HTTP Call to FastAPI Microservice
        ResponseEntity<Map<String, AiPredictionResponse>> response = restTemplate.exchange(
                aiServiceUrl + "/predict/maintenance",
                HttpMethod.POST,
                new HttpEntity<>(requestData),
                new ParameterizedTypeReference<Map<String, AiPredictionResponse>>() {}
        );

        return response.getBody();
    }
}
