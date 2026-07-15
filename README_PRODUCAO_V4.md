# BALU Food v4 — Pronto para subir e preparar banco

Esta versão inclui:

- ajustes visuais e contraste no modo escuro;
- animações leves;
- planos com ciclo mensal, trimestral e anual;
- painel de controle interno mantido fora do menu do cliente;
- backend Node.js/Express preparado;
- schema PostgreSQL de produção;
- guia de deploy.

## Subir front-end

Faça push normalmente para o repositório do front.

## Backend

A API está na pasta `backend/`.

Ela ainda é uma estrutura base para produção. O front-end continua funcionando com `localStorage` até a integração final com a API.

## Banco

Use:

`backend/migrations/001_schema_producao_balu_food.sql`

## Observação

GitHub Pages não executa backend nem banco. Para PostgreSQL real, hospede a API em Render/Railway/VPS e o banco em Neon, Supabase, Render PostgreSQL, Railway PostgreSQL ou outro provedor PostgreSQL.
