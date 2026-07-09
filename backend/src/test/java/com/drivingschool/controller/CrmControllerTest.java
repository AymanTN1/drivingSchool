package com.drivingschool.controller;

import com.drivingschool.model.Prospect;
import com.drivingschool.model.ProspectStatus;
import com.drivingschool.repository.ProspectRepository;
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
@DisplayName("CRM & Prospect Management Tests")
public class CrmControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ProspectRepository prospectRepository;
    @Autowired private ObjectMapper objectMapper;

    @Nested
    @DisplayName("Public Landing Page - POST /api/public/prospects")
    class PublicProspectTests {

        @Test
        @DisplayName("Visitor submits contact form with valid data")
        public void testSubmitProspect_Success() throws Exception {
            long countBefore = prospectRepository.count();

            mockMvc.perform(post("/api/public/prospects")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "fullName", "Ahmed Benali",
                            "phone", "0612345678",
                            "licenseType", "B"
                    ))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Demande envoyée avec succès")));

            assertEquals(countBefore + 1, prospectRepository.count());
        }

        @Test
        @DisplayName("Visitor submits empty name → 400 Bad Request")
        public void testSubmitProspect_MissingName() throws Exception {
            mockMvc.perform(post("/api/public/prospects")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "fullName", "",
                            "phone", "0612345678"
                    ))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("obligatoires")));
        }

        @Test
        @DisplayName("Visitor submits missing phone → 400 Bad Request")
        public void testSubmitProspect_MissingPhone() throws Exception {
            mockMvc.perform(post("/api/public/prospects")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "fullName", "Test User"
                    ))))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("No authentication required for public prospect submission")
        public void testSubmitProspect_NoAuthRequired() throws Exception {
            // This test verifies the endpoint works WITHOUT any @WithMockUser
            mockMvc.perform(post("/api/public/prospects")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "fullName", "Public Visitor",
                            "phone", "0699999999"
                    ))))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Default license type is 'B' when not provided")
        public void testSubmitProspect_DefaultLicenseType() throws Exception {
            mockMvc.perform(post("/api/public/prospects")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "fullName", "Default License Test",
                            "phone", "0611111111"
                    ))))
                    .andExpect(status().isOk());

            Prospect saved = prospectRepository.findAll().stream()
                    .filter(p -> "Default License Test".equals(p.getFullName()))
                    .findFirst().orElseThrow();
            assertEquals("B", saved.getLicenseType());
        }
    }

    @Nested
    @DisplayName("CRM Kanban - Assistant Prospect Management")
    class AssistantCrmTests {

        private Prospect prospect;

        @BeforeEach
        public void setUp() {
            prospect = new Prospect();
            prospect.setFullName("CRM Test Prospect");
            prospect.setPhone("0688887777");
            prospect.setLicenseType("B");
            prospect.setStatus(ProspectStatus.NEW);
            prospect.setCreatedAt(LocalDate.now());
            prospect = prospectRepository.save(prospect);
        }

        @Test
        @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
        @DisplayName("Assistant retrieves all prospects")
        public void testGetProspects() throws Exception {
            mockMvc.perform(get("/api/assistant/prospects"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }

        @Test
        @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
        @DisplayName("Assistant moves prospect from NEW to CALLED status")
        public void testUpdateStatus_NewToCalled() throws Exception {
            mockMvc.perform(put("/api/assistant/prospects/" + prospect.getId() + "/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "status", "CALLED",
                            "notes", "Appelé, intéressé par permis B"
                    ))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Statut mis à jour avec succès"));

            Prospect updated = prospectRepository.findById(prospect.getId()).orElseThrow();
            assertEquals(ProspectStatus.CALLED, updated.getStatus());
            assertEquals("Appelé, intéressé par permis B", updated.getNotes());
            assertEquals(LocalDate.now(), updated.getLastContactDate());
        }

        @Test
        @WithMockUser(username = "assistant", roles = {"ASSISTANT"})
        @DisplayName("Full CRM funnel: NEW → CALLED → WAITING_DOCS → ENROLLED")
        public void testFullCrmFunnel() throws Exception {
            // Step 1: NEW → CALLED
            mockMvc.perform(put("/api/assistant/prospects/" + prospect.getId() + "/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("status", "CALLED"))))
                    .andExpect(status().isOk());

            // Step 2: CALLED → WAITING_DOCS
            mockMvc.perform(put("/api/assistant/prospects/" + prospect.getId() + "/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "status", "WAITING_DOCS",
                            "notes", "Doit ramener CIN et photos"
                    ))))
                    .andExpect(status().isOk());

            // Step 3: WAITING_DOCS → ENROLLED
            mockMvc.perform(put("/api/assistant/prospects/" + prospect.getId() + "/status")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("status", "ENROLLED"))))
                    .andExpect(status().isOk());

            Prospect finalProspect = prospectRepository.findById(prospect.getId()).orElseThrow();
            assertEquals(ProspectStatus.ENROLLED, finalProspect.getStatus());
        }

        @Test
        @WithMockUser(username = "student", roles = {"CANDIDATE"})
        @DisplayName("CANDIDATE cannot access CRM prospects (403)")
        public void testGetProspects_ForbiddenForCandidate() throws Exception {
            mockMvc.perform(get("/api/assistant/prospects"))
                    .andExpect(status().isForbidden());
        }
    }
}
