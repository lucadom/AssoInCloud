package it.assoincloud.backend.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.assoincloud.backend.dto.PriceListItemDto;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.InvoiceLineItemRepository;
import it.assoincloud.backend.repository.SupplierRepository;

@RestController
@RequestMapping("/api/price-lists")
@CrossOrigin
public class PriceListController {

    private static final Logger log = LoggerFactory.getLogger(PriceListController.class);
    private static final DateTimeFormatter FILENAME_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final MediaType XLSX_MEDIA_TYPE =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final InvoiceLineItemRepository lineItemRepository;
    private final SupplierRepository supplierRepository;

    public PriceListController(InvoiceLineItemRepository lineItemRepository,
                               SupplierRepository supplierRepository) {
        this.lineItemRepository = lineItemRepository;
        this.supplierRepository = supplierRepository;
    }

    @GetMapping("/supplier/{supplierId}")
    public List<PriceListItemDto> getPriceList(
            @PathVariable String supplierId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        log.debug("Fetching price list for supplierId={} from={} to={}", supplierId, from, to);
        List<Object[]> rows = lineItemRepository.findPriceList(supplierId, from, to);
        return rows.stream().map(PriceListController::toDto).toList();
    }

    @GetMapping("/supplier/{supplierId}/export-xlsx")
    public ResponseEntity<byte[]> exportXlsx(
            @PathVariable String supplierId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) throws IOException {

        Supplier supplier = supplierRepository.findById(supplierId).orElse(null);
        String supplierName = supplier != null ? supplier.getName() : supplierId;
        log.info("Exporting price list XLSX for supplier={} from={} to={}", supplierName, from, to);

        List<PriceListItemDto> items = lineItemRepository.findPriceList(supplierId, from, to)
                .stream().map(PriceListController::toDto).toList();

        byte[] content = PriceListExcelExporter.buildExcel(items);
        String filename = "listino_" + sanitizeFilename(supplierName) + "_" + LocalDate.now().format(FILENAME_DATE_FMT) + ".xlsx";

        return ResponseEntity.ok()
                .contentType(XLSX_MEDIA_TYPE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(content);
    }

    @GetMapping("/supplier/{supplierId}/export-pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable String supplierId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) throws IOException {

        Supplier supplier = supplierRepository.findById(supplierId).orElse(null);
        String supplierName = supplier != null ? supplier.getName() : supplierId;
        String vatNumber = supplier != null ? supplier.getVatNumber() : "";
        log.info("Exporting price list PDF for supplier={} from={} to={}", supplierName, from, to);

        List<PriceListItemDto> items = lineItemRepository.findPriceList(supplierId, from, to)
                .stream().map(PriceListController::toDto).toList();

        byte[] content = PriceListPdfExporter.buildPdf(items, supplierName, vatNumber, from, to);
        String filename = "listino_" + sanitizeFilename(supplierName) + "_" + LocalDate.now().format(FILENAME_DATE_FMT) + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(content);
    }

    static PriceListItemDto toDto(Object[] row) {
        String description = (String) row[0];
        String unitOfMeasure = (String) row[1];
        BigDecimal unitPrice = toBigDecimal(row[2]);
        String lastPurchaseDate = row[3] != null ? row[3].toString() : null;
        BigDecimal totalQuantity = toBigDecimal(row[4]);
        BigDecimal discountPercentage = toBigDecimal(row[5]);
        BigDecimal effectiveUnitPrice = computeEffectivePrice(unitPrice, discountPercentage);
        return new PriceListItemDto(description, unitOfMeasure, unitPrice, lastPurchaseDate,
                totalQuantity, discountPercentage, effectiveUnitPrice);
    }

    static BigDecimal computeEffectivePrice(BigDecimal unitPrice, BigDecimal discountPercentage) {
        if (unitPrice == null) return null;
        if (discountPercentage == null || discountPercentage.compareTo(BigDecimal.ZERO) == 0) {
            return unitPrice.setScale(4, RoundingMode.HALF_UP);
        }
        BigDecimal factor = BigDecimal.ONE.subtract(
                discountPercentage.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP));
        return unitPrice.multiply(factor).setScale(4, RoundingMode.HALF_UP);
    }

    static BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(value.toString());
    }

    private static String sanitizeFilename(String name) {
        return name.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}
