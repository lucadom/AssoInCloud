package it.assoincloud.backend.dto;

/**
 * Result of a CSV or XML invoice import operation.
 *
 * @param imported number of new invoices successfully imported
 * @param updated  number of existing invoices overwritten (XML/P7M only)
 * @param skipped  number of invoices skipped because they already exist (CSV only)
 */
public record ImportResultDto(int imported, int updated, int skipped) {
}
