package com.drivingschool.controller;

import com.drivingschool.model.Role;
import com.drivingschool.model.User;
import com.drivingschool.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Auth & Security Tests")
public class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ObjectMapper objectMapper;

    private User adminUser;

    @BeforeEach
    public void setUp() {
        adminUser = new User();
        adminUser.setUsername("testadmin");
        adminUser.setPassword(passwordEncoder.encode("securepass123"));
        adminUser.setEmail("testadmin@school.ma");
        adminUser.setFullName("Admin Test");
        adminUser.setRole(Role.ADMIN);
        adminUser.setActive(true);
        adminUser.setCreatedAt(LocalDateTime.now());
        adminUser = userRepository.save(adminUser);
    }

    @Nested
    @DisplayName("POST /api/auth/signin")
    class SignInTests {

        @Test
        @DisplayName("Login with valid credentials returns JWT token and correct role")
        public void testLogin_Success() throws Exception {
            Map<String, String> loginRequest = Map.of(
                    "username", "testadmin",
                    "password", "securepass123"
            );

            mockMvc.perform(post("/api/auth/signin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").exists())
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.username").value("testadmin"))
                    .andExpect(jsonPath("$.role").value("ADMIN"))
                    .andExpect(jsonPath("$.fullName").value("Admin Test"));
        }

        @Test
        @DisplayName("Login with wrong password returns 401 Unauthorized")
        public void testLogin_WrongPassword() throws Exception {
            Map<String, String> loginRequest = Map.of(
                    "username", "testadmin",
                    "password", "wrongpassword"
            );

            mockMvc.perform(post("/api/auth/signin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Login with non-existent user returns 401 Unauthorized")
        public void testLogin_UserNotFound() throws Exception {
            Map<String, String> loginRequest = Map.of(
                    "username", "ghostuser",
                    "password", "doesntmatter"
            );

            mockMvc.perform(post("/api/auth/signin")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/auth/me")
    class MeEndpointTests {

        @Test
        @WithMockUser(username = "testadmin", roles = {"ADMIN"})
        @DisplayName("Authenticated user can retrieve their own profile")
        public void testGetMe_Authenticated() throws Exception {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value("testadmin"))
                    .andExpect(jsonPath("$.fullName").value("Admin Test"));
        }

        @Test
        @DisplayName("Unauthenticated request to /me returns 401")
        public void testGetMe_Unauthenticated() throws Exception {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Role-Based Access Control (RBAC)")
    class RBACTests {

        @Test
        @DisplayName("Unauthenticated user cannot access protected admin endpoints")
        public void testAdminEndpoint_Unauthenticated() throws Exception {
            mockMvc.perform(get("/api/payroll/moniteurs"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(username = "student", roles = {"CANDIDATE"})
        @DisplayName("CANDIDATE cannot access ADMIN-only payroll endpoint")
        public void testAdminEndpoint_ForbiddenForCandidate() throws Exception {
            mockMvc.perform(get("/api/payroll/moniteurs"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "student", roles = {"CANDIDATE"})
        @DisplayName("CANDIDATE cannot access ASSISTANT-only caisse endpoint")
        public void testAssistantEndpoint_ForbiddenForCandidate() throws Exception {
            mockMvc.perform(get("/api/assistant/caisse"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "moniteur1", roles = {"MONITEUR"})
        @DisplayName("MONITEUR cannot access ADMIN-only fleet analytics")
        public void testFleetAnalytics_ForbiddenForMoniteur() throws Exception {
            mockMvc.perform(get("/api/fleet/analytics"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Public endpoints are accessible without authentication")
        public void testPublicEndpoint_Accessible() throws Exception {
            mockMvc.perform(get("/api/public/pc-posts"))
                    .andExpect(status().isOk());
        }
    }
}
