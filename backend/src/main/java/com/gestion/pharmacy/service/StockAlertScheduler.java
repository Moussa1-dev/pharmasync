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
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Alertes de stock bas / rupture et de péremption proche.
 *
 * - En TEMPS RÉEL : checkStock(stock) est appelé juste après chaque
 *   modification de stock (mise à jour, ajout, import CSV, vente, réservation).
 *   L'alerte part immédiatement par WebSocket vers la pharmacie.
 * - En filet de sécurité : une vérification complète au démarrage
 *   puis toutes les 30 minutes.
 */
@Service
@RequiredArgsConstructor
public class StockAlertScheduler {

    private final StockRepository stockRepository;
    private final RestockAlertService restockAlertService;
    private final NotificationService notificationService;
    private static final Logger logger = LoggerFactory.getLogger(StockAlertScheduler.class);

    /** Alertes déjà envoyées (partagé entre les requêtes : ensemble thread-safe) */
    private final Set<String> alreadyNotified = ConcurrentHashMap.newKeySet();

    /** Au démarrage pour la démo / soutenance */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        checkStockAlerts();
    }

    /** Vérification complète toutes les 30 minutes (filet de sécurité) */
    @Scheduled(fixedRate = 1800000)
    public void checkStockAlerts() {
        logger.info("Vérification des alertes stock / péremption");
        List<Stock> all = stockRepository.findAll();
        for (Stock stock : all) {
            checkStock(stock);
        }
    }

    /** Vérifie UN stock et envoie tout de suite les alertes nécessaires. */
    public void checkStock(Stock stock) {
        if (stock == null || stock.getPharmacy() == null || stock.getMedication() == null) {
            return;
        }
        Long pharmacyId = stock.getPharmacy().getId();
        String medName = stock.getMedication().getName();

        // 1. Stock bas ou rupture (même seuil que RestockAlertService)
        if (!restockAlertService.buildAlerts(List.of(stock)).isEmpty()) {
            String key = "low:" + pharmacyId + ":" + stock.getId() + ":" + stock.getQuantity();
            if (alreadyNotified.add(key)) {
                boolean rupture = stock.getQuantity() <= 0;
                notificationService.notify(
                        "pharmacy:" + pharmacyId,
                        (rupture ? "Rupture de stock : " : "Stock bas : ") + medName,
                        rupture
                                ? "Plus aucune unité disponible. Commandez un réapprovisionnement."
                                : stock.getQuantity() + " unité(s) restante(s). Commandez un réapprovisionnement.",
                        "STOCK",
                        "/orders?medication=" + medName + "&qty=" + Math.max(50, 100 - stock.getQuantity())
                );
            }
        }

        // 2. Péremption dans les 3 prochains mois
        LocalDate limit = LocalDate.now().plusMonths(3);
        if (stock.getExpirationDate() != null && !stock.getExpirationDate().isAfter(limit)) {
            String key = "exp:" + pharmacyId + ":" + stock.getId() + ":" + stock.getExpirationDate();
            if (alreadyNotified.add(key)) {
                notificationService.notify(
                        "pharmacy:" + pharmacyId,
                        "Péremption proche : " + medName,
                        "Expire le " + stock.getExpirationDate() + ". Vérifiez le lot.",
                        "STOCK",
                        "/dashboard?tab=expiring"
                );
            }
        }
    }
}
