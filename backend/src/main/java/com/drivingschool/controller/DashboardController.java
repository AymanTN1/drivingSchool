package com.drivingschool.controller;

import com.drivingschool.dto.CaisseTransactionRequest;
import com.drivingschool.dto.SupportLessonRequest;
import com.drivingschool.model.*;
import com.drivingschool.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    CandidateProfileRepository candidateProfileRepository;

    @Autowired
    MoniteurProfileRepository moniteurProfileRepository;

    @Autowired
    VehicleRepository vehicleRepository;

    @Autowired
    CaisseTransactionRepository caisseTransactionRepository;

    @Autowired
    NarsaQuotaRepository narsaQuotaRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    SupportLessonRepository supportLessonRepository;

    // --- ADMIN: Staff management ---

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/users")
    public ResponseEntity<?> createStaff(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String email = request.get("email");
        String fullName = request.get("fullName");
        String roleStr = request.get("role"); // ASSISTANT, MONITEUR

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Nom d'utilisateur déjà pris !");
        }

        Role role = Role.valueOf(roleStr);
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setActive(true);
        userRepository.save(user);

        if (role == Role.MONITEUR) {
            MoniteurProfile profile = new MoniteurProfile();
            profile.setUser(user);
            profile.setPhone(request.getOrDefault("phone", ""));
            profile.setCapNumber(request.getOrDefault("capNumber", ""));
            String capExpiryStr = request.get("capExpiryDate");
            if (capExpiryStr != null && !capExpiryStr.isEmpty()) {
                profile.setCapExpiryDate(LocalDate.parse(capExpiryStr));
            }
            String vehicleIdStr = request.get("vehicleId");
            if (vehicleIdStr != null && !vehicleIdStr.isEmpty()) {
                profile.setActiveVehicleId(Long.parseLong(vehicleIdStr));
            }
            moniteurProfileRepository.save(profile);
        }

        return ResponseEntity.ok(Map.of("message", "Compte employé créé avec succès !"));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/admin/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/vehicles")
    public ResponseEntity<?> createVehicle(@RequestBody Vehicle vehicle) {
        if (vehicleRepository.findByLicensePlate(vehicle.getLicensePlate()).isPresent()) {
            return ResponseEntity.badRequest().body("Véhicule avec cette plaque existe déjà !");
        }
        vehicleRepository.save(vehicle);
        return ResponseEntity.ok(Map.of("message", "Véhicule enregistré dans la flotte !"));
    }

    // --- ASSISTANT / ADMIN: Caisse & Transactions ---

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @PostMapping("/assistant/caisse")
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    @Transactional
    public ResponseEntity<?> recordTransaction(@RequestBody CaisseTransactionRequest request, Principal principal) {
        User assistant = userRepository.findByUsername(principal.getName()).orElseThrow();

        if (request.getCandidateId() != null) {
            Optional<CandidateProfile> profileOpt = candidateProfileRepository.findByUserId(request.getCandidateId());
            if (profileOpt.isPresent()) {
                CandidateProfile profile = profileOpt.get();
                if (profile.getAmountPaid() + request.getAmount() > profile.getTotalAmount()) {
                    double reste = profile.getTotalAmount() - profile.getAmountPaid();
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BLOQUÉ: Le montant dépasse le reste à payer (" + reste + " DH).");
                }
                profile.setAmountPaid(profile.getAmountPaid() + request.getAmount());
                candidateProfileRepository.save(profile);
            }
        }

        CaisseTransaction transaction = new CaisseTransaction();
        transaction.setAssistant(assistant);
        transaction.setDate(LocalDateTime.now());
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.valueOf(request.getType()));
        transaction.setDescription(request.getDescription());

        if (request.getCandidateId() != null) {
            userRepository.findById(request.getCandidateId()).ifPresent(transaction::setCandidate);
        }

        caisseTransactionRepository.save(transaction);
        return ResponseEntity.ok(Map.of("message", "Transaction de caisse enregistrée avec succès !"));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @PutMapping("/assistant/candidates/{id}/price")
    public ResponseEntity<?> updateCandidatePrice(@PathVariable Long id, @RequestBody Map<String, Double> body) {
        CandidateProfile profile = candidateProfileRepository.findByUserId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidat introuvable"));
        
        Double newTotal = body.get("totalAmount");
        if (newTotal == null || newTotal < profile.getAmountPaid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nouveau montant total ne peut pas être inférieur au montant déjà payé (" + profile.getAmountPaid() + " DH).");
        }
        
        profile.setTotalAmount(newTotal);
        candidateProfileRepository.save(profile);
        return ResponseEntity.ok(Map.of("message", "Prix négocié mis à jour avec succès !", "newTotal", newTotal));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/caisse")
    public ResponseEntity<?> getTransactions() {
        return ResponseEntity.ok(caisseTransactionRepository.findAll());
    }

    // --- ASSISTANT / ADMIN: Cours de Soutien ---

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @PostMapping("/assistant/support-lessons")
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public ResponseEntity<?> createSupportLesson(@RequestBody SupportLessonRequest request, Principal principal) {
        User candidate = userRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidat introuvable"));
        User moniteur = userRepository.findById(request.getMoniteurId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Moniteur introuvable"));

        LocalDateTime sessionDt = LocalDateTime.parse(request.getSessionDate());
        LocalDateTime sessionEnd = sessionDt.plusMinutes(request.getDurationMinutes());

        // Conflict detection: check if moniteur is already booked during this time slot
        var conflicts = supportLessonRepository.findConflictsForMoniteur(moniteur.getId(), sessionDt.minusMinutes(30), sessionEnd);
        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONFLIT: Le moniteur " + moniteur.getFullName() + " a déjà une séance prévue à ce créneau horaire.");
        }

        SupportLesson lesson = new SupportLesson();
        lesson.setCandidate(candidate);
        lesson.setMoniteur(moniteur);
        lesson.setSessionDate(sessionDt);
        lesson.setDurationMinutes(request.getDurationMinutes());
        lesson.setPricePerSession(request.getPricePerSession());
        lesson.setLessonType(SupportLessonType.valueOf(request.getLessonType()));
        lesson.setComments(request.getComments());
        lesson.setStatus(BookingStatus.BOOKED);
        lesson.setPaid(true);
        lesson.setCreatedAt(LocalDateTime.now());

        if (request.getVehicleId() != null) {
            vehicleRepository.findById(request.getVehicleId()).ifPresent(lesson::setVehicle);
        }

        supportLessonRepository.save(lesson);

        // Auto-register in Caisse as revenue
        User assistant = userRepository.findByUsername(principal.getName()).orElseThrow();
        CaisseTransaction transaction = new CaisseTransaction();
        transaction.setAssistant(assistant);
        transaction.setDate(LocalDateTime.now());
        transaction.setAmount(request.getPricePerSession());
        transaction.setType(TransactionType.CASH);
        transaction.setCandidate(candidate);
        transaction.setDescription("Cours de soutien (" + request.getLessonType().replace("_", " ") + ") - " + candidate.getFullName());
        caisseTransactionRepository.save(transaction);

        return ResponseEntity.ok(Map.of("message", "Séance de soutien planifiée et encaissée avec succès !"));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/support-lessons")
    public ResponseEntity<?> getSupportLessons() {
        return ResponseEntity.ok(supportLessonRepository.findAll());
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @PutMapping("/assistant/support-lessons/{id}/complete")
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public ResponseEntity<?> completeSupportLesson(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        SupportLesson lesson = supportLessonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Séance introuvable"));

        if (lesson.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible de terminer une séance annulée.");
        }

        lesson.setStatus(BookingStatus.COMPLETED);

        if (body != null) {
            if (body.containsKey("moniteurFeedback")) {
                lesson.setMoniteurFeedback((String) body.get("moniteurFeedback"));
            }
            if (body.containsKey("performanceRating")) {
                lesson.setPerformanceRating((Integer) body.get("performanceRating"));
            }
        }

        supportLessonRepository.save(lesson);
        return ResponseEntity.ok(Map.of("message", "Séance de soutien marquée comme terminée !"));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @PutMapping("/assistant/support-lessons/{id}/cancel")
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public ResponseEntity<?> cancelSupportLesson(@PathVariable Long id) {
        SupportLesson lesson = supportLessonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Séance introuvable"));

        if (lesson.getStatus() == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible d'annuler une séance déjà terminée.");
        }

        lesson.setStatus(BookingStatus.CANCELLED);
        lesson.setPaid(false);
        supportLessonRepository.save(lesson);
        return ResponseEntity.ok(Map.of("message", "Séance annulée avec succès."));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/support-lessons/stats")
    public ResponseEntity<?> getSupportLessonStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBooked", supportLessonRepository.countByStatus(BookingStatus.BOOKED));
        stats.put("totalCompleted", supportLessonRepository.countByStatus(BookingStatus.COMPLETED));
        stats.put("totalCancelled", supportLessonRepository.countByStatus(BookingStatus.CANCELLED));
        stats.put("totalRevenue", supportLessonRepository.sumCompletedRevenue());
        stats.put("totalHoursDelivered", supportLessonRepository.sumCompletedDurationMinutes() / 60.0);
        stats.put("totalLessons", supportLessonRepository.count());
        return ResponseEntity.ok(stats);
    }

    // Moniteur: see their assigned support lessons
    @PreAuthorize("hasRole('MONITEUR')")
    @GetMapping("/moniteur/support-lessons")
    public ResponseEntity<?> getMoniteurSupportLessons(Principal principal) {
        User moniteur = userRepository.findByUsername(principal.getName()).orElseThrow();
        return ResponseEntity.ok(supportLessonRepository.findByMoniteurId(moniteur.getId()));
    }

    // Candidate: see their booked/completed support lessons
    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate/support-lessons")
    public ResponseEntity<?> getCandidateSupportLessons(Principal principal) {
        User candidate = userRepository.findByUsername(principal.getName()).orElseThrow();
        return ResponseEntity.ok(supportLessonRepository.findByCandidateId(candidate.getId()));
    }

    // --- ASSISTANT / ADMIN: Alerts Engine ---

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/alerts")
    public ResponseEntity<?> getAlerts() {
        List<Map<String, Object>> alertsList = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // 1. Expiration Permis d'apprendre (< 30 days or expired)
        List<CandidateProfile> candidates = candidateProfileRepository.findByPermitExpiryDateBetween(today.minusDays(365), today.plusDays(30));
        for (CandidateProfile c : candidates) {
            long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, c.getPermitExpiryDate());
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "PERMIT");
            alert.put("target", c.getUser().getFullName());
            alert.put("details", "Permis d'apprendre expire le " + c.getPermitExpiryDate() + " (" + daysLeft + " jours restants)");
            alert.put("status", daysLeft <= 0 ? "RED" : "ORANGE");
            alertsList.add(alert);
        }

        // 2. Expiration Visite Technique, Assurance, Vignette Véhicules
        List<Vehicle> vtVehicles = vehicleRepository.findByNextTechnicalVisitBetween(today.minusDays(365), today.plusDays(30));
        for (Vehicle v : vtVehicles) {
            long vtDays = java.time.temporal.ChronoUnit.DAYS.between(today, v.getNextTechnicalVisit());
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "VEHICLE_VT");
            alert.put("target", v.getBrand() + " " + v.getModel() + " (" + v.getLicensePlate() + ")");
            alert.put("details", "Visite technique expulse le " + v.getNextTechnicalVisit() + " (" + vtDays + " jours restants)");
            alert.put("status", vtDays <= 0 ? "RED" : "ORANGE");
            alertsList.add(alert);
        }

        List<Vehicle> vigVehicles = vehicleRepository.findByVignetteExpiryDateBetween(today.minusDays(365), today.plusDays(30));
        for (Vehicle v : vigVehicles) {
            long vigDays = java.time.temporal.ChronoUnit.DAYS.between(today, v.getVignetteExpiryDate());
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "VEHICLE_VIGNETTE");
            alert.put("target", v.getBrand() + " " + v.getModel() + " (" + v.getLicensePlate() + ")");
            alert.put("details", "Vignette expire le " + v.getVignetteExpiryDate() + " (" + vigDays + " jours restants)");
            alert.put("status", vigDays <= 0 ? "RED" : "ORANGE");
            alertsList.add(alert);
        }

        List<Vehicle> insVehicles = vehicleRepository.findByInsuranceExpiryDateBetween(today.minusDays(365), today.plusDays(30));
        for (Vehicle v : insVehicles) {
            long insDays = java.time.temporal.ChronoUnit.DAYS.between(today, v.getInsuranceExpiryDate());
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "VEHICLE_INSURANCE");
            alert.put("target", v.getBrand() + " " + v.getModel() + " (" + v.getLicensePlate() + ")");
            alert.put("details", "Assurance expire le " + v.getInsuranceExpiryDate() + " (" + insDays + " jours restants)");
            alert.put("status", insDays <= 0 ? "RED" : "ORANGE");
            alertsList.add(alert);
        }

        // 3. Expiration CAP Moniteurs
        List<MoniteurProfile> moniteurs = moniteurProfileRepository.findByCapExpiryDateBetween(today.minusDays(365), today.plusDays(30));
        for (MoniteurProfile m : moniteurs) {
            long capDays = java.time.temporal.ChronoUnit.DAYS.between(today, m.getCapExpiryDate());
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "MONITEUR_CAP");
            alert.put("target", m.getUser().getFullName());
            alert.put("details", "Autorisation CAP expire le " + m.getCapExpiryDate() + " (" + capDays + " jours restants)");
            alert.put("status", capDays <= 0 ? "RED" : "ORANGE");
            alertsList.add(alert);
        }

        return ResponseEntity.ok(alertsList);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/fleet")
    public ResponseEntity<?> getFleet() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    // --- ADMIN: Decision Analytics Dashboard ---

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/analytics")
    @org.springframework.cache.annotation.Cacheable("analytics")
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> data = new HashMap<>();

        // 1. Inscriptions trends by month (étude de demande saisonnière)
        LocalDate now = LocalDate.now();
        LocalDate sixMonthsAgo = now.minusMonths(5).withDayOfMonth(1);
        List<CandidateProfile> candidatesReg = candidateProfileRepository.findByRegistrationDateAfter(sixMonthsAgo);
        Map<String, Integer> regByMonth = new LinkedHashMap<>();
        
        // Initialize last 6 months including current
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String label = month.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + month.getYear();
            regByMonth.put(label, 0);
        }

        for (CandidateProfile c : candidatesReg) {
            if (c.getRegistrationDate() != null) {
                LocalDate regDate = c.getRegistrationDate();
                String label = regDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + regDate.getYear();
                if (regByMonth.containsKey(label)) {
                    regByMonth.put(label, regByMonth.get(label) + 1);
                }
            }
        }

        List<Map<String, Object>> regSeries = new ArrayList<>();
        regByMonth.forEach((month, count) -> regSeries.add(Map.of("name", month, "inscriptions", count)));
        data.put("registrationsDemand", regSeries);

        // 2. Exam volume distribution over the last 6 months (dates examens)
        Map<String, Integer> examByMonth = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String label = month.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + month.getYear();
            examByMonth.put(label, 0);
        }
        
        List<CandidateProfile> candidatesExam = candidateProfileRepository.findByNarsaExamDateAfter(sixMonthsAgo);
        for (CandidateProfile c : candidatesExam) {
            if (c.getNarsaExamDate() != null) {
                LocalDate examDate = c.getNarsaExamDate();
                String label = examDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + examDate.getYear();
                if (examByMonth.containsKey(label)) {
                    examByMonth.put(label, examByMonth.get(label) + 1);
                }
            }
        }
        List<Map<String, Object>> examSeries = new ArrayList<>();
        examByMonth.forEach((month, count) -> examSeries.add(Map.of("name", month, "examens", count)));
        data.put("examSchedules", examSeries);

        // 3. Finances trends (Recettes vs Reliquats cumulés)
        double totalRevenueCollected = caisseTransactionRepository.sumAllAmounts();
        double totalBalanceOutstanding = candidateProfileRepository.sumOutstandingBalances();
        double supportLessonRevenue = supportLessonRepository.sumCompletedRevenue();

        data.put("financesOverview", Map.of(
                "recettes", totalRevenueCollected,
                "reliquats", totalBalanceOutstanding,
                "supportRevenue", supportLessonRevenue
        ));

        // 4. Monthly financials details
        Map<String, Double> financeByMonth = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String label = month.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + month.getYear();
            financeByMonth.put(label, 0.0);
        }
        LocalDateTime sixMonthsAgoTime = now.minusMonths(5).withDayOfMonth(1).atStartOfDay();
        List<CaisseTransaction> transactions = caisseTransactionRepository.findByDateAfter(sixMonthsAgoTime);
        for (CaisseTransaction t : transactions) {
            String label = t.getDate().getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + t.getDate().getYear();
            if (financeByMonth.containsKey(label)) {
                financeByMonth.put(label, financeByMonth.get(label) + t.getAmount());
            }
        }
        List<Map<String, Object>> financeSeries = new ArrayList<>();
        financeByMonth.forEach((month, amount) -> financeSeries.add(Map.of("name", month, "recettes", amount)));
        data.put("financeTrends", financeSeries);

        // General KPI counts
        data.put("kpi", Map.of(
                "totalCandidates", candidateProfileRepository.count(),
                "totalMoniteurs", moniteurProfileRepository.count(),
                "totalVehicles", vehicleRepository.count(),
                "totalSupportLessons", supportLessonRepository.count()
        ));

        return ResponseEntity.ok(data);
    }
}
