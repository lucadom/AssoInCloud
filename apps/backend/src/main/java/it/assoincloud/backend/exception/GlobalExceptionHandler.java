package it.assoincloud.backend.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Global exception handler for common errors.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle IllegalArgumentException (e.g., resource not found, validation errors).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }

    /**
     * Handle database constraint violations (e.g., UNIQUE constraint).
     * Maps "UNIQUE constraint failed: members.fiscal_code" to "Socio già esistente".
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolation(
            org.springframework.dao.DataIntegrityViolationException e) {
        String message = extractMessage(e);
        if (message != null && message.toLowerCase().contains("unique constraint failed: members.fiscal_code")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Socio già esistente"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Errore durante l'operazione"));
    }

    private String extractMessage(Exception e) {
        if (e.getMessage() != null) {
            return e.getMessage();
        }
        Throwable cause = e.getCause();
        if (cause != null && cause.getMessage() != null) {
            return cause.getMessage();
        }
        return null;
    }
}
