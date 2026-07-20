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

    /**
     * Calculate dynamic pricing for every hour of a given day for a specific instructor.
     * Returns a list of 24 pricing results (one per hour, 8h-20h relevant).
     */
    public List<DynamicPricingResponse> getDailyPricing(Long moniteurId, LocalDate date, Double basePrice) {
        List<DynamicPricingResponse> results = new ArrayList<>();

        // Calculate average bookings per hour across all time (simplified)
        long totalBookings = supportLessonRepository.count();
        double avgBookingsPerHour = totalBookings > 0 ? totalBookings / 12.0 : 1.0; // 12 working hours

        // Get instructor stats
        Double avgRating = supportLessonRepository.avgCandidateRatingByMoniteur(moniteurId);
        Long totalInstructorBookings = supportLessonRepository.countCandidateRatingsByMoniteur(moniteurId);

        for (int hour = 8; hour <= 20; hour++) {
            LocalDateTime start = LocalDateTime.of(date, LocalTime.of(hour, 0));
            LocalDateTime end = start.plusHours(1);

            // Count bookings at this specific hour
            List<?> bookingsAtHour = supportLessonRepository.findConflictsForMoniteur(moniteurId, start, end);

            DynamicPricingRequest request = new DynamicPricingRequest();
            request.setBase_price(basePrice);
            request.setHour_of_day(hour);
            request.setDay_of_week(date.getDayOfWeek().getValue() - 1); // 0=Monday
            request.setBookings_at_this_hour(bookingsAtHour.size());
            request.setAvg_bookings_per_hour(avgBookingsPerHour);
            request.setInstructor_avg_rating(avgRating != null ? avgRating : 3.0);
            request.setInstructor_total_bookings(totalInstructorBookings != null ? totalInstructorBookings.intValue() : 0);

            ResponseEntity<DynamicPricingResponse> response = restTemplate.exchange(
                    aiServiceUrl + "/pricing/dynamic",
                    HttpMethod.POST,
                    new HttpEntity<>(request),
                    DynamicPricingResponse.class
            );

            results.add(response.getBody());
        }

        return results;
    }

    /**
     * Get pricing for a single specific slot.
     */
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

        ResponseEntity<DynamicPricingResponse> response = restTemplate.exchange(
                aiServiceUrl + "/pricing/dynamic",
                HttpMethod.POST,
                new HttpEntity<>(request),
                DynamicPricingResponse.class
        );

        return response.getBody();
    }
}
