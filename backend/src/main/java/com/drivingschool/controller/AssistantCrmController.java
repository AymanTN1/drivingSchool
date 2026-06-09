package com.drivingschool.controller;

import com.drivingschool.model.Prospect;
import com.drivingschool.model.ProspectStatus;
import com.drivingschool.repository.ProspectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
public class AssistantCrmController {

    @Autowired
    private ProspectRepository prospectRepository;

    @PreAuthorize("hasAnyRole('ASSISTANT', 'ADMIN')")
    @GetMapping("/prospects")
    public ResponseEntity<List<Prospect>> getAllProspects() {
        return ResponseEntity.ok(prospectRepository.findAll());
    }

    @PreAuthorize("hasAnyRole('ASSISTANT', 'ADMIN')")
    @PutMapping("/prospects/{id}/status")
    public ResponseEntity<?> updateProspectStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {

        Prospect prospect = prospectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prospect introuvable"));

        String newStatusStr = data.get("status");
        if (newStatusStr != null) {
            prospect.setStatus(ProspectStatus.valueOf(newStatusStr));
            prospect.setLastContactDate(LocalDate.now()); // Update last contact on move
        }
        
        if (data.containsKey("notes")) {
            prospect.setNotes(data.get("notes"));
        }

        prospectRepository.save(prospect);

        return ResponseEntity.ok(Map.of("message", "Statut mis à jour avec succès", "prospect", prospect));
    }
}
