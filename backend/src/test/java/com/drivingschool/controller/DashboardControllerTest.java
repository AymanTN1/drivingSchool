package com.drivingschool.controller;

import com.drivingschool.dto.SupportLessonRequest;
import com.drivingschool.model.*;
import com.drivingschool.repository.DrivingLessonSlotRepository;
import com.drivingschool.repository.SupportLessonRepository;
import com.drivingschool.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupportLessonRepository supportLessonRepository;

    @Autowired
    private DrivingLessonSlotRepository drivingLessonSlotRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User candidate;
    private User otherCandidate;
    private User moniteur;

    @BeforeEach
    public void setUp() {
        // Setup Candidate
        candidate = new User();
        candidate.setUsername("candidate1");
        candidate.setPassword("password");
        candidate.setEmail("candidate1@gmail.com");
        candidate.setFullName("Jean Candidate");
        candidate.setRole(Role.CANDIDATE);
        candidate.setActive(true);
        candidate.setCreatedAt(LocalDateTime.now());
        candidate = userRepository.save(candidate);

        // Setup Other Candidate
        otherCandidate = new User();
        otherCandidate.setUsername("candidate2");
        otherCandidate.setPassword("password");
        otherCandidate.setEmail("candidate2@gmail.com");
        otherCandidate.setFullName("Sophie Candidate");
        otherCandidate.setRole(Role.CANDIDATE);
        otherCandidate.setActive(true);
        otherCandidate.setCreatedAt(LocalDateTime.now());
        otherCandidate = userRepository.save(otherCandidate);

        // Setup Moniteur
        moniteur = new User();
        moniteur.setUsername("moniteur1");
        moniteur.setPassword("password");
        moniteur.setEmail("moniteur1@gmail.com");
        moniteur.setFullName("Pierre Moniteur");
        moniteur.setRole(Role.MONITEUR);
        moniteur.setActive(true);
        moniteur.setCreatedAt(LocalDateTime.now());
        moniteur = userRepository.save(moniteur);
    }

    @Test
    @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
    public void testCreateSupportLesson_SucceedsWhenNoConflict() throws Exception {
        SupportLessonRequest request = new SupportLessonRequest();
        request.setCandidateId(candidate.getId());
        request.setMoniteurId(moniteur.getId());
        request.setSessionDate("2026-07-10T10:00:00");
        request.setDurationMinutes(60);
        request.setPricePerSession(150.0);
        request.setLessonType("PERFECTIONNEMENT");
        request.setComments("No conflict lesson");

        mockMvc.perform(post("/api/assistant/support-lessons")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        assertEquals(1, supportLessonRepository.findByMoniteurId(moniteur.getId()).size());
    }

    @Test
    @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
    public void testCreateSupportLesson_FailsDueToSupportLessonConflict() throws Exception {
        // Create an existing support lesson for the moniteur at 10:00 (ends at 11:00)
        SupportLesson existingLesson = new SupportLesson();
        existingLesson.setCandidate(candidate);
        existingLesson.setMoniteur(moniteur);
        existingLesson.setSessionDate(LocalDateTime.of(2026, 7, 10, 10, 0));
        existingLesson.setDurationMinutes(60);
        existingLesson.setPricePerSession(150.0);
        existingLesson.setLessonType(SupportLessonType.PERFECTIONNEMENT);
        existingLesson.setStatus(BookingStatus.BOOKED);
        supportLessonRepository.save(existingLesson);

        // Try to book a new support lesson at 10:15 (conflict window overlap)
        SupportLessonRequest request = new SupportLessonRequest();
        request.setCandidateId(candidate.getId());
        request.setMoniteurId(moniteur.getId());
        request.setSessionDate("2026-07-10T10:15:00");
        request.setDurationMinutes(60);
        request.setPricePerSession(150.0);
        request.setLessonType("PERFECTIONNEMENT");

        mockMvc.perform(post("/api/assistant/support-lessons")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict()); // expects 409 Conflict
    }

    @Test
    @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
    public void testCreateSupportLesson_FailsDueToDrivingLessonConflict() throws Exception {
        // Create an existing driving lesson for the moniteur at 10:00
        DrivingLessonSlot existingDriving = new DrivingLessonSlot();
        existingDriving.setCandidate(candidate);
        existingDriving.setMoniteur(moniteur);
        existingDriving.setSlotDateTime(LocalDateTime.of(2026, 7, 10, 10, 0));
        existingDriving.setDurationMinutes(60);
        existingDriving.setStatus(BookingStatus.BOOKED);
        drivingLessonSlotRepository.save(existingDriving);

        // Try to book a new support lesson at 10:15 (conflict window overlap)
        SupportLessonRequest request = new SupportLessonRequest();
        request.setCandidateId(candidate.getId());
        request.setMoniteurId(moniteur.getId());
        request.setSessionDate("2026-07-10T10:15:00");
        request.setDurationMinutes(60);
        request.setPricePerSession(150.0);
        request.setLessonType("PERFECTIONNEMENT");

        mockMvc.perform(post("/api/assistant/support-lessons")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict()); // expects 409 Conflict
    }

    @Test
    @WithMockUser(username = "candidate1", roles = {"CANDIDATE"})
    public void testSubmitCandidateRating_Succeeds() throws Exception {
        // Create a completed support lesson for candidate1
        SupportLesson completedLesson = new SupportLesson();
        completedLesson.setCandidate(candidate);
        completedLesson.setMoniteur(moniteur);
        completedLesson.setSessionDate(LocalDateTime.now().minusDays(1));
        completedLesson.setDurationMinutes(60);
        completedLesson.setPricePerSession(150.0);
        completedLesson.setStatus(BookingStatus.COMPLETED);
        completedLesson = supportLessonRepository.save(completedLesson);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("candidateRating", 5);
        requestBody.put("candidateComment", "Super instructeur, très patient !");

        mockMvc.perform(put("/api/candidate/support-lessons/" + completedLesson.getId() + "/rate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Merci pour votre évaluation !"));

        // Verify database is updated
        SupportLesson rated = supportLessonRepository.findById(completedLesson.getId()).orElseThrow();
        assertEquals(5, rated.getCandidateRating());
        assertEquals("Super instructeur, très patient !", rated.getCandidateComment());
    }

    @Test
    @WithMockUser(username = "candidate1", roles = {"CANDIDATE"})
    public void testSubmitCandidateRating_ForbiddenForOtherCandidate() throws Exception {
        // Create a completed support lesson for otherCandidate
        SupportLesson otherLesson = new SupportLesson();
        otherLesson.setCandidate(otherCandidate);
        otherLesson.setMoniteur(moniteur);
        otherLesson.setSessionDate(LocalDateTime.now().minusDays(1));
        otherLesson.setDurationMinutes(60);
        otherLesson.setPricePerSession(150.0);
        otherLesson.setStatus(BookingStatus.COMPLETED);
        otherLesson = supportLessonRepository.save(otherLesson);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("candidateRating", 4);

        mockMvc.perform(put("/api/candidate/support-lessons/" + otherLesson.getId() + "/rate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isForbidden()); // candidate1 cannot rate otherCandidate's lesson
    }

    @Test
    @WithMockUser(username = "candidate1", roles = {"CANDIDATE"})
    public void testSubmitCandidateRating_BadRequestIfNotCompleted() throws Exception {
        // Create a BOOKED support lesson
        SupportLesson bookedLesson = new SupportLesson();
        bookedLesson.setCandidate(candidate);
        bookedLesson.setMoniteur(moniteur);
        bookedLesson.setSessionDate(LocalDateTime.now().plusDays(2));
        bookedLesson.setDurationMinutes(60);
        bookedLesson.setPricePerSession(150.0);
        bookedLesson.setStatus(BookingStatus.BOOKED);
        bookedLesson = supportLessonRepository.save(bookedLesson);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("candidateRating", 5);

        mockMvc.perform(put("/api/candidate/support-lessons/" + bookedLesson.getId() + "/rate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isBadRequest()); // cannot rate future/booked lessons
    }

    @Test
    @WithMockUser(username = "candidate1", roles = {"CANDIDATE"})
    public void testGetCandidateProgression_ReturnsStats() throws Exception {
        // Setup some completed and rated lessons
        SupportLesson lesson = new SupportLesson();
        lesson.setCandidate(candidate);
        lesson.setMoniteur(moniteur);
        lesson.setSessionDate(LocalDateTime.now().minusDays(3));
        lesson.setDurationMinutes(90);
        lesson.setPricePerSession(200.0);
        lesson.setLessonType(SupportLessonType.PREPARATION_EXAMEN);
        lesson.setStatus(BookingStatus.COMPLETED);
        lesson.setPerformanceRating(5);
        lesson.setMoniteurFeedback("Excellent boulot.");
        supportLessonRepository.save(lesson);

        mockMvc.perform(get("/api/candidate/progression")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateName").value("Jean Candidate"))
                .andExpect(jsonPath("$.globalStats.completedSessions").value(1))
                .andExpect(jsonPath("$.globalStats.totalHours").value(1.5))
                .andExpect(jsonPath("$.readiness.score").exists());
    }
}
