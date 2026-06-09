package com.drivingschool.controller;

import com.drivingschool.model.*;
import com.drivingschool.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@RestController
@RequestMapping("/api")
public class PayrollController {

    @Autowired
    MoniteurProfileRepository moniteurProfileRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DrivingLessonSlotRepository drivingLessonSlotRepository;

    @Autowired
    CandidateProfileRepository candidateProfileRepository;

    @Autowired
    PaySlipRepository paySlipRepository;

    // --- ADMIN: Update moniteur payroll config ---
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/payroll/config/{moniteurUserId}")
    public ResponseEntity<?> updatePayrollConfig(
            @PathVariable Long moniteurUserId,
            @RequestBody Map<String, Object> config) {

        MoniteurProfile profile = moniteurProfileRepository.findByUserId(moniteurUserId)
                .orElseThrow(() -> new RuntimeException("Profil moniteur introuvable"));

        if (config.containsKey("payFrequency")) {
            profile.setPayFrequency((String) config.get("payFrequency"));
        }
        if (config.containsKey("hourlyRate")) {
            profile.setHourlyRate(Double.parseDouble(config.get("hourlyRate").toString()));
        }
        if (config.containsKey("fixedSalary")) {
            profile.setFixedSalary(Double.parseDouble(config.get("fixedSalary").toString()));
        }
        if (config.containsKey("bonusPerExamSuccess")) {
            profile.setBonusPerExamSuccess(Double.parseDouble(config.get("bonusPerExamSuccess").toString()));
        }

        moniteurProfileRepository.save(profile);
        return ResponseEntity.ok(Map.of("message", "Configuration de paie mise à jour !"));
    }

    // --- ADMIN: Get all moniteurs with payroll summary ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/payroll/moniteurs")
    public ResponseEntity<?> getMoniteursPayroll() {
        List<MoniteurProfile> profiles = moniteurProfileRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (MoniteurProfile p : profiles) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("userId", p.getUser().getId());
            data.put("fullName", p.getUser().getFullName());
            data.put("phone", p.getPhone());
            data.put("payFrequency", p.getPayFrequency());
            data.put("hourlyRate", p.getHourlyRate());
            data.put("fixedSalary", p.getFixedSalary());
            data.put("bonusPerExamSuccess", p.getBonusPerExamSuccess());

            // Calculate current period hours
            LocalDate[] period = getCurrentPeriod(p.getPayFrequency());
            LocalDateTime periodStart = period[0].atStartOfDay();
            LocalDateTime periodEnd = period[1].atTime(23, 59, 59);

            List<DrivingLessonSlot> lessons = drivingLessonSlotRepository.findMoniteurLessonsInPeriod(
                    p.getUser().getId(), periodStart, periodEnd);

            long completedHours = lessons.stream()
                    .filter(l -> l.getStatus() == BookingStatus.COMPLETED)
                    .count();
            long bookedHours = lessons.stream()
                    .filter(l -> l.getStatus() == BookingStatus.BOOKED)
                    .count();

            data.put("currentPeriodStart", period[0].toString());
            data.put("currentPeriodEnd", period[1].toString());
            data.put("currentCompletedHours", completedHours);
            data.put("currentBookedHours", bookedHours);
            data.put("estimatedPay", completedHours * p.getHourlyRate() + p.getFixedSalary());

            // Count exam successes for this moniteur's candidates in current period
            List<CandidateProfile> candidates = candidateProfileRepository.findByAssignedMoniteurId(p.getUser().getId());
            long examSuccesses = candidates.stream()
                    .filter(c -> c.getNarsaExamDate() != null)
                    .filter(c -> !c.getNarsaExamDate().isBefore(period[0]) && !c.getNarsaExamDate().isAfter(period[1]))
                    .count();

            data.put("examSuccessCount", examSuccesses);
            data.put("totalBonus", examSuccesses * p.getBonusPerExamSuccess());

            // Total pay slips generated
            data.put("totalPaySlips", paySlipRepository.findByMoniteurIdOrderByGeneratedAtDesc(p.getUser().getId()).size());

            result.add(data);
        }

