package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByPharmacyId(Long pharmacyId);
    List<Sale> findByLotNumberIgnoreCase(String lotNumber);
}
