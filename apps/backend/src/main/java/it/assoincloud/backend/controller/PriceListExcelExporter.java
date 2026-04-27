package it.assoincloud.backend.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import it.assoincloud.backend.dto.PriceListItemDto;

/**
 * Builds an Excel (.xlsx) workbook from a list of price list items.
 */
class PriceListExcelExporter {

    private PriceListExcelExporter() {}

    static byte[] buildExcel(List<PriceListItemDto> items) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Listino prezzi");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Descrizione");
            header.createCell(1).setCellValue("U.M.");
            header.createCell(2).setCellValue("Prezzo unitario");
            header.createCell(3).setCellValue("Sconto (%)");
            header.createCell(4).setCellValue("Prezzo effettivo");
            header.createCell(5).setCellValue("Ultimo acquisto");
            header.createCell(6).setCellValue("Quantità totale");

            int rowIndex = 1;
            for (PriceListItemDto item : items) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(nullToEmpty(item.description()));
                row.createCell(1).setCellValue(nullToEmpty(item.unitOfMeasure()));
                setCellDecimal(row, 2, item.unitPrice());
                setCellDecimal(row, 3, item.discountPercentage());
                setCellDecimal(row, 4, item.effectiveUnitPrice());
                row.createCell(5).setCellValue(nullToEmpty(item.lastPurchaseDate()));
                setCellDecimal(row, 6, item.totalQuantity());
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private static void setCellDecimal(Row row, int col, BigDecimal value) {
        if (value != null) {
            row.createCell(col).setCellValue(value.doubleValue());
        } else {
            row.createCell(col).setCellValue("");
        }
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
