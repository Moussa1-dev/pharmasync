package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.entity.Stock;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardSummaryService {

    public Map<String, Object> buildSummary(List<Stock> stocks, List<Reservation> reservations) {
        int totalStock = stocks.stream().mapToInt(stock -> stock.getQuantity() == null ? 0 : stock.getQuantity()).sum();
        int ruptures = (int) stocks.stream().filter(stock -> stock.getQuantity() != null && stock.getQuantity() <= 0).count();
        int alertes = (int) stocks.stream().filter(stock -> stock.getQuantity() != null && stock.getQuantity() > 0 && stock.getQuantity() <= 10).count();
        long pendingReservations = reservations.stream().filter(res -> "PENDING".equalsIgnoreCase(res.getStatus())).count();

        double totalRevenue = reservations.stream()
                .filter(res -> "COMPLETED".equalsIgnoreCase(res.getStatus()) || "CONFIRMED".equalsIgnoreCase(res.getStatus()))
                .mapToDouble(res -> {
                    if (res.getStock() == null || res.getStock().getMedication() == null || res.getStock().getMedication().getIndicativePrice() == null) {
                        return 0;
                    }
                    return res.getQuantity() * res.getStock().getMedication().getIndicativePrice();
                })
                .sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStock", totalStock);
        summary.put("ruptures", ruptures);
        summary.put("alertes", alertes);
        summary.put("pendingReservations", pendingReservations);
        summary.put("totalRevenue", totalRevenue);
        return summary;
    }
}
