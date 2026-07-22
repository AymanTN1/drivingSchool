package com.drivingschool.service;

import com.drivingschool.dto.DynamicPricingRequest;
import com.drivingschool.dto.DynamicPricingResponse;
import com.drivingschool.repository.SupportLessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DynamicPricingService {

    @Autowired
    private SupportLessonRepository supportLessonRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://ai-service:8000}")
    private String aiServiceUrl;

    public List<DynamicPricingResponse> getDailyPricing(Long moniteurId, LocalDate date, Double basePrice) {
        List<DynamicPricingResponse> results = new ArrayList<>();

        long totalBookings = supportLessonRepository.count();
        double avgBookingsPerHour = totalBookings > 0 ? totalBookings / 12.0 : 1.0;

        Double avgRating = supportLessonRepository.avgCandidateRatingByMoniteur(moniteurId);
        Long totalInstructorBookings = supportLessonRepository.countCandidateRatingsByMoniteur(moniteurId);

        for (int hour = 8; hour <= 20; hour++) {
            LocalDateTime start = LocalDateTime.of(date, LocalTime.of(hour, 0));
            LocalDateTime end = start.plusHours(1);

            List<?> bookingsAtHour = supportLessonRepository.findConflictsForMoniteur(moniteurId, start, end);

            DynamicPricingRequest request = new DynamicPricingRequest();
            request.setBase_price(basePrice);
            request.setHour_of_day(hour);
            request.setDay_of_week(date.getDayOfWeek().getValue() - 1);
            request.setBookings_at_this_hour(bookingsAtHour.size());
            request.setAvg_bookings_per_hour(avgBookingsPerHour);
            request.setInstructor_avg_rating(avgRating != null ? avgRating : 3.0);
            request.setInstructor_total_bookings(totalInstructorBookings != null ? totalInstructorBookings.intValue() : 0);

            DynamicPricingResponse pricing = calculatePricingWithFallback(request);
            results.add(pricing);
        }

        return results;
    }

    public DynamicPricingResponse getSlotPricing(Long moniteurId, LocalDateTime slotDateTime, Double basePrice) {
        LocalDateTime start = slotDateTime.withMinute(0).withSecond(0);
        LocalDateTime end = start.plusHours(1);

        long totalBookings = supportLessonRepository.count();
        double avgBookingsPerHour = totalBookings > 0 ? totalBookings / 12.0 : 1.0;

        Double avgRating = supportLessonRepository.avgCandidateRatingByMoniteur(moniteurId);
        Long totalInstructorBookings = supportLessonRepository.countCandidateRatingsByMoniteur(moniteurId);

        List<?> bookingsAtHour = supportLessonRepository.findConflictsForMoniteur(moniteurId, start, end);

        DynamicPricingRequest request = new DynamicPricingRequest();
        request.setBase_price(basePrice);
        request.setHour_of_day(slotDateTime.getHour());
        request.setDay_of_week(slotDateTime.getDayOfWeek().getValue() - 1);
        request.setBookings_at_this_hour(bookingsAtHour.size());
        request.setAvg_bookings_per_hour(avgBookingsPerHour);
        request.setInstructor_avg_rating(avgRating != null ? avgRating : 3.0);
        request.setInstructor_total_bookings(totalInstructorBookings != null ? totalInstructorBookings.intValue() : 0);

        return calculatePricingWithFallback(request);
    }

    private DynamicPricingResponse calculatePricingWithFallback(DynamicPricingRequest request) {
        try {
            ResponseEntity<DynamicPricingResponse> response = restTemplate.exchange(
                    aiServiceUrl + "/pricing/dynamic",
                    HttpMethod.POST,
                    new HttpEntity<>(request),
                    DynamicPricingResponse.class
            );
            if (response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            // Fallback to local Java calculations
        }

        return calculateLocalPricing(request);
    }

    private DynamicPricingResponse calculateLocalPricing(DynamicPricingRequest req) {
        double multiplier = 1.0;

        // Demand impact
        if (req.getAvg_bookings_per_hour() > 0) {
            double ratio = (double) req.getBookings_at_this_hour() / req.getAvg_bookings_per_hour();
            if (ratio > 1.5) multiplier += 0.25;
            else if (ratio > 1.0) multiplier += 0.10;
            else if (ratio < 0.5) multiplier -= 0.15;
        }

        // Peak hour impact
        if (req.getHour_of_day() >= 17 && req.getHour_of_day() <= 19) {
            multiplier += 0.10;
        } else if (req.getHour_of_day() >= 10 && req.getHour_of_day() <= 12) {
            multiplier -= 0.10;
        }

        // Weekend impact
        if (req.getDay_of_week() == 5 || req.getDay_of_week() == 6) {
            multiplier += 0.05;
        }

        // Instructor rating impact
        if (req.getInstructor_avg_rating() >= 4.5 && req.getInstructor_total_bookings() >= 5) {
            multiplier += 0.05;
        }

        multiplier = Math.min(Math.max(multiplier, 0.75), 1.35);
        multiplier = Math.round(multiplier * 100.0) / 100.0;

        double finalPrice = Math.round(req.getBase_price() * multiplier * 100.0) / 100.0;

        String tier;
        String explanation;

        if (multiplier >= 1.25) {
            tier = "SURGE";
            explanation = "Tarif Forte Demande (+ " + Math.round((multiplier - 1.0) * 100) + "%). Créneau très sollicité.";
        } else if (multiplier > 1.0) {
            tier = "HIGH_DEMAND";
            explanation = "Tarif Modéré (+ " + Math.round((multiplier - 1.0) * 100) + "%).";
        } else if (multiplier < 1.0) {
            tier = "OFF_PEAK";
            explanation = "Tarif Réduit (- " + Math.round((1.0 - multiplier) * 100) + "%). Promotion heures creuses !";
        } else {
            tier = "NORMAL";
            explanation = "Tarif Standard.";
        }

        DynamicPricingResponse resp = new DynamicPricingResponse();
        resp.setBase_price(req.getBase_price());
        resp.setFinal_price(finalPrice);
        resp.setMultiplier(multiplier);
        resp.setSurge_level(tier);
        resp.setDiscount_percent(Math.round((multiplier - 1.0) * 100.0 * 100.0) / 100.0);
        resp.setExplanation(explanation);

        return resp;
    }
}