        return ResponseEntity.ok(result);
    }

    // --- ADMIN: Generate Pay Slip for a moniteur ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/payroll/generate/{moniteurUserId}")
    public ResponseEntity<?> generatePaySlip(
            @PathVariable Long moniteurUserId,
            @RequestBody Map<String, String> request) {

        User moniteur = userRepository.findById(moniteurUserId)
                .orElseThrow(() -> new RuntimeException("Moniteur introuvable"));

        MoniteurProfile profile = moniteurProfileRepository.findByUserId(moniteurUserId)
                .orElseThrow(() -> new RuntimeException("Profil moniteur introuvable"));

        LocalDate periodStart = LocalDate.parse(request.get("periodStart"));
        LocalDate periodEnd = LocalDate.parse(request.get("periodEnd"));

        // Count completed hours
        LocalDateTime start = periodStart.atStartOfDay();
        LocalDateTime end = periodEnd.atTime(23, 59, 59);

        List<DrivingLessonSlot> lessons = drivingLessonSlotRepository.findMoniteurLessonsInPeriod(
                moniteurUserId, start, end);

        int totalHours = (int) lessons.stream()
                .filter(l -> l.getStatus() == BookingStatus.COMPLETED)
                .count();

        // Count exam successes
        List<CandidateProfile> candidates = candidateProfileRepository.findByAssignedMoniteurId(moniteurUserId);
        int examSuccesses = (int) candidates.stream()
                .filter(c -> c.getNarsaExamDate() != null)
                .filter(c -> !c.getNarsaExamDate().isBefore(periodStart) && !c.getNarsaExamDate().isAfter(periodEnd))
                .count();

        // Build pay slip
        PaySlip slip = new PaySlip();
        slip.setMoniteur(moniteur);
        slip.setPeriodStart(periodStart);
        slip.setPeriodEnd(periodEnd);
        slip.setGeneratedAt(LocalDateTime.now());
        slip.setTotalHours(totalHours);
        slip.setHourlyRate(profile.getHourlyRate());
        slip.setHoursPayment(totalHours * profile.getHourlyRate());
        slip.setFixedSalary(profile.getFixedSalary());
        slip.setExamSuccessCount(examSuccesses);
        slip.setBonusPerExam(profile.getBonusPerExamSuccess());
        slip.setTotalBonus(examSuccesses * profile.getBonusPerExamSuccess());
        slip.setTotalPay(slip.getHoursPayment() + slip.getFixedSalary() + slip.getTotalBonus());
        slip.setPayFrequency(profile.getPayFrequency());
        slip.setStatus("GENERATED");

        paySlipRepository.save(slip);

        return ResponseEntity.ok(Map.of(
                "message", "Fiche de paie générée avec succès pour " + moniteur.getFullName() + " !",
                "paySlip", slip
        ));
    }

    // --- ADMIN: Get all pay slips ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/payroll/slips")
    public ResponseEntity<?> getAllPaySlips() {
        return ResponseEntity.ok(paySlipRepository.findAllByOrderByGeneratedAtDesc());
    }

    // --- ADMIN: Mark pay slip as paid ---
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/payroll/slips/{slipId}/pay")
    public ResponseEntity<?> markAsPaid(@PathVariable Long slipId) {
        PaySlip slip = paySlipRepository.findById(slipId)
                .orElseThrow(() -> new RuntimeException("Fiche de paie introuvable"));
        slip.setStatus("PAID");
        paySlipRepository.save(slip);
        return ResponseEntity.ok(Map.of("message", "Fiche de paie marquée comme payée !"));
    }

    // --- Helper: Calculate current pay period ---
    private LocalDate[] getCurrentPeriod(String frequency) {
        LocalDate today = LocalDate.now();
        LocalDate start, end;

        switch (frequency) {
            case "WEEKLY":
                start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                end = start.plusDays(6);
                break;
            case "BIWEEKLY":
                start = today.getDayOfMonth() <= 15
                        ? today.withDayOfMonth(1)
                        : today.withDayOfMonth(16);
                end = today.getDayOfMonth() <= 15
                        ? today.withDayOfMonth(15)
                        : today.with(TemporalAdjusters.lastDayOfMonth());
                break;
            case "MONTHLY":
            default:
                start = today.withDayOfMonth(1);
                end = today.with(TemporalAdjusters.lastDayOfMonth());
                break;
        }

        return new LocalDate[]{start, end};
    }
}
