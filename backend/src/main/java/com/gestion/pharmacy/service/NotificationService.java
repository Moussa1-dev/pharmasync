package com.gestion.pharmacy.service;

import com.gestion.pharmacy.entity.AppNotification;
import com.gestion.pharmacy.repository.AppNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final AppNotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    public AppNotification notify(String recipientKey, String title, String message, String type, String link) {
        AppNotification n = new AppNotification();
        n.setRecipientKey(recipientKey);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type != null ? type : "SYSTEM");
        n.setLink(link);
        AppNotification saved = notificationRepository.save(n);

        logger.info("\n================= NOTIFICATION =================\n" +
                "📩 Destinataire : {}\n" +
                "Sujet : {}\n" +
                "Message : {}\n" +
                "📱 Canal : Email + SMS (simulé) + Inbox app\n" +
                "================================================", recipientKey, title, message);

        messagingTemplate.convertAndSend("/topic/notifications/" + sanitizeTopic(recipientKey), saved);
        return saved;
    }

    public List<AppNotification> listFor(String recipientKey) {
        return notificationRepository.findByRecipientKeyOrderByCreatedAtDesc(recipientKey);
    }

    public long unreadCount(String recipientKey) {
        return notificationRepository.countByRecipientKeyAndReadFlagFalse(recipientKey);
    }

    public AppNotification markRead(Long id, String recipientKey) {
        return notificationRepository.findById(id).map(n -> {
            if (!n.getRecipientKey().equals(recipientKey)) {
                return null;
            }
            n.setReadFlag(true);
            return notificationRepository.save(n);
        }).orElse(null);
    }

    public void markAllRead(String recipientKey) {
        List<AppNotification> list = notificationRepository.findByRecipientKeyOrderByCreatedAtDesc(recipientKey);
        for (AppNotification n : list) {
            if (!n.isReadFlag()) {
                n.setReadFlag(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    private String sanitizeTopic(String key) {
        return key.replace("@", "_at_").replace(":", "_").replace(".", "_");
    }
}
