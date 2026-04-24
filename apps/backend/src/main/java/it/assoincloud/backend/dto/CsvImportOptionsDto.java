package it.assoincloud.backend.dto;

import java.util.List;

/**
 * Options for a confirmed CSV member import.
 *
 * @param mapping      ordered list of column-to-field mappings
 * @param markAsActive when {@code true}, add the current calendar year as a
 *                     {@code MembershipYear} for every inserted or updated member
 */
public record CsvImportOptionsDto(List<CsvColumnMappingDto> mapping, boolean markAsActive) {
}
