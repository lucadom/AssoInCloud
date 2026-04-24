package it.assoincloud.backend.dto;

import java.util.List;

/**
 * Response returned by the {@code POST /api/members/preview-csv} endpoint.
 *
 * @param rows      preview rows (up to 5 000)
 * @param truncated {@code true} when the input file had more than 5 000 data rows
 * @param totalRows total number of data rows in the file (0 when not truncated)
 */
public record CsvPreviewResponseDto(List<CsvPreviewRowDto> rows, boolean truncated, int totalRows) {
}
