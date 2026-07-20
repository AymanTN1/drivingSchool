package com.drivingschool.dto;

import lombok.Data;

@Data
public class DynamicPricingRequest {
    private Double base_price;
    private Integer hour_of_day;
    private Integer day_of_week;
    private Integer bookings_at_this_hour;
    private Double avg_bookings_per_hour;
    private Double instructor_avg_rating;
    private Integer instructor_total_bookings;
}
