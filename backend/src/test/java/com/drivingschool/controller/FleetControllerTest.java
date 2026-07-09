package com.drivingschool.controller;

import com.drivingschool.dto.FuelRecordRequest;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Fleet Management Tests")
public class FleetControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private FuelRecordRepository fuelRecordRepository;
    @Autowired private DrivingLessonSlotRepository drivingLessonSlotRepository;
    @Autowired private ObjectMapper objectMapper;

    private User moniteur;
    private Vehicle vehicle;

    @BeforeEach
    public void setUp() {
        moniteur = new User();
        moniteur.setUsername("fleetmoniteur");
        moniteur.setPassword("password");
        moniteur.setEmail("fleetmon@school.ma");
        moniteur.setFullName("Fleet Moniteur");
        moniteur.setRole(Role.MONITEUR);
        moniteur.setActive(true);
        moniteur.setCreatedAt(LocalDateTime.now());
        moniteur = userRepository.save(moniteur);

        vehicle = new Vehicle();
        vehicle.setBrand("Dacia");
        vehicle.setModel("Logan");
        vehicle.setLicensePlate("FLEET-001");
        vehicle.setStatus("ACTIVE");
        vehicle.setLastTechnicalVisit(LocalDate.now().minusMonths(3));
        vehicle.setNextTechnicalVisit(LocalDate.now().plusMonths(9));
        vehicle.setInsuranceExpiryDate(LocalDate.now().plusMonths(6));
        vehicle.setVignetteExpiryDate(LocalDate.now().plusMonths(6));
        vehicle = vehicleRepository.save(vehicle);
    }

    @Nested
    @DisplayName("POST /api/fleet/fuel - Record Fuel")
    class RecordFuelTests {

        @Test
        @WithMockUser(username = "fleetmoniteur", roles = {"MONITEUR"})
        @DisplayName("Moniteur can record a fuel fill-up")
        public void testRecordFuel_Success() throws Exception {
            FuelRecordRequest request = new FuelRecordRequest();
            request.setVehicleId(vehicle.getId());
            request.setLiters(35.0);
            request.setPricePerLiter(13.5);
            request.setTotalCost(472.5);
            request.setOdometerKm(50000);
            request.setStation("Afriquia");
            request.setNotes("Plein complet");

            mockMvc.perform(post("/api/fleet/fuel")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Plein de carburant enregistré avec succès !"));

            assertEquals(1, fuelRecordRepository.findByVehicleIdOrderByDateDesc(vehicle.getId()).size());
        }

        @Test
        @WithMockUser(username = "student", roles = {"CANDIDATE"})
        @DisplayName("Candidate CANNOT record fuel (403 Forbidden)")
        public void testRecordFuel_ForbiddenForCandidate() throws Exception {
            FuelRecordRequest request = new FuelRecordRequest();
            request.setVehicleId(vehicle.getId());
            request.setLiters(20.0);

            mockMvc.perform(post("/api/fleet/fuel")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/fleet/analytics - Fleet Analytics & Consumption Alerts")
    class FleetAnalyticsTests {

        @Test
        @WithMockUser(username = "admin", roles = {"ADMIN"})
        @DisplayName("Fleet analytics returns vehicles with consumption data")
        public void testFleetAnalytics_ReturnsVehicles() throws Exception {
            // Create 3 fuel records with increasing odometer to simulate consumption
            createFuelRecord(vehicle, moniteur, 50000, 30.0, 13.5, 405.0, 10);
            createFuelRecord(vehicle, moniteur, 50500, 28.0, 13.5, 378.0, 7);
            createFuelRecord(vehicle, moniteur, 51000, 32.0, 13.5, 432.0, 3);

            mockMvc.perform(get("/api/fleet/analytics")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.vehicles").isArray())
                    .andExpect(jsonPath("$.totalFuelCost").isNumber())
                    .andExpect(jsonPath("$.totalLiters").isNumber())
                    .andExpect(jsonPath("$.monthlyFuelTrends").isArray());
        }

        @Test
        @WithMockUser(username = "admin", roles = {"ADMIN"})
        @DisplayName("Consumption alert triggers when last fill is 50%+ above average")
        public void testFleetAnalytics_ConsumptionAlertTriggered() throws Exception {
            // Normal consumption records: ~6 L/100km
            createFuelRecord(vehicle, moniteur, 50000, 30.0, 13.5, 405.0, 30);
            createFuelRecord(vehicle, moniteur, 50500, 30.0, 13.5, 405.0, 25);
            createFuelRecord(vehicle, moniteur, 51000, 30.0, 13.5, 405.0, 20);
            // SPIKE: last record has 80L for 500km = 16 L/100km (way above 6 avg)
            createFuelRecord(vehicle, moniteur, 51500, 80.0, 13.5, 1080.0, 5);

            String response = mockMvc.perform(get("/api/fleet/analytics")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            // The vehicle should have consumptionAlert = true
            org.junit.jupiter.api.Assertions.assertTrue(
                    response.contains("\"consumptionAlert\":true"),
                    "Expected consumption alert to be triggered for abnormal fuel usage"
            );
        }

        @Test
        @WithMockUser(username = "admin", roles = {"ADMIN"})
        @DisplayName("Cost per driving hour is correctly calculated")
        public void testFleetAnalytics_CostPerHourCalculation() throws Exception {
            // Add fuel cost
            createFuelRecord(vehicle, moniteur, 50000, 30.0, 10.0, 300.0, 10);

            // Add 3 completed driving lessons using this vehicle
            for (int i = 0; i < 3; i++) {
                DrivingLessonSlot lesson = new DrivingLessonSlot();
                lesson.setMoniteur(moniteur);
                lesson.setCandidate(moniteur); // reuse user for simplicity
                lesson.setVehicle(vehicle);
                lesson.setSlotDateTime(LocalDateTime.now().minusDays(i + 1).withHour(10));
                lesson.setDurationMinutes(60);
                lesson.setStatus(BookingStatus.COMPLETED);
                drivingLessonSlotRepository.save(lesson);
            }

            mockMvc.perform(get("/api/fleet/analytics")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    // costPerHour should be 300 / 3 = 100.0
                    .andExpect(jsonPath("$.vehicles[?(@.label == 'Dacia Logan (FLEET-001)')].costPerHour").value(100.0));
        }
    }

    private void createFuelRecord(Vehicle v, User m, int odo, double liters, double price, double total, int daysAgo) {
        FuelRecord fr = new FuelRecord();
        fr.setVehicle(v);
        fr.setMoniteur(m);
        fr.setDate(LocalDateTime.now().minusDays(daysAgo));
        fr.setOdometerKm(odo);
        fr.setLiters(liters);
        fr.setPricePerLiter(price);
        fr.setTotalCost(total);
        fr.setStation("TestStation");
        fuelRecordRepository.save(fr);
    }
}
