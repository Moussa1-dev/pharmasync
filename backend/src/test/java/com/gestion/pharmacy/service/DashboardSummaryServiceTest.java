package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.Medication;
import com.gestion.pharmacy.entity.Reservation;
import com.gestion.pharmacy.entity.Stock;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DashboardSummaryServiceTest {

    private final DashboardSummaryService service = new DashboardSummaryService();

    @Test
    void shouldBuildDashboardSummaryForPharmacy() {
        Medication med1 = new Medication();
        med1.setId(1L);
        med1.setName("Doliprane");
        med1.setIndicativePrice(1640.0);

        Medication med2 = new Medication();
        med2.setId(2L);
        med2.setName("Spasfon");
        med2.setIndicativePrice(2952.0);

        Stock stock1 = new Stock();
        stock1.setQuantity(12);
        stock1.setMedication(med1);
        stock1.setExpirationDate(LocalDate.now().plusMonths(2));

        Stock stock2 = new Stock();
        stock2.setQuantity(0);
        stock2.setMedication(med2);
        stock2.setExpirationDate(LocalDate.now().plusMonths(6));

        Reservation reservation1 = new Reservation();
        reservation1.setStatus("COMPLETED");
        reservation1.setQuantity(2);
        reservation1.setStock(stock1);

        Reservation reservation2 = new Reservation();
        reservation2.setStatus("PENDING");
        reservation2.setQuantity(1);
        reservation2.setStock(stock2);

        Map<String, Object> summary = service.buildSummary(List.of(stock1, stock2), List.of(reservation1, reservation2));

        assertEquals(12, summary.get("totalStock"));
        assertEquals(1, summary.get("ruptures"));
        assertEquals(0, summary.get("alertes"));
        assertEquals(1L, summary.get("pendingReservations"));
        assertEquals(3280.0, summary.get("totalRevenue"));
    }
}
