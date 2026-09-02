package com.gestion.pharmacy.service;

import com.gestion.pharmacy.dto.SearchResultDTO;
import com.gestion.pharmacy.entity.Medication;
import com.gestion.pharmacy.entity.Stock;
import com.gestion.pharmacy.repository.MedicationRepository;
import com.gestion.pharmacy.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmacyService {

    private final MedicationRepository medicationRepository;
    private final StockRepository stockRepository;

    private static final double EARTH_RADIUS = 6371;

    /** Synonymes courants (DCI / marques) pour la recherche intelligente */
    private static final Map<String, List<String>> SYNONYMS = Map.of(
            "doliprane", List.of("paracétamol", "paracetamol", "acetaminophen"),
            "paracetamol", List.of("doliprane", "paracétamol"),
            "paracétamol", List.of("doliprane", "paracetamol"),
            "aspirine", List.of("acide acetylsalicylique", "aspirin"),
            "amoxicilline", List.of("amoxil", "clamoxyl"),
            "coartem", List.of("artéméther", "lumefantrine", "artemether"),
            "ibuprofène", List.of("advil", "nurofen", "ibuprofen"),
            "ibuprofen", List.of("ibuprofène", "advil", "nurofen")
    );

    public List<SearchResultDTO> searchMedication(String query, Double userLat, Double userLng) {
        return searchMedication(query, userLat, userLng, null, false, false, null);
    }

    public List<SearchResultDTO> searchMedication(
            String query,
            Double userLat,
            Double userLng,
            Double maxDistanceKm,
            boolean onCallOnly,
            boolean inStockOnly,
            Double maxPrice) {

        Set<String> terms = expandQuery(query);
        Map<Long, Medication> medMap = new LinkedHashMap<>();
        for (String term : terms) {
            for (Medication med : medicationRepository.findByNameContainingIgnoreCase(term)) {
                medMap.put(med.getId(), med);
            }
        }

        List<Medication> medications = new ArrayList<>(medMap.values());
        List<SearchResultDTO> results = new ArrayList<>();
        boolean foundInStock = false;

        for (Medication med : medications) {
            List<Stock> stocks = stockRepository.findByMedicationId(med.getId());
            for (Stock stock : stocks) {
                Double distance = computeDistance(userLat, userLng, stock);
                SearchResultDTO dto = new SearchResultDTO(stock, stock.getPharmacy(), distance);
                if (passesFilters(dto, maxDistanceKm, onCallOnly, inStockOnly, maxPrice)) {
                    results.add(dto);
                    if (stock.getQuantity() != null && stock.getQuantity() > 0) {
                        foundInStock = true;
                    }
                }
            }
        }

        if (!foundInStock && !medications.isEmpty()) {
            Medication firstMed = medications.get(0);
            if (firstMed.getCategory() != null && !firstMed.getCategory().isEmpty()) {
                List<Medication> alternatives = medicationRepository.findByCategory(firstMed.getCategory());
                for (Medication altMed : alternatives) {
                    if (altMed.getId().equals(firstMed.getId())) continue;
                    for (Stock stock : stockRepository.findByMedicationId(altMed.getId())) {
                        if (stock.getQuantity() == null || stock.getQuantity() <= 0) continue;
                        Double distance = computeDistance(userLat, userLng, stock);
                        SearchResultDTO altDto = new SearchResultDTO(stock, stock.getPharmacy(), distance);
                        altDto.setAlternative(true);
                        if (passesFilters(altDto, maxDistanceKm, onCallOnly, false, maxPrice)) {
                            results.add(altDto);
                        }
                    }
                }
            }
        }

        if (userLat != null && userLng != null) {
            results.sort(Comparator.comparing(SearchResultDTO::getDistanceKm, Comparator.nullsLast(Double::compareTo)));
        } else {
            results.sort(Comparator.comparing((SearchResultDTO res) ->
                    res.getStock().getQuantity() != null ? res.getStock().getQuantity() : 0).reversed());
        }

        return results;
    }

    public List<String> suggestMedications(String prefix) {
        if (prefix == null || prefix.trim().length() < 2) {
            return List.of();
        }
        String q = prefix.trim().toLowerCase();
        Set<String> suggestions = new LinkedHashSet<>();

        for (Medication med : medicationRepository.findByNameContainingIgnoreCase(prefix.trim())) {
            suggestions.add(med.getName());
            if (suggestions.size() >= 8) break;
        }

        for (Map.Entry<String, List<String>> entry : SYNONYMS.entrySet()) {
            if (entry.getKey().startsWith(q) || entry.getKey().contains(q)) {
                suggestions.add(capitalize(entry.getKey()));
                for (String syn : entry.getValue()) {
                    suggestions.add(capitalize(syn));
                }
            }
            for (String syn : entry.getValue()) {
                if (syn.toLowerCase().startsWith(q) || syn.toLowerCase().contains(q)) {
                    suggestions.add(capitalize(entry.getKey()));
                    suggestions.add(capitalize(syn));
                }
            }
        }

        return suggestions.stream().limit(8).collect(Collectors.toList());
    }

    private Set<String> expandQuery(String query) {
        Set<String> terms = new LinkedHashSet<>();
        if (query == null || query.isBlank()) {
            return terms;
        }
        String normalized = query.trim().toLowerCase();
        terms.add(query.trim());
        terms.add(normalized);

        List<String> syns = SYNONYMS.get(normalized);
        if (syns != null) {
            terms.addAll(syns);
        }
        for (Map.Entry<String, List<String>> entry : SYNONYMS.entrySet()) {
            if (entry.getValue().stream().anyMatch(s -> s.equalsIgnoreCase(normalized))) {
                terms.add(entry.getKey());
                terms.addAll(entry.getValue());
            }
        }
        return terms;
    }

    private boolean passesFilters(
            SearchResultDTO dto,
            Double maxDistanceKm,
            boolean onCallOnly,
            boolean inStockOnly,
            Double maxPrice) {
        if (inStockOnly && (dto.getStock().getQuantity() == null || dto.getStock().getQuantity() <= 0)) {
            return false;
        }
        if (onCallOnly && (dto.getPharmacy().getIsOnCall() == null || !dto.getPharmacy().getIsOnCall())) {
            return false;
        }
        if (maxDistanceKm != null && dto.getDistanceKm() != null && dto.getDistanceKm() > maxDistanceKm) {
            return false;
        }
        if (maxPrice != null && dto.getStock().getMedication() != null
                && dto.getStock().getMedication().getIndicativePrice() != null
                && dto.getStock().getMedication().getIndicativePrice() > maxPrice) {
            return false;
        }
        return true;
    }

    private Double computeDistance(Double userLat, Double userLng, Stock stock) {
        if (userLat != null && userLng != null
                && stock.getPharmacy().getLatitude() != null
                && stock.getPharmacy().getLongitude() != null) {
            return calculateHaversineDistance(userLat, userLng,
                    stock.getPharmacy().getLatitude(), stock.getPharmacy().getLongitude());
        }
        return null;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS * c;
    }

    public List<com.gestion.pharmacy.entity.Pharmacy> findNearestPharmacies(Double lat, Double lng) {
        List<com.gestion.pharmacy.entity.Pharmacy> allPharmacies = stockRepository.findAll().stream()
                .map(Stock::getPharmacy)
                .distinct()
                .collect(Collectors.toList());

        if (lat == null || lng == null) {
            return allPharmacies;
        }

        allPharmacies.sort((p1, p2) -> {
            Double d1 = (p1.getLatitude() != null && p1.getLongitude() != null) ?
                    calculateHaversineDistance(lat, lng, p1.getLatitude(), p1.getLongitude()) : Double.MAX_VALUE;
            Double d2 = (p2.getLatitude() != null && p2.getLongitude() != null) ?
                    calculateHaversineDistance(lat, lng, p2.getLatitude(), p2.getLongitude()) : Double.MAX_VALUE;
            return d1.compareTo(d2);
        });

        return allPharmacies;
    }
}
