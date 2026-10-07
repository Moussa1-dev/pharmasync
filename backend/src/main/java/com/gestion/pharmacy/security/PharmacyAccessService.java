package com.gestion.pharmacy.security;

import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.entity.Role;
import com.gestion.pharmacy.entity.User;
import com.gestion.pharmacy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Vérifie qu'un utilisateur connecté a le droit de gérer une pharmacie donnée.
 * Règle identique à GET /api/me/pharmacies :
 *  - l'administrateur gère toutes les pharmacies ;
 *  - un pharmacien gère les pharmacies qui lui sont assignées ;
 *  - un pharmacien sans aucune assignation garde l'accès à toutes (mode démo).
 */
@Service
@RequiredArgsConstructor
public class PharmacyAccessService {

    private final UserRepository userRepository;

    public boolean canManage(Long pharmacyId) {
        if (pharmacyId == null) {
            return false;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl principal)) {
            return false;
        }
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null || user.getRole() == null) {
            return false;
        }
        if (user.getRole() == Role.ROLE_ADMIN) {
            return true;
        }
        if (user.getRole() != Role.ROLE_PHARMACIEN) {
            return false;
        }
        if (user.getPharmacies() == null || user.getPharmacies().isEmpty()) {
            return true;
        }
        for (Pharmacy p : user.getPharmacies()) {
            if (pharmacyId.equals(p.getId())) {
                return true;
            }
        }
        return false;
    }
}
