export const SCENARIO_STATUS_LABELS: Record<string, string> = {
  todo:      'To Do',
  em_teste:  'Em Teste',
  bloqueado: 'Bloqueado',
  falha:     'Falha',
  sucesso:   'Sucesso',
}

export const SCENARIO_STATUS_OPTIONS = Object.entries(SCENARIO_STATUS_LABELS)
  .map(([value, label]) => ({ value, label }))

export const VALID_SCENARIO_STATUSES = Object.keys(SCENARIO_STATUS_LABELS)

export const SEVERITY_LABELS: Record<string, string> = {
  S1: 'S1 – Bloqueio Homologação Total',
  S2: 'S2 – Bloqueio Homologação Parcial',
  S3: 'S3 – Bloqueio de Cenário Específico',
  S4: 'S4 – Não Bloqueante',
  S5: 'S5 – Estético / Usabilidade',
}
export const SEVERITY_OPTIONS = Object.entries(SEVERITY_LABELS).map(([v,l])=>({value:v,label:l}))

export const PRIORITY_LABELS: Record<string, string> = {
  P1: 'P1 – Correção Imediata',
  P2: 'P2 – Correção no Ciclo de Homologação',
  P3: 'P3 – Correção Pós com Aceite de Risco',
  P4: 'P4 – Backlog / Melhoria',
}
export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([v,l])=>({value:v,label:l}))

export const ISSUE_STATUS_LABELS: Record<string, string> = {
  aberto:      'Aberto',
  em_analise:  'Em Análise',
  em_correcao: 'Em Correção',
  homologando: 'Homologando',
  encerrado:   'Encerrado',
  cancelado:   'Cancelado',
}
export const ISSUE_STATUS_OPTIONS = Object.entries(ISSUE_STATUS_LABELS).map(([v,l])=>({value:v,label:l}))

export const USER_ROLE_LABELS: Record<string, string> = {
  admin:       'Administrador',
  gestor:      'Gestor',
  executor:    'Executor',
  stakeholder: 'Somente Leitura',
}

// Status removido: "concluido" — descontinuado por regra de negócio.
// Ordem alinhada ao fluxo real do teste: pendente → execução → resultado.
export const STATUS_COLORS: Record<string, string> = {
  todo: '#888780', em_teste: '#378ADD', bloqueado: '#A32D2D',
  falha: '#791F1F', sucesso: '#3B6D11',
}

export const SEVERITY_COLORS: Record<string, string> = {
  S1: '#E24B4A', S2: '#F09595', S3: '#EF9F27', S4: '#FAC775', S5: '#B5D4F4',
}

export const PRIORITY_COLORS: Record<string, string> = {
  P1: '#E24B4A', P2: '#EF9F27', P3: '#FAC775', P4: '#D3D1C7',
}
