package it.assoincloud.backend.dto;

/**
 * Maps a single CSV column header to a member field identifier.
 *
 * @param csvHeader   the exact header text from the CSV first row
 * @param memberField one of: lastName, firstName, fiscalCode, birthDate, birthPlace,
 *                    address, city, phone, membershipDate — or {@code null} to ignore the column
 */
public record CsvColumnMappingDto(String csvHeader, String memberField) {
}
