package com.gestion.pharmacy.repository;

import com.gestion.pharmacy.entity.ReservationChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationChatMessageRepository extends JpaRepository<ReservationChatMessage, Long> {
    List<ReservationChatMessage> findByReservationIdOrderByCreatedAtAsc(Long reservationId);
}
