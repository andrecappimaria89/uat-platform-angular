package com.uatplataform.api.repository.adapter;

import com.uatplataform.api.model.Scenario;
import com.uatplataform.api.repository.ScenarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ════════════════════════════════════════════════════════════════════════
 *  ADAPTADOR SQL SERVER — ESQUELETO PRONTO (inativo por enquanto)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Esta classe já implementa 100% do contrato ScenarioRepository.
 * Ela está PRONTA mas não é usada ainda — o Spring não a injeta porque
 * ScenarioSupabaseAdapter tem @Primary.
 *
 * Reutiliza a MESMA ScenarioJpaRepository do adaptador Supabase, porque
 * Spring Data JPA gera SQL compatível com qualquer banco relacional —
 * a única coisa que muda de fato é a string de conexão e o dialect
 * em application.yml (de PostgreSQLDialect para SQLServerDialect).
 *
 * ─── PASSOS PARA ATIVAR ESTE ADAPTADOR NO FUTURO ───────────────────────
 * 1. Configurar datasource do SQL Server em application.yml
 *    (spring.datasource.url, username, password, driver-class-name)
 * 2. Trocar spring.jpa.database-platform para SQLServerDialect
 * 3. Remover @Primary de ScenarioSupabaseAdapter
 * 4. Adicionar @Primary aqui nesta classe
 * 5. Rodar os scripts de migração de schema (incluídos em /sql-migration)
 *
 * Nenhum Controller, Service, DTO ou linha do Angular precisa mudar.
 * ════════════════════════════════════════════════════════════════════════
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class ScenarioSqlServerAdapter implements ScenarioRepository {

    private final ScenarioJpaRepository jpa;

    @Override
    public List<Scenario> findAll() {
        log.debug("[SQL Server] Buscando todos os cenários");
        return jpa.findAll();
    }

    @Override
    public List<Scenario> findByProjectId(UUID projectId) {
        log.debug("[SQL Server] Buscando cenários do projeto {}", projectId);
        return jpa.findByProjectId(projectId);
    }

    @Override
    public Optional<Scenario> findById(UUID id) {
        return jpa.findById(id);
    }

    @Override
    public Scenario save(Scenario scenario) {
        log.debug("[SQL Server] Salvando cenário {}", scenario.getCtId());
        return jpa.save(scenario);
    }

    @Override
    public void deleteById(UUID id) {
        log.debug("[SQL Server] Excluindo cenário {}", id);
        jpa.deleteById(id);
    }

    @Override
    public boolean existsByCtId(String ctId) {
        return jpa.existsByCtId(ctId);
    }
}
