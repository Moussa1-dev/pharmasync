package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.service.StockAlertScheduler;
import com.gestion.pharmacy.security.PharmacyAccessService;
import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.entity.Medication;
import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.repository.StockRepository;
import com.gestion.pharmacy.repository.ReservationRepository;
import com.gestion.pharmacy.repository.PharmacyRepository;
import com.gestion.pharmacy.repository.MedicationRepository;
import com.gestion.pharmacy.service.DashboardSummaryService;
import com.gestion.pharmacy.service.DutyScheduleService;
import com.gestion.pharmacy.service.RestockAlertService;
import lombok.RequiredArgsConstructor;
import com.gestion.pharmacy.dto.StockRequestDTO;
import com.gestion.pharmacy.dto.UpdateStockDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pharmacy")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PharmacyController {

    private final StockRepository stockRepository;
    private final ReservationRepository reservationRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicationRepository medicationRepository;
    private final DashboardSummaryService dashboardSummaryService;
    private final RestockAlertService restockAlertService;
    private final DutyScheduleService dutyScheduleService;
    private final PharmacyAccessService pharmacyAccessService;
    private final StockAlertScheduler stockAlertScheduler;

    @GetMapping("/on-call")
    public ResponseEntity<List<Pharmacy>> getOnCallPharmacies() {
        return ResponseEntity.ok(dutyScheduleService.pharmaciesOnCallNow());
    }

    @GetMapping
    public ResponseEntity<List<Pharmacy>> getAllPharmacies() {
        return ResponseEntity.ok(pharmacyRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pharmacy> getPharmacyById(@PathVariable Long id) {
        return pharmacyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Pharmacy> createPharmacy(@Valid @RequestBody Pharmacy pharmacy) {
        return ResponseEntity.ok(pharmacyRepository.save(pharmacy));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pharmacy> updatePharmacy(@PathVariable Long id, @Valid @RequestBody Pharmacy pharmacy) {
        return pharmacyRepository.findById(id)
                .map(existing -> {
                    existing.setName(pharmacy.getName());
                    existing.setAddress(pharmacy.getAddress());
                    existing.setContact(pharmacy.getContact());
                    existing.setLatitude(pharmacy.getLatitude());
                    existing.setLongitude(pharmacy.getLongitude());
                    existing.setIsOnCall(pharmacy.getIsOnCall());
                    return ResponseEntity.ok(pharmacyRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePharmacy(@PathVariable Long id) {
        if (!pharmacyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        pharmacyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/medications")
    public ResponseEntity<List<Medication>> getAllMedications() {
        return ResponseEntity.ok(medicationRepository.findAll());
    }

    @GetMapping("/{id}/stocks")
    public ResponseEntity<List<Stock>> getPharmacyStocks(@PathVariable Long id) {
        return ResponseEntity.ok(stockRepository.findByPharmacyId(id));
    }

    @GetMapping("/{id}/stocks/by-barcode/{code}")
    public ResponseEntity<?> getStockByBarcode(@PathVariable Long id, @PathVariable String code) {
        return stockRepository.findFirstByPharmacyIdAndMedicationBarcodeOrderByExpirationDateAsc(id, code)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/reservations")
    public ResponseEntity<?> getPharmacyReservations(@PathVariable Long id) {
        return ResponseEntity.ok(reservationRepository.findByStockPharmacyId(id));
    }

    @GetMapping("/{id}/expiring")
    public ResponseEntity<List<Stock>> getExpiringStocks(@PathVariable Long id) {
        LocalDate threeMonthsFromNow = LocalDate.now().plusMonths(3);
        return ResponseEntity.ok(stockRepository.findByPharmacyIdAndExpirationDateBefore(id, threeMonthsFromNow));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<?> getPharmacySummary(@PathVariable Long id) {
        List<Stock> stocks = stockRepository.findByPharmacyId(id);
        List<Reservation> reservations = reservationRepository.findByStockPharmacyId(id);
        return ResponseEntity.ok(dashboardSummaryService.buildSummary(stocks, reservations));
    }

    @GetMapping("/{id}/alerts")
    public ResponseEntity<List<Stock>> getStockAlerts(@PathVariable Long id) {
        List<Stock> stocks = stockRepository.findByPharmacyId(id);
        return ResponseEntity.ok(restockAlertService.buildAlerts(stocks));
    }

    @PostMapping("/{id}/stocks")
    public ResponseEntity<?> addStock(@PathVariable Long id, @Valid @RequestBody StockRequestDTO requestDTO) {
        Pharmacy pharmacy = pharmacyRepository.findById(id).orElse(null);
        if (pharmacy == null) return ResponseEntity.notFound().build();
        if (!pharmacyAccessService.canManage(id)) {
            return ResponseEntity.status(403).body("Vous ne gérez pas cette pharmacie");
        }

        Long medicationId = requestDTO.getMedicationId();
        Medication medication = medicationRepository.findById(medicationId).orElse(null);
        if (medication == null) return ResponseEntity.badRequest().body("Medication not found");

        String lot = requestDTO.getLotNumber() != null && !requestDTO.getLotNumber().isBlank()
                ? requestDTO.getLotNumber().trim()
                : null;

        if (lot != null) {
            Optional<Stock> sameLot = stockRepository.findByPharmacyIdAndMedicationIdAndLotNumber(id, medicationId, lot);
            if (sameLot.isPresent()) {
                Stock existing = sameLot.get();
                existing.setQuantity(existing.getQuantity() + requestDTO.getQuantity());
                existing.setExpirationDate(requestDTO.getExpirationDate());
                if (requestDTO.getSerialNumber() != null) {
                    existing.setSerialNumber(requestDTO.getSerialNumber());
                }
                Stock savedExisting = stockRepository.save(existing);
                stockAlertScheduler.checkStock(savedExisting); // alerte en temps réel
                return ResponseEntity.ok(savedExisting);
            }
        } else {
            // Sans lot : comportement historique (un stock par médicament)
            List<Stock> existingStocks = stockRepository.findByPharmacyId(id);
            for (Stock s : existingStocks) {
                if (s.getMedication().getId().equals(medicationId)
                        && (s.getLotNumber() == null || s.getLotNumber().isBlank())) {
                    return ResponseEntity.badRequest().body("Stock already exists for this medication");
                }
            }
        }

        Stock newStock = new Stock();
        newStock.setPharmacy(pharmacy);
        newStock.setMedication(medication);
        newStock.setQuantity(requestDTO.getQuantity());
        newStock.setExpirationDate(requestDTO.getExpirationDate());
        newStock.setLotNumber(lot);
        newStock.setSerialNumber(requestDTO.getSerialNumber());

        Stock savedNew = stockRepository.save(newStock);
        stockAlertScheduler.checkStock(savedNew); // alerte en temps réel
        return ResponseEntity.ok(savedNew);
    }

    @PutMapping("/stocks/{stockId}")
    public ResponseEntity<?> updateStock(@PathVariable Long stockId, @Valid @RequestBody UpdateStockDTO requestDTO) {
        Stock stock = stockRepository.findById(stockId).orElse(null);
        if (stock == null) return ResponseEntity.notFound().build();
        if (!pharmacyAccessService.canManage(stock.getPharmacy().getId())) {
            return ResponseEntity.status(403).body("Vous ne gérez pas cette pharmacie");
        }
        
        stock.setQuantity(requestDTO.getQuantity());
        stockRepository.save(stock);
        stockAlertScheduler.checkStock(stock); // alerte en temps réel
        return ResponseEntity.ok(stock);
    }
}
