package com.drivingschool.dto;

import lombok.Data;

@Data
public class DynamicPricingResponse {
    private Double base_price;
    private Double multiplier;
    private Double final_price;
    private String surge_level;
    private Double discount_percent;
    private String explanation;
}
