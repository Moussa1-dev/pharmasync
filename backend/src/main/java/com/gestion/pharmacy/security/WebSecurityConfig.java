package com.gestion.pharmacy.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configure(http))
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .authorizeHttpRequests(auth -> auth
                // Authentification publique
                .requestMatchers("/api/auth/**").permitAll()
                // Recherche patient (sans connexion)
                .requestMatchers(HttpMethod.GET, "/api/search/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pharmacy/on-call").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pharmacy").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pharmacy/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/medications/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reservations").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/patient/reservations").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reservations/*/chat").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reservations/*/chat").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payments/init").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payments/confirm").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payments/reservation/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/duty-schedules/**").permitAll()
                // Documentation & WebSocket
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                // Administration plateforme
                .requestMatchers(HttpMethod.POST, "/api/pharmacy").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/pharmacy/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/pharmacy/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/medications/**").hasRole("ADMIN")
                // Patient connecté : notifications + espace perso
                .requestMatchers("/api/notifications/**").hasAnyRole("PATIENT", "PHARMACIEN", "ADMIN")
                .requestMatchers("/api/patient/**").hasAnyRole("PATIENT", "PHARMACIEN", "ADMIN")
                // Espace pharmacien / admin
                .requestMatchers("/api/**").hasAnyRole("PHARMACIEN", "ADMIN")
                .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
