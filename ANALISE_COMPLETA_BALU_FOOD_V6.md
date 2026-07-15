# BALU Food — Análise completa e versão V6

## 1. O que é o BALU Food

O BALU Food é um SaaS de gestão enxuta para negócios de alimentação. Ele não deve ser tratado como PDV, ERP ou sistema financeiro completo. O objetivo é substituir várias planilhas usadas por restaurantes, marmitarias, lanchonetes, buffets e pequenos food services.

A pergunta central do BALU é:

> No final do mês, meu negócio de alimentação deu lucro ou prejuízo?

Para responder isso, o sistema centraliza faturamento, compras de estoque, inventário, mão de obra, custos operacionais, fichas técnicas, precificação, vendas do mês e indicadores executivos.

## 2. Filosofia do produto

- Poucos cliques.
- Mínimo de preenchimento.
- Cada dado tem uma única origem.
- O cliente informa a realidade da operação.
- O sistema faz os cálculos.
- Cadastros estruturais são feitos uma vez.
- Lançamentos periódicos registram apenas valores ou quantidades.
- Dashboard deve mostrar decisão, não excesso de operação.

## 3. O que já ajustamos

### SaaS e acesso

- Login obrigatório nas páginas internas.
- Acessos internos para desenvolvedor, admin e representante BALU.
- Cliente teste com plano ativo.
- Painel de controle protegido para perfis internos.
- Estrutura multiempresa preparada por `empresa_id` no backend/schema.

### Visual

- Modo escuro reforçado.
- Contraste de textos, ícones, botões, cards, inputs e tabelas.
- Animações leves em cards e painéis.
- Melhor organização visual para produto SaaS.

### Faturamento

- Faturamento virou fechamento por canais, não venda por venda.
- Corrigida a regra do faturamento médio: agora é a média dos totais mensais registrados.
- Se houver apenas um mês registrado, a média é o total desse mês.
- O sistema não faz média por canal.

### Compras

- Compras passaram a ser lançamento simples de compras de insumos e embalagens.
- O cliente informa valor total da nota e valor fora do estoque.
- O sistema calcula automaticamente o valor destinado ao estoque.

### Inventário

- Inventário ficou focado em valor financeiro do estoque.
- Estoque inicial é usado na implantação.
- Fechamento de estoque alimenta CMV Real.
- Conferência de estoque fica separada e não entra no CMV.

### Vendas do Mês

- O antigo CMV Real foi reposicionado para Vendas do Mês.
- O cliente informa quantidade vendida mensal por ficha técnica.
- O sistema compara CMV teórico e CMV real.

### Precificação

- Precificação passou a ser por canal.
- Canais possuem taxa, imposto e uso ou não de embalagem.
- A ficha técnica fornece o custo da receita.
- Mão de obra e custos operacionais entram como percentuais calculados automaticamente.

### Custos Fixos e Variáveis

- Separação entre Plano Gerencial de Despesas e Registro Mensal de Custos.
- O cliente cadastra a estrutura uma vez.
- Todo mês só informa Despesa x Valor.

### Mão de Obra

- Módulo não é RH.
- O faturamento não deve ser digitado nessa aba.
- O percentual de mão de obra usa o faturamento médio mensal vindo do módulo Faturamento.

### Backend e PostgreSQL

- Estrutura de backend Node/Express preparada.
- Schema PostgreSQL de produção incluído.
- Variáveis de ambiente em `.env.example`.
- Pagamento preparado como placeholder seguro para Mercado Pago no backend.

## 4. O que ainda vamos ajustar nas próximas versões

### Cadastros base

- Refazer Cadastro de Insumos no padrão final: dados básicos, conversões, fornecedores dinâmicos, estoque ideal, armazenamento e foto no final.
- Refazer Cadastro de Embalagens no mesmo fluxo dos insumos.
- Remover definitivamente campos de estoque operacional dos cadastros permanentes.

### Fichas Técnicas

- Simplificar ficha técnica para custo de receita, CMV teórico e base de precificação.
- Separar produção e revenda.
- Conectar kit de embalagem por canal.

### Dashboard executivo

- Tornar o Dashboard menos operacional e mais decisório.
- Priorizar saúde da operação, CMV real x teórico, lucro bruto, margem, diagnóstico inteligente e ações pendentes.

### Banco real

- Executar migration PostgreSQL.
- Hospedar backend/API.
- Ligar front ao backend gradualmente sem quebrar localStorage.

### Pagamento

- Implementar Mercado Pago no backend.
- Criar assinatura mensal, trimestral e anual.
- Receber webhooks e atualizar status da assinatura.
- Bloquear ou liberar acesso por status.

## 5. O que queremos que o sistema faça

1. O cliente cadastra insumos, embalagens e estrutura da operação.
2. O cliente lança faturamento por canal.
3. O cliente lança compras de estoque de forma simples.
4. O cliente faz fechamento de estoque.
5. O cliente informa vendas do mês por produto/ficha.
6. O BALU calcula CMV real, CMV teórico, perdas, lucro bruto, custos operacionais e margem.
7. O Dashboard mostra diagnóstico e ações.
8. O painel interno BALU controla clientes, planos, status e suporte.

## 6. Ordem recomendada de teste

1. Login com cliente teste.
2. Faturamento.
3. Custos Fixos e Variáveis.
4. Mão de Obra.
5. Cadastro de Insumos.
6. Cadastro de Embalagens.
7. Fichas Técnicas.
8. Precificação.
9. Compras de Insumos e Embalagens.
10. Inventário.
11. Vendas do Mês.
12. Dashboard.
13. Relatórios.

## 7. Acessos de teste

Desenvolvedor:
- E-mail: dev@balufood.com.br
- Senha: BaluDev2026!

Admin BALU:
- E-mail: admin@balufood.com.br
- Senha: BaluAdmin2026!

Representante:
- E-mail: representante@balufood.com.br
- Senha: BaluRep2026!

Cliente teste:
- E-mail: cliente@balufood.com.br
- Senha: BaluCliente2026!
