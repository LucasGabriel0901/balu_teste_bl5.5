-- =========================================================
-- BALU FOOD - POSTGRESQL PRODUÇÃO
-- Gestão enxuta para food service
-- Versão: v4 deploy
-- =========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- SaaS / Clientes / Planos
-- =========================
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL DEFAULT 'BALU Food',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS planos_ciclos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE CASCADE,
  ciclo TEXT NOT NULL CHECK (ciclo IN ('Mensal','Trimestral','Anual')),
  valor_ciclo NUMERIC(14,2) NOT NULL,
  meses_equivalentes INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (plano_id, ciclo)
);

CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  cnpj TEXT,
  slug TEXT NOT NULL UNIQUE,
  responsavel TEXT,
  email TEXT,
  telefone TEXT,
  segmento TEXT,
  status TEXT NOT NULL DEFAULT 'Trial' CHECK (status IN ('Trial','Ativo','Bloqueado','Cancelamento solicitado','Cancelado')),
  status_pagamento TEXT NOT NULL DEFAULT 'Pendente' CHECK (status_pagamento IN ('Em dia','Pendente','Atrasado','Cancelado','Isento')),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'cliente_admin' CHECK (perfil IN ('cliente_admin','cliente_colaborador','admin_balu','representante_balu','suporte_balu','desenvolvedor_balu','Dono','Admin','Cliente','Colaborador')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo','Bloqueado','Cancelado')),
  ultimo_acesso TIMESTAMP,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id),
  ciclo TEXT NOT NULL DEFAULT 'Mensal' CHECK (ciclo IN ('Mensal','Trimestral','Anual')),
  valor_ciclo NUMERIC(14,2) NOT NULL DEFAULT 250,
  forma_pagamento TEXT NOT NULL DEFAULT 'Cartão de crédito',
  status TEXT NOT NULL DEFAULT 'Aguardando pagamento' CHECK (status IN ('Trial','Aguardando pagamento','Ativa','Atrasada','Bloqueada','Cancelamento solicitado','Cancelada','Isento')),
  data_inicio DATE,
  data_vencimento DATE,
  ultimo_pagamento DATE,
  gateway TEXT,
  gateway_assinatura_id TEXT,
  cancelamento_solicitado_em TIMESTAMP,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  assinatura_id UUID REFERENCES assinaturas(id) ON DELETE SET NULL,
  valor NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Pago','Atrasado','Cancelado','Estornado')),
  metodo TEXT DEFAULT 'Cartão de crédito',
  gateway TEXT,
  gateway_pagamento_id TEXT,
  data_pagamento DATE,
  data_vencimento DATE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- Cadastros estruturais
-- =========================
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT,
  nome TEXT NOT NULL,
  grupo TEXT,
  unidade_compra TEXT,
  unidade_consumo TEXT,
  peso_embalagem_g NUMERIC(14,4) DEFAULT 0,
  peso_bruto_g NUMERIC(14,4) DEFAULT 0,
  peso_liquido_g NUMERIC(14,4) DEFAULT 0,
  fator_correcao NUMERIC(14,6) DEFAULT 1,
  custo_unitario NUMERIC(14,6) DEFAULT 0,
  custo_por_g NUMERIC(14,6) DEFAULT 0,
  estoque_ideal NUMERIC(14,4) DEFAULT 0,
  local_armazenamento TEXT,
  posicao TEXT,
  foto_url TEXT,
  status TEXT DEFAULT 'Ativo',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS insumos_precos_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insumo_id UUID NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  fornecedor TEXT,
  preco NUMERIC(14,4) NOT NULL,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS embalagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT,
  nome TEXT NOT NULL,
  grupo TEXT,
  unidade_compra TEXT,
  unidade_utilizacao TEXT,
  quantidade_por_compra NUMERIC(14,4) DEFAULT 1,
  custo_unitario NUMERIC(14,6) DEFAULT 0,
  estoque_ideal NUMERIC(14,4) DEFAULT 0,
  local_armazenamento TEXT,
  posicao TEXT,
  foto_url TEXT,
  status TEXT DEFAULT 'Ativo',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS embalagens_precos_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  embalagem_id UUID NOT NULL REFERENCES embalagens(id) ON DELETE CASCADE,
  fornecedor TEXT,
  preco NUMERIC(14,4) NOT NULL,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CLT','Freelancer','Pró-labore','MEI')),
  departamento TEXT,
  custo_mensal NUMERIC(14,2) NOT NULL DEFAULT 0,
  horas_mes NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'Ativo',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plano_despesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  natureza TEXT NOT NULL CHECK (natureza IN ('Fixo','Variável')),
  grupo_gerencial TEXT,
  status TEXT DEFAULT 'Ativo',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canais_venda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  taxa_percentual NUMERIC(10,4) DEFAULT 0,
  imposto_percentual NUMERIC(10,4) DEFAULT 0,
  usa_embalagem BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Ativo',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================
-- Lançamentos periódicos
-- =========================
CREATE TABLE IF NOT EXISTS faturamentos_diarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_fechamento DATE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, data_fechamento)
);

