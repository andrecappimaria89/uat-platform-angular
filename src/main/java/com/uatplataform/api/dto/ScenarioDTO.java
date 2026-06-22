package com.uatplataform.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.uatplataform.api.model.Scenario;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO espelhando exatamente a interface Scenario do Angular
 * (src/app/core/models/index.ts) para o JSON trafegar idêntico
 * entre frontend e backend sem nenhum mapeamento extra no Angular.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioDTO {

    private UUID id;

    @NotBlank(message = "CT ID é obrigatório")
    private String ctId;

    private String efId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate plannedDate;

    private UUID responsibleId;
    private String responsibleName;
    private UUID areaId;
    private String areaName;

    @NotBlank(message = "Cenário é obrigatório")
    private String scenario;

    private String feature;
    private String preconditions;

    // Campos Gherkin agrupados — o Angular usa um objeto { dado, quando, entao }
    private GherkinDTO gherkin;

    private String expectedResult;
    private String expectedEvidence;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate executionDate;

    private String effectiveExecutor;
    private String obtainedResult;
    private String realizedEvidence;
    private String status;
    private String comments;
    private UUID projectId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GherkinDTO {
        private String dado;
        private String quando;
        private String entao;
    }

    // ─── Mapeamento Entity <-> DTO ──────────────────────────────────────────

    public static ScenarioDTO fromEntity(Scenario e) {
        return ScenarioDTO.builder()
                .id(e.getId())
                .ctId(e.getCtId())
                .efId(e.getEfId())
                .plannedDate(e.getPlannedDate())
                .responsibleId(e.getResponsibleId())
                .responsibleName(e.getResponsibleName())
                .areaId(e.getAreaId())
                .areaName(e.getAreaName())
                .scenario(e.getScenario())
                .feature(e.getFeature())
                .preconditions(e.getPreconditions())
                .gherkin(GherkinDTO.builder()
                        .dado(e.getGherkinDado())
                        .quando(e.getGherkinQuando())
                        .entao(e.getGherkinEntao())
                        .build())
                .expectedResult(e.getExpectedResult())
                .expectedEvidence(e.getExpectedEvidence())
                .executionDate(e.getExecutionDate())
                .effectiveExecutor(e.getEffectiveExecutor())
                .obtainedResult(e.getObtainedResult())
                .realizedEvidence(e.getRealizedEvidence())
                .status(e.getStatus())
                .comments(e.getComments())
                .projectId(e.getProjectId())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    public Scenario toEntity() {
        Scenario e = new Scenario();
        applyToEntity(e);
        return e;
    }

    public void applyToEntity(Scenario e) {
        e.setCtId(this.ctId);
        e.setEfId(this.efId);
        e.setPlannedDate(this.plannedDate);
        e.setResponsibleId(this.responsibleId);
        e.setResponsibleName(this.responsibleName);
        e.setAreaId(this.areaId);
        e.setAreaName(this.areaName);
        e.setScenario(this.scenario);
        e.setFeature(this.feature);
        e.setPreconditions(this.preconditions);
        if (this.gherkin != null) {
            e.setGherkinDado(this.gherkin.getDado());
            e.setGherkinQuando(this.gherkin.getQuando());
            e.setGherkinEntao(this.gherkin.getEntao());
        }
        e.setExpectedResult(this.expectedResult);
        e.setExpectedEvidence(this.expectedEvidence);
        e.setExecutionDate(this.executionDate);
        e.setEffectiveExecutor(this.effectiveExecutor);
        e.setObtainedResult(this.obtainedResult);
        e.setRealizedEvidence(this.realizedEvidence);
        e.setStatus(this.status);
        e.setComments(this.comments);
        e.setProjectId(this.projectId);
    }
}
