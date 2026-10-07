package com.gestion.pharmacy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Autorise le site du frontend à appeler l'API.
 * En local : http://localhost:4200 (valeur par défaut).
 * En ligne : variable d'environnement FRONTEND_URL
 * (plusieurs adresses possibles, séparées par des virgules).
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${pharmasync.frontend-url:http://localhost:4200}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
