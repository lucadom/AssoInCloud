package it.assoincloud.backend.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.assoincloud.backend.dto.PriceListItemDto;
import it.assoincloud.backend.repository.InvoiceLineItemRepository;

@RestController
@RequestMapping("/api/price-lists")
@CrossOrigin
public class PriceListController {

    private final InvoiceLineItemRepository lineItemRepository;

    public PriceListController(InvoiceLineItemRepository lineItemRepository) {
        this.lineItemRepository = lineItemRepository;
    }

    @GetMapping("/supplier/{supplierId}")
    public List<PriceListItemDto> getPriceList(
            @PathVariable String supplierId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        List<Object[]> rows = lineItemRepository.findPriceList(supplierId, from, to);
        return rows.stream().map(PriceListController::toDto).toList();
    }

    static PriceListItemDto toDto(Object[] row) {
        String description = (String) row[0];
        String unitOfMeasure = (String) row[1];
        BigDecimal unitPrice = toBigDecimal(row[2]);
        String lastPurchaseDate = row[3] != null ? row[3].toString() : null;
        BigDecimal totalQuantity = toBigDecimal(row[4]);
        return new PriceListItemDto(description, unitOfMeasure, unitPrice, lastPurchaseDate, totalQuantity);
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(value.toString());
    }
}
