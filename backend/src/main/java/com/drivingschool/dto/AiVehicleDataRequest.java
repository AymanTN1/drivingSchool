package com.drivingschool.dto;

import lombok.Data;
import java.util.Map;

@Data
public class AiVehicleDataRequest {
    private Long vehicle_id;
    private Integer current_mileage;
    private Double avg_daily_mileage;
    private Map<String, Integer> last_maintenance_mileage;
}
