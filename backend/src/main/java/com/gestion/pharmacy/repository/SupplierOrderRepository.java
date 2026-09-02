package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.SupplierOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierOrderRepository extends JpaRepository<SupplierOrder, Long> {
    List<SupplierOrder> findByPharmacyIdOrderByCreatedAtDesc(Long pharmacyId);
}
