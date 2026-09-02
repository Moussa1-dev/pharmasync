package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findByRecipientKeyOrderByCreatedAtDesc(String recipientKey);

    long countByRecipientKeyAndReadFlagFalse(String recipientKey);
}
