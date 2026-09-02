package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.entity.StockMovement;
import com.gestion.pharmacy.repository.MedicationRepository;
import com.gestion.pharmacy.repository.PharmacyRepository;
import com.gestion.pharmacy.repository.StockRepository;
import com.gestion.pharmacy.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import com.gestion.pharmacy.repository.AlertSubscriptionRepository;
import com.gestion.pharmacy.service.NotificationService;
import com.gestion.pharmacy.entity.AlertSubscription;


import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class StockManagementController {

    private final StockRepository stockRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicationRepository medicationRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AlertSubscriptionRepository alertSubscriptionRepository;
    private final NotificationService notificationService;


    @GetMapping
    public ResponseEntity<List<Stock>> getAllStocks() {
        return ResponseEntity.ok(stockRepository.findAll());
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    public ResponseEntity<List<Stock>> getStocksByPharmacy(@PathVariable Long pharmacyId) {
        return ResponseEntity.ok(stockRepository.findByPharmacyId(pharmacyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Stock> getStock(@PathVariable Long id) {
        return stockRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createStock(@RequestBody Map<String, String> payload) {
        Long pharmacyId = Long.parseLong(payload.get("pharmacyId"));
        Long medicationId = Long.parseLong(payload.get("medicationId"));
        Integer quantity = Integer.parseInt(payload.get("quantity"));
        LocalDate expirationDate = LocalDate.parse(payload.get("expirationDate"));

        var pharmacy = pharmacyRepository.findById(pharmacyId).orElse(null);
        var medication = medicationRepository.findById(medicationId).orElse(null);
        if (pharmacy == null || medication == null) {
            return ResponseEntity.badRequest().body("Pharmacy or medication not found");
        }

        if (stockRepository.findByPharmacyIdAndMedicationId(pharmacyId, medicationId).isPresent()) {
            return ResponseEntity.badRequest().body("Stock already exists for this medication in this pharmacy");
        }

        Stock stock = new Stock();
        stock.setPharmacy(pharmacy);
        stock.setMedication(medication);
        stock.setQuantity(quantity);
        stock.setExpirationDate(expirationDate);
        Stock savedStock = stockRepository.save(stock);
        
        // Log movement
        StockMovement movement = new StockMovement(null, savedStock, "ENTREE", quantity, "AJOUT INITIAL", null, "Pharmacien");
        stockMovementRepository.save(movement);

        return ResponseEntity.ok(savedStock);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Stock> updateStock(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return stockRepository.findById(id)
                .map(stock -> {
                    Integer oldQuantity = stock.getQuantity();
                    if (payload.containsKey("quantity")) {
                        Integer newQuantity = (Integer) payload.get("quantity");
                        stock.setQuantity(newQuantity);
                        
                        // Log movement
                        if (!oldQuantity.equals(newQuantity)) {
                            int diff = newQuantity - oldQuantity;
                            String type = diff > 0 ? "ENTREE" : "SORTIE";
                            StockMovement movement = new StockMovement(null, stock, type, Math.abs(diff), "INVENTAIRE MANUEL", null, "Pharmacien");
                            stockMovementRepository.save(movement);

                            if (oldQuantity == 0 && newQuantity > 0) {
                                triggerRestockAlerts(stock);
                            }
                        }
                    }

                    if (payload.containsKey("expirationDate")) {
                        stock.setExpirationDate(LocalDate.parse((String) payload.get("expirationDate")));
                    }
                    return ResponseEntity.ok(stockRepository.save(stock));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        if (!stockRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        stockRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    // NOUVELLE FONCTIONNALITÉ: Mouvements
    @GetMapping("/movements/{pharmacyId}")
    public ResponseEntity<List<StockMovement>> getStockMovements(@PathVariable Long pharmacyId) {
        return ResponseEntity.ok(stockMovementRepository.findByStockPharmacyIdOrderByMovementDateDesc(pharmacyId));
    }
    
    // NOUVELLE FONCTIONNALITÉ: Import CSV
    @PostMapping("/import/{pharmacyId}")
    @Transactional
    public ResponseEntity<?> importStockCSV(@PathVariable Long pharmacyId, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Le fichier est vide");
        }
        
        var pharmacyOpt = pharmacyRepository.findById(pharmacyId);
        if (pharmacyOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Pharmacie non trouvée");
        }
        
        int count = 0;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isFirstLine = true;
            while ((line = br.readLine()) != null) {
                if (isFirstLine) { // Ignorer l'entête
                    isFirstLine = false;
                    continue;
                }
                
                String[] values = line.split("[,;]");
                if (values.length >= 3) {
                    Long medicationId = Long.parseLong(values[0].trim());
                    int quantity = Integer.parseInt(values[1].trim());
                    LocalDate expDate = LocalDate.parse(values[2].trim());
                    
                    var stockOpt = stockRepository.findByPharmacyIdAndMedicationId(pharmacyId, medicationId);
                    Stock stock;
                    if (stockOpt.isPresent()) {
                        stock = stockOpt.get();
                        int oldQuantity = stock.getQuantity();
                        stock.setQuantity(stock.getQuantity() + quantity);
                        stock.setExpirationDate(expDate); // Update expiration if new batch arrives
                        Stock saved = stockRepository.save(stock);
                        
                        StockMovement mov = new StockMovement(null, saved, "ENTREE", quantity, "IMPORT CSV", null, "Pharmacien");
                        stockMovementRepository.save(mov);

                        if (oldQuantity == 0 && saved.getQuantity() > 0) {
                            triggerRestockAlerts(saved);
                        }
                    } else {

                        var medOpt = medicationRepository.findById(medicationId);
                        if(medOpt.isPresent()) {
                            stock = new Stock();
                            stock.setPharmacy(pharmacyOpt.get());
                            stock.setMedication(medOpt.get());
                            stock.setQuantity(quantity);
                            stock.setExpirationDate(expDate);
                            Stock saved = stockRepository.save(stock);
                            
                            StockMovement mov = new StockMovement(null, saved, "ENTREE", quantity, "IMPORT CSV", null, "Pharmacien");
                            stockMovementRepository.save(mov);
                        }
                    }
                    count++;
                }
            }
            return ResponseEntity.ok("Importation réussie : " + count + " lignes traitées.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors de l'import : " + e.getMessage());
        }
    }

    private void triggerRestockAlerts(Stock stock) {
        // Fetch subscriptions for this specific pharmacy
        List<AlertSubscription> subs = alertSubscriptionRepository.findByMedicationIdAndPharmacyIdAndActiveTrue(stock.getMedication().getId(), stock.getPharmacy().getId());
        // Also fetch global subscriptions for this medication
        subs.addAll(alertSubscriptionRepository.findByMedicationIdAndPharmacyIdIsNullAndActiveTrue(stock.getMedication().getId()));

        for (AlertSubscription sub : subs) {
            notificationService.notify(
                sub.getPatient().getEmail(),
                "Médicament disponible !",
                "Le médicament " + stock.getMedication().getName() + " est de nouveau en stock à la pharmacie " + stock.getPharmacy().getName() + ".",
                "RESTOCK",
                "/search"
            );
            sub.setActive(false);
            alertSubscriptionRepository.save(sub);
        }
    }
}
