-- ========================================
-- BALU FOOD - MIGRATION COMPLEMENTAR MVP
-- Complementa o schema PostgreSQL com módulos criados no front-end.
-- Rodar depois de database/schema.sql.
-- ========================================

BEGIN;

-- ========================================
-- FORNECEDORES
-- ========================================
CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(180) NOT NULL,
  cnpj VARCHAR(30),
  telefone VARCHAR(50),
  email VARCHAR(180),
  categoria VARCHAR(100),
  contato VARCHAR(180),
  observacoes TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa_id ON fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON fornecedores(status);

-- ========================================
-- PRODUTOS / CARDÁPIO
-- ========================================
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ficha_tecnica_id INTEGER REFERENCES fichas_tecnicas(id) ON DELETE SET NULL,
  nome VARCHAR(180) NOT NULL,
  categoria VARCHAR(100),
  preco_venda NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ficha_tecnica_id ON produtos(ficha_tecnica_id);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);

-- ========================================
-- VENDAS / PRODUÇÃO
-- ========================================
CREATE TABLE IF NOT EXISTS vendas_producao (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  ficha_tecnica_id INTEGER REFERENCES fichas_tecnicas(id) ON DELETE SET NULL,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(40) NOT NULL DEFAULT 'Venda',
  quantidade NUMERIC(14,3) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'Confirmada',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendas_producao_empresa_id ON vendas_producao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_producao_produto_id ON vendas_producao(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_producao_data ON vendas_producao(data_registro);
CREATE INDEX IF NOT EXISTS idx_vendas_producao_status ON vendas_producao(status);

-- ========================================
-- FATURAMENTO
-- ========================================
CREATE TABLE IF NOT EXISTS faturamento (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao VARCHAR(220),
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  origem VARCHAR(80) DEFAULT 'Manual',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faturamento_empresa_id ON faturamento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_faturamento_data ON faturamento(data_registro);


-- ========================================
-- CUSTOS FIXOS E VARIÁVEIS
-- ========================================
CREATE TABLE IF NOT EXISTS custos_operacionais (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(40) NOT NULL DEFAULT 'Fixo',
  categoria VARCHAR(120) NOT NULL DEFAULT 'Outros',
  descricao TEXT,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'Confirmado',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custos_operacionais_empresa_id ON custos_operacionais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_custos_operacionais_data ON custos_operacionais(data_registro);
CREATE INDEX IF NOT EXISTS idx_custos_operacionais_tipo ON custos_operacionais(tipo);
CREATE INDEX IF NOT EXISTS idx_custos_operacionais_status ON custos_operacionais(status);

-- ========================================
-- PRECIFICAÇÕES
-- ========================================
CREATE TABLE IF NOT EXISTS precificacoes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ficha_tecnica_id INTEGER REFERENCES fichas_tecnicas(id) ON DELETE SET NULL,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  nome VARCHAR(180) NOT NULL,
  custo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_sugerido NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_praticado NUMERIC(12,2) NOT NULL DEFAULT 0,
  margem_percentual NUMERIC(10,2) NOT NULL DEFAULT 0,
  markup NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_precificacoes_empresa_id ON precificacoes(empresa_id);

-- ========================================
-- PRODUÇÃO PLANEJADA
-- ========================================
CREATE TABLE IF NOT EXISTS producao_planejada (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  ficha_tecnica_id INTEGER REFERENCES fichas_tecnicas(id) ON DELETE SET NULL,
  data_planejada DATE NOT NULL DEFAULT CURRENT_DATE,
  quantidade NUMERIC(14,3) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'Planejada',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producao_planejada_empresa_id ON producao_planejada(empresa_id);
CREATE INDEX IF NOT EXISTS idx_producao_planejada_data ON producao_planejada(data_planejada);

-- ========================================
-- FEEDBACKS
-- ========================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nome VARCHAR(180),
  empresa VARCHAR(180),
  tipo VARCHAR(60) NOT NULL DEFAULT 'Sugestão',
  modulo VARCHAR(100) NOT NULL DEFAULT 'Geral',
  prioridade VARCHAR(40) NOT NULL DEFAULT 'Média',
  mensagem TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Aberto',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_empresa_id ON feedbacks(empresa_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_prioridade ON feedbacks(prioridade);

-- ========================================
-- CONFIGURAÇÕES DA EMPRESA
-- ========================================
CREATE TABLE IF NOT EXISTS configuracoes_empresa (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  chave VARCHAR(120) NOT NULL,
  valor TEXT,
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, chave)
);

CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_id ON configuracoes_empresa(empresa_id);

-- ========================================
-- BANNERS / PUBLICIDADE INTERNA
-- ========================================
CREATE TABLE IF NOT EXISTS publicidade_banners (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  titulo VARCHAR(180) NOT NULL,
  subtitulo TEXT,
  imagem TEXT,
  link TEXT,
  paginas TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
  data_inicio DATE,
  data_fim DATE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publicidade_banners_empresa_id ON publicidade_banners(empresa_id);
CREATE INDEX IF NOT EXISTS idx_publicidade_banners_status ON publicidade_banners(status);


-- ========================================
-- GESTÃO ENXUTA - FATURAMENTO POR FECHAMENTO
-- ========================================
CREATE TABLE IF NOT EXISTS canais_faturamento (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(120) NOT NULL,
  grupo VARCHAR(80) DEFAULT 'Outros',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, nome)
);

CREATE TABLE IF NOT EXISTS faturamento_fechamentos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_fechamento DATE NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'Confirmado',
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, data_fechamento)
);

CREATE TABLE IF NOT EXISTS faturamento_fechamento_canais (
  id SERIAL PRIMARY KEY,
  fechamento_id INTEGER NOT NULL REFERENCES faturamento_fechamentos(id) ON DELETE CASCADE,
  canal_id INTEGER REFERENCES canais_faturamento(id) ON DELETE SET NULL,
  canal_nome VARCHAR(120) NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_faturamento_fechamentos_empresa_data ON faturamento_fechamentos(empresa_id, data_fechamento);
CREATE INDEX IF NOT EXISTS idx_faturamento_fechamento_canais_fechamento ON faturamento_fechamento_canais(fechamento_id);

-- ========================================
-- GESTÃO ENXUTA - PLANO GERENCIAL E FECHAMENTO DE CUSTOS
-- ========================================
CREATE TABLE IF NOT EXISTS plano_gerencial_despesas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(160) NOT NULL,
  natureza VARCHAR(40) NOT NULL DEFAULT 'Fixo',
  grupo_gerencial VARCHAR(100) NOT NULL DEFAULT 'Operacional',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, nome)
);

CREATE TABLE IF NOT EXISTS custos_fechamentos_mensais (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  mes_referencia VARCHAR(7) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_fixos NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_variaveis NUMERIC(14,2) NOT NULL DEFAULT 0,
  faturamento_medio NUMERIC(14,2) NOT NULL DEFAULT 0,
  percentual_operacional NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, mes_referencia)
);

CREATE TABLE IF NOT EXISTS custos_fechamento_itens (
  id SERIAL PRIMARY KEY,
  fechamento_id INTEGER NOT NULL REFERENCES custos_fechamentos_mensais(id) ON DELETE CASCADE,
  despesa_id INTEGER REFERENCES plano_gerencial_despesas(id) ON DELETE SET NULL,
  nome_despesa VARCHAR(160) NOT NULL,
  natureza VARCHAR(40) NOT NULL,
  grupo_gerencial VARCHAR(100) NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_plano_gerencial_despesas_empresa ON plano_gerencial_despesas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_custos_fechamentos_empresa_mes ON custos_fechamentos_mensais(empresa_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_custos_fechamento_itens_fechamento ON custos_fechamento_itens(fechamento_id);

COMMIT;
