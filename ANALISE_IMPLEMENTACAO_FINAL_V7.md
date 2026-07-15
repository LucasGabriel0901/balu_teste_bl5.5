# BALU Food — Análise e Implementação Final V7

## 1. O que o BALU Food é

O BALU Food é um SaaS de gestão enxuta para negócios de alimentação. Ele não deve ser posicionado como PDV, ERP ou sistema financeiro completo. O objetivo é substituir planilhas gerenciais e responder, no fim do mês, se a operação está dando lucro ou prejuízo.

## 2. Princípios usados nesta versão

- Pouca burocracia e mínimo de cliques.
- Cada informação possui uma única origem.
- Cadastros estruturais são feitos uma vez.
- Lançamentos periódicos pedem apenas valores ou quantidades.
- O usuário informa a realidade da operação; o BALU faz os cálculos.
- Todo peso interno deve ser tratado em gramas quando aplicável.
- Fotos e observações ficam ao final dos cadastros.
- O Dashboard deve ser executivo, não operacional.

## 3. Ordem ideal de preenchimento

1. Configurações da empresa.
2. Cadastro de Insumos.
3. Cadastro de Embalagens.
4. Mão de Obra.
5. Plano Gerencial de Despesas.
6. Faturamento diário por canal.
7. Custos do mês.
8. Compras de Insumos e Embalagens.
9. Inventário / Fechamento de Estoque.
10. Fichas Técnicas.
11. Vendas do Mês.
12. Precificação.
13. Dashboard e Relatórios.

## 4. Mapa de módulos

### Faturamento

Deve registrar fechamento diário, não vendas individuais.

O usuário preenche:
- data;
- canal;
- valor por canal;
- observações.

O sistema calcula:
- total do dia;
- total do mês;
- faturamento médio mensal;
- participação por canal.

Regra principal:
Faturamento Médio = soma dos totais mensais registrados / número de meses com registro.

### Cadastro de Insumos

É base de custos, não controle operacional de estoque.

Deve manter:
- nome;
- código;
- grupo;
- unidade de compra;
- unidade de consumo;
- peso/quantidade da embalagem;
- fator de correção;
- fornecedores dinâmicos;
- preços;
- estoque ideal;
- armazenamento;
- foto ao final.

Deve remover ou reduzir:
- estoque atual;
- estoque mínimo;
- valor em estoque;
- status crítico;
- lote;
- validade;
- marca preferida.

### Cadastro de Embalagens

Deve seguir o mesmo fluxo do Cadastro de Insumos.

Deve manter:
- nome;
- grupo;
- unidade de compra;
- unidade de utilização;
- quantidade por embalagem;
- fornecedores dinâmicos;
- preço;
- estoque ideal;
- armazenamento;
- foto ao final.

### Mão de Obra

Não é RH. O objetivo é calcular custo da equipe e participação sobre faturamento médio.

Fórmula:
% Mão de Obra = custo total da equipe / faturamento médio mensal × 100.

### Custos Fixos e Variáveis

O módulo possui duas partes:

1. Plano Gerencial de Despesas: cadastrado uma vez.
2. Registro Mensal de Custos: usuário informa apenas Despesa × Valor.

Fórmula:
% Custos Operacionais = custos operacionais / faturamento médio × 100.

### Compras de Insumos e Embalagens

Não deve ser ERP de compras.

O usuário preenche:
- data;
- local da compra;
- forma de pagamento;
- valor total da nota;
- valor que não pertence ao estoque;
- observações;
- anexo.

Fórmula:
Valor destinado ao estoque = valor total da nota - valor fora do estoque.

### Inventário

O usuário preenche apenas Quantidade Física.

Tipos:
- Estoque Inicial: apenas na implantação.
- Fechamento de Estoque: uma vez por mês.
- Conferência de Estoque: opcional e não entra no CMV.

Fórmula:
Valor do item = quantidade física × custo unitário.

### Vendas do Mês

Substitui a antiga aba CMV Real visual.

O usuário preenche apenas quantidade vendida por receita.

Fórmula:
CMV Teórico = quantidade vendida × custo unitário da ficha.

Comparação:
Perdas = CMV Real - CMV Teórico.

### Precificação

Não calcula custo de receita. Usa o custo que vem da Ficha Técnica.

Fórmula usada no motor V7:
Preço sugerido = (custo da receita + embalagem) / (1 - soma dos percentuais / 100)

Percentuais usados:
- mão de obra;
- custos operacionais;
- taxa do canal;
- imposto;
- margem desejada.

### Dashboard

Deve responder:
- Estou ganhando dinheiro?
- Onde estou perdendo dinheiro?
- O que preciso fazer este mês?

Deve mostrar indicadores executivos:
- saúde da operação;
- faturamento;
- CMV real;
- CMV teórico;
- diferença/perdas;
- lucro bruto;
- margem bruta;
- diagnóstico inteligente;
- ações pendentes.

## 5. O que foi ajustado nesta V7

- Motor global de cálculo gerencial em `js/app.js`.
- Dashboard passou a consumir o motor global quando disponível.
- Sidebar/topbar não são mais removidas e recriadas em chamadas repetidas de `renderLayout()`.
- Adicionada classe visual `layout-ready` para reduzir piscada.
- Páginas protegidas escondem conteúdo até autenticação ser validada.
- Ordem de scripts ajustada para carregar `auth-guard.js` antes de `layout.js` nas páginas internas.
- Contraste do modo escuro reforçado para textos, ícones, tabelas, inputs, botões, sidebar e topbar.
- Criada migration `003_fluxo_final_balu_v7.sql` com tabelas do fluxo final.

## 6. O que ainda precisa de próxima rodada profunda

- Refazer totalmente UI e JS do Cadastro de Insumos no padrão final.
- Refazer totalmente UI e JS do Cadastro de Embalagens no mesmo padrão de Insumos.
- Reestruturar Fichas Técnicas para usar apenas dados dos cadastros e calcular custo técnico simplificado.
- Conectar o front ao backend/API real.
- Hospedar backend e PostgreSQL.
- Implementar Mercado Pago apenas no backend.

## 7. Teste de cálculo rápido

Faturamento de julho:
- Salão: 50.000
- iFood: 20.000
- Delivery: 10.000
- WhatsApp: 5.000

Total esperado: 85.000.
Média esperada, com só um mês registrado: 85.000.

Compras:
- Nota: 20.000
- Fora do estoque: 2.000

Compras para CMV: 18.000.

Inventário:
- Estoque inicial: 30.000
- Estoque final: 25.000

CMV Real = 30.000 + 18.000 - 25.000 = 23.000.

CMV % = 23.000 / 85.000 × 100 = 27,05%.
