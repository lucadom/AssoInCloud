package it.assoincloud.backend.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.dto.CsvColumnMappingDto;
import it.assoincloud.backend.dto.CsvImportOptionsDto;
import it.assoincloud.backend.dto.CsvPreviewResponseDto;
import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.entity.Member;
import it.assoincloud.backend.repository.MemberRepository;
import it.assoincloud.backend.repository.MembershipYearRepository;

/**
 * Integration tests for MemberService CSV preview and confirm-import operations.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@Transactional
class MemberServiceCsvImportTest {

    @Autowired
    private MemberService memberService;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private MembershipYearRepository membershipYearRepository;

    /** Standard mapping matching the classic Italian export format. */
    private static final List<CsvColumnMappingDto> STANDARD_MAPPING = List.of(
            new CsvColumnMappingDto("Cognome", "lastName"),
            new CsvColumnMappingDto("Nome", "firstName"),
            new CsvColumnMappingDto("Codice fiscale", "fiscalCode"),
            new CsvColumnMappingDto("Data di nascita", "birthDate"),
            new CsvColumnMappingDto("Nato a", "birthPlace"),
            new CsvColumnMappingDto("Residenza", "address"),
            new CsvColumnMappingDto("Citta", "city"),
            new CsvColumnMappingDto("Telefono", "phone"),
            new CsvColumnMappingDto("Data accettazione", "membershipDate")
    );

    private Member existingMember;

    @BeforeEach
    void setUp() {
        existingMember = new Member("Rossi", "Mario", "RSSMRA80A01H501U");
        existingMember.setBirthDate(LocalDate.parse("1980-01-01"));
        existingMember.setCity("Roma");
        existingMember = memberRepository.save(existingMember);
    }

    // -----------------------------------------------------------------------
    // previewCsv
    // -----------------------------------------------------------------------

    @Test
    void previewCsvShouldReturnMixedStatuses() {
        String csv = """
                Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
                Rossi;Mario;RSSMRA80A01H501U;01/01/1980;Roma;Via Roma 1;Roma;3331111111;15/01/2025
                Bianchi;Luigi;BNCLGU85B15F205X;15/02/1985;Milano;Via Milano 1;Milano;3332222222;01/02/2025
                SenzaCodice;;          ;20/05/1985;Firenze;Via Error;Firenze;3333333333;20/01/2025
                """;

        MockMultipartFile file = csvFile(csv);
        CsvPreviewResponseDto result = memberService.previewCsv(file, STANDARD_MAPPING);

        assertFalse(result.truncated());
        assertEquals(3, result.rows().size());
        assertEquals("update", result.rows().get(0).rowStatus());
        assertEquals("new", result.rows().get(1).rowStatus());
        assertEquals("skip", result.rows().get(2).rowStatus());
    }

    @Test
    void previewCsvShouldAssignCorrectRowNumbers() {
        String csv = """
                Cognome;Nome;Codice fiscale
                Verdi;Giuseppe;VRDGPP90R10F839B
                Neri;Anna;NRANNA85E60D612C
                """;

        List<CsvColumnMappingDto> mapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName"),
                new CsvColumnMappingDto("Codice fiscale", "fiscalCode")
        );

        CsvPreviewResponseDto result = memberService.previewCsv(csvFile(csv), mapping);

        assertEquals(1, result.rows().get(0).rowNumber());
        assertEquals(2, result.rows().get(1).rowNumber());
    }

    @Test
    void previewCsvShouldReturnTruncatedResponseWhenFileExceeds5000Rows() {
        StringBuilder csv = new StringBuilder("Cognome;Nome;Codice fiscale\n");
        for (int i = 0; i < 5100; i++) {
            csv.append("Cognome").append(i).append(";Nome").append(i)
               .append(";FC").append(String.format("%016d", i)).append("\n");
        }

        CsvPreviewResponseDto result = memberService.previewCsv(csvFile(csv.toString()), List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName"),
                new CsvColumnMappingDto("Codice fiscale", "fiscalCode")
        ));

        assertTrue(result.truncated());
        assertEquals(5000, result.rows().size());
        assertEquals(5100, result.totalRows());
    }

    @Test
    void previewCsvShouldSkipBlankLines() {
        String csv = "Cognome;Nome;Codice fiscale\n" +
                     "Verdi;Giuseppe;VRDGPP90R10F839B\n" +
                     "\n" +
                     "Neri;Anna;NRANNA85E60D612C\n";

        List<CsvColumnMappingDto> mapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName"),
                new CsvColumnMappingDto("Codice fiscale", "fiscalCode")
        );

        CsvPreviewResponseDto result = memberService.previewCsv(csvFile(csv), mapping);
        assertEquals(2, result.rows().size());
    }

    @Test
    void previewCsvShouldRejectMappingWithoutFiscalCode() {
        String csv = "Cognome;Nome\nRossi;Mario\n";
        List<CsvColumnMappingDto> badMapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName")
        );

        assertThrows(IllegalArgumentException.class,
                () -> memberService.previewCsv(csvFile(csv), badMapping));
    }

    @Test
    void previewCsvShouldRejectNullMapping() {
        assertThrows(IllegalArgumentException.class,
                () -> memberService.previewCsv(csvFile("Cognome;Codice fiscale\nRossi;FC\n"), null));
    }

    // -----------------------------------------------------------------------
    // confirmCsvImport
    // -----------------------------------------------------------------------

    @Test
    void confirmCsvImportShouldInsertNewMembersAndUpdateExisting() {
        String csv = """
                Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
                Rossi;Mario;RSSMRA80A01H501U;01/01/1980;Roma;Via Aggiornata 99;Roma;3339999999;15/01/2025
                Bianchi;Luigi;BNCLGU85B15F205X;15/02/1985;Milano;Via Milano 1;Milano;3332222222;01/02/2025
                """;

        CsvImportOptionsDto options = new CsvImportOptionsDto(STANDARD_MAPPING, false);
        ImportResultDto result = memberService.confirmCsvImport(csvFile(csv), options);

        assertEquals(1, result.imported());
        assertEquals(1, result.updated());
        assertEquals(0, result.skipped());

        Member updated = memberRepository.findByFiscalCode("RSSMRA80A01H501U").orElseThrow();
        assertEquals("Via Aggiornata 99", updated.getAddress());
    }

    @Test
    void confirmCsvImportShouldSkipRowsWithoutFiscalCode() {
        String csv = """
                Cognome;Nome;Codice fiscale
                Verdi;Giuseppe;VRDGPP90R10F839B
                SenzaCodice;Mario;
                """;

        List<CsvColumnMappingDto> mapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName"),
                new CsvColumnMappingDto("Codice fiscale", "fiscalCode")
        );

        ImportResultDto result = memberService.confirmCsvImport(csvFile(csv), new CsvImportOptionsDto(mapping, false));

        assertEquals(1, result.imported());
        assertEquals(0, result.updated());
        assertEquals(1, result.skipped());
    }

    @Test
    void confirmCsvImportWithMarkAsActiveShouldAddCurrentYearToInsertedAndUpdated() {
        int currentYear = Year.now().getValue();
        String csv = """
                Cognome;Nome;Codice fiscale
                Rossi;Mario;RSSMRA80A01H501U
                Bianchi;Luigi;BNCLGU85B15F205X
                """;

        List<CsvColumnMappingDto> mapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName"),
                new CsvColumnMappingDto("Codice fiscale", "fiscalCode")
        );

        memberService.confirmCsvImport(csvFile(csv), new CsvImportOptionsDto(mapping, true));

        assertTrue(membershipYearRepository.existsByMemberIdAndYear(existingMember.getId(), currentYear));
        Member newMember = memberRepository.findByFiscalCode("BNCLGU85B15F205X").orElseThrow();
        assertTrue(membershipYearRepository.existsByMemberIdAndYear(newMember.getId(), currentYear));
    }

    @Test
    void confirmCsvImportWithMarkAsActiveShouldBeIdempotent() {
        int currentYear = Year.now().getValue();
        // Pre-add current year for the existing member
        memberService.renewMembership(existingMember.getId());

        String csv = "Cognome;Nome;Codice fiscale\nRossi;Mario;RSSMRA80A01H501U\n";
        List<CsvColumnMappingDto> mapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName"),
                new CsvColumnMappingDto("Codice fiscale", "fiscalCode")
        );

        // Should not throw or create duplicate year
        memberService.confirmCsvImport(csvFile(csv), new CsvImportOptionsDto(mapping, true));

        long count = membershipYearRepository.findAll().stream()
                .filter(my -> my.getMember().getId().equals(existingMember.getId()) && my.getYear() == currentYear)
                .count();
        assertEquals(1, count);
    }

    @Test
    void confirmCsvImportWithMarkAsActiveFalseShouldNotAddMembershipYear() {
        int currentYear = Year.now().getValue();
        String csv = "Cognome;Nome;Codice fiscale\nRossi;Mario;RSSMRA80A01H501U\n";
        List<CsvColumnMappingDto> mapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName"),
                new CsvColumnMappingDto("Codice fiscale", "fiscalCode")
        );

        memberService.confirmCsvImport(csvFile(csv), new CsvImportOptionsDto(mapping, false));

        assertFalse(membershipYearRepository.existsByMemberIdAndYear(existingMember.getId(), currentYear));
    }

    @Test
    void confirmCsvImportShouldRejectMappingWithoutFiscalCode() {
        String csv = "Cognome;Nome\nRossi;Mario\n";
        List<CsvColumnMappingDto> badMapping = List.of(
                new CsvColumnMappingDto("Cognome", "lastName"),
                new CsvColumnMappingDto("Nome", "firstName")
        );

        assertThrows(IllegalArgumentException.class,
                () -> memberService.confirmCsvImport(csvFile(csv), new CsvImportOptionsDto(badMapping, false)));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private MockMultipartFile csvFile(String content) {
        return new MockMultipartFile("file", "members.csv", "text/csv",
                content.getBytes(StandardCharsets.UTF_8));
    }
}
