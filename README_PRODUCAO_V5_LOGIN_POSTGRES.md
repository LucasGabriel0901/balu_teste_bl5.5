# BALU Food v5 — Login obrigatório, SaaS e PostgreSQL

Esta versão mantém o front funcionando com `localStorage`, mas adiciona a base correta para SaaS real com backend e PostgreSQL.

## Acessos de teste no front-end

Use em `pages/login.html`:

- Desenvolvedor: `dev@balufood.com.br` / `BaluDev2026!`
- Admin BALU: `admin@balufood.com.br` / `BaluAdmin2026!`
- Representante: `representante@balufood.com.br` / `BaluRep2026!`
- Cliente teste: `cliente@balufood.com.br` / `BaluCliente2026!`

## Regra de login

O login agora é obrigatório para todas as páginas internas.

- Cliente ativo acessa o sistema.
- Cliente bloqueado/cancelado não acessa os módulos.
- Admin, representante, suporte e desenvolvedor BALU entram sem plano pago.
- Painel de controle é restrito a usuários internos BALU.

## SaaS multiempresa

O banco usa `empresa_id` nas tabelas principais. Isso separa os dados de cada cliente.

## Plano único

Plano: `BALU Food`

Ciclos:

- Mensal: R$ 250,00
- Trimestral: R$ 675,00
- Anual: R$ 2.500,00

## Pagamento

A integração correta é Mercado Pago, não Mercado Livre.

Nesta versão existe rota placeholder:

`POST /api/pagamentos/mercado-pago/assinatura`

A cobrança real deve ser implementada no backend usando variável de ambiente `MERCADO_PAGO_ACCESS_TOKEN`. Nunca coloque token no front-end.

## Rodar backend local

```txt
cd backend
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

## Correção importante de faturamento médio

O faturamento médio agora considera a média dos totais mensais registrados:

```txt
Faturamento Médio = soma dos totais mensais registrados ÷ quantidade de meses com registro
```

Se só existe julho registrado, a média é o total de julho.

## Deploy

- Front-end: GitHub Pages, Netlify ou Vercel.
- Backend/API: Render, Railway, VPS ou similar.
- PostgreSQL: Neon, Supabase, Railway, Render PostgreSQL ou VPS.

GitHub Pages sozinho não executa backend nem PostgreSQL.
