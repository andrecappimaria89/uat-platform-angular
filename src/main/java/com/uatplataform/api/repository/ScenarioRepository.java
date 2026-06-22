package com.uatplataform.api.repository;

import com.uatplataform.api.model.Scenario;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ════════════════════════════════════════════════════════════════════════
 *  CONTRATO AGNÓSTICO DE BANCO — Repository Pattern
 * ════════════════════════════════════════════════════════════════════════
 *
 * Esta interface define O QUE a aplicação precisa fazer com Scenarios,
 * nunca COMO isso é feito em um banco específico.
 *
 * O resto da API (controllers, services) depende SOMENTE desta interface.
 * Nenhuma classe de negócio conhece Supabase, PostgreSQL ou SQL Server.
 *
 * Hoje:    ScenarioSupabaseAdapter implementa esta interface usando
 *          Spring Data JPA configurado para PostgreSQL (Supabase).
 *
 * Amanhã:  Quando migrar para SQL Server, basta criar
 *          ScenarioSqlServerAdapter implementando esta MESMA interface,
 *          e trocar 1 linha de configuração (@Primary) em application.yml.
 *          Nenhum Controller, Service ou linha do Angular muda.
 * ════════════════════════════════════════════════════════════════════════
 */
public interface ScenarioRepository {

    List<Scenario> findAll();

    List<Scenario> findByProjectId(UUID projectId);

    Optional<Scenario> findById(UUID id);

    Scenario save(Scenario scenario);

    void deleteById(UUID id);

    boolean existsByCtId(String ctId);
}
