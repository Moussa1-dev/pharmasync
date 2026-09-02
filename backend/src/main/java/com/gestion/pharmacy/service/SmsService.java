package com.gestion.pharmacy.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    private static final Logger logger = LoggerFactory.getLogger(SmsService.class);

    /**
     * Envoi SMS simulé (demo PFE). En production : Orange SMS / Twilio / etc.
     */
    public void send(String phoneNumber, String message) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            logger.warn("SMS non envoyé : numéro vide");
            return;
        }
        logger.info("\n================= SMS (simulé) =================\n" +
                "📱 Destinataire : {}\n" +
                "Message : {}\n" +
                "================================================", phoneNumber, message);
    }
}
