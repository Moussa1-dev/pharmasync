package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.service.StockAlertScheduler;
import com.gestion.pharmacy.security.PharmacyAccessService;
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
    private final PharmacyAccessService pharmacyAccessService;
    private final StockAlertScheduler stockAlertScheduler;


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

        if (!pharmacyAccessService.canManage(pharmacyId)) {
            return ResponseEntity.status(403).body("Vous ne gérez pas cette pharmacie");
        }
        if (quantity < 0) {
            return ResponseEntity.badRequest().body("La quantité ne peut pas être négative");
        }

        var pharmacy = pharmacyRepository.findById(pharmacyId).orElse(null);
        var medication = medicationRepository.findById(medicationId).orElse(null);
        if (pharmacy == null || medication == null) {
            return ResponseEntity.badRequest().body("Pharmacy or medication not found");
        }

        if (stockRepository.findFirstByPharmacyIdAndMedicationIdOrderByExpirationDateAsc(pharmacyId, medicationId).isPresent()) {
            return ResponseEntity.badRequest().body("Stock already exists for this medication in this pharmacy");
        }

        Stock stock = new Stock();
        stock.setPharmacy(pharmacy);
        stock.setMedication(medication);
        stock.setQuantity(quantity);
        stock.setExpirationDate(expirationDate);
        Stock savedStock = stockRepository.save(stock);
        stockAlertScheduler.checkStock(savedStock); // alerte en temps réel
        
        // Log movement
        StockMovement movement = new StockMovement(null, savedStock, "ENTREE", quantity, "AJOUT INITIAL", null, "Pharmacien");
        stockMovementRepository.save(movement);

        return ResponseEntity.ok(savedStock);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Stock stock = stockRepository.findById(id).orElse(null);
        if (stock == null) {
            return ResponseEntity.notFound().build();
        }
        if (!pharmacyAccessService.canManage(stock.getPharmacy().getId())) {
            return ResponseEntity.status(403).body("Vous ne gérez pas cette pharmacie");
        }

        Integer oldQuantity = stock.getQuantity() != null ? stock.getQuantity() : 0;
        if (payload.containsKey("quantity")) {
            Object raw = payload.get("quantity");
            Integer newQuantity;
            try {
                newQuantity = (raw instanceof Number n) ? n.intValue() : Integer.valueOf(String.valueOf(raw).trim());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Quantité invalide");
            }
            if (newQuantity < 0) {
                return ResponseEntity.badRequest().body("La quantité ne peut pas être négative");
            }
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

        if (payload.get("expirationDate") != null) {
            stock.setExpirationDate(LocalDate.parse(String.valueOf(payload.get("expirationDate"))));
        }
        Stock savedStock = stockRepository.save(stock);
        stockAlertScheduler.checkStock(savedStock); // alerte en temps réel
        return ResponseEntity.ok(savedStock);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStock(@PathVariable Long id) {
        Stock stock = stockRepository.findById(id).orElse(null);
        if (stock == null) {
            return ResponseEntity.notFound().build();
        }
        if (!pharmacyAccessService.canManage(stock.getPharmacy().getId())) {
            return ResponseEntity.status(403).body("Vous ne gérez pas cette pharmacie");
        }
        try {
            stockRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).body(
                    "Ce stock est lié à des réservations, ventes ou mouvements : mettez plutôt sa quantité à 0.");
        }
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
        if (!pharmacyAccessService.canManage(pharmacyId)) {
            return ResponseEntity.status(403).body("Vous ne gérez pas cette pharmacie");
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
                    
                    var stockOpt = stockRepository.findFirstByPharmacyIdAndMedicationIdOrderByExpirationDateAsc(pharmacyId, medicationId);
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
                        stockAlertScheduler.checkStock(saved); // alerte en temps réel
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
                            stockAlertScheduler.checkStock(saved); // alerte en temps réel
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
