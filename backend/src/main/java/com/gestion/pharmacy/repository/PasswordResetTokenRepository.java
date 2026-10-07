package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.PasswordResetToken;
import com.gestion.pharmacy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    // Une suppression "deleteBy..." doit s'exécuter dans une transaction,
    // sinon Spring lève une erreur (mot de passe oublié en panne).
    @org.springframework.transaction.annotation.Transactional
    void deleteByUser(User user);
}
