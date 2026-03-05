package it.assoincloud.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.assoincloud.backend.dto.PecSettingsDto;
import it.assoincloud.backend.service.AppSettingService;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin
public class SettingsController {

    private final AppSettingService appSettingService;

    public SettingsController(AppSettingService appSettingService) {
        this.appSettingService = appSettingService;
    }

    @GetMapping("/pec")
    public PecSettingsDto getPecSettings() {
        return appSettingService.getPecSettings();
    }

    @PutMapping("/pec")
    public ResponseEntity<PecSettingsDto> savePecSettings(@RequestBody PecSettingsDto dto) {
        appSettingService.savePecSettings(dto);
        return ResponseEntity.ok(appSettingService.getPecSettings());
    }
}
