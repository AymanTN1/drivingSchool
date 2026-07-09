package com.drivingschool.controller;

import com.drivingschool.model.CandidateProfile;
import com.drivingschool.model.NarsaQuota;
import com.drivingschool.model.Role;
import com.drivingschool.model.User;
import com.drivingschool.repository.CandidateProfileRepository;
import com.drivingschool.repository.NarsaQuotaRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateProfileRepository candidateProfileRepository;

    @Autowired
    private NarsaQuotaRepository narsaQuotaRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User candidateUser;
    private CandidateProfile candidateProfile;

    @BeforeEach
    public void setUp() {
        // Setup a candidate user
        candidateUser = new User();
        candidateUser.setUsername("testcandidate");
        candidateUser.setPassword("password");
        candidateUser.setEmail("test@gmail.com");
        candidateUser.setFullName("Test Candidate");
        candidateUser.setRole(Role.CANDIDATE);
        candidateUser.setActive(true);
        candidateUser.setCreatedAt(LocalDateTime.now());
        candidateUser = userRepository.save(candidateUser);

        // Setup candidate profile
        candidateProfile = new CandidateProfile();
        candidateProfile.setUser(candidateUser);
        candidateProfile.setCin("CIN123");
        candidateProfile.setPhone("0600000000");
        candidateProfile.setBirthDate(LocalDate.of(2000, 1, 1));
        candidateProfile.setRegistrationDate(LocalDate.now());
        candidateProfile.setPermitNumber("PERMIT123");
        candidateProfile.setPermitExpiryDate(LocalDate.now().plusYears(1));
        candidateProfile.setMaxWeeklyLessons(3);
        
        // Outstanding balance by default: 3500 total, 2000 paid = 1500 outstanding
        candidateProfile.setTotalAmount(3500.0);
        candidateProfile.setAmountPaid(2000.0);
        
        candidateProfile = candidateProfileRepository.save(candidateProfile);
    }

    @Test
    @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
    public void testScheduleNarsaExam_BlockedDueToOutstandingBalance() throws Exception {
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("examDate", LocalDate.now().plusDays(10).toString());

        mockMvc.perform(put("/api/assistant/candidates/" + candidateUser.getId() + "/exam")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("BLOQUÉ: Le candidat a un solde débiteur")));
    }

    @Test
    @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
    public void testScheduleNarsaExam_SucceedsWhenFullyPaid() throws Exception {
        // Make fully paid
        candidateProfile.setAmountPaid(3500.0);
        candidateProfileRepository.save(candidateProfile);

        // Use a far-future month to avoid collision with seed data quotas
        LocalDate examDate = LocalDate.now().plusMonths(8).withDayOfMonth(10);
        String monthYearKey = examDate.format(DateTimeFormatter.ofPattern("MM-yyyy"));

        // Record the quota before the test (may be 0 or may not exist yet)
        int quotaBefore = narsaQuotaRepository.findByMonthYear(monthYearKey)
                .map(NarsaQuota::getUsedQuota).orElse(0);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("examDate", examDate.toString());

        mockMvc.perform(put("/api/assistant/candidates/" + candidateUser.getId() + "/exam")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Examen planifié avec succès")));

        // Verify profile updated
        CandidateProfile updatedProfile = candidateProfileRepository.findByUserId(candidateUser.getId()).orElseThrow();
        assertEquals(examDate, updatedProfile.getNarsaExamDate());

        // Verify quota was incremented by exactly 1
        NarsaQuota quota = narsaQuotaRepository.findByMonthYear(monthYearKey).orElseThrow();
        assertEquals(quotaBefore + 1, quota.getUsedQuota());
    }

    @Test
    @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
    public void testScheduleNarsaExam_BlockedDueToExceededQuota() throws Exception {
        // Make fully paid
        candidateProfile.setAmountPaid(3500.0);
        candidateProfileRepository.save(candidateProfile);

        // Use a far-future month to avoid collision with seed data quotas
        LocalDate examDate = LocalDate.now().plusMonths(10).withDayOfMonth(15);
        String monthYearKey = examDate.format(DateTimeFormatter.ofPattern("MM-yyyy"));

        // Setup a pre-exhausted quota (find existing or create new)
        NarsaQuota exhaustedQuota = narsaQuotaRepository.findByMonthYear(monthYearKey)
                .orElseGet(() -> {
                    NarsaQuota q = new NarsaQuota();
                    q.setMonthYear(monthYearKey);
                    return q;
                });
        exhaustedQuota.setTotalQuota(5);
        exhaustedQuota.setUsedQuota(5);
        narsaQuotaRepository.save(exhaustedQuota);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("examDate", examDate.toString());

        mockMvc.perform(put("/api/assistant/candidates/" + candidateUser.getId() + "/exam")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Quota mensuel NARSA dépassé")));
    }
}
