package com.drivingschool.controller;

import com.drivingschool.model.Prospect;
import com.drivingschool.repository.ProspectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicProspectController {

    @Autowired
    private ProspectRepository prospectRepository;

    @PostMapping("/prospects")
    public ResponseEntity<?> submitProspectForm(@RequestBody Map<String, String> data) {
        String fullName = data.get("fullName");
        String phone = data.get("phone");
        String licenseType = data.get("licenseType");

        if (fullName == null || fullName.trim().isEmpty() || phone == null || phone.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nom et Téléphone sont obligatoires"));
        }

        Prospect p = new Prospect();
        p.setFullName(fullName);
        p.setPhone(phone);
        p.setLicenseType(licenseType != null ? licenseType : "B");
        
        prospectRepository.save(p);

        return ResponseEntity.ok(Map.of("message", "Demande envoyée avec succès ! Notre équipe vous contactera bientôt."));
    }
}
