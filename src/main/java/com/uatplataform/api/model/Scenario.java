package com.uatplataform.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entidade Scenario — mapeamento JPA padrão ANSI SQL.
 *
 * Esta classe é o "contrato de dados" e funciona sem alteração tanto em
 * PostgreSQL (Supabase) quanto em SQL Server, porque usa apenas tipos
 * e anotações JPA genéricas — nada específico de um banco.
 *
 * A tabela já existe no Supabase (criada durante o desenvolvimento Angular)
 * e o nome/colunas abaixo são espelho exato dela.
 */
@Entity
@Table(name = "scenarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Scenario {

    @Id
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "ct_id", nullable = false, length = 50)
    private String ctId;

    @Column(name = "ef_id", length = 50)
    private String efId;

    @Column(name = "planned_date")
    private java.time.LocalDate plannedDate;

    @Column(name = "responsible_id", columnDefinition = "uuid")
    private UUID responsibleId;

    @Column(name = "responsible_name", length = 200)
    private String responsibleName;

    @Column(name = "area_id", columnDefinition = "uuid")
    private UUID areaId;

    @Column(name = "area_name", length = 200)
    private String areaName;

    @Column(name = "scenario", nullable = false, columnDefinition = "text")
    private String scenario;

    @Column(name = "feature", length = 200)
    private String feature;

    @Column(name = "preconditions", columnDefinition = "text")
    private String preconditions;

    @Column(name = "gherkin_dado", columnDefinition = "text")
    private String gherkinDado;

    @Column(name = "gherkin_quando", columnDefinition = "text")
    private String gherkinQuando;

    @Column(name = "gherkin_entao", columnDefinition = "text")
    private String gherkinEntao;

    @Column(name = "expected_result", columnDefinition = "text")
    private String expectedResult;

    @Column(name = "expected_evidence", columnDefinition = "text")
    private String expectedEvidence;

    @Column(name = "execution_date")
    private java.time.LocalDate executionDate;

    @Column(name = "effective_executor", length = 200)
    private String effectiveExecutor;

    @Column(name = "obtained_result", columnDefinition = "text")
    private String obtainedResult;

    @Column(name = "realized_evidence", columnDefinition = "text")
    private String realizedEvidence;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "comments", columnDefinition = "text")
    private String comments;

    @Column(name = "project_id", columnDefinition = "uuid")
    private UUID projectId;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
