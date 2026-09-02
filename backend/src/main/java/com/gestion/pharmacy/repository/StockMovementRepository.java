package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByStockId(Long stockId);
    List<StockMovement> findByStockPharmacyId(Long pharmacyId);
    List<StockMovement> findByStockPharmacyIdOrderByMovementDateDesc(Long pharmacyId);
}
