package it.assoincloud.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import it.assoincloud.backend.entity.AppSetting;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {
}
