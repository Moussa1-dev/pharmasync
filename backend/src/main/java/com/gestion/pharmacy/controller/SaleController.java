package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.service.StockAlertScheduler;
import com.gestion.pharmacy.security.PharmacyAccessService;
import com.gestion.pharmacy.dto.SaleRequestDTO;
import com.gestion.pharmacy.entity.Medication;
import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.entity.Sale;
import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.repository.MedicationRepository;
import com.gestion.pharmacy.repository.PharmacyRepository;
import com.gestion.pharmacy.repository.SaleRepository;
import com.gestion.pharmacy.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*")
public class SaleController {

    @Autowired
    private PharmacyAccessService pharmacyAccessService;

    @Autowired
    private StockAlertScheduler stockAlertScheduler;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private PharmacyRepository pharmacyRepository;

    @Autowired
    private MedicationRepository medicationRepository;

    @PostMapping
    public ResponseEntity<?> createSale(@RequestBody SaleRequestDTO request) {
        if (request.getPharmacyId() == null) {
            return ResponseEntity.badRequest().body("Pharmacie manquante");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body("La quantité doit être supérieure à zéro");
        }
        if (!pharmacyAccessService.canManage(request.getPharmacyId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous ne gérez pas cette pharmacie");
        }
        Optional<Pharmacy> pharmacyOpt = pharmacyRepository.findById(request.getPharmacyId());
        if (pharmacyOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Pharmacy not found");
        }
        Pharmacy pharmacy = pharmacyOpt.get();

        Stock stock = null;
        if (request.getStockId() != null) {
            stock = stockRepository.findById(request.getStockId()).orElse(null);
        } else if (request.getLotNumber() != null && !request.getLotNumber().isBlank() && request.getMedicationId() != null) {
            stock = stockRepository.findByPharmacyIdAndMedicationIdAndLotNumber(
                    pharmacy.getId(), request.getMedicationId(), request.getLotNumber()).orElse(null);
        } else if (request.getMedicationId() != null) {
            stock = stockRepository.findFirstByPharmacyIdAndMedicationIdAndQuantityGreaterThanOrderByExpirationDateAsc(
                    pharmacy.getId(), request.getMedicationId(), 0).orElse(null);
        }

        if (stock != null && (stock.getPharmacy() == null || !pharmacy.getId().equals(stock.getPharmacy().getId()))) {
            return ResponseEntity.badRequest().body("Ce stock n'appartient pas à cette pharmacie");
        }
        if (stock == null || stock.getQuantity() == null || stock.getQuantity() < request.getQuantity()) {
            return ResponseEntity.badRequest().body("Insufficient stock");
        }

        Medication medication = stock.getMedication();
        if (medication == null && request.getMedicationId() != null) {
            medication = medicationRepository.findById(request.getMedicationId()).orElse(null);
        }
        if (medication == null) {
            return ResponseEntity.badRequest().body("Medication not found");
        }

        stock.setQuantity(stock.getQuantity() - request.getQuantity());
        stockRepository.save(stock);
        stockAlertScheduler.checkStock(stock); // alerte en temps réel

        Sale sale = new Sale();
        sale.setPharmacy(pharmacy);
        sale.setMedication(medication);
        sale.setQuantity(request.getQuantity());
        sale.setCustomerName(request.getCustomerName());
        sale.setLotNumber(stock.getLotNumber());
        sale.setSerialNumber(stock.getSerialNumber());

        double price = medication.getIndicativePrice() != null ? medication.getIndicativePrice() : 0.0;
        sale.setTotalPrice(price * request.getQuantity());

        saleRepository.save(sale);
        return ResponseEntity.status(HttpStatus.CREATED).body(sale);
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    public ResponseEntity<List<Sale>> getSalesByPharmacy(@PathVariable Long pharmacyId) {
        return ResponseEntity.ok(saleRepository.findByPharmacyId(pharmacyId));
    }
}
