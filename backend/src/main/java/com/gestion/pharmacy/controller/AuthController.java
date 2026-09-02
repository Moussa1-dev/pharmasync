package com.gestion.pharmacy.controller;

import com.gestion.pharmacy.dto.JwtResponse;
import com.gestion.pharmacy.dto.LoginRequest;
import com.gestion.pharmacy.dto.SignupRequest;
import com.gestion.pharmacy.entity.Pharmacy;
import com.gestion.pharmacy.entity.Role;
import com.gestion.pharmacy.entity.User;
import com.gestion.pharmacy.repository.PharmacyRepository;
import com.gestion.pharmacy.repository.UserRepository;
import com.gestion.pharmacy.security.JwtUtils;
import com.gestion.pharmacy.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;


@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PharmacyRepository pharmacyRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    com.gestion.pharmacy.repository.AuditLogRepository auditLogRepository;

    @Autowired
    com.gestion.pharmacy.repository.PasswordResetTokenRepository tokenRepository;

    @Autowired
    com.gestion.pharmacy.service.NotificationService notificationService;


    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            User user = userRepository.findById(userDetails.getId()).orElse(null);
            if (user != null && !user.isEmailVerified()) {
                return ResponseEntity.status(403).body(Map.of("message", "Veuillez vérifier votre adresse e-mail avant de vous connecter."));
            }

            List<JwtResponse.PharmacySummary> pharmacies = resolvePharmacies(user, roles);
            Long activePharmacyId = pharmacies.isEmpty() ? null : pharmacies.get(0).getId();

            auditLogRepository.save(new com.gestion.pharmacy.entity.AuditLog(loginRequest.getEmail(), "LOGIN_SUCCESS", "User logged in successfully"));

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    roles,
                    pharmacies,
                    activePharmacyId
            ));
        } catch (Exception e) {
            auditLogRepository.save(new com.gestion.pharmacy.entity.AuditLog(loginRequest.getEmail(), "LOGIN_FAILED", "Invalid credentials"));
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    private List<JwtResponse.PharmacySummary> resolvePharmacies(User user, List<String> roles) {
        List<Pharmacy> list;
        if (roles.contains("ROLE_ADMIN")) {
            list = pharmacyRepository.findAll();
        } else if (user != null && user.getPharmacies() != null && !user.getPharmacies().isEmpty()) {
            list = new ArrayList<>(user.getPharmacies());
        } else if (roles.contains("ROLE_PHARMACIEN")) {
            list = pharmacyRepository.findAll();
        } else {
            list = List.of();
        }
        return list.stream()
                .sorted(Comparator.comparing(Pharmacy::getId))
                .map(p -> new JwtResponse.PharmacySummary(p.getId(), p.getName(), p.getAddress()))
                .collect(Collectors.toList());
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        User user = new User();
        user.setNom(signUpRequest.getNom());
        user.setPrenom(signUpRequest.getPrenom());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setTelephone(signUpRequest.getTelephone());
        user.setRole(Role.ROLE_PATIENT);
        user.setPharmacies(Set.of());
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setEmailVerified(false);

        userRepository.save(user);
        
        String verifyLink = "http://localhost:4200/login?verify=" + user.getVerificationToken();
        notificationService.notify(user.getEmail(), "Vérification de votre compte PharmaSync", 
            "Cliquez sur ce lien pour vérifier votre compte : " + verifyLink, "SYSTEM", null);

        auditLogRepository.save(new com.gestion.pharmacy.entity.AuditLog(user.getEmail(), "SIGNUP", "User registered"));
        return ResponseEntity.ok(Map.of("message", "Inscription réussie ! Veuillez vérifier votre e-mail pour activer votre compte."));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        User user = userRepository.findByVerificationToken(token).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Jeton de vérification invalide."));
        }
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Compte vérifié avec succès. Vous pouvez maintenant vous connecter."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Utilisateur non trouvé");
        }

        tokenRepository.deleteByUser(user);
        com.gestion.pharmacy.entity.PasswordResetToken resetToken = new com.gestion.pharmacy.entity.PasswordResetToken(user);
        tokenRepository.save(resetToken);

        // Simulation d'envoi d'email
        String resetLink = "http://localhost:4200/reset-password?token=" + resetToken.getToken();
        notificationService.notify(email, "Réinitialisation de mot de passe", "Lien : " + resetLink, "SYSTEM", null);
        auditLogRepository.save(new com.gestion.pharmacy.entity.AuditLog(email, "FORGOT_PASSWORD", "Reset token generated"));

        return ResponseEntity.ok(Map.of("message", "Un lien a été envoyé à votre adresse e-mail."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        com.gestion.pharmacy.entity.PasswordResetToken resetToken = tokenRepository.findByToken(token).orElse(null);
        if (resetToken == null || resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Jeton invalide ou expiré");
        }

        User user = resetToken.getUser();
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);
        
        auditLogRepository.save(new com.gestion.pharmacy.entity.AuditLog(user.getEmail(), "RESET_PASSWORD", "Password successfully reset"));

        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès."));
    }
}
