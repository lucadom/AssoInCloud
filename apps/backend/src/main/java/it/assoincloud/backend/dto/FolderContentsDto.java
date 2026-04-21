package it.assoincloud.backend.dto;

import java.util.List;

public record FolderContentsDto(List<FolderDto> folders, List<DocumentFileDto> files) {}
