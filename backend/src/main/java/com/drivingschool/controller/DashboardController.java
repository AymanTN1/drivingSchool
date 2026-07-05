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

    @Autowired
    DrivingLessonSlotRepository drivingLessonSlotRepository;

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
        // Buffer de 30 minutes avant et après pour éviter les chevauchements de trajets
        LocalDateTime windowStart = sessionDt.minusMinutes(30);
        LocalDateTime windowEnd = sessionEnd;

        // 1. Conflit sur une séance de SOUTIEN existante
        var supportConflicts = supportLessonRepository.findConflictsForMoniteur(moniteur.getId(), windowStart, windowEnd);
        if (!supportConflicts.isEmpty()) {
            SupportLesson conflicting = supportConflicts.get(0);
            String conflictTime = conflicting.getSessionDate().toLocalTime().toString().substring(0, 5);
            String conflictDuration = conflicting.getDurationMinutes() + " min";
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "CONFLIT HORAIRE: " + moniteur.getFullName() + " a déjà un cours de soutien le " +
                    conflicting.getSessionDate().toLocalDate() + " à " + conflictTime + " (" + conflictDuration + ").");
        }

        // 2. Conflit sur une LEÇON DE CONDUITE normale
        var drivingConflicts = drivingLessonSlotRepository.findMoniteurLessonsInPeriod(moniteur.getId(), windowStart, windowEnd);
        if (!drivingConflicts.isEmpty()) {
            DrivingLessonSlot conflicting = drivingConflicts.get(0);
            String conflictTime = conflicting.getSlotDateTime().toLocalTime().toString().substring(0, 5);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "CONFLIT HORAIRE: " + moniteur.getFullName() + " a déjà une leçon de conduite le " +
                    conflicting.getSlotDateTime().toLocalDate() + " à " + conflictTime + ". Choisissez un autre moniteur ou un autre créneau.");
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

    // Endpoint: check which moniteurs are available for a given date/time + duration
    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/support-lessons/availability")
    public ResponseEntity<?> getMoniteursAvailability(
            @org.springframework.web.bind.annotation.RequestParam String sessionDate,
            @org.springframework.web.bind.annotation.RequestParam Integer durationMinutes) {

        LocalDateTime sessionDt = LocalDateTime.parse(sessionDate);
        LocalDateTime windowStart = sessionDt.minusMinutes(30);
        LocalDateTime windowEnd = sessionDt.plusMinutes(durationMinutes);

        // Get all moniteurs
        List<User> allMoniteurs = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.drivingschool.model.Role.MONITEUR && u.isActive())
                .toList();

        List<Map<String, Object>> availability = new java.util.ArrayList<>();
        for (User m : allMoniteurs) {
            boolean hasSupportConflict = !supportLessonRepository
                    .findConflictsForMoniteur(m.getId(), windowStart, windowEnd).isEmpty();
            boolean hasDrivingConflict = !drivingLessonSlotRepository
                    .findMoniteurLessonsInPeriod(m.getId(), windowStart, windowEnd).isEmpty();
            boolean available = !hasSupportConflict && !hasDrivingConflict;

            Map<String, Object> entry = new HashMap<>();
            entry.put("id", m.getId());
            entry.put("fullName", m.getFullName());
            entry.put("available", available);
            entry.put("conflictReason", hasSupportConflict ? "Cours de soutien" : (hasDrivingConflict ? "Leçon de conduite" : null));
            availability.add(entry);
        }

        return ResponseEntity.ok(availability);
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

    // Moniteur: submit performance feedback for a completed lesson
    @PreAuthorize("hasRole('MONITEUR')")
    @PutMapping("/moniteur/support-lessons/{id}/feedback")
    public ResponseEntity<?> submitMoniteurFeedback(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Principal principal) {

        User moniteur = userRepository.findByUsername(principal.getName()).orElseThrow();

        SupportLesson lesson = supportLessonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Séance introuvable"));

        // Security: moniteur can only submit feedback for their OWN lessons
        if (!lesson.getMoniteur().getId().equals(moniteur.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez soumettre un feedback que pour vos propres séances.");
        }

        // Lesson must be COMPLETED to accept feedback
        if (lesson.getStatus() != BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le feedback n'est possible que pour les séances terminées. Statut actuel : " + lesson.getStatus());
        }

        // Extract and validate rating (1-5)
        if (body.containsKey("performanceRating")) {
            int rating = ((Number) body.get("performanceRating")).intValue();
            if (rating < 1 || rating > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La note doit être entre 1 et 5.");
            }
            lesson.setPerformanceRating(rating);
        }

        if (body.containsKey("moniteurFeedback")) {
            String feedback = (String) body.get("moniteurFeedback");
            if (feedback != null && !feedback.isBlank()) {
                lesson.setMoniteurFeedback(feedback.trim());
            }
        }

        supportLessonRepository.save(lesson);

        return ResponseEntity.ok(Map.of(
                "message", "Évaluation enregistrée avec succès !",
                "rating", lesson.getPerformanceRating(),
                "feedback", lesson.getMoniteurFeedback() != null ? lesson.getMoniteurFeedback() : ""
        ));
    }

    // Candidate: see their booked/completed support lessons
    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate/support-lessons")
    public ResponseEntity<?> getCandidateSupportLessons(Principal principal) {
        User candidate = userRepository.findByUsername(principal.getName()).orElseThrow();
        return ResponseEntity.ok(supportLessonRepository.findByCandidateId(candidate.getId()));
    }

    // Candidate: full progression report (carnet de progression)
    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate/progression")
    public ResponseEntity<?> getCandidateProgression(Principal principal) {
        User candidate = userRepository.findByUsername(principal.getName()).orElseThrow();

        List<SupportLesson> supportLessons = supportLessonRepository.findByCandidateId(candidate.getId());
        List<DrivingLessonSlot> drivingLessons = drivingLessonSlotRepository.findByCandidateId(candidate.getId());

        // Global stats
        List<SupportLesson> completed = supportLessons.stream()
                .filter(s -> s.getStatus() == BookingStatus.COMPLETED).toList();
        List<SupportLesson> rated = completed.stream()
                .filter(s -> s.getPerformanceRating() != null).toList();

        long totalSupportMinutes = completed.stream()
                .mapToLong(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0).sum();
        double hoursCompleted = totalSupportMinutes / 60.0;
        long totalDrivingSlots = drivingLessons.stream()
                .filter(d -> d.getStatus() != BookingStatus.CANCELLED).count();
        double avgPerformance = rated.isEmpty() ? 0 :
                rated.stream().mapToInt(SupportLesson::getPerformanceRating).average().orElse(0);

        // Readiness score (0-100)
        double hoursScore = Math.min(30, hoursCompleted * 3);
        double perfScore = rated.isEmpty() ? 0 : (avgPerformance / 5.0) * 50;
        double sessionsScore = Math.min(20, completed.size() * 4);
        int readinessScore = Math.min(100, (int) Math.round(perfScore + hoursScore + sessionsScore));

        String readinessLevel;
        String readinessAdvice;
        if (readinessScore >= 85) {
            readinessLevel = "EXCELLENT";
            readinessAdvice = "Vous etes pret(e) pour l'examen ! Continuez a maintenir ce niveau.";
        } else if (readinessScore >= 65) {
            readinessLevel = "BON";
            readinessAdvice = "Bonne progression ! Quelques seances supplementaires consolideront vos acquis.";
        } else if (readinessScore >= 40) {
            readinessLevel = "EN_COURS";
            readinessAdvice = "Vous progressez bien. Concentrez-vous sur les points faibles identifies par votre moniteur.";
        } else {
            readinessLevel = "DEBUT";
            readinessAdvice = "Debut du parcours. Chaque seance compte — restez regulier(e) !";
        }

        // Per lesson-type stats
        Map<String, Map<String, Object>> byTypeMap = new java.util.LinkedHashMap<>();
        for (SupportLesson sl : completed) {
            String type = sl.getLessonType() != null ? sl.getLessonType().name() : "AUTRE";
            byTypeMap.computeIfAbsent(type, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("type", type); m.put("sessions", 0); m.put("totalMinutes", 0);
                m.put("ratings", new java.util.ArrayList<Integer>());
                m.put("feedbacks", new java.util.ArrayList<String>());
                return m;
            });
            Map<String, Object> e = byTypeMap.get(type);
            e.put("sessions", ((int) e.get("sessions")) + 1);
            e.put("totalMinutes", ((int) e.get("totalMinutes")) + (sl.getDurationMinutes() != null ? sl.getDurationMinutes() : 0));
            if (sl.getPerformanceRating() != null)
                ((java.util.List<Integer>) e.get("ratings")).add(sl.getPerformanceRating());
            if (sl.getMoniteurFeedback() != null && !sl.getMoniteurFeedback().isBlank())
                ((java.util.List<String>) e.get("feedbacks")).add(sl.getMoniteurFeedback());
        }
        List<Map<String, Object>> typeStats = byTypeMap.values().stream().map(e -> {
            Map<String, Object> res = new HashMap<>(e);
            @SuppressWarnings("unchecked")
            java.util.List<Integer> ratings = (java.util.List<Integer>) e.get("ratings");
            res.put("avgRating", ratings.isEmpty() ? null :
                    Math.round(ratings.stream().mapToInt(i -> i).average().orElse(0) * 10.0) / 10.0);
            res.put("ratingCount", ratings.size());
            return res;
        }).toList();

        // Timeline: completed sessions sorted most-recent first
        List<Map<String, Object>> timeline = completed.stream()
                .sorted((a, b) -> b.getSessionDate().compareTo(a.getSessionDate()))
                .map(sl -> {
                    Map<String, Object> t = new HashMap<>();
                    t.put("id", sl.getId());
                    t.put("sessionDate", sl.getSessionDate());
                    t.put("durationMinutes", sl.getDurationMinutes());
                    t.put("lessonType", sl.getLessonType() != null ? sl.getLessonType().name() : null);
                    t.put("moniteurName", sl.getMoniteur().getFullName());
                    t.put("performanceRating", sl.getPerformanceRating());
                    t.put("moniteurFeedback", sl.getMoniteurFeedback());
                    t.put("vehicleName", sl.getVehicle() != null ?
                            sl.getVehicle().getBrand() + " " + sl.getVehicle().getModel() : null);
                    return t;
                }).toList();

        // Next upcoming session
        Map<String, Object> nextSessionMap = supportLessons.stream()
                .filter(s -> s.getStatus() == BookingStatus.BOOKED && s.getSessionDate().isAfter(LocalDateTime.now()))
                .min((a, b) -> a.getSessionDate().compareTo(b.getSessionDate()))
                .map(sl -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("sessionDate", sl.getSessionDate());
                    m.put("durationMinutes", sl.getDurationMinutes());
                    m.put("lessonType", sl.getLessonType() != null ? sl.getLessonType().name() : null);
                    m.put("moniteurName", sl.getMoniteur().getFullName());
                    m.put("pricePerSession", sl.getPricePerSession());
                    return m;
                }).orElse(null);

        Map<String, Object> response = new HashMap<>();
        response.put("candidateName", candidate.getFullName());
        response.put("globalStats", Map.of(
                "completedSessions", completed.size(),
                "totalHours", Math.round(hoursCompleted * 10.0) / 10.0,
                "totalDrivingSlots", totalDrivingSlots,
                "averagePerformance", Math.round(avgPerformance * 10.0) / 10.0,
                "ratedSessions", rated.size(),
                "upcomingSessions", supportLessons.stream().filter(s -> s.getStatus() == BookingStatus.BOOKED).count()
        ));
        response.put("readiness", Map.of("score", readinessScore, "level", readinessLevel, "advice", readinessAdvice));
        response.put("byType", typeStats);
        response.put("timeline", timeline);
        response.put("nextSession", nextSessionMap != null ? nextSessionMap : Map.of());

        return ResponseEntity.ok(response);
    }

    // Candidate: rate their moniteur after a completed session
    @PreAuthorize("hasRole('CANDIDATE')")
    @PutMapping("/candidate/support-lessons/{id}/rate")
    public ResponseEntity<?> submitCandidateRating(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Principal principal) {

        User candidate = userRepository.findByUsername(principal.getName()).orElseThrow();

        SupportLesson lesson = supportLessonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Séance introuvable"));

        // Security: candidate can only rate their OWN sessions
        if (!lesson.getCandidate().getId().equals(candidate.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez noter que vos propres séances.");
        }

        if (lesson.getStatus() != BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vous ne pouvez évaluer qu'une séance terminée.");
        }

        // Extract and validate rating
        if (!body.containsKey("candidateRating")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La note est obligatoire.");
        }
        int rating = ((Number) body.get("candidateRating")).intValue();
        if (rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La note doit être entre 1 et 5.");
        }
        lesson.setCandidateRating(rating);

        if (body.containsKey("candidateComment")) {
            String comment = (String) body.get("candidateComment");
            if (comment != null && !comment.isBlank()) {
                lesson.setCandidateComment(comment.trim());
            }
        }

        supportLessonRepository.save(lesson);

        return ResponseEntity.ok(Map.of("message", "Merci pour votre évaluation !"));
    }

    // ADMIN ONLY: moniteur ratings report (candidate ratings of their moniteurs)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/moniteurs/ratings-report")
    public ResponseEntity<?> getMoniteurRatingsReport() {
        List<User> moniteurs = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.drivingschool.model.Role.MONITEUR && u.isActive())
                .toList();

        List<Map<String, Object>> report = new java.util.ArrayList<>();
        for (User m : moniteurs) {
            Double avgRating = supportLessonRepository.avgCandidateRatingByMoniteur(m.getId());
            Long ratingCount = supportLessonRepository.countCandidateRatingsByMoniteur(m.getId());
            long totalSessions = supportLessonRepository.findByMoniteurId(m.getId()).size();

            Map<String, Object> entry = new HashMap<>();
            entry.put("moniteurId", m.getId());
            entry.put("moniteurName", m.getFullName());
            entry.put("totalSupportSessions", totalSessions);
            entry.put("totalRatings", ratingCount != null ? ratingCount : 0);
            entry.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null);
            report.add(entry);
        }

        // Sort by avg rating descending (best first)
        report.sort((a, b) -> {
            Double ra = (Double) a.get("averageRating");
            Double rb = (Double) b.get("averageRating");
            if (ra == null && rb == null) return 0;
            if (ra == null) return 1;
            if (rb == null) return -1;
            return Double.compare(rb, ra);
        });

        // Also include the most recent reviews (with comments)
        List<SupportLesson> recentReviews = supportLessonRepository.findAllRatedByCandidate();
        List<Map<String, Object>> reviews = recentReviews.stream().limit(20).map(sl -> {
            Map<String, Object> r = new HashMap<>();
            r.put("id", sl.getId());
            r.put("sessionDate", sl.getSessionDate());
            r.put("candidateName", sl.getCandidate().getFullName());
            r.put("moniteurName", sl.getMoniteur().getFullName());
            r.put("candidateRating", sl.getCandidateRating());
            r.put("candidateComment", sl.getCandidateComment());
            r.put("lessonType", sl.getLessonType());
            return r;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "moniteurRankings", report,
                "recentReviews", reviews
        ));
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
