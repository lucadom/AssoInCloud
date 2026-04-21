package it.assoincloud.backend.service;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.entity.Member;
import it.assoincloud.backend.entity.MembershipYear;
import it.assoincloud.backend.repository.MemberRepository;
import it.assoincloud.backend.repository.MembershipYearRepository;

@Service
@Transactional
public class MemberService {

    private static final Logger log = LoggerFactory.getLogger(MemberService.class);
    private static final DateTimeFormatter CSV_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter EXPORT_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MemberRepository memberRepository;
    private final MembershipYearRepository membershipYearRepository;

    public MemberService(MemberRepository memberRepository, MembershipYearRepository membershipYearRepository) {
        this.memberRepository = memberRepository;
        this.membershipYearRepository = membershipYearRepository;
    }

    @Transactional(readOnly = true)
    public List<Member> findAll() {
        log.info("Fetching all members");
        return memberRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Member> findAllActive() {
        log.info("Fetching all active members");
        return memberRepository.findAllActive();
    }

    @Transactional(readOnly = true)
    public Member findById(String id) {
        log.debug("Fetching member by id: {}", id);
        return memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + id));
    }

    public Member create(Member member) {
        return create(member, null);
    }

    public Member create(Member member, List<Integer> membershipYears) {
        if (memberRepository.existsByFiscalCode(member.getFiscalCode())) {
            log.warn("Cannot create member: fiscal code already exists: {}", member.getFiscalCode());
            throw new IllegalArgumentException("Socio già esistente");
        }
        log.info("Creating member: {} {} (fiscalCode={})", member.getFirstName(), member.getLastName(), member.getFiscalCode());
        Member saved = memberRepository.save(member);
        if (membershipYears != null) {
            syncMembershipYears(saved, membershipYears);
        }
        log.info("Member created with id: {}", saved.getId());
        return saved;
    }

    public Member update(String id, Member updates) {
        return update(id, updates, null);
    }

    public Member update(String id, Member updates, List<Integer> membershipYears) {
        log.info("Updating member id: {}", id);
        Member existing = findById(id);
        updateFields(existing, updates);
        if (membershipYears != null) {
            syncMembershipYears(existing, membershipYears);
        }
        return memberRepository.save(existing);
    }

    public void delete(String id) {
        log.info("Deleting member id: {}", id);
        memberRepository.deleteById(id);
    }

    /**
     * Record membership renewal for a member for the current calendar year.
     * If the member already has the current year recorded, this is idempotent and returns success.
     * 
     * @param memberId the member ID
     * @return the updated Member with all membership years
     * @throws IllegalArgumentException if the member does not exist
     */
    public Member renewMembership(String memberId) {
        Member member = findById(memberId);
        int currentYear = Year.now().getValue();
        
        log.info("Processing renewal for member id: {} for year: {}", memberId, currentYear);
        
        // Check if member already has the current year
        if (membershipYearRepository.existsByMemberIdAndYear(memberId, currentYear)) {
            log.debug("Member {} already has membership year {}, no-op renewal", memberId, currentYear);
            return member;
        }
        
        // Create and save new membership year entry
        MembershipYear membershipYear = new MembershipYear(member, currentYear);
        membershipYearRepository.save(membershipYear);
        member.getMembershipYears().add(membershipYear);
        
        log.info("Successfully renewed membership for member id: {} for year: {}", memberId, currentYear);
        return member;
    }

    @Transactional(readOnly = true)
    public byte[] exportXlsx() {
        List<Member> members = memberRepository.findAll(Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()));
        log.info("Exporting {} members to XLSX", members.size());
        return generateXlsxBytes(members);
    }

    @Transactional(readOnly = true)
    public byte[] exportActiveXlsx() {
        List<Member> members = memberRepository.findAllActive();
        log.info("Exporting {} active members to XLSX", members.size());
        return generateXlsxBytes(members);
    }

    private byte[] generateXlsxBytes(List<Member> members) {
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
            header.createCell(9).setCellValue("Anni di iscrizione");

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
                String yearsStr = member.getMembershipYears().stream()
                    .map(my -> my.getYear().toString())
                    .sorted()
                    .reduce((a, b) -> a + "," + b)
                    .orElse("");
                row.createCell(9).setCellValue(yearsStr);
            }

            workbook.write(output);
            return output.toByteArray();
        } catch (Exception e) {
            log.error("Error during XLSX export: {}", e.getMessage(), e);
            throw new RuntimeException("Errore durante l'esportazione dei soci", e);
        }
    }

    /**
     * Import CSV with upsert logic: if member exists (by fiscal code), update only non-null fields from CSV.
     */
    public ImportResultDto importCsv(MultipartFile file) {
        log.info("Importing members from CSV file: {}", file.getOriginalFilename());
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
            log.error("Error during member CSV import for file '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
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

    private void syncMembershipYears(Member member, List<Integer> requestedYears) {
        Set<Integer> normalizedYears = normalizeMembershipYears(requestedYears);
        Set<Integer> existingYears = member.getMembershipYears().stream()
            .map(MembershipYear::getYear)
            .collect(Collectors.toSet());

        // Remove years that are no longer present in the request.
        for (Integer year : existingYears) {
            if (!normalizedYears.contains(year)) {
                membershipYearRepository.deleteByMemberIdAndYear(member.getId(), year);
            }
        }

        member.getMembershipYears().removeIf(my -> !normalizedYears.contains(my.getYear()));

        // Add new years introduced by the request.
        for (Integer year : normalizedYears) {
            if (!existingYears.contains(year)) {
                MembershipYear membershipYear = membershipYearRepository.save(new MembershipYear(member, year));
                member.getMembershipYears().add(membershipYear);
            }
        }
    }

    private Set<Integer> normalizeMembershipYears(List<Integer> years) {
        Set<Integer> normalized = new HashSet<>();
        int maxYear = Year.now().getValue() + 20;

        for (Integer year : years) {
            if (year == null || year < 1900 || year > maxYear) {
                throw new IllegalArgumentException("Anno di iscrizione non valido");
            }
            normalized.add(year);
        }

        return normalized;
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
