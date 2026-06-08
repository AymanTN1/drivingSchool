package com.drivingschool.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PCBookingRequest {
    private LocalDateTime slotDateTime;
    private Integer postNumber;
}
