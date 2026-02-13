package it.assoincloud.backend.service;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.entity.Member;
import it.assoincloud.backend.repository.MemberRepository;

@Service
@Transactional
public class MemberService {

    private static final DateTimeFormatter CSV_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter EXPORT_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Transactional(readOnly = true)
    public List<Member> findAll() {
        return memberRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Member findById(String id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + id));
    }

    public Member create(Member member) {
        if (memberRepository.existsByFiscalCode(member.getFiscalCode())) {
            throw new IllegalArgumentException("Socio già esistente");
        }
        return memberRepository.save(member);
    }

    public Member update(String id, Member updates) {
        Member existing = findById(id);
        updateFields(existing, updates);
        return memberRepository.save(existing);
    }

    public void delete(String id) {
        memberRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public byte[] exportXlsx() {
        List<Member> members = memberRepository.findAll(Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()));

        try (var workbook = new XSSFWorkbook(); var output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Soci");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Cognome");
            header.createCell(1).setCellValue("Nome");
            header.createCell(2).setCellValue("Codice fiscale");
            header.createCell(3).setCellValue("Data di nascita");
            header.createCell(4).setCellValue("Nato a");
            header.createCell(5).setCellValue("Residenza");
            header.createCell(6).setCellValue("Citta");
            header.createCell(7).setCellValue("Telefono");
            header.createCell(8).setCellValue("Data accettazione");

            int rowIndex = 1;
            for (Member member : members) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(nullToEmpty(member.getLastName()));
                row.createCell(1).setCellValue(nullToEmpty(member.getFirstName()));
                row.createCell(2).setCellValue(nullToEmpty(member.getFiscalCode()));
                row.createCell(3).setCellValue(formatDate(member.getBirthDate()));
                row.createCell(4).setCellValue(nullToEmpty(member.getBirthPlace()));
                row.createCell(5).setCellValue(nullToEmpty(member.getAddress()));
                row.createCell(6).setCellValue(nullToEmpty(member.getCity()));
                row.createCell(7).setCellValue(nullToEmpty(member.getPhone()));
                row.createCell(8).setCellValue(formatDate(member.getMembershipDate()));
            }

            workbook.write(output);
            return output.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Errore durante l'esportazione dei soci", e);
        }
    }

    /**
     * Import CSV with upsert logic: if member exists (by fiscal code), update only non-null fields from CSV.
     */
    public ImportResultDto importCsv(MultipartFile file) {
        int importedCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;

        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean header = true;

            while ((line = reader.readLine()) != null) {
                if (header) {
                    header = false;
                    continue; // skip header
                }
                if (line.isBlank()) continue;

                String[] cols = line.split(";", -1);
                if (cols.length < 9) {
                    skippedCount++;
                    continue;
                }

                // Columns: Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione
                // Indexes:  0       1     2              3              4      5         6     7         8
                String fiscalCode = trim(cols[2]);
                
                if (fiscalCode.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                String lastName = trim(cols[0]);
                String firstName = trim(cols[1]);
                String birthDateStr = trim(cols[3]);
                String birthPlace = trim(cols[4]);
                String address = trim(cols[5]);
                String city = trim(cols[6]);
                String phone = trim(cols[7]);
                String membershipDateStr = trim(cols[8]);

                var existing = memberRepository.findByFiscalCode(fiscalCode);
                Member member;

                if (existing.isPresent()) {
                    // Update existing member with non-empty CSV values
                    member = existing.get();
                    if (!lastName.isEmpty()) member.setLastName(lastName);
                    if (!firstName.isEmpty()) member.setFirstName(firstName);
                    if (!birthDateStr.isEmpty()) {
                        try {
                            member.setBirthDate(LocalDate.parse(birthDateStr, CSV_DATE_FMT));
                        } catch (Exception ignored) {}
                    }
                    if (!birthPlace.isEmpty()) member.setBirthPlace(birthPlace);
                    if (!address.isEmpty()) member.setAddress(address);
                    if (!city.isEmpty()) member.setCity(city);
                    if (!phone.isEmpty()) member.setPhone(phone);
                    if (!membershipDateStr.isEmpty()) {
                        try {
                            member.setMembershipDate(LocalDate.parse(membershipDateStr, CSV_DATE_FMT));
                        } catch (Exception ignored) {}
                    }
                    updatedCount++;
                } else {
                    // Create new member
                    member = new Member(lastName, firstName, fiscalCode);
                    if (!birthDateStr.isEmpty()) {
                        try {
                            member.setBirthDate(LocalDate.parse(birthDateStr, CSV_DATE_FMT));
                        } catch (Exception ignored) {}
                    }
                    if (!birthPlace.isEmpty()) member.setBirthPlace(birthPlace);
                    if (!address.isEmpty()) member.setAddress(address);
                    if (!city.isEmpty()) member.setCity(city);
                    if (!phone.isEmpty()) member.setPhone(phone);
                    if (!membershipDateStr.isEmpty()) {
                        try {
                            member.setMembershipDate(LocalDate.parse(membershipDateStr, CSV_DATE_FMT));
                        } catch (Exception ignored) {}
                    }
                    importedCount++;
                }

                memberRepository.save(member);
            }

            return new ImportResultDto(importedCount, updatedCount, skippedCount);
        } catch (Exception e) {
            throw new RuntimeException("Errore durante l'elaborazione del CSV: " + e.getMessage(), e);
        }
    }

    private void updateFields(Member target, Member source) {
        if (source.getLastName() != null) target.setLastName(source.getLastName());
        if (source.getFirstName() != null) target.setFirstName(source.getFirstName());
        if (source.getBirthDate() != null) target.setBirthDate(source.getBirthDate());
        if (source.getBirthPlace() != null) target.setBirthPlace(source.getBirthPlace());
        if (source.getFiscalCode() != null) target.setFiscalCode(source.getFiscalCode());
        if (source.getAddress() != null) target.setAddress(source.getAddress());
        if (source.getCity() != null) target.setCity(source.getCity());
        if (source.getPhone() != null) target.setPhone(source.getPhone());
        if (source.getMembershipDate() != null) target.setMembershipDate(source.getMembershipDate());
    }

    private String trim(String s) {
        return s != null ? s.trim() : "";
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String formatDate(LocalDate date) {
        return date == null ? "" : date.format(EXPORT_DATE_FMT);
    }
}
