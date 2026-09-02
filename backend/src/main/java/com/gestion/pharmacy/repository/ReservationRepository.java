package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByStockPharmacyId(Long pharmacyId);
    List<Reservation> findByStatusAndCreatedAtBefore(String status, LocalDateTime date);

    List<Reservation> findByStatusAndCreatedAtBetweenAndSmsReminderSentFalse(
            String status, LocalDateTime from, LocalDateTime to);

    List<Reservation> findByPatientEmailIgnoreCaseOrderByCreatedAtDesc(String patientEmail);
    List<Reservation> findByPatientContactIgnoreCaseOrPatientEmailIgnoreCaseOrderByCreatedAtDesc(
            String patientContact, String patientEmail);
}
