package it.assoincloud.backend.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import it.assoincloud.backend.dto.PriceListItemDto;

/**
 * Generates a PDF price list document with supplier header and product table.
 */
class PriceListPdfExporter {

    private static final DateTimeFormatter DISPLAY_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final float[] COLUMN_WIDTHS = {30f, 6f, 10f, 8f, 10f, 11f, 10f};

    private PriceListPdfExporter() {}

    static byte[] buildPdf(List<PriceListItemDto> items, String supplierName, String vatNumber,
                           String dateFrom, String dateTo) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            try {
                PdfWriter.getInstance(document, out);
                document.open();

                Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
                Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
                Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
                Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);

                // Header: supplier info
                Paragraph title = new Paragraph("Listino prezzi", titleFont);
                title.setAlignment(Element.ALIGN_CENTER);
                title.setSpacingAfter(8f);
                document.add(title);

                Paragraph supplierInfo = new Paragraph(supplierName, normalFont);
                if (vatNumber != null && !vatNumber.isBlank()) {
                    supplierInfo.add(new Phrase("  —  P.IVA: " + vatNumber, normalFont));
                }
                supplierInfo.setAlignment(Element.ALIGN_CENTER);
                document.add(supplierInfo);

                String periodText = buildPeriodText(dateFrom, dateTo);
                Paragraph period = new Paragraph("Periodo: " + periodText, smallFont);
                period.setAlignment(Element.ALIGN_CENTER);
                period.setSpacingAfter(16f);
                document.add(period);

                // Product table
                PdfPTable table = new PdfPTable(7);
                table.setWidthPercentage(100f);
                table.setWidths(COLUMN_WIDTHS);

                addHeaderCell(table, "Descrizione", headerFont);
                addHeaderCell(table, "U.M.", headerFont);
                addHeaderCell(table, "Prezzo unitario", headerFont);
                addHeaderCell(table, "Sconto (%)", headerFont);
                addHeaderCell(table, "Prezzo effettivo", headerFont);
                addHeaderCell(table, "Ultimo acquisto", headerFont);
                addHeaderCell(table, "Quantità totale", headerFont);

                for (PriceListItemDto item : items) {
                    addCell(table, nullToEmpty(item.description()), smallFont, Element.ALIGN_LEFT);
                    addCell(table, nullToEmpty(item.unitOfMeasure()), smallFont, Element.ALIGN_CENTER);
                    addCell(table, formatDecimal(item.unitPrice()), smallFont, Element.ALIGN_RIGHT);
                    addCell(table, formatDiscount(item.discountPercentage()), smallFont, Element.ALIGN_RIGHT);
                    addCell(table, formatDecimal(item.effectiveUnitPrice()), smallFont, Element.ALIGN_RIGHT);
                    addCell(table, formatDate(item.lastPurchaseDate()), smallFont, Element.ALIGN_CENTER);
                    addCell(table, formatDecimal(item.totalQuantity()), smallFont, Element.ALIGN_RIGHT);
                }

                document.add(table);
            } finally {
                document.close();
            }
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IOException("Errore durante la generazione del PDF", e);
        }
    }

    private static String buildPeriodText(String dateFrom, String dateTo) {
        if (dateFrom == null && dateTo == null) {
            return "Tutte le date";
        }
        String from = dateFrom != null ? LocalDate.parse(dateFrom).format(DISPLAY_DATE_FMT) : "—";
        String to = dateTo != null ? LocalDate.parse(dateTo).format(DISPLAY_DATE_FMT) : "—";
        return from + " — " + to;
    }

    private static void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(4f);
        cell.setGrayFill(0.85f);
        table.addCell(cell);
    }

    private static void addCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(3f);
        table.addCell(cell);
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }

    private static String formatDecimal(BigDecimal value) {
        if (value == null) return "—";
        return value.stripTrailingZeros().toPlainString();
    }

    private static String formatDiscount(BigDecimal value) {
        if (value == null) return "—";
        return value.stripTrailingZeros().toPlainString() + "%";
    }

    private static String formatDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return "—";
        try {
            return LocalDate.parse(dateStr).format(DISPLAY_DATE_FMT);
        } catch (Exception e) {
            return dateStr;
        }
    }
}
