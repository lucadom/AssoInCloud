package it.assoincloud.backend.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import it.assoincloud.backend.controller.AuthController;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter that enforces bearer-token authentication on all /api/** endpoints,
 * except for /api/auth/** which must remain publicly accessible.
 * <p>
 * When no password is configured (ASSOINCLOUD_PASSWORD is empty), the filter
 * allows all requests through without authentication.
 */
@Component
public class AuthTokenFilter extends OncePerRequestFilter {

    private final AuthController authController;

    public AuthTokenFilter(AuthController authController) {
        this.authController = authController;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Allow auth endpoints without token
        if (path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // If no password configured, allow everything
        if (!authController.isAuthEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Only protect /api/** endpoints
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check Authorization header
        String authHeader = request.getHeader("Authorization");
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // Fallback: check query parameter (for direct links like attachment downloads)
        if (token == null) {
            token = request.getParameter("token");
        }

        if (token == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Autenticazione richiesta\"}");
            return;
        }

        if (!authController.isValidToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Token non valido o scaduto\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
