package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.Pharmacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {
    List<Pharmacy> findByIsOnCallTrue();
    List<Pharmacy> findByNameContainingIgnoreCase(String name);
    List<Pharmacy> findByAddressContainingIgnoreCase(String address);
}