CREATE TABLE IF NOT EXISTS faturamento_diario_canais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fechamento_id UUID NOT NULL REFERENCES faturamentos_diarios(id) ON DELETE CASCADE,
  canal_id UUID REFERENCES canais_venda(id) ON DELETE SET NULL,
  canal_nome TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS compras_estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_compra DATE NOT NULL,
  local_compra TEXT NOT NULL,
  forma_pagamento TEXT,
  valor_total_nota NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_fora_estoque NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_destinado_estoque NUMERIC(14,2) GENERATED ALWAYS AS (valor_total_nota - valor_fora_estoque) STORED,
  anexo_url TEXT,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Estoque Inicial','Fechamento de Estoque','Conferência de Estoque')),
  data_inventario DATE NOT NULL DEFAULT CURRENT_DATE,
  total_producao NUMERIC(14,2) DEFAULT 0,
  total_revenda NUMERIC(14,2) DEFAULT 0,
  total_embalagens NUMERIC(14,2) DEFAULT 0,
  total_geral NUMERIC(14,2) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id UUID NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
  item_tipo TEXT NOT NULL CHECK (item_tipo IN ('Insumo','Embalagem','Revenda')),
  item_id UUID,
  nome TEXT NOT NULL,
  categoria TEXT,
  unidade TEXT,
  quantidade_fisica NUMERIC(14,4) DEFAULT 0,
  custo_unitario NUMERIC(14,6) DEFAULT 0,
  valor_total NUMERIC(14,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS custos_mensais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  total_fixos NUMERIC(14,2) DEFAULT 0,
  total_variaveis NUMERIC(14,2) DEFAULT 0,
  total_geral NUMERIC(14,2) DEFAULT 0,
  percentual_operacional NUMERIC(10,4) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, competencia)
);

CREATE TABLE IF NOT EXISTS custos_mensais_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  custo_mensal_id UUID NOT NULL REFERENCES custos_mensais(id) ON DELETE CASCADE,
  despesa_id UUID REFERENCES plano_despesas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  natureza TEXT,
  grupo_gerencial TEXT,
  valor NUMERIC(14,2) DEFAULT 0
);

-- =========================
-- Produtos, fichas e preço
-- =========================
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT,
  nome TEXT NOT NULL,
  categoria TEXT,
  classificacao TEXT DEFAULT 'Produção' CHECK (classificacao IN ('Produção','Revenda')),
  rendimento NUMERIC(14,4) DEFAULT 1,
  custo_receita NUMERIC(14,4) DEFAULT 0,
  cmv_teorico_percentual NUMERIC(10,4) DEFAULT 0,
  status TEXT DEFAULT 'Ativo',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichas_tecnicas_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ficha_id UUID NOT NULL REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
  item_tipo TEXT NOT NULL CHECK (item_tipo IN ('Insumo','Embalagem','Revenda')),
  item_id UUID,
  nome TEXT NOT NULL,
  quantidade NUMERIC(14,4) DEFAULT 0,
  unidade TEXT,
  custo_unitario NUMERIC(14,6) DEFAULT 0,
  custo_total NUMERIC(14,4) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS precificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ficha_id UUID REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
  canal_id UUID REFERENCES canais_venda(id) ON DELETE SET NULL,
  margem_desejada_percentual NUMERIC(10,4) DEFAULT 0,
  preco_sugerido NUMERIC(14,2) DEFAULT 0,
  preco_escolhido NUMERIC(14,2) DEFAULT 0,
  cmv_percentual NUMERIC(10,4) DEFAULT 0,
  lucro_liquido NUMERIC(14,2) DEFAULT 0,
  margem_real_percentual NUMERIC(10,4) DEFAULT 0,
  status TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas_mes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  data_fechamento DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id UUID REFERENCES usuarios(id),
  cmv_teorico_producao NUMERIC(14,2) DEFAULT 0,
  cmv_teorico_revenda NUMERIC(14,2) DEFAULT 0,
  cmv_teorico_total NUMERIC(14,2) DEFAULT 0,
  cmv_real NUMERIC(14,2) DEFAULT 0,
  perdas_valor NUMERIC(14,2) DEFAULT 0,
  perdas_percentual NUMERIC(10,4) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, competencia)
);

CREATE TABLE IF NOT EXISTS vendas_mes_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_mes_id UUID NOT NULL REFERENCES vendas_mes(id) ON DELETE CASCADE,
  ficha_id UUID REFERENCES fichas_tecnicas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  categoria TEXT,
  classificacao TEXT,
  custo_unitario NUMERIC(14,4) DEFAULT 0,
  quantidade_vendida NUMERIC(14,4) DEFAULT 0,
  cmv_teorico NUMERIC(14,2) DEFAULT 0
);

-- =========================
-- Suporte / Feedback / Logs
-- =========================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nome TEXT,
  empresa TEXT,
  tipo TEXT,
  modulo TEXT,
  prioridade TEXT,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'Aberto',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_evento TEXT,
  descricao TEXT,
  origem TEXT,
  status TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_faturamentos_empresa_data ON faturamentos_diarios(empresa_id, data_fechamento);
CREATE INDEX IF NOT EXISTS idx_compras_empresa_data ON compras_estoque(empresa_id, data_compra);
CREATE INDEX IF NOT EXISTS idx_inventarios_empresa_competencia ON inventarios(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_vendas_mes_empresa_competencia ON vendas_mes(empresa_id, competencia);

-- Seed plano único
INSERT INTO planos (nome)
VALUES ('BALU Food')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO planos_ciclos (plano_id, ciclo, valor_ciclo, meses_equivalentes)
SELECT p.id, x.ciclo, x.valor, x.meses
FROM planos p
CROSS JOIN (VALUES
  ('Mensal', 250.00, 1),
  ('Trimestral', 675.00, 3),
  ('Anual', 2500.00, 12)
) AS x(ciclo, valor, meses)
WHERE p.nome = 'BALU Food'
ON CONFLICT (plano_id, ciclo) DO NOTHING;

COMMIT;
