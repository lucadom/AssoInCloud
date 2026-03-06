package it.assoincloud.backend.controller;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.entity.Member;
import it.assoincloud.backend.repository.MemberRepository;

/**
 * Integration tests for MemberController REST endpoints.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class MemberControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MemberRepository memberRepository;

    private Member testMember;

    @BeforeEach
    void setUp() {
        testMember = new Member("Rossi", "Mario", "RSSMRA80A01H501U");
        testMember.setBirthDate(LocalDate.parse("1980-01-01"));
        testMember.setBirthPlace("Roma");
        testMember.setAddress("Via Roma 1");
        testMember.setCity("Roma");
        testMember.setPhone("3331234567");
        testMember.setMembershipDate(LocalDate.parse("2025-01-15"));
        memberRepository.save(testMember);
    }

    @Test
    void shouldListAllMembers() throws Exception {
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].lastName", is("Rossi")))
                .andExpect(jsonPath("$[0].firstName", is("Mario")))
                .andExpect(jsonPath("$[0].fiscalCode", is("RSSMRA80A01H501U")));
    }

    @Test
    void shouldGetMemberById() throws Exception {
        mockMvc.perform(get("/api/members/" + testMember.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastName", is("Rossi")))
                .andExpect(jsonPath("$.firstName", is("Mario")))
                .andExpect(jsonPath("$.fiscalCode", is("RSSMRA80A01H501U")))
                .andExpect(jsonPath("$.birthDate", is("1980-01-01")))
                .andExpect(jsonPath("$.city", is("Roma")));
    }

    @Test
    void shouldCreateNewMember() throws Exception {
        String json = """
            {
                "lastName": "Bianchi",
                "firstName": "Luigi",
                "fiscalCode": "BNCLGU85B15F205X",
                "birthDate": "1985-02-15",
                "birthPlace": "Milano",
                "address": "Via Milano 10",
                "city": "Milano",
                "phone": "3339876543",
                "membershipDate": "2025-02-01"
            }
            """;

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lastName", is("Bianchi")))
                .andExpect(jsonPath("$.firstName", is("Luigi")))
                .andExpect(jsonPath("$.fiscalCode", is("BNCLGU85B15F205X")))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void shouldReturnErrorWhenCreatingMemberWithDuplicateFiscalCode() throws Exception {
        String json = """
            {
                "lastName": "Rossi",
                "firstName": "Maria",
                "fiscalCode": "RSSMRA80A01H501U",
                "birthDate": "1985-02-15",
                "city": "Roma"
            }
            """;

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Socio già esistente")));
    }

    @Test
    void shouldUpdateMember() throws Exception {
        String json = """
            {
                "lastName": "Rossi",
                "firstName": "Mario",
                "fiscalCode": "RSSMRA80A01H501U",
                "birthDate": "1980-01-01",
                "birthPlace": "Roma",
                "address": "Via Nuova 20",
                "city": "Roma",
                "phone": "3339999999",
                "membershipDate": "2025-01-15"
            }
            """;

        mockMvc.perform(put("/api/members/" + testMember.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address", is("Via Nuova 20")))
                .andExpect(jsonPath("$.phone", is("3339999999")));
    }

    @Test
    void shouldDeleteMember() throws Exception {
        mockMvc.perform(delete("/api/members/" + testMember.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void shouldImportCsvWithNewMembers() throws Exception {
        String csvContent = """
            Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
            Verdi;Giuseppe;VRDGPP90R10F839B;10/10/1990;Napoli;Via Napoli 5;Napoli;3331111111;15/01/2025
            Neri;Anna;NRANNA85E60D612C;20/05/1985;Firenze;Via Firenze 8;Firenze;3332222222;20/01/2025
            """;

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "members.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/api/members/import-csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(2)))
                .andExpect(jsonPath("$.updated", is(0)))
                .andExpect(jsonPath("$.skipped", is(0)));

        // Verify members were created
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3))); // 1 existing + 2 new
    }

    @Test
    void shouldUpsertExistingMemberOnCsvImport() throws Exception {
        // CSV with existing fiscal code but updated data
        String csvContent = """
            Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
            Rossi;Mario;RSSMRA80A01H501U;01/01/1980;Roma;Via Aggiornata 99;Roma;3335555555;15/01/2025
            """;

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "members.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/api/members/import-csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(0)))
                .andExpect(jsonPath("$.updated", is(1)))
                .andExpect(jsonPath("$.skipped", is(0)));

        // Verify member was updated, not duplicated
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/members/" + testMember.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address", is("Via Aggiornata 99")))
                .andExpect(jsonPath("$.phone", is("3335555555")));
    }

    @Test
    void shouldPreserveExistingFieldsOnCsvUpsert() throws Exception {
        // CSV with partial data (no address)
        String csvContent = """
            Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
            Rossi;Mario;RSSMRA80A01H501U;01/01/1980;Roma;;Roma;3336666666;15/01/2025
            """;

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "members.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/api/members/import-csv").file(file))
                .andExpect(status().isOk());

        // Verify existing address was preserved (CSV had empty address)
        mockMvc.perform(get("/api/members/" + testMember.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address", is("Via Roma 1"))) // original preserved
                .andExpect(jsonPath("$.phone", is("3336666666"))); // updated from CSV
    }

    @Test
    void shouldSkipInvalidCsvRows() throws Exception {
        String csvContent = """
            Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
            Verdi;Giuseppe;VRDGPP90R10F839B;10/10/1990;Napoli;Via Napoli 5;Napoli;3331111111;15/01/2025
            Senza;Codice;;20/05/1985;Firenze;Via Error;Firenze;333222;20/01/2025
            """;

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "members.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/api/members/import-csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)))
                .andExpect(jsonPath("$.updated", is(0)))
                .andExpect(jsonPath("$.skipped", is(1))); // row without fiscal code
    }

    @Test
    void shouldExportMembersAsXlsx() throws Exception {
        Member secondMember = new Member("Bianchi", "Luigi", "BNCLGU85B15F205X");
        secondMember.setBirthDate(LocalDate.parse("1985-02-15"));
        secondMember.setCity("Milano");
        secondMember.setMembershipDate(LocalDate.parse("2025-02-01"));
        memberRepository.save(secondMember);

        MvcResult result = mockMvc.perform(get("/api/members/export-xlsx"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"soci.xlsx\""))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andReturn();

        byte[] content = result.getResponse().getContentAsByteArray();
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            Sheet sheet = workbook.getSheet("Soci");
            Row headerRow = sheet.getRow(0);
            assertEquals("Cognome", headerRow.getCell(0).getStringCellValue());
            assertEquals("Nome", headerRow.getCell(1).getStringCellValue());
            assertEquals("Codice fiscale", headerRow.getCell(2).getStringCellValue());
            assertEquals("Data accettazione", headerRow.getCell(8).getStringCellValue());

            Row firstDataRow = sheet.getRow(1);
            assertEquals("Bianchi", firstDataRow.getCell(0).getStringCellValue());
            assertEquals("Luigi", firstDataRow.getCell(1).getStringCellValue());
            assertEquals("BNCLGU85B15F205X", firstDataRow.getCell(2).getStringCellValue());
            assertEquals("15/02/1985", firstDataRow.getCell(3).getStringCellValue());
            assertEquals("Milano", firstDataRow.getCell(6).getStringCellValue());
            assertEquals("01/02/2025", firstDataRow.getCell(8).getStringCellValue());
        }
    }

    @Test
    void shouldConvertFiscalCodeToUppercaseOnCreate() throws Exception {
        String json = """
            {
                "lastName": "Verdi",
                "firstName": "Giuseppe",
                "fiscalCode": "vrdgpp90r10f839b",
                "city": "Napoli"
            }
            """;

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fiscalCode", is("VRDGPP90R10F839B")));
    }

    @Test
    void shouldConvertFiscalCodeToUppercaseOnUpdate() throws Exception {
        String json = """
            {
                "lastName": "Rossi",
                "firstName": "Mario",
                "fiscalCode": "rssmra80a01h501u",
                "city": "Roma"
            }
            """;

        mockMvc.perform(put("/api/members/" + testMember.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fiscalCode", is("RSSMRA80A01H501U")));
    }

    @Test
    void shouldConvertFiscalCodeToUppercaseOnCsvImport() throws Exception {
        // CSV with lowercase fiscal code
        String csvContent = """
            Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
            Neri;Anna;nranna85e60d612c;20/05/1985;Firenze;Via Firenze 8;Firenze;3332222222;20/01/2025
            """;

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "members.csv",
                "text/csv",
                csvContent.getBytes()
        );

        mockMvc.perform(multipart("/api/members/import-csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)));

        // Verify fiscal code was converted to uppercase
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.lastName == 'Neri')].fiscalCode", hasSize(1)))
            .andExpect(jsonPath("$[?(@.lastName == 'Neri')].fiscalCode", hasItem("NRANNA85E60D612C")));
    }

    @Test
    void shouldSkipCsvRowsWithTooFewColumns() throws Exception {
        String csvContent = "Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione\n" +
                "Rossi;Marco\n" +  // only 2 columns → skipped (cols.length < 9)
                "Bianchi;Luigi;BNCLGU85B15F205X;15/02/1985;Milano;Via Bianchi 3;Milano;3334444444;01/02/2025\n";

        MockMultipartFile file = new MockMultipartFile("file", "members.csv", "text/csv", csvContent.getBytes());
        mockMvc.perform(multipart("/api/members/import-csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)))
                .andExpect(jsonPath("$.skipped", is(1)));
    }
}

