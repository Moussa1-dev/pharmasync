package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.AlertSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertSubscriptionRepository extends JpaRepository<AlertSubscription, Long> {
    List<AlertSubscription> findByMedicationIdAndPharmacyIdAndActiveTrue(Long medicationId, Long pharmacyId);
    List<AlertSubscription> findByMedicationIdAndPharmacyIdIsNullAndActiveTrue(Long medicationId);
    List<AlertSubscription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    boolean existsByPatientIdAndMedicationIdAndPharmacyIdAndActiveTrue(Long patientId, Long medicationId, Long pharmacyId);
}
