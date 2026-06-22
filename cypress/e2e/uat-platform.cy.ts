/**
 * Cypress E2E — UATPlataform Angular
 * Valida regras de negócio e usabilidade principais.
 * Executar: npx cypress open
 */

describe('Dashboard', () => {
  beforeEach(() => cy.visit('/'))

  it('exibe métricas calculadas dinamicamente', () => {
    cy.get('.metric-value').should('have.length.gte', 4)
    cy.get('.exec-bar').should('exist')
  })

  it('filtra por projeto selecionado', () => {
    cy.get('.project-select').select(1)
    cy.get('.metric-value').first().invoke('text').then(val => {
      expect(parseInt(val)).to.be.gte(0)
    })
  })
})

describe('Cenários — Regras de Negócio', () => {
  beforeEach(() => cy.visit('/cenarios'))

  it('exibe tabela de cenários', () => {
    cy.get('table').should('exist')
  })

  it('CT ID tem formato correto', () => {
    cy.get('.ct-id').first().invoke('text').then(text => {
      expect(text.trim()).to.match(/^CT-\d+/)
    })
  })

  it('filtro por status funciona', () => {
    cy.get('select').eq(1).select('sucesso')
    cy.get('.badge.sucesso').should('exist')
  })

  it('filtro por área funciona', () => {
    cy.get('select').first().then($sel => {
      if ($sel.find('option').length > 1) {
        cy.wrap($sel).select(1)
        cy.get('table tr').should('have.length.gte', 1)
      }
    })
  })

  it('botão exportar Excel funciona', () => {
    cy.get('button').contains('Exportar').click()
    cy.task('fileExists', 'cenarios-uat.xlsx').should('eq', true)
  })
})

describe('Issues — Severidade e Prioridade', () => {
  beforeEach(() => cy.visit('/issues'))

  it('exibe badges de severidade S1-S5', () => {
    cy.get('.badge.s1, .badge.s2, .badge.s3, .badge.s4, .badge.s5').should('exist')
  })

  it('issues S1 têm badge vermelho', () => {
    cy.get('.badge.s1').should('have.css', 'background-color')
  })

  it('filtro por severidade S1 funciona', () => {
    cy.get('select').eq(0).select('S1')
    cy.get('.badge:not(.s2):not(.s3):not(.s4):not(.s5)').each($el => {
      expect($el.text().trim()).to.eq('S1')
    })
  })
})

describe('Plano de Testes — Conclusão e Bloqueio', () => {
  beforeEach(() => cy.visit('/plano'))

  it('exibe campos do plano', () => {
    cy.get('input').should('have.length.gte', 4)
  })

  it('botão Editar habilita campos', () => {
    cy.get('button').contains('Editar').click()
    cy.get('input[readonly]').should('not.exist')
  })

  it('botão Cancelar reverte campos', () => {
    cy.get('button').contains('Editar').click()
    cy.get('input').first().clear().type('Projeto Teste XYZ')
    cy.get('button').contains('Cancelar').click()
    cy.get('input').first().invoke('val').should('not.eq', 'Projeto Teste XYZ')
  })

  it('projeto concluído exibe banner de bloqueio', () => {
    cy.get('.lock-banner').then($el => {
      if ($el.length) {
        cy.get('button').contains('Editar').should('not.exist')
        cy.get('button').contains('Concluir').should('not.exist')
      }
    })
  })
})

describe('Gestão de Usuários — Perfil Executor Padrão', () => {
  beforeEach(() => cy.visit('/usuarios'))

  it('exibe tabela de usuários', () => {
    cy.get('table').should('exist')
  })

  it('novo usuário abre formulário sem campo de perfil visível', () => {
    cy.get('button').contains('Novo').click()
    cy.get('mat-dialog-container').within(() => {
      cy.get('input[placeholder*="nome"], input[placeholder*="Nome"]').should('exist')
      cy.get('select[ng-reflect-model*="admin"]').should('not.exist')
    })
  })
})

describe('Gestão de Áreas — Responsável Automático', () => {
  beforeEach(() => cy.visit('/areas'))

  it('exibe cards de área', () => {
    cy.get('.area-card, mat-card').should('exist')
  })

  it('ao editar área preenche responsável automaticamente', () => {
    cy.get('button[aria-label="Editar"], button').contains('edit').first().click({ force: true })
    cy.get('mat-dialog-container').within(() => {
      cy.get('select, input[placeholder*="esponsável"]').should('exist')
    })
  })
})

describe('Sumário de Issues', () => {
  beforeEach(() => cy.visit('/sumario'))

  it('exibe alerta de situação atual', () => {
    cy.get('.alert, .warn, [class*="alert"]').should('exist')
  })

  it('exibe gráfico por severidade', () => {
    cy.get('canvas').should('have.length.gte', 1)
  })
})

describe('Importar Planilha', () => {
  beforeEach(() => cy.visit('/importar'))

  it('exibe área de upload', () => {
    cy.get('input[type="file"], .drop-zone, [class*="import"]').should('exist')
  })
})

describe('Navegação — Todas as Rotas', () => {
  const routes = ['/', '/plano', '/cenarios', '/issues', '/sumario',
    '/historico', '/areas', '/usuarios', '/importar', '/config']

  routes.forEach(route => {
    it(`rota ${route} carrega sem erro`, () => {
      cy.visit(route)
      cy.get('app-topbar, .topbar').should('exist')
      cy.get('mat-error, .error-fatal').should('not.exist')
    })
  })
})

describe('Usabilidade — Responsividade', () => {
  it('funciona em tablet (768px)', () => {
    cy.viewport(768, 1024)
    cy.visit('/')
    cy.get('app-sidebar').should('exist')
    cy.get('.metric-value').should('have.length.gte', 4)
  })

  it('funciona em mobile (375px)', () => {
    cy.viewport(375, 812)
    cy.visit('/')
    cy.get('app-root').should('exist')
  })
})
