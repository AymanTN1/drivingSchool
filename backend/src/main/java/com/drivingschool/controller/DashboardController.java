package com.drivingschool.controller;

import com.drivingschool.dto.CaisseTransactionRequest;
import com.drivingschool.model.*;
import com.drivingschool.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> recordTransaction(@RequestBody CaisseTransactionRequest request, Principal principal) {
        User assistant = userRepository.findByUsername(principal.getName()).orElseThrow();

        CaisseTransaction transaction = new CaisseTransaction();
        transaction.setAssistant(assistant);
        transaction.setDate(LocalDateTime.now());
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.valueOf(request.getType()));
        transaction.setDescription(request.getDescription());

        if (request.getCandidateId() != null) {
            Optional<User> candidateOpt = userRepository.findById(request.getCandidateId());
            if (candidateOpt.isPresent()) {
                transaction.setCandidate(candidateOpt.get());
                // Update amount paid in candidate profile
                Optional<CandidateProfile> profileOpt = candidateProfileRepository.findByUserId(request.getCandidateId());
                if (profileOpt.isPresent()) {
                    CandidateProfile profile = profileOpt.get();
                    profile.setAmountPaid(profile.getAmountPaid() + request.getAmount());
                    candidateProfileRepository.save(profile);
                }
            }
        }

        caisseTransactionRepository.save(transaction);
        return ResponseEntity.ok(Map.of("message", "Transaction de caisse enregistrée avec succès !"));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/caisse")
    public ResponseEntity<?> getTransactions() {
        return ResponseEntity.ok(caisseTransactionRepository.findAll());
    }

    // --- ASSISTANT / ADMIN: Alerts Engine ---

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/alerts")
    public ResponseEntity<?> getAlerts() {
        List<Map<String, Object>> alertsList = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // 1. Expiration Permis d'apprendre (< 30 days or expired)
        List<CandidateProfile> candidates = candidateProfileRepository.findAll();
        for (CandidateProfile c : candidates) {
            if (c.getPermitExpiryDate() != null) {
                long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, c.getPermitExpiryDate());
                if (daysLeft <= 30) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("type", "PERMIT");
                    alert.put("target", c.getUser().getFullName());
                    alert.put("details", "Permis d'apprendre expire le " + c.getPermitExpiryDate() + " (" + daysLeft + " jours restants)");
                    alert.put("status", daysLeft <= 0 ? "RED" : "ORANGE");
                    alertsList.add(alert);
                }
            }
        }

        // 2. Expiration Visite Technique, Assurance, Vignette Véhicules
        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle v : vehicles) {
            if (v.getNextTechnicalVisit() != null) {
                long vtDays = java.time.temporal.ChronoUnit.DAYS.between(today, v.getNextTechnicalVisit());
                if (vtDays <= 30) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("type", "VEHICLE_VT");
                    alert.put("target", v.getBrand() + " " + v.getModel() + " (" + v.getLicensePlate() + ")");
                    alert.put("details", "Visite technique expulse le " + v.getNextTechnicalVisit() + " (" + vtDays + " jours restants)");
                    alert.put("status", vtDays <= 0 ? "RED" : "ORANGE");
                    alertsList.add(alert);
                }
            }
            if (v.getVignetteExpiryDate() != null) {
                long vigDays = java.time.temporal.ChronoUnit.DAYS.between(today, v.getVignetteExpiryDate());
                if (vigDays <= 30) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("type", "VEHICLE_VIGNETTE");
                    alert.put("target", v.getBrand() + " " + v.getModel() + " (" + v.getLicensePlate() + ")");
                    alert.put("details", "Vignette expire le " + v.getVignetteExpiryDate() + " (" + vigDays + " jours restants)");
                    alert.put("status", vigDays <= 0 ? "RED" : "ORANGE");
                    alertsList.add(alert);
                }
            }
            if (v.getInsuranceExpiryDate() != null) {
                long insDays = java.time.temporal.ChronoUnit.DAYS.between(today, v.getInsuranceExpiryDate());
                if (insDays <= 30) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("type", "VEHICLE_INSURANCE");
                    alert.put("target", v.getBrand() + " " + v.getModel() + " (" + v.getLicensePlate() + ")");
                    alert.put("details", "Assurance expire le " + v.getInsuranceExpiryDate() + " (" + insDays + " jours restants)");
                    alert.put("status", insDays <= 0 ? "RED" : "ORANGE");
                    alertsList.add(alert);
                }
            }
        }

        // 3. Expiration CAP Moniteurs
        List<MoniteurProfile> moniteurs = moniteurProfileRepository.findAll();
        for (MoniteurProfile m : moniteurs) {
            if (m.getCapExpiryDate() != null) {
                long capDays = java.time.temporal.ChronoUnit.DAYS.between(today, m.getCapExpiryDate());
                if (capDays <= 30) {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("type", "MONITEUR_CAP");
                    alert.put("target", m.getUser().getFullName());
                    alert.put("details", "Autorisation CAP expire le " + m.getCapExpiryDate() + " (" + capDays + " jours restants)");
                    alert.put("status", capDays <= 0 ? "RED" : "ORANGE");
                    alertsList.add(alert);
                }
            }
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
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> data = new HashMap<>();

        // 1. Inscriptions trends by month (étude de demande saisonnière)
        List<CandidateProfile> candidates = candidateProfileRepository.findAll();
        Map<String, Integer> regByMonth = new LinkedHashMap<>();
        
        // Initialize last 6 months including current
        LocalDate now = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String label = month.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + month.getYear();
            regByMonth.put(label, 0);
        }

        for (CandidateProfile c : candidates) {
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
        for (CandidateProfile c : candidates) {
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
        double totalRevenueCollected = caisseTransactionRepository.findAll().stream()
                .mapToDouble(CaisseTransaction::getAmount).sum();
        
        double totalBalanceOutstanding = candidates.stream()
                .mapToDouble(c -> Math.max(0, c.getTotalAmount() - c.getAmountPaid())).sum();

        data.put("financesOverview", Map.of(
                "recettes", totalRevenueCollected,
                "reliquats", totalBalanceOutstanding
        ));

        // 4. Monthly financials details
        Map<String, Double> financeByMonth = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String label = month.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRANCE) + " " + month.getYear();
            financeByMonth.put(label, 0.0);
        }
        List<CaisseTransaction> transactions = caisseTransactionRepository.findAll();
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
                "totalCandidates", candidates.size(),
                "totalMoniteurs", moniteurProfileRepository.count(),
                "totalVehicles", vehicleRepository.count()
        ));

        return ResponseEntity.ok(data);
    }
}
