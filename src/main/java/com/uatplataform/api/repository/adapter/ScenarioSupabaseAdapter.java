package com.uatplataform.api.repository.adapter;

import com.uatplataform.api.model.Scenario;
import com.uatplataform.api.repository.ScenarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ════════════════════════════════════════════════════════════════════════
 *  ADAPTADOR SUPABASE — ATIVO (banco atual)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Implementa o contrato ScenarioRepository usando Spring Data JPA
 * conectado ao PostgreSQL do Supabase (configurado em application.yml).
 *
 * @Primary marca este adaptador como o que o Spring injeta por padrão.
 * Quando migrar para SQL Server, troque @Primary para
 * ScenarioSqlServerAdapter e remova daqui — só isso muda.
 * ════════════════════════════════════════════════════════════════════════
 */
@Repository
@Primary
@RequiredArgsConstructor
@Slf4j
public class ScenarioSupabaseAdapter implements ScenarioRepository {

    private final ScenarioJpaRepository jpa;

    @Override
    public List<Scenario> findAll() {
        log.debug("[Supabase] Buscando todos os cenários");
        return jpa.findAll();
    }

    @Override
    public List<Scenario> findByProjectId(UUID projectId) {
        log.debug("[Supabase] Buscando cenários do projeto {}", projectId);
        return jpa.findByProjectId(projectId);
    }

    @Override
    public Optional<Scenario> findById(UUID id) {
        return jpa.findById(id);
    }

    @Override
    public Scenario save(Scenario scenario) {
        log.debug("[Supabase] Salvando cenário {}", scenario.getCtId());
        return jpa.save(scenario);
    }

    @Override
    public void deleteById(UUID id) {
        log.debug("[Supabase] Excluindo cenário {}", id);
        jpa.deleteById(id);
    }

    @Override
    public boolean existsByCtId(String ctId) {
        return jpa.existsByCtId(ctId);
    }
}
