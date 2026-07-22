package com.drivingschool.service;

import com.drivingschool.dto.AiPredictionResponse;
import com.drivingschool.dto.AiVehicleDataRequest;
import com.drivingschool.dto.CandidateRiskRequest;
import com.drivingschool.dto.CandidateRiskResponse;
import com.drivingschool.model.CandidateProfile;
import com.drivingschool.repository.CandidateProfileRepository;
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
public class AiPredictionService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private CandidateProfileRepository candidateProfileRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://ai-service:8000}")
    private String aiServiceUrl;

    private static final Map<String, Integer> MAINTENANCE_THRESHOLDS = Map.of(
            "OIL_CHANGE", 10000,
            "TIRE_REPLACEMENT", 40000,
            "BRAKE_PADS", 30000,
            "WINDSHIELD_WIPERS", 20000,
            "ENGINE_REPAIR", 100000,
            "TECHNICAL_VISIT", 15000,
            "OTHER", 50000
    );

    public Map<String, AiPredictionResponse> getMaintenancePredictions(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        List<MaintenanceRecord> records = maintenanceRecordRepository.findByVehicleIdOrderByDateDesc(vehicleId);

        Map<String, Integer> lastMaintenanceMileage = new HashMap<>();
        for (MaintenanceType type : MaintenanceType.values()) {
            lastMaintenanceMileage.put(type.name(), 0);
        }

        for (MaintenanceRecord record : records) {
            String typeName = record.getType().name();
            if (lastMaintenanceMileage.get(typeName) == 0 && record.getMileageAtMaintenance() != null) {
                lastMaintenanceMileage.put(typeName, record.getMileageAtMaintenance());
            }
        }

        AiVehicleDataRequest requestData = new AiVehicleDataRequest();
        requestData.setVehicle_id(vehicle.getId());
        requestData.setCurrent_mileage(vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0);
        requestData.setAvg_daily_mileage(50.0);
        requestData.setLast_maintenance_mileage(lastMaintenanceMileage);

        try {
            ResponseEntity<Map<String, AiPredictionResponse>> response = restTemplate.exchange(
                    aiServiceUrl + "/predict/maintenance",
                    HttpMethod.POST,
                    new HttpEntity<>(requestData),
                    new ParameterizedTypeReference<Map<String, AiPredictionResponse>>() {}
            );
            if (response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            // Graceful fallback to in-memory predictive calculation if FastAPI service is offline/unreachable
        }

        return calculateLocalMaintenancePredictions(requestData);
    }

    public CandidateRiskResponse getCandidateRiskPrediction(Long candidateId) {
        CandidateProfile candidate = candidateProfileRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        CandidateRiskRequest requestData = new CandidateRiskRequest();
        requestData.setCandidate_id(candidate.getId());
        requestData.setTheoretical_test_score(candidate.getTheoreticalTestScore() != null ? candidate.getTheoreticalTestScore() : 0);
        requestData.setClasses_attended(candidate.getClassesAttended() != null ? candidate.getClassesAttended() : 0);
        requestData.setClasses_missed(candidate.getClassesMissed() != null ? candidate.getClassesMissed() : 0);
        requestData.setInstructor_evaluation_score(candidate.getInstructorEvaluationScore() != null ? candidate.getInstructorEvaluationScore() : 0);

        try {
            ResponseEntity<CandidateRiskResponse> response = restTemplate.exchange(
                    aiServiceUrl + "/predict/candidate-risk",
                    HttpMethod.POST,
                    new HttpEntity<>(requestData),
                    CandidateRiskResponse.class
            );
            if (response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            // Graceful fallback to in-memory risk scoring if FastAPI service is offline/unreachable
        }

        return calculateLocalCandidateRiskPrediction(requestData);
    }

    private Map<String, AiPredictionResponse> calculateLocalMaintenancePredictions(AiVehicleDataRequest data) {
        Map<String, AiPredictionResponse> predictions = new HashMap<>();

        for (Map.Entry<String, Integer> entry : MAINTENANCE_THRESHOLDS.entrySet()) {
            String mType = entry.getKey();
            int threshold = entry.getValue();
            Integer lastMileageObj = data.getLast_maintenance_mileage().get(mType);
            int lastMileage = lastMileageObj != null ? lastMileageObj : 0;

            int distanceSinceLast = Math.max(0, data.getCurrent_mileage() - lastMileage);
            double risk = (double) distanceSinceLast / threshold;

            if (risk > 0.8) {
                risk = risk + Math.pow(risk - 0.8, 2) * 5;
            }
            risk = Math.min(Math.max(risk, 0.0), 1.0);

            int distanceRemaining = threshold - distanceSinceLast;
            int daysRemaining = data.getAvg_daily_mileage() > 0 ? (int) (distanceRemaining / data.getAvg_daily_mileage()) : 999;

            String rec;
            if (risk >= 0.9) {
                rec = "CRITIQUE: Planifier immédiatement";
            } else if (risk >= 0.7) {
                rec = "ATTENTION: À prévoir bientôt";
            } else {
                rec = "OK: Usure normale";
            }

            AiPredictionResponse resp = new AiPredictionResponse();
            resp.setType(mType);
            resp.setRisk_score(Math.round(risk * 100.0) / 100.0);
            resp.setEstimated_days_remaining(daysRemaining);
            resp.setRecommendation(rec);

            predictions.put(mType, resp);
        }

        return predictions;
    }

    private CandidateRiskResponse calculateLocalCandidateRiskPrediction(CandidateRiskRequest data) {
        double risk = 0.1;

        if (data.getTheoretical_test_score() < 30) {
            risk += (30 - data.getTheoretical_test_score()) * 0.03;
        } else {
            risk -= (data.getTheoretical_test_score() - 30) * 0.01;
        }

        int totalClasses = data.getClasses_attended() + data.getClasses_missed();
        if (totalClasses > 0) {
            double absenteeRate = (double) data.getClasses_missed() / totalClasses;
            risk += absenteeRate * 0.5;
        }

        if (data.getInstructor_evaluation_score() > 0) {
            if (data.getInstructor_evaluation_score() < 3) {
                risk += (3 - data.getInstructor_evaluation_score()) * 0.15;
            } else if (data.getInstructor_evaluation_score() > 3) {
                risk -= (data.getInstructor_evaluation_score() - 3) * 0.10;
            }
        }

        risk = Math.min(Math.max(risk, 0.0), 1.0);

        String level;
        String msg;
        if (risk >= 0.75) {
            level = "CRITICAL";
            msg = "Alerte Rouge : Très fort risque d'abandon ou d'échec. Contacter pour soutien immédiat.";
        } else if (risk >= 0.50) {
            level = "HIGH";
            msg = "Risque Élevé : Attention requise. Proposer des leçons supplémentaires.";
        } else if (risk >= 0.25) {
            level = "MEDIUM";
            msg = "Risque Modéré : Suivi normal.";
        } else {
            level = "LOW";
            msg = "Bonne progression. Aucun risque détecté.";
        }

        CandidateRiskResponse response = new CandidateRiskResponse();
        response.setCandidate_id(data.getCandidate_id());
        response.setRisk_score(Math.round(risk * 100.0) / 100.0);
        response.setRisk_level(level);
        response.setAlert_message(msg);

        return response;
    }
}
