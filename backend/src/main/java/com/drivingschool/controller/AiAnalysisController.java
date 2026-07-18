package com.drivingschool.controller;

import com.drivingschool.dto.CandidateRiskResponse;
import com.drivingschool.service.AiPredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/candidates")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiAnalysisController {

    @Autowired
    private AiPredictionService aiPredictionService;

    @GetMapping("/{candidateId}/risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSISTANT')")
    public ResponseEntity<CandidateRiskResponse> getCandidateRisk(@PathVariable Long candidateId) {
        CandidateRiskResponse risk = aiPredictionService.getCandidateRiskPrediction(candidateId);
        return ResponseEntity.ok(risk);
    }
}
