package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    List<Stock> findByMedicationId(Long medicationId);
    List<Stock> findByPharmacyId(Long pharmacyId);
    Optional<Stock> findByPharmacyIdAndMedicationId(Long pharmacyId, Long medicationId);
    List<Stock> findByQuantityLessThanEqual(Integer threshold);
    List<Stock> findByPharmacyIdAndExpirationDateBefore(Long pharmacyId, LocalDate date);

    Optional<Stock> findByPharmacyIdAndMedicationBarcode(Long pharmacyId, String barcode);

    List<Stock> findByLotNumberIgnoreCase(String lotNumber);

    Optional<Stock> findByPharmacyIdAndMedicationIdAndLotNumber(Long pharmacyId, Long medicationId, String lotNumber);

    // Un médicament peut avoir plusieurs lots dans une même pharmacie :
    // ces méthodes renvoient le lot qui périme en premier, au lieu de planter.
    Optional<Stock> findFirstByPharmacyIdAndMedicationIdOrderByExpirationDateAsc(Long pharmacyId, Long medicationId);

    Optional<Stock> findFirstByPharmacyIdAndMedicationIdAndQuantityGreaterThanOrderByExpirationDateAsc(
            Long pharmacyId, Long medicationId, Integer quantity);

    Optional<Stock> findFirstByPharmacyIdAndMedicationBarcodeOrderByExpirationDateAsc(Long pharmacyId, String barcode);
}
