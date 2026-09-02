package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.Stock;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RestockAlertService {

    public List<Stock> buildAlerts(List<Stock> stocks) {
        return stocks.stream()
                .filter(stock -> stock.getQuantity() != null && stock.getQuantity() <= 10)
                .sorted(Comparator.comparingInt(Stock::getQuantity))
                .toList();
    }
}
