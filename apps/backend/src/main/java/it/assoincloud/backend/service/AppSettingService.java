package it.assoincloud.backend.service;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.dto.PecSettingsDto;
import it.assoincloud.backend.entity.AppSetting;
import it.assoincloud.backend.repository.AppSettingRepository;

@Service
@Transactional
public class AppSettingService {

    private static final Logger log = LoggerFactory.getLogger(AppSettingService.class);

    private static final String PEC_HOST = "pec.host";
    private static final String PEC_PORT = "pec.port";
    private static final String PEC_USERNAME = "pec.username";
    private static final String PEC_PASSWORD = "pec.password";
    private static final String PEC_SSL = "pec.ssl";
    private static final String PEC_SSL_TRUST_ALL = "pec.ssl-trust-all";

    private final AppSettingRepository repository;

    public AppSettingService(AppSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<String> getValue(String key) {
        return repository.findById(key).map(AppSetting::getValue);
    }

    public void setValue(String key, String value) {
        AppSetting setting = repository.findById(key).orElse(new AppSetting(key, null));
        setting.setValue(value);
        repository.save(setting);
    }

    /**
     * Returns PEC configuration from the database.
     * The password is never returned to the caller; use isPasswordSet() to check if one exists.
     */
    @Transactional(readOnly = true)
    public PecSettingsDto getPecSettings() {
        String host = getValue(PEC_HOST).orElse("");
        int port = getValue(PEC_PORT).map(v -> {
            try { return Integer.parseInt(v); } catch (NumberFormatException e) { return 993; }
        }).orElse(993);
        String username = getValue(PEC_USERNAME).orElse("");
        boolean passwordSet = getValue(PEC_PASSWORD).filter(p -> !p.isBlank()).isPresent();
        boolean ssl = getValue(PEC_SSL).map(Boolean::parseBoolean).orElse(true);
        boolean sslTrustAll = getValue(PEC_SSL_TRUST_ALL).map(Boolean::parseBoolean).orElse(false);
        return new PecSettingsDto(host, port, username, "", ssl, sslTrustAll, passwordSet);
    }

    /**
     * Returns the raw (decrypted) PEC password for internal use by PecService.
     */
    @Transactional(readOnly = true)
    public String getPecPassword() {
        return getValue(PEC_PASSWORD).orElse("");
    }

    /**
     * Saves PEC configuration. If the incoming password is blank, the existing one is preserved.
     */
    public void savePecSettings(PecSettingsDto dto) {
        log.info("Saving PEC settings for host: {}, port: {}, user: {}", dto.host(), dto.port(), dto.username());
        setValue(PEC_HOST, dto.host() == null ? "" : dto.host().trim());
        setValue(PEC_PORT, String.valueOf(dto.port() > 0 ? dto.port() : 993));
        setValue(PEC_USERNAME, dto.username() == null ? "" : dto.username().trim());
        if (dto.password() != null && !dto.password().isBlank()) {
            setValue(PEC_PASSWORD, dto.password());
        }
        setValue(PEC_SSL, String.valueOf(dto.ssl()));
        setValue(PEC_SSL_TRUST_ALL, String.valueOf(dto.sslTrustAll()));
    }
}
