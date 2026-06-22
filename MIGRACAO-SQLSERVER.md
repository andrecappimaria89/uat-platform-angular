# Mapeamento de Schema — Supabase (PostgreSQL) → SQL Server

Este documento existe para quando a migração de banco acontecer de fato.
Ele mapeia cada tipo de coluna usado no Supabase para o equivalente em SQL Server.

## Tabela: scenarios

| Coluna | PostgreSQL (Supabase) | SQL Server (futuro) |
|---|---|---|
| id | uuid | uniqueidentifier |
| ct_id | varchar(50) | nvarchar(50) |
| ef_id | varchar(50) | nvarchar(50) |
| planned_date | date | date |
| responsible_id | uuid | uniqueidentifier |
| responsible_name | varchar(200) | nvarchar(200) |
| area_id | uuid | uniqueidentifier |
| area_name | varchar(200) | nvarchar(200) |
| scenario | text | nvarchar(max) |
| feature | varchar(200) | nvarchar(200) |
| preconditions | text | nvarchar(max) |
| gherkin_dado | text | nvarchar(max) |
| gherkin_quando | text | nvarchar(max) |
| gherkin_entao | text | nvarchar(max) |
| status | varchar(30) | nvarchar(30) |
| project_id | uuid | uniqueidentifier |
| created_at | timestamptz | datetimeoffset |
| updated_at | timestamptz | datetimeoffset |

## O que muda de verdade na migração

A camada JPA (`@Entity Scenario.java`) já usa tipos genéricos do Java
(`UUID`, `String`, `LocalDate`, `OffsetDateTime`) — o Hibernate traduz
automaticamente para o tipo nativo correto de cada banco através do
`dialect` configurado em `application.yml`. Por isso a entidade Java
não muda nada nessa migração — só o dialect e a connection string mudam.

## O que precisa ser recriado manualmente

1. **Schema SQL Server**: rodar `CREATE TABLE` equivalente usando os
   tipos da tabela acima (ou usar `ddl-auto: update` uma única vez em
   ambiente de homologação para o Hibernate gerar o schema automaticamente,
   depois validar e travar de volta em `validate`).

2. **Row Level Security (RLS)**: o Supabase garante isso automaticamente
   no banco. Em SQL Server isso não existe nativamente — a lógica de
   "usuário só vê dados do seu projeto" precisa ser implementada
   manualmente nos Services (filtros explícitos por `project_id`
   baseados no usuário autenticado).

3. **Autenticação**: o Supabase Auth resolve login/sessão hoje. A API
   Spring Boot precisa de uma solução própria de autenticação
   independente do banco (JWT, por exemplo) ANTES da migração, para
   que trocar de banco não quebre o login também.

## Checklist de ativação do adaptador SQL Server

- [ ] Servidor SQL Server provisionado e acessível
- [ ] Schema criado com os tipos da tabela de mapeamento acima
- [ ] Variáveis de ambiente `SQLSERVER_DB_URL`, `SQLSERVER_DB_USER`,
      `SQLSERVER_DB_PASSWORD` configuradas
- [ ] `application-sqlserver.yml` renomeado para `application.yml`
      (ou ativado via `--spring.profiles.active=sqlserver`)
- [ ] `@Primary` movido de `ScenarioSupabaseAdapter` para
      `ScenarioSqlServerAdapter` (repetir para os demais adaptadores
      quando forem criados: Issue, Area, User, Plan, Version)
- [ ] Testes de integração rodados contra o SQL Server real
- [ ] `GET /api/health/database` confirmando `connected: true` e
      `database: Microsoft SQL Server`
