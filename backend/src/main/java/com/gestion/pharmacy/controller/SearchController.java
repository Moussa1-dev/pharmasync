package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.dto.SearchResultDTO;
import com.gestion.pharmacy.service.PharmacyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class SearchController {

    private final PharmacyService pharmacyService;

    @GetMapping
    public ResponseEntity<List<SearchResultDTO>> search(
            @RequestParam String query,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double maxDistance,
            @RequestParam(required = false, defaultValue = "false") boolean onCallOnly,
            @RequestParam(required = false, defaultValue = "false") boolean inStockOnly,
            @RequestParam(required = false) Double maxPrice) {
        List<SearchResultDTO> results = pharmacyService.searchMedication(
                query, lat, lng, maxDistance, onCallOnly, inStockOnly, maxPrice);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/suggest")
    public ResponseEntity<List<String>> suggest(@RequestParam String q) {
        return ResponseEntity.ok(pharmacyService.suggestMedications(q));
    }

    @GetMapping("/synonyms")
    public ResponseEntity<?> synonymsHint(@RequestParam String q) {
        List<String> suggestions = pharmacyService.suggestMedications(q);
        return ResponseEntity.ok(Map.of("query", q, "suggestions", suggestions));
    }

    @GetMapping("/nearest")
    public ResponseEntity<List<com.gestion.pharmacy.entity.Pharmacy>> getNearestPharmacies(
            @RequestParam Double lat,
            @RequestParam Double lng) {
        return ResponseEntity.ok(pharmacyService.findNearestPharmacies(lat, lng));
    }
}
