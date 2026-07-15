-- BALU Food V7 - Fluxo final de gestão enxuta
-- Complementa o schema de produção com estruturas para os módulos definidos nos relatórios.
-- Não armazena vendas individuais, não substitui ERP/PDV e mantém empresa_id em todas as tabelas SaaS.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS canais_faturamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(120) NOT NULL,
  grupo VARCHAR(80),
  status VARCHAR(30) DEFAULT 'Ativo',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fechamentos_faturamento_diario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  data_fechamento DATE NOT NULL,
  responsavel_id UUID,
  total_faturado NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  status VARCHAR(30) DEFAULT 'Confirmado',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (empresa_id, data_fechamento)
);

CREATE TABLE IF NOT EXISTS fechamento_faturamento_canais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fechamento_id UUID NOT NULL REFERENCES fechamentos_faturamento_diario(id) ON DELETE CASCADE,
  canal_id UUID REFERENCES canais_faturamento(id),
  nome_canal VARCHAR(120) NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plano_gerencial_despesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(140) NOT NULL,
  natureza VARCHAR(30) NOT NULL CHECK (natureza IN ('Fixo', 'Variável')),
  grupo_gerencial VARCHAR(80) NOT NULL,
  status VARCHAR(30) DEFAULT 'Ativo',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fechamentos_custos_mensais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  competencia CHAR(7) NOT NULL,
  responsavel_id UUID,
  total_fixos NUMERIC(14,2) DEFAULT 0,
  total_variaveis NUMERIC(14,2) DEFAULT 0,
  total_geral NUMERIC(14,2) DEFAULT 0,
  faturamento_medio NUMERIC(14,2) DEFAULT 0,
  percentual_operacional NUMERIC(8,4) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (empresa_id, competencia)
);

CREATE TABLE IF NOT EXISTS fechamento_custos_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fechamento_id UUID NOT NULL REFERENCES fechamentos_custos_mensais(id) ON DELETE CASCADE,
  despesa_id UUID REFERENCES plano_gerencial_despesas(id),
  nome_despesa VARCHAR(140) NOT NULL,
  natureza VARCHAR(30) NOT NULL,
  grupo_gerencial VARCHAR(80) NOT NULL,
  valor NUMERIC(14,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS compras_estoque_simplificadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  data_compra DATE NOT NULL,
  competencia CHAR(7) NOT NULL,
  local_compra VARCHAR(160) NOT NULL,
  forma_pagamento VARCHAR(50),
  valor_total_nota NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_fora_estoque NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_destinado_estoque NUMERIC(14,2) GENERATED ALWAYS AS (GREATEST(valor_total_nota - valor_fora_estoque, 0)) STORED,
  observacoes TEXT,
  anexo_url TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventarios_fechamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  competencia CHAR(7) NOT NULL,
  tipo VARCHAR(40) NOT NULL CHECK (tipo IN ('Estoque Inicial', 'Fechamento de Estoque', 'Conferência de Estoque')),
  total_producao NUMERIC(14,2) DEFAULT 0,
  total_revenda NUMERIC(14,2) DEFAULT 0,
  total_embalagens NUMERIC(14,2) DEFAULT 0,
  total_estoque NUMERIC(14,2) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (empresa_id, competencia, tipo)
);

CREATE TABLE IF NOT EXISTS inventario_fechamento_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id UUID NOT NULL REFERENCES inventarios_fechamentos(id) ON DELETE CASCADE,
  item_tipo VARCHAR(40) NOT NULL,
  item_id UUID,
  nome VARCHAR(160) NOT NULL,
  categoria VARCHAR(100),
  unidade VARCHAR(40),
  quantidade_fisica NUMERIC(14,4) DEFAULT 0,
  custo_unitario NUMERIC(14,6) DEFAULT 0,
  valor_total NUMERIC(14,2) DEFAULT 0,
  estoque_ideal NUMERIC(14,4) DEFAULT 0,
  quantidade_sugerida_compra NUMERIC(14,4) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vendas_mensais_fechamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  competencia CHAR(7) NOT NULL,
  data_fechamento DATE NOT NULL,
  responsavel_id UUID,
  cmv_teorico_producao NUMERIC(14,2) DEFAULT 0,
  cmv_teorico_revenda NUMERIC(14,2) DEFAULT 0,
  cmv_teorico_total NUMERIC(14,2) DEFAULT 0,
  cmv_real NUMERIC(14,2) DEFAULT 0,
  diferenca_perdas NUMERIC(14,2) DEFAULT 0,
  percentual_perdas NUMERIC(8,4) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (empresa_id, competencia)
);

CREATE TABLE IF NOT EXISTS vendas_mensais_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fechamento_id UUID NOT NULL REFERENCES vendas_mensais_fechamentos(id) ON DELETE CASCADE,
  ficha_tecnica_id UUID,
  nome_receita VARCHAR(160) NOT NULL,
  categoria VARCHAR(100),
  classificacao VARCHAR(40) NOT NULL CHECK (classificacao IN ('Produção', 'Revenda')),
  custo_unitario NUMERIC(14,6) DEFAULT 0,
  quantidade_vendida NUMERIC(14,4) DEFAULT 0,
  cmv_teorico NUMERIC(14,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS canais_precificacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(120) NOT NULL,
  tipo VARCHAR(80),
  taxa_percentual NUMERIC(8,4) DEFAULT 0,
  imposto_percentual NUMERIC(8,4) DEFAULT 0,
  usa_embalagem BOOLEAN DEFAULT FALSE,
  kit_embalagem_id UUID,
  status VARCHAR(30) DEFAULT 'Ativo',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historico_precificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  ficha_tecnica_id UUID,
  canal_id UUID REFERENCES canais_precificacao(id),
  custo_receita NUMERIC(14,2) DEFAULT 0,
  custo_embalagem NUMERIC(14,2) DEFAULT 0,
  percentual_mao_obra NUMERIC(8,4) DEFAULT 0,
  percentual_custos_operacionais NUMERIC(8,4) DEFAULT 0,
  taxa_percentual NUMERIC(8,4) DEFAULT 0,
  imposto_percentual NUMERIC(8,4) DEFAULT 0,
  margem_desejada NUMERIC(8,4) DEFAULT 0,
  preco_sugerido NUMERIC(14,2) DEFAULT 0,
  preco_escolhido NUMERIC(14,2) DEFAULT 0,
  lucro_liquido NUMERIC(14,2) DEFAULT 0,
  margem_real NUMERIC(8,4) DEFAULT 0,
  cmv_percentual NUMERIC(8,4) DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canais_faturamento_empresa ON canais_faturamento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fat_diario_empresa_data ON fechamentos_faturamento_diario(empresa_id, data_fechamento);
CREATE INDEX IF NOT EXISTS idx_compras_estoque_empresa_comp ON compras_estoque_simplificadas(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_inventarios_empresa_comp ON inventarios_fechamentos(empresa_id, competencia);
CREATE INDEX IF NOT EXISTS idx_vendas_mensais_empresa_comp ON vendas_mensais_fechamentos(empresa_id, competencia);
