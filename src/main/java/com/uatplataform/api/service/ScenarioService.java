package com.uatplataform.api.service;

import com.uatplataform.api.dto.ScenarioDTO;
import com.uatplataform.api.exception.BusinessException;
import com.uatplataform.api.exception.ResourceNotFoundException;
import com.uatplataform.api.model.Scenario;
import com.uatplataform.api.repository.ScenarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Camada de negócio para Scenarios.
 *
 * IMPORTANTE: esta classe depende apenas da interface ScenarioRepository
 * (o contrato), nunca de ScenarioSupabaseAdapter ou ScenarioSqlServerAdapter
 * diretamente. O Spring injeta automaticamente qual implementação está
 * marcada como @Primary no momento.
 *
 * Isso significa que ao trocar de banco, esta classe não muda absolutamente
 * nada — ela continua chamando os mesmos métodos da mesma interface.
 */
@Service
@RequiredArgsConstructor
public class ScenarioService {

    private final ScenarioRepository repository;

    @Transactional(readOnly = true)
    public List<ScenarioDTO> findAll(UUID projectId) {
        List<Scenario> scenarios = (projectId != null)
                ? repository.findByProjectId(projectId)
                : repository.findAll();

        return scenarios.stream()
                .map(ScenarioDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ScenarioDTO findById(UUID id) {
        Scenario scenario = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cenário não encontrado: " + id));
        return ScenarioDTO.fromEntity(scenario);
    }

    @Transactional
    public ScenarioDTO create(ScenarioDTO dto) {
        // Regra de negócio: projeto é obrigatório
        if (dto.getProjectId() == null) {
            throw new BusinessException("Projeto é obrigatório para criar um cenário.");
        }
        // Regra de negócio: CT ID não pode duplicar
        if (dto.getCtId() != null && repository.existsByCtId(dto.getCtId())) {
            throw new BusinessException("Já existe um cenário com CT ID: " + dto.getCtId());
        }

        Scenario entity = dto.toEntity();
        entity.setId(UUID.randomUUID());
        entity.setCreatedAt(OffsetDateTime.now());
        entity.setUpdatedAt(OffsetDateTime.now());

        Scenario saved = repository.save(entity);
        return ScenarioDTO.fromEntity(saved);
    }

    @Transactional
    public ScenarioDTO update(UUID id, ScenarioDTO dto) {
        Scenario existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cenário não encontrado: " + id));

        dto.applyToEntity(existing);
        existing.setUpdatedAt(OffsetDateTime.now());

        Scenario saved = repository.save(existing);
        return ScenarioDTO.fromEntity(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (repository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Cenário não encontrado: " + id);
        }
        repository.deleteById(id);
    }
}
