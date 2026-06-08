package com.drivingschool.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DrivingBookingRequest {
    private LocalDateTime slotDateTime;
    private Long moniteurId;
}
