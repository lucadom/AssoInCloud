package it.assoincloud.backend.converter;

import java.time.LocalDate;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Stores {@link LocalDate} as an ISO-8601 text string (yyyy-MM-dd) in SQLite
 * so the SQLite JDBC driver doesn't choke on epoch-millis values.
 */
@Converter(autoApply = true)
public class LocalDateStringConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate date) {
        return date != null ? date.toString() : null;
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbValue) {
        return dbValue != null && !dbValue.isBlank() ? LocalDate.parse(dbValue) : null;
    }
}
