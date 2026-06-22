package com.uatplataform.api.controller;

import com.uatplataform.api.dto.ScenarioDTO;
import com.uatplataform.api.service.ScenarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints REST para Scenarios.
 *
 * Esta classe não conhece Supabase nem SQL Server — ela só chama
 * ScenarioService, que por sua vez fala com a interface ScenarioRepository.
 *
 * O Angular consome estes endpoints exatamente como consumia o SDK do
 * Supabase, só trocando o cliente HTTP usado no DataService.
 */
@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class ScenarioController {

    private final ScenarioService service;

    @GetMapping
    public ResponseEntity<List<ScenarioDTO>> findAll(
            @RequestParam(required = false) UUID projectId) {
        return ResponseEntity.ok(service.findAll(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScenarioDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScenarioDTO> create(@Valid @RequestBody ScenarioDTO dto) {
        ScenarioDTO created = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScenarioDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ScenarioDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
