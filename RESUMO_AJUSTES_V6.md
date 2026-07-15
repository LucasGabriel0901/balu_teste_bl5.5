# Resumo dos ajustes V6

## Ajustes técnicos feitos nesta versão

1. Criada fonte global para cálculo de faturamento médio em `js/app.js`.
2. Corrigida regra do faturamento médio em `js/faturamento.js`.
3. Corrigidos módulos que dependem do faturamento médio:
   - `js/custos-fixos-variaveis.js`
   - `js/funcionarios.js`
4. Mão de obra agora trata o faturamento como campo automático, não manual.
5. Ajustado texto da tela de Mão de Obra para deixar claro que o faturamento vem do módulo Faturamento.
6. Reforçado contraste no modo escuro em `css/global.css`.
7. Adicionadas microinterações leves em cards e painéis.
8. Criada documentação de análise, fluxo e testes.

## Regra corrigida

Antes havia risco de alguns módulos dividirem faturamento por quantidade de meses configurada, mesmo sem registro.

Agora a regra correta é:

Faturamento Médio = soma dos meses registrados / quantidade de meses registrados

Exemplo:

- Julho: R$ 85.000
- Só existe Julho
- Média: R$ 85.000

## O que fica para próxima etapa

1. Refazer Cadastro de Insumos no padrão final.
2. Refazer Cadastro de Embalagens no padrão final.
3. Simplificar Fichas Técnicas com base de produção/revenda.
4. Evoluir Dashboard executivo.
5. Conectar backend/PostgreSQL em ambiente hospedado.
6. Implementar Mercado Pago no backend.
