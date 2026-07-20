package com.drivingschool.controller;

import com.drivingschool.dto.DynamicPricingResponse;
import com.drivingschool.service.DynamicPricingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DynamicPricingController {

    @Autowired
    private DynamicPricingService dynamicPricingService;

    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSISTANT')")
    public ResponseEntity<List<DynamicPricingResponse>> getDailyPricing(
            @RequestParam Long moniteurId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "200.0") Double basePrice) {

        List<DynamicPricingResponse> pricing = dynamicPricingService.getDailyPricing(moniteurId, date, basePrice);
        return ResponseEntity.ok(pricing);
    }
}
