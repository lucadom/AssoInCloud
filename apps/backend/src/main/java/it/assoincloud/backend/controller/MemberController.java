package it.assoincloud.backend.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.dto.MemberDto;
import it.assoincloud.backend.entity.Member;
import it.assoincloud.backend.service.MemberService;

@RestController
@RequestMapping("/api/members")
@CrossOrigin
public class MemberController {

    private static final Logger log = LoggerFactory.getLogger(MemberController.class);

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public List<MemberDto> list() {
        return memberService.findAll().stream()
                .map(MemberDto::from)
                .toList();
    }

    @GetMapping("/{id}")
    public MemberDto get(@PathVariable String id) {
        return MemberDto.from(memberService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<?> create(@RequestBody MemberFormData data) {
        Member member = new Member(data.lastName(), data.firstName(), data.fiscalCode());
        applyFormData(member, data);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MemberDto.from(memberService.create(member)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody MemberFormData data) {
        Member updates = new Member();
        applyFormData(updates, data);
        return ResponseEntity.ok(MemberDto.from(memberService.update(id, updates)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        memberService.delete(id);
    }

    @PostMapping("/import-csv")
    public ResponseEntity<?> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            ImportResultDto result = memberService.importCsv(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("CSV member import failed for file '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Errore durante l'importazione del CSV: " + e.getMessage()));
        }
    }

    @GetMapping("/export-xlsx")
    public ResponseEntity<?> exportXlsx() {
        try {
            byte[] data = memberService.exportXlsx();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"soci.xlsx\"")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(data);
        } catch (Exception e) {
            log.error("XLSX member export failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Errore durante l'esportazione dei soci"));
        }
    }

    private void applyFormData(Member member, MemberFormData data) {
        member.setLastName(data.lastName());
        member.setFirstName(data.firstName());
        member.setFiscalCode(data.fiscalCode());
        
        if (data.birthDate() != null && !data.birthDate().isBlank()) {
            member.setBirthDate(LocalDate.parse(data.birthDate()));
        }
        if (data.birthPlace() != null) {
            member.setBirthPlace(data.birthPlace());
        }
        if (data.address() != null) {
            member.setAddress(data.address());
        }
        if (data.city() != null) {
            member.setCity(data.city());
        }
        if (data.phone() != null) {
            member.setPhone(data.phone());
        }
        if (data.membershipDate() != null && !data.membershipDate().isBlank()) {
            member.setMembershipDate(LocalDate.parse(data.membershipDate()));
        }
    }

    public record MemberFormData(
        String lastName,
        String firstName,
        String birthDate,
        String birthPlace,
        String fiscalCode,
        String address,
        String city,
        String phone,
        String membershipDate
    ) {}
}
