package com.uatplataform.api;

import com.uatplataform.api.dto.ScenarioDTO;
import com.uatplataform.api.exception.BusinessException;
import com.uatplataform.api.exception.ResourceNotFoundException;
import com.uatplataform.api.service.ScenarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Teste de integração — valida que o padrão Repository funciona
 * de ponta a ponta (Controller → Service → Repository → Adapter → Banco)
 * usando H2 em memória no lugar do Supabase real.
 *
 * Isso prova que a arquitetura agnóstica de banco está correta:
 * o MESMO código de Service/Controller funciona tanto aqui (H2)
 * quanto vai funcionar com Supabase (PostgreSQL) e futuramente
 * com SQL Server — porque tudo passa pela interface ScenarioRepository.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "app.cors.allowed-origin=http://localhost:4200"
})
@Transactional
class ScenarioServiceIntegrationTest {

    @Autowired
    private ScenarioService service;

    @Test
    void deveCriarCenarioComProjetoObrigatorio() {
        ScenarioDTO dto = ScenarioDTO.builder()
                .ctId("CT-TEST-001")
                .scenario("Cenário de teste de integração")
                .status("todo")
                .projectId(UUID.randomUUID())
                .gherkin(ScenarioDTO.GherkinDTO.builder()
                        .dado("um usuário autenticado")
                        .quando("ele cria um cenário")
                        .entao("o sistema persiste corretamente")
                        .build())
                .build();

        ScenarioDTO created = service.create(dto);

        assertThat(created.getId()).isNotNull();
        assertThat(created.getCtId()).isEqualTo("CT-TEST-001");
        assertThat(created.getCreatedAt()).isNotNull();
    }

    @Test
    void deveRejeitarCenarioSemProjeto() {
        ScenarioDTO dto = ScenarioDTO.builder()
                .ctId("CT-TEST-002")
                .scenario("Cenário sem projeto")
                .status("todo")
                .projectId(null)
                .build();

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Projeto é obrigatório");
    }

    @Test
    void deveRejeitarCtIdDuplicado() {
        UUID projectId = UUID.randomUUID();
        ScenarioDTO first = ScenarioDTO.builder()
                .ctId("CT-DUP-001")
                .scenario("Primeiro cenário")
                .status("todo")
                .projectId(projectId)
                .build();
        service.create(first);

        ScenarioDTO duplicate = ScenarioDTO.builder()
                .ctId("CT-DUP-001")
                .scenario("Cenário duplicado")
                .status("todo")
                .projectId(projectId)
                .build();

        assertThatThrownBy(() -> service.create(duplicate))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe");
    }

    @Test
    void deveAtualizarCenarioExistente() {
        ScenarioDTO created = service.create(ScenarioDTO.builder()
                .ctId("CT-TEST-003")
                .scenario("Cenário original")
                .status("todo")
                .projectId(UUID.randomUUID())
                .build());

        created.setStatus("sucesso");
        created.setScenario("Cenário atualizado");

        ScenarioDTO updated = service.update(created.getId(), created);

        assertThat(updated.getStatus()).isEqualTo("sucesso");
        assertThat(updated.getScenario()).isEqualTo("Cenário atualizado");
    }

    @Test
    void deveListarCenariosPorProjeto() {
        UUID projectA = UUID.randomUUID();
        UUID projectB = UUID.randomUUID();

        service.create(ScenarioDTO.builder().ctId("CT-A-1").scenario("A1").status("todo").projectId(projectA).build());
        service.create(ScenarioDTO.builder().ctId("CT-A-2").scenario("A2").status("todo").projectId(projectA).build());
        service.create(ScenarioDTO.builder().ctId("CT-B-1").scenario("B1").status("todo").projectId(projectB).build());

        List<ScenarioDTO> resultA = service.findAll(projectA);

        assertThat(resultA).hasSize(2);
        assertThat(resultA).extracting(ScenarioDTO::getCtId).containsExactlyInAnyOrder("CT-A-1", "CT-A-2");
    }

    @Test
    void deveExcluirCenario() {
        ScenarioDTO created = service.create(ScenarioDTO.builder()
                .ctId("CT-DEL-001")
                .scenario("Cenário a excluir")
                .status("todo")
                .projectId(UUID.randomUUID())
                .build());

        service.delete(created.getId());

        assertThatThrownBy(() -> service.findById(created.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
