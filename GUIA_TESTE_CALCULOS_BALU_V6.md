# Guia de teste dos cálculos — BALU V6

## 1. Teste do faturamento médio

Acesse Faturamento e registre um fechamento em Julho/2026:

- Salão: R$ 50.000
- iFood: R$ 20.000
- Delivery próprio: R$ 10.000
- WhatsApp: R$ 5.000

Total do mês esperado:

- R$ 85.000

Como só existe um mês registrado, o faturamento médio mensal deve ser:

- R$ 85.000

Regra:

Faturamento Médio Mensal = Soma dos totais mensais registrados / Quantidade de meses com registro

Não dividir por canais.
Não dividir por meses vazios.

## 2. Teste de custos operacionais

Em Custos Fixos e Variáveis, registre:

- Aluguel: R$ 5.000
- Energia: R$ 2.000
- Gás: R$ 1.500
- Internet: R$ 300
- Marketing: R$ 1.200

Total esperado:

- R$ 10.000

Percentual operacional esperado:

10.000 / 85.000 x 100 = 11,76%

## 3. Teste de mão de obra

Cadastre:

- Funcionário 1: R$ 3.000
- Funcionário 2: R$ 2.500
- Pró-labore: R$ 4.500

Total esperado:

- R$ 10.000

Percentual esperado:

10.000 / 85.000 x 100 = 11,76%

## 4. Teste de compras

Em Compras de Insumos e Embalagens:

- Valor total da nota: R$ 20.000
- Valor fora do estoque: R$ 2.000

Valor destinado ao estoque:

20.000 - 2.000 = R$ 18.000

## 5. Teste do CMV real

Em Inventário:

- Estoque inicial: R$ 30.000
- Estoque final: R$ 25.000

CMV Real:

30.000 + 18.000 - 25.000 = R$ 23.000

CMV %:

23.000 / 85.000 x 100 = 27,05%

## 6. Resultado esperado no Dashboard

- Faturamento: R$ 85.000
- Faturamento médio: R$ 85.000
- Compras para estoque: R$ 18.000
- Custos operacionais: R$ 10.000
- Mão de obra: R$ 10.000
- CMV Real: R$ 23.000
- CMV Real %: 27,05%

Lucro bruto:

85.000 - 23.000 = R$ 62.000

Lucro estimado após custos e mão de obra:

85.000 - 23.000 - 10.000 - 10.000 = R$ 42.000
