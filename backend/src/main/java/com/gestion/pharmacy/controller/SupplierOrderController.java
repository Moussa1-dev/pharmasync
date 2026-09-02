package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.entity.SupplierOrder;
import com.gestion.pharmacy.repository.SupplierOrderRepository;
import com.gestion.pharmacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/supplier-orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class SupplierOrderController {

    private final SupplierOrderRepository orderRepository;
    private final NotificationService notificationService;

    @GetMapping("/pharmacy/{pharmacyId}")
    public ResponseEntity<List<SupplierOrder>> list(@PathVariable Long pharmacyId) {
        return ResponseEntity.ok(orderRepository.findByPharmacyIdOrderByCreatedAtDesc(pharmacyId));
    }

    @PostMapping
    public ResponseEntity<SupplierOrder> create(@RequestBody SupplierOrder order) {
        if (order.getPharmacyId() == null) {
            order.setPharmacyId(1L);
        }
        if (order.getExpectedDate() == null) {
            order.setExpectedDate(LocalDate.now().plusDays(5));
        }
        if (order.getUnitPrice() == null) {
            order.setUnitPrice(0.0);
        }
        if (order.getQuantity() == null || order.getQuantity() <= 0) {
            order.setQuantity(50);
        }
        order.setTotal(order.getUnitPrice() * order.getQuantity());
        SupplierOrder saved = orderRepository.save(order);

        notificationService.notify(
                "pharmacy:" + saved.getPharmacyId(),
                "Commande fournisseur créée",
                saved.getQuantity() + "x " + saved.getMedicationName() + " chez " + saved.getSupplierName(),
                "ORDER",
                "/orders"
        );

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/from-alert")
    public ResponseEntity<SupplierOrder> createFromAlert(@RequestBody Map<String, Object> payload) {
        SupplierOrder order = new SupplierOrder();
        order.setPharmacyId(payload.get("pharmacyId") != null
                ? Long.valueOf(payload.get("pharmacyId").toString()) : 1L);
        order.setMedicationName(String.valueOf(payload.getOrDefault("medicationName", "Médicament")));
        order.setSupplierName(String.valueOf(payload.getOrDefault("supplierName", "Fournisseur principal")));
        int currentQty = payload.get("currentQuantity") != null
                ? Integer.parseInt(payload.get("currentQuantity").toString()) : 0;
        int suggested = Math.max(50, 100 - currentQty);
        order.setQuantity(payload.get("quantity") != null
                ? Integer.parseInt(payload.get("quantity").toString()) : suggested);
        order.setUnitPrice(payload.get("unitPrice") != null
                ? Double.parseDouble(payload.get("unitPrice").toString()) : 250.0);
        order.setExpectedDate(LocalDate.now().plusDays(5));
        order.setStatus("PENDING");
        order.setTotal(order.getUnitPrice() * order.getQuantity());

        SupplierOrder saved = orderRepository.save(order);
        notificationService.notify(
                "pharmacy:" + saved.getPharmacyId(),
                "Réapprovisionnement demandé",
                "Commande auto : " + saved.getQuantity() + "x " + saved.getMedicationName(),
                "ORDER",
                "/orders"
        );
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(payload.get("status"));
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }
}
