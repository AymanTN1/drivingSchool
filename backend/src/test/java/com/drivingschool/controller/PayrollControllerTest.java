package com.drivingschool.controller;

import com.drivingschool.model.*;
import com.drivingschool.repository.*;
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
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PayrollControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MoniteurProfileRepository moniteurProfileRepository;

    @Autowired
    private DrivingLessonSlotRepository drivingLessonSlotRepository;

    @Autowired
    private CandidateProfileRepository candidateProfileRepository;

    @Autowired
    private PaySlipRepository paySlipRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User moniteurUser;
    private MoniteurProfile moniteurProfile;
    private User candidateUser;
    private CandidateProfile candidateProfile;

    @BeforeEach
    public void setUp() {
        // Setup Moniteur
        moniteurUser = new User();
        moniteurUser.setUsername("payrollmoniteur");
        moniteurUser.setPassword("password");
        moniteurUser.setEmail("payrollmon@gmail.com");
        moniteurUser.setFullName("Moniteur Test Paie");
        moniteurUser.setRole(Role.MONITEUR);
        moniteurUser.setActive(true);
        moniteurUser.setCreatedAt(LocalDateTime.now());
        moniteurUser = userRepository.save(moniteurUser);

        moniteurProfile = new MoniteurProfile();
        moniteurProfile.setUser(moniteurUser);
        moniteurProfile.setPhone("0600112233");
        moniteurProfile.setHourlyRate(50.0);
        moniteurProfile.setFixedSalary(1000.0);
        moniteurProfile.setBonusPerExamSuccess(100.0);
        moniteurProfile.setPayFrequency("MONTHLY");
        moniteurProfile = moniteurProfileRepository.save(moniteurProfile);

        // Setup Candidate
        candidateUser = new User();
        candidateUser.setUsername("payrollcandidate");
        candidateUser.setPassword("password");
        candidateUser.setEmail("payrollcand@gmail.com");
        candidateUser.setFullName("Candidate Test Paie");
        candidateUser.setRole(Role.CANDIDATE);
        candidateUser.setActive(true);
        candidateUser.setCreatedAt(LocalDateTime.now());
        candidateUser = userRepository.save(candidateUser);

        candidateProfile = new CandidateProfile();
        candidateProfile.setUser(candidateUser);
        candidateProfile.setCin("CIN999");
        candidateProfile.setPhone("0677889900");
        candidateProfile.setRegistrationDate(LocalDate.now());
        candidateProfile.setBirthDate(LocalDate.of(2000, 1, 1));
        candidateProfile.setTotalAmount(3500.0);
        candidateProfile.setAmountPaid(3500.0);
        candidateProfile.setAssignedMoniteur(moniteurUser);
        candidateProfile = candidateProfileRepository.save(candidateProfile);
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testUpdatePayrollConfig() throws Exception {
        Map<String, Object> config = new HashMap<>();
        config.put("hourlyRate", 60.0);
        config.put("fixedSalary", 1200.0);
        config.put("bonusPerExamSuccess", 120.0);
        config.put("payFrequency", "WEEKLY");

        mockMvc.perform(put("/api/payroll/config/" + moniteurUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(config)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Configuration de paie mise à jour !"));

        MoniteurProfile updatedProfile = moniteurProfileRepository.findByUserId(moniteurUser.getId()).orElseThrow();
        assertEquals(60.0, updatedProfile.getHourlyRate());
        assertEquals(1200.0, updatedProfile.getFixedSalary());
        assertEquals(120.0, updatedProfile.getBonusPerExamSuccess());
        assertEquals("WEEKLY", updatedProfile.getPayFrequency());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testGetMoniteursPayroll() throws Exception {
        // Add one completed driving lesson in current month
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDateTime lessonTime = startOfMonth.plusDays(5).atTime(10, 0);

        DrivingLessonSlot completedSlot = new DrivingLessonSlot();
        completedSlot.setMoniteur(moniteurUser);
        completedSlot.setCandidate(candidateUser);
        completedSlot.setSlotDateTime(lessonTime);
        completedSlot.setDurationMinutes(60);
        completedSlot.setStatus(BookingStatus.COMPLETED);
        drivingLessonSlotRepository.save(completedSlot);

        // Add exam success in current month
        candidateProfile.setNarsaExamDate(startOfMonth.plusDays(10));
        candidateProfileRepository.save(candidateProfile);

        mockMvc.perform(get("/api/payroll/moniteurs")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.userId == " + moniteurUser.getId() + ")].currentCompletedHours").value(1))
                .andExpect(jsonPath("$[?(@.userId == " + moniteurUser.getId() + ")].examSuccessCount").value(1))
                .andExpect(jsonPath("$[?(@.userId == " + moniteurUser.getId() + ")].estimatedPay").value(1050.0)) // 1000 fixed + 1 * 50 hourly
                .andExpect(jsonPath("$[?(@.userId == " + moniteurUser.getId() + ")].totalBonus").value(100.0));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testGeneratePaySlipAndMarkAsPaid() throws Exception {
        LocalDate start = LocalDate.now().minusMonths(1).withDayOfMonth(1);
        LocalDate end = start.plusMonths(1).minusDays(1);

        // Create completed slot in last month
        DrivingLessonSlot completedSlot = new DrivingLessonSlot();
        completedSlot.setMoniteur(moniteurUser);
        completedSlot.setCandidate(candidateUser);
        completedSlot.setSlotDateTime(start.plusDays(5).atTime(10, 0));
        completedSlot.setDurationMinutes(60);
        completedSlot.setStatus(BookingStatus.COMPLETED);
        drivingLessonSlotRepository.save(completedSlot);

        // Create narsa exam in last month
        candidateProfile.setNarsaExamDate(start.plusDays(15));
        candidateProfileRepository.save(candidateProfile);

        Map<String, String> request = new HashMap<>();
        request.put("periodStart", start.toString());
        request.put("periodEnd", end.toString());

        String responseStr = mockMvc.perform(post("/api/payroll/generate/" + moniteurUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("générée avec succès")))
                .andReturn().getResponse().getContentAsString();

        // Extract generated payslip ID
        Map<?, ?> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<?, ?> paySlipMap = (Map<?, ?>) responseMap.get("paySlip");
        Number paySlipId = (Number) paySlipMap.get("id");
        assertNotNull(paySlipId);

        // Verify values calculated
        PaySlip slip = paySlipRepository.findById(paySlipId.longValue()).orElseThrow();
        assertEquals(1, slip.getTotalHours());
        assertEquals(50.0, slip.getHourlyRate());
        assertEquals(50.0, slip.getHoursPayment());
        assertEquals(1000.0, slip.getFixedSalary());
        assertEquals(1, slip.getExamSuccessCount());
        assertEquals(100.0, slip.getTotalBonus());
        assertEquals(1150.0, slip.getTotalPay());
        assertEquals("GENERATED", slip.getStatus());

        // Mark as paid
        mockMvc.perform(put("/api/payroll/slips/" + paySlipId.longValue() + "/pay")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Fiche de paie marquée comme payée !"));

        PaySlip paidSlip = paySlipRepository.findById(paySlipId.longValue()).orElseThrow();
        assertEquals("PAID", paidSlip.getStatus());
    }
}
