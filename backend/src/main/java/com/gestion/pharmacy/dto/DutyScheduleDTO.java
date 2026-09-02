package com.gestion.pharmacy.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class DutyScheduleDTO {
    private Long id;
    private Long pharmacyId;
    private String pharmacyName;
    private LocalDate dutyDate;
    private String shiftType;
    private LocalTime startTime;
    private LocalTime endTime;
    private String notes;
}
