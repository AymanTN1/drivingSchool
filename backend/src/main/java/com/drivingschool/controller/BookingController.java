package com.drivingschool.controller;

import com.drivingschool.dto.CandidateRegistrationRequest;
import com.drivingschool.dto.DrivingBookingRequest;
import com.drivingschool.dto.PCBookingRequest;
import com.drivingschool.model.*;
import com.drivingschool.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@RestController
@RequestMapping("/api")
public class BookingController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    CandidateProfileRepository candidateProfileRepository;

    @Autowired
    MoniteurProfileRepository moniteurProfileRepository;

    @Autowired
    VehicleRepository vehicleRepository;

    @Autowired
    LearningPostSlotRepository learningPostSlotRepository;

    @Autowired
    DrivingLessonSlotRepository drivingLessonSlotRepository;

    @Autowired
    CaisseTransactionRepository caisseTransactionRepository;

    @Autowired
    NarsaQuotaRepository narsaQuotaRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    // --- ASSISTANT: Enroll Candidate ---

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @PostMapping("/assistant/candidates")
    public ResponseEntity<?> enrollCandidate(@RequestBody CandidateRegistrationRequest request, Principal principal) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nom d'utilisateur candidat déjà existant !"));
        }

        // 1. Create User
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(Role.CANDIDATE);
        user.setActive(true);
        userRepository.save(user);

        // 2. Resolve Moniteur
        User moniteur = null;
        if (request.getAssignedMoniteurId() != null) {
            moniteur = userRepository.findById(request.getAssignedMoniteurId()).orElse(null);
        }

        // 3. Create Candidate Profile
        CandidateProfile profile = new CandidateProfile();
        profile.setUser(user);
        profile.setCin(request.getCin());
        profile.setPhone(request.getPhone());
        profile.setBirthDate(request.getBirthDate());
        profile.setRegistrationDate(LocalDate.now());
        profile.setPermitNumber(request.getPermitNumber());
        profile.setPermitExpiryDate(request.getPermitExpiryDate());
        profile.setTotalAmount(request.getTotalAmount());
        profile.setAmountPaid(request.getAmountPaid());
        profile.setMaxWeeklyLessons(request.getMaxWeeklyLessons() != null ? request.getMaxWeeklyLessons() : 3);
        profile.setAssignedMoniteur(moniteur);
        profile.setRegistrationContractPath("/contracts/contrat_" + user.getUsername() + ".pdf");
        candidateProfileRepository.save(profile);

        // 4. Record Initial payment if any
        if (request.getAmountPaid() > 0) {
            User assistant = userRepository.findByUsername(principal.getName()).orElseThrow();
            CaisseTransaction transaction = new CaisseTransaction();
            transaction.setAssistant(assistant);
            transaction.setDate(LocalDateTime.now());
            transaction.setAmount(request.getAmountPaid());
            transaction.setType(TransactionType.CASH);
            transaction.setCandidate(user);
            transaction.setDescription("Avancement frais d'inscription - " + request.getFullName());
            caisseTransactionRepository.save(transaction);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Candidat inscrit avec succès !",
                "contractUrl", profile.getRegistrationContractPath()
        ));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @GetMapping("/assistant/candidates")
    public ResponseEntity<?> getCandidates() {
        List<CandidateProfile> profiles = candidateProfileRepository.findAll();
        return ResponseEntity.ok(profiles);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('ASSISTANT')")
    @PutMapping("/assistant/candidates/{id}/exam")
    public ResponseEntity<?> scheduleNarsaExam(@PathVariable Long id, @RequestBody Map<String, String> body) {
        CandidateProfile profile = candidateProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidat introuvable"));

        // ENFORCE FINANCE CONTRACT BLOCK RULE
        double balance = profile.getTotalAmount() - profile.getAmountPaid();
        if (balance > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", 
                    "BLOQUÉ: Le candidat a un solde débiteur de " + balance + " DH. Réservation d'examen NARSA impossible !"));
        }

        String examDateStr = body.get("examDate");
        if (examDateStr == null || examDateStr.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Date de l'examen requise"));
        }

        LocalDate examDate = LocalDate.parse(examDateStr);
        String monthYearKey = examDate.format(java.time.format.DateTimeFormatter.ofPattern("MM-yyyy"));

        // Check Quota availability
        Optional<NarsaQuota> quotaOpt = narsaQuotaRepository.findByMonthYear(monthYearKey);
        NarsaQuota quota = quotaOpt.orElseGet(() -> {
            NarsaQuota newQuota = new NarsaQuota();
            newQuota.setMonthYear(monthYearKey);
            newQuota.setTotalQuota(15);
            newQuota.setUsedQuota(0);
            return narsaQuotaRepository.save(newQuota);
        });

        if (quota.getUsedQuota() >= quota.getTotalQuota()) {
            return ResponseEntity.badRequest().body(Map.of("message", 
                    "Quota mensuel NARSA dépassé pour le mois de " + monthYearKey + " (Max " + quota.getTotalQuota() + ") !"));
        }

        // Update quota and candidate profile
        quota.setUsedQuota(quota.getUsedQuota() + 1);
        narsaQuotaRepository.save(quota);

        profile.setNarsaExamDate(examDate);
        candidateProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of("message", "Examen planifié avec succès pour le " + examDate));
    }

    // --- PUBLIC & CANDIDATE: PC Post bookings ---

    @GetMapping("/public/pc-posts")
    public ResponseEntity<?> getPcPostsOccupancy() {
        // Return details for current hour
        LocalDateTime startOfHour = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfHour = startOfHour.plusHours(1);

        List<LearningPostSlot> activeSlots = learningPostSlotRepository.findBySlotDateTimeBetweenAndStatus(
                startOfHour, endOfHour, BookingStatus.BOOKED);

        int totalPosts = 15;
        Set<Integer> occupiedPosts = new HashSet<>();
        for (LearningPostSlot slot : activeSlots) {
            occupiedPosts.add(slot.getPostNumber());
        }

        List<Map<String, Object>> postsStatusList = new ArrayList<>();
        for (int i = 1; i <= totalPosts; i++) {
            postsStatusList.add(Map.of(
                    "postNumber", i,
                    "occupied", occupiedPosts.contains(i)
            ));
        }

        return ResponseEntity.ok(Map.of(
                "totalPosts", totalPosts,
                "occupiedCount", occupiedPosts.size(),
                "freeCount", totalPosts - occupiedPosts.size(),
                "posts", postsStatusList
        ));
    }

    @PreAuthorize("hasRole('CANDIDATE')")
    @PostMapping("/candidate/pc-posts/reserve")
    public ResponseEntity<?> reservePcPost(@RequestBody PCBookingRequest request, Principal principal) {
        User candidate = userRepository.findByUsername(principal.getName()).orElseThrow();
        LocalDateTime slotTime = request.getSlotDateTime().withMinute(0).withSecond(0).withNano(0);

        // Verify slot is in future
        if (slotTime.isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Impossible de réserver dans le passé !"));
        }

        // Verify target post is not already booked at that slotTime
        if (request.getPostNumber() < 1 || request.getPostNumber() > 15) {
            return ResponseEntity.badRequest().body(Map.of("message", "Numéro de poste invalide (doit être entre 1 et 15)."));
        }

        boolean occupied = learningPostSlotRepository.existsByPostNumberAndSlotDateTimeAndStatus(
                request.getPostNumber(), slotTime, BookingStatus.BOOKED);

        if (occupied) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ce poste est déjà réservé pour ce créneau !"));
        }

        LearningPostSlot slot = new LearningPostSlot();
        slot.setCandidate(candidate);
        slot.setPostNumber(request.getPostNumber());
        slot.setSlotDateTime(slotTime);
        slot.setStatus(BookingStatus.BOOKED);
        learningPostSlotRepository.save(slot);

        return ResponseEntity.ok(Map.of("message", "Poste d'apprentissage #" + request.getPostNumber() + " réservé avec succès !"));
    }

    // --- CANDIDATE: Driving booking ---

    @PreAuthorize("hasRole('CANDIDATE')")
    @PostMapping("/candidate/driving/reserve")
    public ResponseEntity<?> reserveDrivingLesson(@RequestBody DrivingBookingRequest request, Principal principal) {
        User candidate = userRepository.findByUsername(principal.getName()).orElseThrow();
        CandidateProfile cProfile = candidateProfileRepository.findByUserId(candidate.getId()).orElseThrow();

        if (cProfile.getAssignedMoniteur() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Aucun moniteur ne vous a encore été affecté !"));
        }

        User moniteur = cProfile.getAssignedMoniteur();
        MoniteurProfile mProfile = moniteurProfileRepository.findByUserId(moniteur.getId()).orElseThrow();

        // 1. VEHICLE ALERT BLOCKED RULE Check
        if (mProfile.getActiveVehicleId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", 
                    "Le moniteur n'a pas de véhicule associé. Réservation impossible !"));
        }

        Vehicle vehicle = vehicleRepository.findById(mProfile.getActiveVehicleId()).orElseThrow();
        LocalDate today = LocalDate.now();
        // Check if vehicle checkup dates have alerts blocking operations
        if (vehicle.getNextTechnicalVisit() != null && vehicle.getNextTechnicalVisit().isBefore(today)) {
            return ResponseEntity.badRequest().body(Map.of("message", 
                    "Réservation bloquée: Le véhicule d'instruction de votre moniteur (" + vehicle.getLicensePlate() + 
                    ") a dépassé sa date de visite technique. Veuillez contacter l'assistant !"));
        }
        if (vehicle.getVignetteExpiryDate() != null && vehicle.getVignetteExpiryDate().isBefore(today)) {
            return ResponseEntity.badRequest().body(Map.of("message", 
                    "Réservation bloquée: Le véhicule d'instruction (" + vehicle.getLicensePlate() + 
                    ") a un défaut de vignette de taxe de conduite expirée !"));
        }

        LocalDateTime slotTime = request.getSlotDateTime().withMinute(0).withSecond(0).withNano(0);
        if (slotTime.isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Impossible de réserver dans le passé !"));
        }

        // 2. Candidate WEEKLY CAP check
        // Determine start and end of week for target slotTime
        LocalDate slotDate = slotTime.toLocalDate();
        LocalDateTime startOfWeek = slotDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime endOfWeek = slotDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).atTime(LocalTime.MAX);

        long weeklyCount = drivingLessonSlotRepository.countWeeklyLessonsForCandidate(candidate.getId(), startOfWeek, endOfWeek);
        if (weeklyCount >= cProfile.getMaxWeeklyLessons()) {
            return ResponseEntity.badRequest().body(Map.of("message", 
                    "BLOQUÉ: Vous avez atteint votre quota maximum de " + cProfile.getMaxWeeklyLessons() + 
                    " séances de conduite pour la semaine du " + slotDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) + " !"));
        }

        // 3. Moniteur DOUBLE BOOKING check
        List<DrivingLessonSlot> conflictingLessons = drivingLessonSlotRepository.findMoniteurLessonsInPeriod(
                moniteur.getId(), slotTime, slotTime.plusMinutes(59));

        if (!conflictingLessons.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", 
                    "Le moniteur est déjà réservé à cette heure. Veuillez choisir un autre créneau."));
        }

        DrivingLessonSlot lesson = new DrivingLessonSlot();
        lesson.setCandidate(candidate);
        lesson.setMoniteur(moniteur);
        lesson.setVehicle(vehicle);
        lesson.setSlotDateTime(slotTime);
        lesson.setStatus(BookingStatus.BOOKED);
        drivingLessonSlotRepository.save(lesson);

        return ResponseEntity.ok(Map.of("message", "Séance de conduite réservée pour le " + slotTime + " avec " + moniteur.getFullName()));
    }

    // --- MONITEUR & CANDIDATE: Schedules Loggers ---

    @PreAuthorize("hasRole('CANDIDATE')")
    @GetMapping("/candidate/lessons")
    public ResponseEntity<?> getCandidateLessons(Principal principal) {
        User candidate = userRepository.findByUsername(principal.getName()).orElseThrow();
        List<DrivingLessonSlot> lessons = drivingLessonSlotRepository.findByCandidateId(candidate.getId());
        List<LearningPostSlot> pcSlots = learningPostSlotRepository.findByCandidateId(candidate.getId());

        CandidateProfile profile = candidateProfileRepository.findByUserId(candidate.getId()).orElseThrow();
        double balance = profile.getTotalAmount() - profile.getAmountPaid();

        return ResponseEntity.ok(Map.of(
                "drivingLessons", lessons,
                "pcLessons", pcSlots,
                "maxWeeklyLessons", profile.getMaxWeeklyLessons(),
                "assignedMoniteur", profile.getAssignedMoniteur() != null ? profile.getAssignedMoniteur().getFullName() : "Aucun",
                "finances", Map.of(
                        "totalAmount", profile.getTotalAmount(),
                        "amountPaid", profile.getAmountPaid(),
                        "balance", balance
                )
        ));
    }

    @PreAuthorize("hasRole('MONITEUR')")
    @GetMapping("/moniteur/lessons")
    public ResponseEntity<?> getMoniteurLessons(Principal principal) {
        User moniteur = userRepository.findByUsername(principal.getName()).orElseThrow();
        List<DrivingLessonSlot> lessons = drivingLessonSlotRepository.findByMoniteurId(moniteur.getId());
        return ResponseEntity.ok(lessons);
    }

    @PreAuthorize("hasRole('MONITEUR')")
    @PutMapping("/moniteur/lessons/{id}/complete")
    public ResponseEntity<?> completeLesson(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        DrivingLessonSlot lesson = drivingLessonSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Séance introuvable"));

        lesson.setStatus(BookingStatus.COMPLETED);
        if (body.get("comments") != null) {
            lesson.setComments((String) body.get("comments"));
        }
        if (body.get("rating") != null) {
            lesson.setRating(Integer.parseInt(body.get("rating").toString()));
        }

        drivingLessonSlotRepository.save(lesson);
        return ResponseEntity.ok(Map.of("message", "Séance marquée terminée avec succès !"));
    }
}
