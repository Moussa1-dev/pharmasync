package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.ProductRecall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRecallRepository extends JpaRepository<ProductRecall, Long> {
    List<ProductRecall> findByPharmacyIdOrderByCreatedAtDesc(Long pharmacyId);
    List<ProductRecall> findByLotNumberIgnoreCase(String lotNumber);
    List<ProductRecall> findByStatusOrderByCreatedAtDesc(String status);
}
