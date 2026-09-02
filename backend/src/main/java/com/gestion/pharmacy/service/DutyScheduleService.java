package com.gestion.pharmacy.service;

import com.gestion.pharmacy.dto.DutyScheduleDTO;
import com.gestion.pharmacy.entity.DutySchedule;
import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.repository.DutyScheduleRepository;
import com.gestion.pharmacy.repository.PharmacyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DutyScheduleService {

    private final DutyScheduleRepository dutyScheduleRepository;
    private final PharmacyRepository pharmacyRepository;

    public List<DutyScheduleDTO> findBetween(LocalDate start, LocalDate end) {
        return dutyScheduleRepository.findByDutyDateBetween(start, end).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<DutyScheduleDTO> findByPharmacy(Long pharmacyId) {
        return dutyScheduleRepository.findByPharmacyId(pharmacyId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<Pharmacy> pharmaciesOnCallNow() {
        LocalDateTime now = LocalDateTime.now();
        Set<Long> ids = new HashSet<>();
        for (DutySchedule d : dutyScheduleRepository.findByDutyDate(now.toLocalDate())) {
            if (isActiveNow(d, now)) {
                ids.add(d.getPharmacy().getId());
            }
        }
        if (ids.isEmpty()) {
            return pharmacyRepository.findByIsOnCallTrue();
        }
        return pharmacyRepository.findAll().stream()
                .filter(p -> ids.contains(p.getId()) || Boolean.TRUE.equals(p.getIsOnCall()))
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional
    public DutyScheduleDTO create(DutyScheduleDTO dto) {
        Pharmacy pharmacy = pharmacyRepository.findById(dto.getPharmacyId())
                .orElseThrow(() -> new IllegalArgumentException("Pharmacie introuvable"));

        DutySchedule schedule = new DutySchedule();
        applyDto(schedule, dto, pharmacy);
        DutySchedule saved = dutyScheduleRepository.save(schedule);
        syncOnCallFlags();
        return toDto(saved);
    }

    @Transactional
    public DutyScheduleDTO update(Long id, DutyScheduleDTO dto) {
        DutySchedule schedule = dutyScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Garde introuvable"));
        Pharmacy pharmacy = pharmacyRepository.findById(dto.getPharmacyId())
                .orElseThrow(() -> new IllegalArgumentException("Pharmacie introuvable"));
        applyDto(schedule, dto, pharmacy);
        DutySchedule saved = dutyScheduleRepository.save(schedule);
        syncOnCallFlags();
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        dutyScheduleRepository.deleteById(id);
        syncOnCallFlags();
    }

    /** Met à jour le flag isOnCall toutes les minutes selon le planning. */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void syncOnCallFlags() {
        LocalDateTime now = LocalDateTime.now();
        Set<Long> activeIds = new HashSet<>();
        for (DutySchedule d : dutyScheduleRepository.findByDutyDate(now.toLocalDate())) {
            if (isActiveNow(d, now)) {
                activeIds.add(d.getPharmacy().getId());
            }
        }

        // Si aucun créneau planifié aujourd'hui, on ne touche pas aux flags manuels
        if (dutyScheduleRepository.findByDutyDate(now.toLocalDate()).isEmpty()) {
            return;
        }

        for (Pharmacy pharmacy : pharmacyRepository.findAll()) {
            boolean shouldBeOnCall = activeIds.contains(pharmacy.getId());
            if (!Boolean.valueOf(shouldBeOnCall).equals(pharmacy.getIsOnCall())) {
                pharmacy.setIsOnCall(shouldBeOnCall);
                pharmacyRepository.save(pharmacy);
            }
        }
    }

    private boolean isActiveNow(DutySchedule d, LocalDateTime now) {
        if (!d.getDutyDate().equals(now.toLocalDate())) {
            return false;
        }
        LocalTime start = d.getStartTime() != null ? d.getStartTime() : defaultStart(d.getShiftType());
        LocalTime end = d.getEndTime() != null ? d.getEndTime() : defaultEnd(d.getShiftType());
        LocalTime t = now.toLocalTime();

        // Créneau qui chevauche minuit (nuit)
        if (end.isBefore(start) || end.equals(start)) {
            return !t.isBefore(start) || t.isBefore(end);
        }
        return !t.isBefore(start) && t.isBefore(end);
    }

    private LocalTime defaultStart(String shift) {
        if ("NUIT".equalsIgnoreCase(shift)) return LocalTime.of(20, 0);
        if ("WEEKEND".equalsIgnoreCase(shift)) return LocalTime.of(8, 0);
        return LocalTime.of(8, 0);
    }

    private LocalTime defaultEnd(String shift) {
        if ("NUIT".equalsIgnoreCase(shift)) return LocalTime.of(8, 0);
        if ("WEEKEND".equalsIgnoreCase(shift)) return LocalTime.of(20, 0);
        return LocalTime.of(20, 0);
    }

    private void applyDto(DutySchedule schedule, DutyScheduleDTO dto, Pharmacy pharmacy) {
        String shift = dto.getShiftType() != null ? dto.getShiftType().toUpperCase() : "JOUR";
        LocalDate date = dto.getDutyDate();
        if (date != null && "WEEKEND".equals(shift)
                && date.getDayOfWeek() != DayOfWeek.SATURDAY
                && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
            // autorisé mais on garde le type demandé
        }
        schedule.setPharmacy(pharmacy);
        schedule.setDutyDate(date);
        schedule.setShiftType(shift);
        schedule.setStartTime(dto.getStartTime() != null ? dto.getStartTime() : defaultStart(shift));
        schedule.setEndTime(dto.getEndTime() != null ? dto.getEndTime() : defaultEnd(shift));
        schedule.setNotes(dto.getNotes());
    }

    private DutyScheduleDTO toDto(DutySchedule d) {
        DutyScheduleDTO dto = new DutyScheduleDTO();
        dto.setId(d.getId());
        dto.setPharmacyId(d.getPharmacy().getId());
        dto.setPharmacyName(d.getPharmacy().getName());
        dto.setDutyDate(d.getDutyDate());
        dto.setShiftType(d.getShiftType());
        dto.setStartTime(d.getStartTime());
        dto.setEndTime(d.getEndTime());
        dto.setNotes(d.getNotes());
        return dto;
    }
}
