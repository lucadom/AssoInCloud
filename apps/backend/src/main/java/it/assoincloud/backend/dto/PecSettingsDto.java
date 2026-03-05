package it.assoincloud.backend.dto;

/**
 * DTO for PEC IMAP configuration.
 *
 * @param host        IMAP hostname
 * @param port        IMAP port (default 993)
 * @param username    IMAP username / email address
 * @param password    Password — empty string on GET responses; provide a value on PUT to change it
 * @param ssl         Whether to use SSL/TLS
 * @param sslTrustAll Whether to trust any certificate (for private CAs like Legalmail/Infocert)
 * @param passwordSet True when a password has been saved in the database (GET only)
 */
public record PecSettingsDto(
        String host,
        int port,
        String username,
        String password,
        boolean ssl,
        boolean sslTrustAll,
        boolean passwordSet) {
}
