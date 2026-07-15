# BALU Food — Guia de Deploy Produção

Esta versão está pronta para subir o **front-end** e já inclui estrutura para **PostgreSQL + API**.

## 1. O que pode subir agora

### Front-end
Pode subir em:
- GitHub Pages
- Vercel
- Netlify

O front-end continua funcionando com `localStorage` enquanto a API não estiver conectada.

### Backend/API
Para banco real, precisa hospedar a API separadamente, por exemplo:
- Render
- Railway
- VPS/Hostinger VPS
- servidor com Node.js

O GitHub Pages **não roda backend** e **não conecta no PostgreSQL**.

## 2. Banco PostgreSQL

Use o arquivo:

`backend/migrations/001_schema_producao_balu_food.sql`

ou a cópia em:

`database/migrations/001_schema_producao_balu_food.sql`

Esse script cria:
- clientes/empresas;
- usuários;
- plano único BALU Food;
- ciclos mensal, trimestral e anual;
- assinaturas;
- pagamentos;
- insumos;
- embalagens;
- mão de obra;
- custos fixos e variáveis;
- faturamento;
- compras de estoque;
- inventários;
- fichas técnicas;
- precificação;
- vendas do mês;
- feedbacks;
- logs.

## 3. Como rodar a API localmente

Entre na pasta:

`backend`

Rode:

`npm install`

Crie um `.env` baseado no `.env.example`.

Depois rode:

`npm run dev`

Teste:

`http://localhost:3000/api/health`

## 4. Painel de Controle

O painel interno está em:

`pages/painel-controle.html`

Ele **não aparece no menu do cliente**.

Existem duas formas de usar em produção:

### Opção A — Mesmo domínio
Exemplo:

`https://seudominio.com/pages/painel-controle.html`

Vantagem: simples.
Desvantagem: o link existe no mesmo projeto, então precisa de autenticação forte no backend.

### Opção B — Subdomínio recomendado
Exemplo:

`https://admin.seudominio.com`

Vantagem: mais profissional e separado para o dono do SaaS.
Desvantagem: exige configurar DNS/subdomínio.

Para começar, pode manter no mesmo projeto, escondido do menu. Na produção real, usar login via backend.

## 5. Planos

Existe apenas um plano:

**BALU Food**

Ciclos:
- Mensal: R$ 250,00
- Trimestral: R$ 675,00
- Anual: R$ 2.500,00

O cliente pode continuar, solicitar cancelamento, atrasar pagamento, ser bloqueado ou cancelado.

## 6. Pagamento

A tela está preparada visualmente.

A cobrança real precisa ser feita no backend, nunca no JavaScript público.

Não coloque token de Mercado Pago, Stripe ou outro gateway no front-end.


## BALU v5 — login, SaaS e painel

- Login obrigatório em todas as páginas internas.
- Painel administrativo pode ficar em `/admin.html` no mesmo domínio durante o MVP.
- Em produção, preferir `admin.balufood.com.br` para a central interna e `app.balufood.com.br` para clientes.
- O painel só é seguro se protegido por backend/JWT e perfil interno (`admin_balu`, `representante_balu`, `suporte_balu`, `desenvolvedor_balu`).
- Pagamentos devem ser criados via backend usando Mercado Pago, nunca pelo front.
