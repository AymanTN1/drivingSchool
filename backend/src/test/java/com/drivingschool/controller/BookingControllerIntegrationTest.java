package com.drivingschool.controller;

import com.drivingschool.dto.CandidateRegistrationRequest;
import com.drivingschool.dto.DrivingBookingRequest;
import com.drivingschool.dto.PCBookingRequest;
import com.drivingschool.model.*;
import com.drivingschool.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Booking Controller - Candidate, PC & Driving Tests")
public class BookingControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private CandidateProfileRepository candidateProfileRepository;
    @Autowired private MoniteurProfileRepository moniteurProfileRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private LearningPostSlotRepository learningPostSlotRepository;
    @Autowired private DrivingLessonSlotRepository drivingLessonSlotRepository;
    @Autowired private ObjectMapper objectMapper;

    private User candidateUser;
    private CandidateProfile candidateProfile;
    private User moniteurUser;
    private MoniteurProfile moniteurProfile;
    private Vehicle vehicle;

    @BeforeEach
    public void setUp() {
        // Moniteur
        moniteurUser = new User();
        moniteurUser.setUsername("bookingmoniteur");
        moniteurUser.setPassword("password");
        moniteurUser.setEmail("bookmon@school.ma");
        moniteurUser.setFullName("Booking Moniteur");
        moniteurUser.setRole(Role.MONITEUR);
        moniteurUser.setActive(true);
        moniteurUser.setCreatedAt(LocalDateTime.now());
        moniteurUser = userRepository.save(moniteurUser);

        // Vehicle with valid documents
        vehicle = new Vehicle();
        vehicle.setBrand("Renault");
        vehicle.setModel("Clio");
        vehicle.setLicensePlate("BOOK-001");
        vehicle.setStatus("ACTIVE");
        vehicle.setNextTechnicalVisit(LocalDate.now().plusMonths(6));
        vehicle.setInsuranceExpiryDate(LocalDate.now().plusMonths(6));
        vehicle.setVignetteExpiryDate(LocalDate.now().plusMonths(6));
        vehicle = vehicleRepository.save(vehicle);

        // Moniteur Profile with assigned vehicle
        moniteurProfile = new MoniteurProfile();
        moniteurProfile.setUser(moniteurUser);
        moniteurProfile.setPhone("0600001111");
        moniteurProfile.setHourlyRate(50.0);
        moniteurProfile.setActiveVehicleId(vehicle.getId());
        moniteurProfile = moniteurProfileRepository.save(moniteurProfile);

        // Candidate
        candidateUser = new User();
        candidateUser.setUsername("bookingcandidate");
        candidateUser.setPassword("password");
        candidateUser.setEmail("bookcand@school.ma");
        candidateUser.setFullName("Booking Candidate");
        candidateUser.setRole(Role.CANDIDATE);
        candidateUser.setActive(true);
        candidateUser.setCreatedAt(LocalDateTime.now());
        candidateUser = userRepository.save(candidateUser);

        // Candidate Profile
        candidateProfile = new CandidateProfile();
        candidateProfile.setUser(candidateUser);
        candidateProfile.setCin("CINBOOK");
        candidateProfile.setPhone("0622223333");
        candidateProfile.setRegistrationDate(LocalDate.now());
        candidateProfile.setBirthDate(LocalDate.of(2000, 5, 15));
        candidateProfile.setTotalAmount(3500.0);
        candidateProfile.setAmountPaid(3500.0);
        candidateProfile.setMaxWeeklyLessons(2); // Low cap for testing
        candidateProfile.setAssignedMoniteur(moniteurUser);
        candidateProfile = candidateProfileRepository.save(candidateProfile);
    }

    // ───────────────────── CANDIDATE ENROLLMENT ─────────────────────

    @Nested
    @DisplayName("POST /api/assistant/candidates - Enrollment")
    class EnrollmentTests {

        @Test
        @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
        @DisplayName("Enroll a new candidate with initial payment")
        public void testEnrollCandidate_Success() throws Exception {
            CandidateRegistrationRequest req = new CandidateRegistrationRequest();
            req.setUsername("newstudent99");
            req.setPassword("pass123");
            req.setEmail("new@school.ma");
            req.setFullName("Nouveau Candidat");
            req.setCin("CIN-NEW");
            req.setPhone("0611112222");
            req.setBirthDate(LocalDate.of(2002, 3, 20));
            req.setTotalAmount(3500.0);
            req.setAmountPaid(1500.0);
            req.setMaxWeeklyLessons(3);
            req.setAssignedMoniteurId(moniteurUser.getId());

            mockMvc.perform(post("/api/assistant/candidates")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("inscrit avec succès")));

            // Verify user and profile created
            assertTrue(userRepository.findByUsername("newstudent99").isPresent());
            CandidateProfile profile = candidateProfileRepository
                    .findByUserId(userRepository.findByUsername("newstudent99").get().getId()).orElseThrow();
            assertEquals("CIN-NEW", profile.getCin());
            assertEquals(3500.0, profile.getTotalAmount());
            assertEquals(1500.0, profile.getAmountPaid());
        }

        @Test
        @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
        @DisplayName("Duplicate username is rejected")
        public void testEnrollCandidate_DuplicateUsername() throws Exception {
            CandidateRegistrationRequest req = new CandidateRegistrationRequest();
            req.setUsername("bookingcandidate"); // Already exists from @BeforeEach
            req.setPassword("pass");
            req.setEmail("dup@school.ma");
            req.setFullName("Duplicate");
            req.setCin("CIN-DUP");
            req.setPhone("0600000000");
            req.setBirthDate(LocalDate.of(2000, 1, 1));
            req.setTotalAmount(3500.0);
            req.setAmountPaid(0.0);

            mockMvc.perform(post("/api/assistant/candidates")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("déjà existant")));
        }
    }

    // ───────────────────── PC POST RESERVATION ─────────────────────

    @Nested
    @DisplayName("POST /api/candidate/pc-posts/reserve - PC Reservation")
    class PcReservationTests {

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("Reserve a PC post for a future slot")
        public void testReservePc_Success() throws Exception {
            PCBookingRequest req = new PCBookingRequest();
            req.setSlotDateTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
            req.setPostNumber(5);

            mockMvc.perform(post("/api/candidate/pc-posts/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("réservé avec succès")));
        }

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("Reject invalid post number (out of range 1-15)")
        public void testReservePc_InvalidPostNumber() throws Exception {
            PCBookingRequest req = new PCBookingRequest();
            req.setSlotDateTime(LocalDateTime.now().plusDays(1).withHour(10));
            req.setPostNumber(20); // Invalid: max is 15

            mockMvc.perform(post("/api/candidate/pc-posts/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("invalide")));
        }

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("Reject double booking of same PC post at same time")
        public void testReservePc_DoubleBooking() throws Exception {
            LocalDateTime futureSlot = LocalDateTime.now().plusDays(2).withHour(14).withMinute(0).withSecond(0).withNano(0);

            // Book post 3
            LearningPostSlot existing = new LearningPostSlot();
            existing.setCandidate(candidateUser);
            existing.setPostNumber(3);
            existing.setSlotDateTime(futureSlot);
            existing.setStatus(BookingStatus.BOOKED);
            learningPostSlotRepository.save(existing);

            // Try to book same post 3 at same time
            PCBookingRequest req = new PCBookingRequest();
            req.setSlotDateTime(futureSlot);
            req.setPostNumber(3);

            mockMvc.perform(post("/api/candidate/pc-posts/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("déjà réservé")));
        }
    }

    // ───────────────────── DRIVING LESSON RESERVATION ─────────────────────

    @Nested
    @DisplayName("POST /api/candidate/driving/reserve - Driving Lesson")
    class DrivingReservationTests {

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("Successfully reserve a driving lesson")
        public void testReserveDriving_Success() throws Exception {
            DrivingBookingRequest req = new DrivingBookingRequest();
            req.setSlotDateTime(LocalDateTime.now().plusDays(3).withHour(9).withMinute(0));

            mockMvc.perform(post("/api/candidate/driving/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("réservée")));

            // Verify a verification PIN was generated
            var lessons = drivingLessonSlotRepository.findByCandidateId(candidateUser.getId());
            assertFalse(lessons.isEmpty());
            assertNotNull(lessons.get(lessons.size() - 1).getVerificationPin());
        }

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("BLOCKED: Weekly lesson cap exceeded (max 2)")
        public void testReserveDriving_WeeklyCapExceeded() throws Exception {
            // Pre-fill 2 lessons in the same week (cap is 2)
            LocalDateTime nextMonday = LocalDateTime.now().plusDays(7)
                    .with(java.time.DayOfWeek.MONDAY).withHour(9).withMinute(0).withSecond(0).withNano(0);

            for (int i = 0; i < 2; i++) {
                DrivingLessonSlot slot = new DrivingLessonSlot();
                slot.setCandidate(candidateUser);
                slot.setMoniteur(moniteurUser);
                slot.setVehicle(vehicle);
                slot.setSlotDateTime(nextMonday.plusDays(i).withHour(10 + i));
                slot.setDurationMinutes(60);
                slot.setStatus(BookingStatus.BOOKED);
                drivingLessonSlotRepository.save(slot);
            }

            // Try a 3rd lesson in same week → should be blocked
            DrivingBookingRequest req = new DrivingBookingRequest();
            req.setSlotDateTime(nextMonday.plusDays(2).withHour(14));

            mockMvc.perform(post("/api/candidate/driving/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("quota maximum")));
        }

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("BLOCKED: Vehicle technical visit expired")
        public void testReserveDriving_VehicleExpired() throws Exception {
            // Expire the vehicle's technical visit
            vehicle.setNextTechnicalVisit(LocalDate.now().minusDays(5));
            vehicleRepository.save(vehicle);

            DrivingBookingRequest req = new DrivingBookingRequest();
            req.setSlotDateTime(LocalDateTime.now().plusDays(1).withHour(10));

            mockMvc.perform(post("/api/candidate/driving/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("visite technique")));
        }

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("BLOCKED: Vehicle vignette expired")
        public void testReserveDriving_VignetteExpired() throws Exception {
            vehicle.setVignetteExpiryDate(LocalDate.now().minusDays(10));
            vehicleRepository.save(vehicle);

            DrivingBookingRequest req = new DrivingBookingRequest();
            req.setSlotDateTime(LocalDateTime.now().plusDays(1).withHour(10));

            mockMvc.perform(post("/api/candidate/driving/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("vignette")));
        }

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("BLOCKED: Moniteur double-booked at same hour")
        public void testReserveDriving_MoniteurDoubleBooked() throws Exception {
            LocalDateTime futureSlot = LocalDateTime.now().plusDays(4).withHour(11).withMinute(0).withSecond(0).withNano(0);

            // Pre-book the moniteur at this slot
            DrivingLessonSlot existing = new DrivingLessonSlot();
            existing.setCandidate(candidateUser);
            existing.setMoniteur(moniteurUser);
            existing.setVehicle(vehicle);
            existing.setSlotDateTime(futureSlot);
            existing.setDurationMinutes(60);
            existing.setStatus(BookingStatus.BOOKED);
            drivingLessonSlotRepository.save(existing);

            // Try to book same moniteur at same time
            DrivingBookingRequest req = new DrivingBookingRequest();
            req.setSlotDateTime(futureSlot);

            mockMvc.perform(post("/api/candidate/driving/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("déjà réservé")));
        }
    }

    // ───────────────────── CANDIDATE SCHEDULE VIEW ─────────────────────

    @Nested
    @DisplayName("GET /api/candidate/lessons - Candidate Schedule")
    class CandidateScheduleTests {

        @Test
        @WithMockUser(username = "bookingcandidate", roles = {"CANDIDATE"})
        @DisplayName("Candidate can view their lessons, finances, and assigned moniteur")
        public void testGetCandidateLessons() throws Exception {
            mockMvc.perform(get("/api/candidate/lessons"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.drivingLessons").isArray())
                    .andExpect(jsonPath("$.pcLessons").isArray())
                    .andExpect(jsonPath("$.maxWeeklyLessons").value(2))
                    .andExpect(jsonPath("$.assignedMoniteur").value("Booking Moniteur"))
                    .andExpect(jsonPath("$.finances.totalAmount").value(3500.0))
                    .andExpect(jsonPath("$.finances.balance").value(0.0));
        }
    }
}
