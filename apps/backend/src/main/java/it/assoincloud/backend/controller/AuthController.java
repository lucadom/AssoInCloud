package it.assoincloud.backend.controller;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
@RequestMapping("/api/auth")
public class AuthController {

    private final String configuredPassword;
    private final ConcurrentHashMap<String, Long> validTokens = new ConcurrentHashMap<>();

    /** Token validity: 24 hours in milliseconds. */
    private static final long TOKEN_TTL_MS = 24L * 60 * 60 * 1000;

    public AuthController(@Value("${assoincloud.password:}") String configuredPassword) {
        this.configuredPassword = configuredPassword;
    }

    /**
     * Returns whether authentication is enabled (a password is configured).
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> status() {
        boolean enabled = configuredPassword != null && !configuredPassword.isBlank();
        return ResponseEntity.ok(Map.of("authEnabled", enabled));
    }

    /**
     * Validates the submitted password and returns a bearer token on success.
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String password = body.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Password richiesta"));
        }

        if (!isAuthEnabled()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Autenticazione non configurata"));
        }

        if (!MessageDigest.isEqual(
                configuredPassword.getBytes(StandardCharsets.UTF_8),
                password.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Password non valida"));
        }

        String token = generateToken();
        validTokens.put(hashToken(token), System.currentTimeMillis());
        cleanExpiredTokens();

        return ResponseEntity.ok(Map.of("token", token));
    }

    /**
     * Logs out by invalidating the provided token.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) Map<String, String> body) {
        if (body != null && body.containsKey("token")) {
            validTokens.remove(hashToken(body.get("token")));
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Checks whether a given bearer token is valid and not expired.
     */
    public boolean isValidToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String hashed = hashToken(token);
        Long issuedAt = validTokens.get(hashed);
        if (issuedAt == null) {
            return false;
        }
        if (System.currentTimeMillis() - issuedAt > TOKEN_TTL_MS) {
            validTokens.remove(hashed);
            return false;
        }
        return true;
    }

    /**
     * Returns true when authentication is enabled (password is configured).
     */
    public boolean isAuthEnabled() {
        return configuredPassword != null && !configuredPassword.isBlank();
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private void cleanExpiredTokens() {
        long now = System.currentTimeMillis();
        validTokens.entrySet().removeIf(entry -> now - entry.getValue() > TOKEN_TTL_MS);
    }
}
