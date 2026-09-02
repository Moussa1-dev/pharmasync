package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
}
