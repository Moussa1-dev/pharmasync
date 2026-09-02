package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.Medication;
import com.gestion.pharmacy.entity.Stock;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RestockAlertServiceTest {

    private final RestockAlertService service = new RestockAlertService();

    @Test
    void shouldRecommendLowStockItemsSortedByUrgency() {
        Medication med1 = new Medication();
        med1.setId(1L);
        med1.setName("Doliprane");

        Medication med2 = new Medication();
        med2.setId(2L);
        med2.setName("Spasfon");

        Stock stock1 = new Stock();
        stock1.setMedication(med1);
        stock1.setQuantity(4);
        stock1.setExpirationDate(LocalDate.now().plusMonths(6));

        Stock stock2 = new Stock();
        stock2.setMedication(med2);
        stock2.setQuantity(1);
        stock2.setExpirationDate(LocalDate.now().plusMonths(6));

        List<Stock> alerts = service.buildAlerts(List.of(stock1, stock2));

        assertEquals(2, alerts.size());
        assertEquals("Spasfon", alerts.get(0).getMedication().getName());
        assertTrue(alerts.get(0).getQuantity() <= alerts.get(1).getQuantity());
    }
}
