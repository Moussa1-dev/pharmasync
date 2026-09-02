package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.ProductRecall;
import com.gestion.pharmacy.entity.Sale;
import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.repository.ProductRecallRepository;
import com.gestion.pharmacy.repository.SaleRepository;
import com.gestion.pharmacy.repository.StockRepository;
import com.gestion.pharmacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/traceability")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class TraceabilityController {

    private final StockRepository stockRepository;
    private final SaleRepository saleRepository;
    private final ProductRecallRepository productRecallRepository;
    private final NotificationService notificationService;

    @GetMapping("/lot/{lotNumber}")
    public ResponseEntity<?> traceByLot(@PathVariable String lotNumber) {
        List<Stock> stocks = stockRepository.findByLotNumberIgnoreCase(lotNumber);
        List<Sale> sales = saleRepository.findByLotNumberIgnoreCase(lotNumber);
        List<ProductRecall> recalls = productRecallRepository.findByLotNumberIgnoreCase(lotNumber);

        Map<String, Object> result = new HashMap<>();
        result.put("lotNumber", lotNumber);
        result.put("stocks", stocks);
        result.put("sales", sales);
        result.put("recalls", recalls);
        result.put("stockUnits", stocks.stream().mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0).sum());
        result.put("soldUnits", sales.stream().mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0).sum());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/recalls")
    public ResponseEntity<List<ProductRecall>> listRecalls(
            @RequestParam(required = false) Long pharmacyId
    ) {
        if (pharmacyId != null) {
            return ResponseEntity.ok(productRecallRepository.findByPharmacyIdOrderByCreatedAtDesc(pharmacyId));
        }
        return ResponseEntity.ok(productRecallRepository.findByStatusOrderByCreatedAtDesc("OPEN"));
    }

    @PostMapping("/recalls")
    public ResponseEntity<?> createRecall(@RequestBody Map<String, Object> body) {
        String lotNumber = body.get("lotNumber") != null ? body.get("lotNumber").toString().trim() : null;
        if (lotNumber == null || lotNumber.isBlank()) {
            return ResponseEntity.badRequest().body("lotNumber requis");
        }

        ProductRecall recall = new ProductRecall();
        recall.setLotNumber(lotNumber);
        recall.setReason(body.get("reason") != null ? body.get("reason").toString() : "Rappel produit");
        recall.setCreatedBy(body.get("createdBy") != null ? body.get("createdBy").toString() : "pharmacien");
        if (body.get("pharmacyId") != null) {
            recall.setPharmacyId(Long.valueOf(body.get("pharmacyId").toString()));
        }
        recall.setStatus("OPEN");
        ProductRecall saved = productRecallRepository.save(recall);

        List<Stock> affected = stockRepository.findByLotNumberIgnoreCase(lotNumber);
        for (Stock stock : affected) {
            if (stock.getPharmacy() != null) {
                notificationService.notify(
                        "pharmacy:" + stock.getPharmacy().getId(),
                        "Rappel produit — lot " + lotNumber,
                        "Médicament : " + (stock.getMedication() != null ? stock.getMedication().getName() : "?")
                                + " — " + recall.getReason(),
                        "RECALL",
                        "/dashboard?tab=stocks"
                );
            }
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/recalls/{id}/close")
    public ResponseEntity<?> closeRecall(@PathVariable Long id) {
        return productRecallRepository.findById(id)
                .map(r -> {
                    r.setStatus("CLOSED");
                    return ResponseEntity.ok(productRecallRepository.save(r));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
