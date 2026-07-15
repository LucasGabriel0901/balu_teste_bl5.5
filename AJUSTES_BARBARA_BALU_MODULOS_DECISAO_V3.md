# BALU Food — Ajustes de Gestão Enxuta V3

Esta versão aplica as novas decisões dos relatórios enviados para manter o BALU como sistema de gestão, não PDV, ERP ou sistema financeiro completo.

## Filosofia aplicada

- Pouca burocracia e mínimo de cliques.
- Cada informação tem uma origem oficial.
- Cadastros estruturais são feitos uma vez.
- Lançamentos periódicos pedem apenas valores ou quantidades.
- O sistema calcula os indicadores automaticamente.

## Módulos ajustados

### Compras de Insumos e Embalagens

Substitui a lógica de compra item por item por um lançamento simples:

- Data da compra.
- Local da compra.
- Forma de pagamento.
- Valor total da nota.
- Valor que não pertence ao estoque.
- Valor destinado ao estoque calculado automaticamente.
- Observações.
- Anexo da notinha.

O valor destinado ao estoque alimenta o CMV real.

### Inventário

O inventário agora carrega automaticamente insumos, embalagens e produtos de revenda.
O usuário preenche apenas quantidade física.

Tipos:

- Estoque Inicial: usado apenas na implantação.
- Fechamento de Estoque: feito no fim do mês e alimenta CMV real.
- Conferência de Estoque: conferência parcial que pode gerar sugestão de compra.

### Vendas do Mês

Substitui visualmente o antigo módulo CMV Real.
O usuário preenche, uma vez por mês, a quantidade vendida de cada ficha técnica.

O sistema calcula:

- CMV teórico da produção.
- CMV teórico das revendas.
- CMV teórico total.
- Comparação com CMV real.
- Diferença/perdas.
- Percentual de perdas.
- Diagnóstico automático.

### Precificação

A precificação agora é por canal.

Possui duas áreas:

- Configuração dos canais de venda.
- Precificação da receita.

O usuário seleciona uma ficha técnica, define margem desejada e o BALU calcula preço sugerido por canal usando:

- Custo da receita.
- Custo de embalagem.
- Percentual de mão de obra.
- Percentual de custos operacionais.
- Taxa do canal.
- Imposto.
- Margem desejada.

Também permite preencher “Meu Preço” para simular margem real, lucro líquido e status.

### Dashboard

O Dashboard foi ajustado para priorizar indicadores executivos:

- Faturamento.
- Compras do mês.
- CMV real.
- CMV percentual.
- Estoque inicial.
- Estoque final.
- Análise Inteligente BALU.

A análise inteligente usa regras matemáticas para gerar diagnósticos e ações pendentes, sem chamar isso de IA falsa.

## Ajustes visuais

- Correções adicionais para contraste no modo escuro.
- Inputs, tabelas, textos secundários, ícones e cards receberam reforço de cor.
- Ícones continuam com fallback via app/layout.

## Observação

O sistema continua 100% front-end/localStorage. Não foi ativado banco de dados nem backend real.
