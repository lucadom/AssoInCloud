package it.assoincloud.backend.dto;

/**
 * A single row in the CSV preview response.
 *
 * @param rowNumber      1-based row number (excluding the header row)
 * @param rowStatus      "new" | "update" | "skip"
 * @param firstName      parsed first name (may be empty)
 * @param lastName       parsed last name (may be empty)
 * @param fiscalCode     parsed fiscal code (may be empty for skipped rows)
 * @param birthDate      parsed birth date string as-is from CSV (may be empty)
 * @param birthPlace     parsed birth place (may be empty)
 * @param address        parsed address (may be empty)
 * @param city           parsed city (may be empty)
 * @param phone          parsed phone (may be empty)
 * @param membershipDate parsed membership date string as-is from CSV (may be empty)
 */
public record CsvPreviewRowDto(
        int rowNumber,
        String rowStatus,
        String firstName,
        String lastName,
        String fiscalCode,
        String birthDate,
        String birthPlace,
        String address,
        String city,
        String phone,
        String membershipDate) {
}
