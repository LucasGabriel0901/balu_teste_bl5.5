# BALU Food V7 — O que foi ajustado e o que ainda não foi totalmente ajustado

## Ajustado nesta versão

- Faturamento médio consolidado por mês, não por canal.
- Compras simples com valor destinado ao estoque.
- Inventário com conceito de estoque inicial, fechamento e conferência.
- Vendas do Mês para calcular CMV Teórico.
- Precificação com lógica por canal e margem desejada.
- Dashboard consumindo resumo executivo centralizado.
- Login obrigatório mais consistente nas páginas internas.
- Sidebar com menos piscada em rerenderizações.
- Contraste do modo escuro reforçado.
- Migration PostgreSQL complementar para o fluxo final.

## Parcialmente ajustado

- Cadastro de Insumos: ainda precisa refatoração completa da tela e dos campos.
- Cadastro de Embalagens: ainda precisa seguir exatamente o padrão de Insumos.
- Mão de Obra: cálculo principal está direcionado, mas ainda pode simplificar UI.
- Fichas Técnicas: posicionamento foi alterado, mas ainda precisa reconstrução profunda.
- Painel de Controle: existe base, mas o controle SaaS real depende de backend ativo.

## Não ajustado completamente porque depende de backend real

- Multiempresa real por `empresa_id` em todos os dados.
- JWT real persistido com renovação segura.
- Bloqueio automático por inadimplência.
- Pagamento recorrente Mercado Pago.
- Webhook de pagamento.
- Upload real de imagens/anexos.
- Banco PostgreSQL em produção.
