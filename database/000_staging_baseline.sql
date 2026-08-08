-- Baseline para um banco vazio de homologacao.
-- Execute os tres arquivos abaixo, nesta ordem, com psql a partir desta pasta:
-- \ir 001_initial_schema.sql
-- \ir 002_workspace_invitations.sql
-- \ir 003_household_collaboration.sql
--
-- Este arquivo e um orquestrador psql e nao deve ser aplicado em producao.
\set ON_ERROR_STOP on
\ir 001_initial_schema.sql
\ir 002_workspace_invitations.sql
\ir 003_household_collaboration.sql
