package com.uatplataform.api.repository.adapter;

import com.uatplataform.api.model.Scenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Interface técnica do Spring Data JPA.
 *
 * Esta é a camada que o Spring gera automaticamente (sem precisar escrever
 * implementação). Funciona idêntica tanto para PostgreSQL quanto SQL Server
 * porque o Spring Data JPA traduz os métodos para SQL ANSI compatível com
 * o dialect configurado em application.yml.
 *
 * Os adaptadores (Supabase e SQL Server) usam esta interface por baixo.
 */
public interface ScenarioJpaRepository extends JpaRepository<Scenario, UUID> {

    List<Scenario> findByProjectId(UUID projectId);

    boolean existsByCtId(String ctId);
}
