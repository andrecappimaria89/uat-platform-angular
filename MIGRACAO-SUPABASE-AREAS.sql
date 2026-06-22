-- ════════════════════════════════════════════════════════════════════════
--  MIGRAÇÃO NECESSÁRIA NO SUPABASE — Coluna "members" em areas
-- ════════════════════════════════════════════════════════════════════════
--
-- Esta migração é necessária para suportar múltiplos usuários vinculados
-- a uma área (Item 14 do prompt de correção: "A área poderá possuir 1
-- ou mais usuários cadastrados").
--
-- Execute este comando no Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → colar e Run):

ALTER TABLE areas ADD COLUMN IF NOT EXISTS members jsonb DEFAULT '[]'::jsonb;

-- Verificação após executar:
-- SELECT id, name, responsible_name, members FROM areas LIMIT 5;
