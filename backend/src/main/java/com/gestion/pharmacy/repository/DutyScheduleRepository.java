package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.DutySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DutyScheduleRepository extends JpaRepository<DutySchedule, Long> {
    List<DutySchedule> findByPharmacyId(Long pharmacyId);

    List<DutySchedule> findByDutyDateBetween(LocalDate start, LocalDate end);

    List<DutySchedule> findByDutyDate(LocalDate date);

    @Query("SELECT d FROM DutySchedule d WHERE d.dutyDate = :date AND d.pharmacy.id = :pharmacyId")
    List<DutySchedule> findByPharmacyAndDate(@Param("pharmacyId") Long pharmacyId, @Param("date") LocalDate date);
}
