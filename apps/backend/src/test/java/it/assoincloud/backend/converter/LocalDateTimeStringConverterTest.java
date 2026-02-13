package it.assoincloud.backend.converter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;

class LocalDateTimeStringConverterTest {

    private final LocalDateTimeStringConverter converter = new LocalDateTimeStringConverter();

    @Test
    void convertToDatabaseColumnShouldFormatDateTime() {
        LocalDateTime value = LocalDateTime.of(2026, 2, 13, 11, 37, 10, 492_000_000);

        String result = converter.convertToDatabaseColumn(value);

        assertEquals("2026-02-13 11:37:10.492", result);
    }

    @Test
    void convertToEntityAttributeShouldParseEpochMillis() {
        long epochMillis = 1770982527958L;
        LocalDateTime expected = LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), ZoneId.systemDefault());

        LocalDateTime result = converter.convertToEntityAttribute(Long.toString(epochMillis));

        assertEquals(expected, result);
    }

    @Test
    void convertToEntityAttributeShouldParseFormattedString() {
        LocalDateTime result = converter.convertToEntityAttribute("2026-02-13 11:37:10.492");

        assertNotNull(result);
        assertEquals(2026, result.getYear());
        assertEquals(2, result.getMonthValue());
        assertEquals(13, result.getDayOfMonth());
    }
}
