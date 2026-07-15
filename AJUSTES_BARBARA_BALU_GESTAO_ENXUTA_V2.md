# BALU Food - Gestão Enxuta V2

Esta versão aplica os relatórios de alteração enviados para deixar o BALU mais simples, direto e focado em indicadores gerenciais.

## Filosofia aplicada

O BALU não é PDV, ERP ou sistema financeiro completo. A proposta é substituir várias planilhas e centralizar indicadores para responder se a operação está dando lucro ou prejuízo no fim do mês.

## Ajustes principais

### Faturamento

- Alterado de lançamento por canal individual para **Novo Fechamento**.
- O usuário preenche uma única tela com os canais e valores do dia.
- Cadastro de novo canal acontece dentro da própria tela de fechamento.
- O sistema calcula total do dia, histórico mensal, média de faturamento e participação por canal.
- Configuração da média: 3, 6, 9 ou 12 meses.

### Compras do Mês

- Simplificado para data, local/fornecedor, categoria, valor total, status, observação e foto da notinha.
- Não exige item por item.
- Compras confirmadas alimentam o CMV real.

### Custos Fixos e Variáveis

- Separado em Plano Gerencial de Despesas e Registro Mensal de Custos.
- Plano é cadastrado uma vez.
- No fechamento mensal o cliente preenche somente Despesa x Valor.
- Percentual operacional é calculado automaticamente com base no faturamento médio.

### Mão de Obra

- Tela principal focada em faturamento médio, custo total da equipe, participação percentual e status.
- Faturamento não é mais informado manualmente.
- O percentual é calculado a partir do faturamento médio do módulo Faturamento.

### Insumos e Embalagens

- Cards superiores foram ajustados para indicadores de qualidade do cadastro.
- A intenção é tratar esses módulos como base de custos, não como controle operacional de estoque em tempo real.

### Dashboard

- Incluída área de **Análise Inteligente BALU**.
- Não é IA falsa. É uma análise automática por regras matemáticas, com alertas e recomendações com base em CMV, compras, mão de obra e faturamento.

### Modo escuro

- Reforçadas regras globais de contraste.
- Textos, ícones, inputs, botões, cards, tabelas, modais e sidebar receberam correção para não ficarem escuros no modo escuro.

## Arquivos principais alterados

- pages/faturamento.html
- js/faturamento.js
- pages/compras-realizadas.html
- js/compras-realizadas.js
- pages/custos-fixos-variaveis.html
- js/custos-fixos-variaveis.js
- pages/funcionarios.html
- js/funcionarios.js
- pages/dashboard.html
- js/dashboard.js
- pages/cadastro-insumos.html
- js/cadastro-insumos.js
- pages/cadastro-embalagens.html
- js/cadastro-embalagens.js
- js/layout.js
- css/global.css
- css/dashboard.css
- database/migrations/002_tabelas_mvp_complementares.sql

## Observação

O sistema continua funcionando em front-end/localStorage. As alterações de banco foram apenas preparatórias para a futura versão com backend/PostgreSQL.
