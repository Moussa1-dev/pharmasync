package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StockAlertScheduler {

    private final StockRepository stockRepository;
    private final RestockAlertService restockAlertService;
    private final NotificationService notificationService;
    private static final Logger logger = LoggerFactory.getLogger(StockAlertScheduler.class);
    private final Set<String> alreadyNotified = new HashSet<>();

    /** Au démarrage pour la démo / soutenance */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        checkStockAlerts();
    }

    /** Vérifie les stocks bas et péremptions toutes les 30 minutes */
    @Scheduled(fixedRate = 1800000)
    public void checkStockAlerts() {
        logger.info("Vérification des alertes stock / péremption");
        List<Stock> all = stockRepository.findAll();
        List<Stock> low = restockAlertService.buildAlerts(all);
        LocalDate limit = LocalDate.now().plusMonths(3);

        for (Stock stock : low) {
            Long pharmacyId = stock.getPharmacy().getId();
            String key = "low:" + pharmacyId + ":" + stock.getId() + ":" + stock.getQuantity();
            if (alreadyNotified.contains(key)) continue;
            alreadyNotified.add(key);

            notificationService.notify(
                    "pharmacy:" + pharmacyId,
                    "Stock bas : " + stock.getMedication().getName(),
                    stock.getQuantity() + " unité(s) restante(s). Commandez un réapprovisionnement.",
                    "STOCK",
                    "/orders?medication=" + stock.getMedication().getName() + "&qty=" + Math.max(50, 100 - stock.getQuantity())
            );
        }

        for (Stock stock : all) {
            if (stock.getExpirationDate() == null) continue;
            if (stock.getExpirationDate().isAfter(limit)) continue;
            Long pharmacyId = stock.getPharmacy().getId();
            String key = "exp:" + pharmacyId + ":" + stock.getId() + ":" + stock.getExpirationDate();
            if (alreadyNotified.contains(key)) continue;
            alreadyNotified.add(key);

            notificationService.notify(
                    "pharmacy:" + pharmacyId,
                    "Péremption proche : " + stock.getMedication().getName(),
                    "Expire le " + stock.getExpirationDate() + ". Vérifiez le lot.",
                    "STOCK",
                    "/dashboard?tab=expiring"
            );
        }
    }
}
