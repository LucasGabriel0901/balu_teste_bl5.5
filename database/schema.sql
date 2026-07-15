-- ========================================
-- BALU FOOD - SCHEMA DO BANCO DE DADOS
-- Banco: PostgreSQL
-- Estrutura SaaS com empresa_id
-- ========================================

BEGIN;

-- ========================================
-- TABELA: PLANOS
-- ========================================

CREATE TABLE IF NOT EXISTS planos (
id SERIAL PRIMARY KEY,
nome VARCHAR(100) NOT NULL UNIQUE,
valor_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
descricao TEXT,
status VARCHAR(30) NOT NULL DEFAULT 'Ativo',
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: EMPRESAS
-- Cada cliente do SaaS será uma empresa
-- ========================================

CREATE TABLE IF NOT EXISTS empresas (
id SERIAL PRIMARY KEY,
plano_id INTEGER REFERENCES planos(id) ON DELETE SET NULL,
nome_fantasia VARCHAR(180) NOT NULL,
razao_social VARCHAR(180),
cnpj VARCHAR(30),
slug VARCHAR(180) NOT NULL UNIQUE,
responsavel VARCHAR(180),
email VARCHAR(180),
telefone VARCHAR(50),
segmento VARCHAR(100),
status VARCHAR(40) NOT NULL DEFAULT 'Teste',
status_pagamento VARCHAR(40) NOT NULL DEFAULT 'Pendente',
data_inicio DATE,
data_vencimento DATE,
ultimo_pagamento DATE,
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: USUÁRIOS
-- Usuários que acessam cada empresa
-- ========================================

CREATE TABLE IF NOT EXISTS usuarios (
id SERIAL PRIMARY KEY,
empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
nome VARCHAR(180) NOT NULL,
email VARCHAR(180) NOT NULL UNIQUE,
senha_hash TEXT,
perfil VARCHAR(50) NOT NULL DEFAULT 'Cliente',
status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
ultimo_acesso TIMESTAMP,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: ASSINATURAS
-- Controle de plano, valor e liberação
-- ========================================

CREATE TABLE IF NOT EXISTS assinaturas (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
plano_id INTEGER REFERENCES planos(id) ON DELETE SET NULL,
valor_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
status VARCHAR(40) NOT NULL DEFAULT 'Aguardando pagamento',
data_inicio DATE,
data_vencimento DATE,
ultimo_pagamento DATE,
gateway VARCHAR(80),
gateway_assinatura_id VARCHAR(180),
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: PAGAMENTOS
-- Histórico de pagamentos da assinatura
-- ========================================

CREATE TABLE IF NOT EXISTS pagamentos (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
assinatura_id INTEGER REFERENCES assinaturas(id) ON DELETE SET NULL,
valor NUMERIC(12,2) NOT NULL DEFAULT 0,
status VARCHAR(40) NOT NULL DEFAULT 'Pendente',
metodo VARCHAR(80),
gateway VARCHAR(80),
gateway_pagamento_id VARCHAR(180),
data_pagamento DATE,
data_vencimento DATE,
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: INSUMOS
-- ========================================

CREATE TABLE IF NOT EXISTS insumos (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
imagem TEXT,
nome VARCHAR(180) NOT NULL,
codigo VARCHAR(80),
grupo VARCHAR(100) NOT NULL,
categoria VARCHAR(100),
unidade_compra VARCHAR(50),
unidade_consumo VARCHAR(50),
descricao TEXT,
peso_bruto NUMERIC(14,4) NOT NULL DEFAULT 0,
peso_liquido NUMERIC(14,4) NOT NULL DEFAULT 0,
fator_correcao NUMERIC(14,4) NOT NULL DEFAULT 0,
perda_percentual NUMERIC(10,2) NOT NULL DEFAULT 0,
fornecedor_1 VARCHAR(180),
preco_fornecedor_1 NUMERIC(14,2) NOT NULL DEFAULT 0,
fornecedor_2 VARCHAR(180),
preco_fornecedor_2 NUMERIC(14,2) NOT NULL DEFAULT 0,
fornecedor_3 VARCHAR(180),
preco_fornecedor_3 NUMERIC(14,2) NOT NULL DEFAULT 0,
preco_medio NUMERIC(14,2) NOT NULL DEFAULT 0,
preco_medio_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
estoque_atual NUMERIC(14,4) NOT NULL DEFAULT 0,
estoque_minimo NUMERIC(14,4) NOT NULL DEFAULT 0,
estoque_ideal NUMERIC(14,4) NOT NULL DEFAULT 0,
valor_estoque NUMERIC(14,2) NOT NULL DEFAULT 0,
status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
status_estoque VARCHAR(40) NOT NULL DEFAULT 'Ativo',
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
UNIQUE (empresa_id, codigo)
);

-- ========================================
-- TABELA: EMBALAGENS
-- ========================================

CREATE TABLE IF NOT EXISTS embalagens (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
imagem TEXT,
nome VARCHAR(180) NOT NULL,
codigo VARCHAR(80),
categoria VARCHAR(100) NOT NULL,
unidade VARCHAR(50),
quantidade_pacote NUMERIC(14,4) NOT NULL DEFAULT 0,
status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
descricao TEXT,
fornecedor_1 VARCHAR(180),
preco_fornecedor_1 NUMERIC(14,2) NOT NULL DEFAULT 0,
fornecedor_2 VARCHAR(180),
preco_fornecedor_2 NUMERIC(14,2) NOT NULL DEFAULT 0,
fornecedor_3 VARCHAR(180),
preco_fornecedor_3 NUMERIC(14,2) NOT NULL DEFAULT 0,
preco_medio_pacote NUMERIC(14,2) NOT NULL DEFAULT 0,
preco_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
estoque_atual NUMERIC(14,4) NOT NULL DEFAULT 0,
estoque_minimo NUMERIC(14,4) NOT NULL DEFAULT 0,
estoque_ideal NUMERIC(14,4) NOT NULL DEFAULT 0,
valor_estoque NUMERIC(14,2) NOT NULL DEFAULT 0,
status_estoque VARCHAR(40) NOT NULL DEFAULT 'Ativo',
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
UNIQUE (empresa_id, codigo)
);

-- ========================================
-- TABELA: FUNCIONÁRIOS
-- ========================================

CREATE TABLE IF NOT EXISTS funcionarios (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
imagem TEXT,
nome VARCHAR(180) NOT NULL,
tipo VARCHAR(80) NOT NULL,
cargo VARCHAR(120),
departamento VARCHAR(120),
status VARCHAR(40) NOT NULL DEFAULT 'Ativo',
salario_base NUMERIC(14,2) NOT NULL DEFAULT 0,
encargos_percentual NUMERIC(10,2) NOT NULL DEFAULT 0,
valor_encargos NUMERIC(14,2) NOT NULL DEFAULT 0,
horas_mensais_clt NUMERIC(14,2) NOT NULL DEFAULT 0,
valor_diaria NUMERIC(14,2) NOT NULL DEFAULT 0,
dias_mes NUMERIC(14,2) NOT NULL DEFAULT 0,
horas_diaria NUMERIC(14,2) NOT NULL DEFAULT 0,
valor_mensal NUMERIC(14,2) NOT NULL DEFAULT 0,
horas_mensais_mensal NUMERIC(14,2) NOT NULL DEFAULT 0,
custo_mensal NUMERIC(14,2) NOT NULL DEFAULT 0,
custo_hora NUMERIC(14,2) NOT NULL DEFAULT 0,
horas_mes NUMERIC(14,2) NOT NULL DEFAULT 0,
participacao NUMERIC(10,2) NOT NULL DEFAULT 0,
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: COMPRAS
-- ========================================

CREATE TABLE IF NOT EXISTS compras (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
imagem TEXT,
data_compra DATE NOT NULL,
fornecedor VARCHAR(180) NOT NULL,
numero_nota VARCHAR(100),
tipo VARCHAR(80) NOT NULL,
status VARCHAR(40) NOT NULL DEFAULT 'Confirmada',
forma_pagamento VARCHAR(80),
competencia VARCHAR(7),
subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
desconto NUMERIC(14,2) NOT NULL DEFAULT 0,
frete NUMERIC(14,2) NOT NULL DEFAULT 0,
impostos NUMERIC(14,2) NOT NULL DEFAULT 0,
ajustes NUMERIC(14,2) NOT NULL DEFAULT 0,
total NUMERIC(14,2) NOT NULL DEFAULT 0,
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: ITENS DA COMPRA
-- ========================================

CREATE TABLE IF NOT EXISTS compra_itens (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
tipo VARCHAR(80) NOT NULL DEFAULT 'Insumo',
nome VARCHAR(180) NOT NULL,
quantidade NUMERIC(14,4) NOT NULL DEFAULT 0,
unidade VARCHAR(50),
valor_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
total NUMERIC(14,2) NOT NULL DEFAULT 0,
criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: INVENTÁRIOS
-- ========================================

CREATE TABLE IF NOT EXISTS inventarios (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
imagem TEXT,
data_inventario DATE NOT NULL,
competencia VARCHAR(7) NOT NULL,
tipo VARCHAR(40) NOT NULL,
status VARCHAR(40) NOT NULL DEFAULT 'Aberto',
responsavel VARCHAR(180) NOT NULL,
local_estoque VARCHAR(180),
total_itens INTEGER NOT NULL DEFAULT 0,
total_insumos NUMERIC(14,2) NOT NULL DEFAULT 0,
total_embalagens NUMERIC(14,2) NOT NULL DEFAULT 0,
total_outros NUMERIC(14,2) NOT NULL DEFAULT 0,
total_geral NUMERIC(14,2) NOT NULL DEFAULT 0,
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: ITENS DO INVENTÁRIO
-- ========================================

CREATE TABLE IF NOT EXISTS inventario_itens (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
inventario_id INTEGER NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
tipo VARCHAR(80) NOT NULL DEFAULT 'Insumo',
nome VARCHAR(180) NOT NULL,
quantidade NUMERIC(14,4) NOT NULL DEFAULT 0,
unidade VARCHAR(50),
custo_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
total NUMERIC(14,2) NOT NULL DEFAULT 0,
criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: CMV MENSAL
-- ========================================

CREATE TABLE IF NOT EXISTS cmv_mensal (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
competencia VARCHAR(7) NOT NULL,
data_fechamento DATE NOT NULL,
responsavel VARCHAR(180) NOT NULL,
status VARCHAR(40) NOT NULL DEFAULT 'Aberto',
faturamento NUMERIC(14,2) NOT NULL DEFAULT 0,
estoque_inicial NUMERIC(14,2) NOT NULL DEFAULT 0,
compras NUMERIC(14,2) NOT NULL DEFAULT 0,
estoque_final NUMERIC(14,2) NOT NULL DEFAULT 0,
perdas NUMERIC(14,2) NOT NULL DEFAULT 0,
ajustes NUMERIC(14,2) NOT NULL DEFAULT 0,
cmv_real NUMERIC(14,2) NOT NULL DEFAULT 0,
cmv_percentual NUMERIC(10,2) NOT NULL DEFAULT 0,
lucro_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
margem_bruta NUMERIC(10,2) NOT NULL DEFAULT 0,
classificacao VARCHAR(80),
leitura TEXT,
motivo_ajuste TEXT,
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
UNIQUE (empresa_id, competencia)
);

-- ========================================
-- TABELA: FICHAS TÉCNICAS
-- Base para custo, preço e margem
-- ========================================

CREATE TABLE IF NOT EXISTS fichas_tecnicas (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
nome VARCHAR(180) NOT NULL,
codigo VARCHAR(80),
categoria VARCHAR(120),
rendimento NUMERIC(14,4) NOT NULL DEFAULT 1,
unidade_rendimento VARCHAR(50) DEFAULT 'unidade',
preco_venda NUMERIC(14,2) NOT NULL DEFAULT 0,
custo_insumos NUMERIC(14,2) NOT NULL DEFAULT 0,
custo_embalagens NUMERIC(14,2) NOT NULL DEFAULT 0,
custo_mao_obra NUMERIC(14,2) NOT NULL DEFAULT 0,
custo_total NUMERIC(14,2) NOT NULL DEFAULT 0,
margem_bruta NUMERIC(10,2) NOT NULL DEFAULT 0,
lucro_estimado NUMERIC(14,2) NOT NULL DEFAULT 0,
cmv_previsto NUMERIC(10,2) NOT NULL DEFAULT 0,
status VARCHAR(40) NOT NULL DEFAULT 'Ativa',
observacoes TEXT,
criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
UNIQUE (empresa_id, codigo)
);

-- ========================================
-- TABELA: ITENS DA FICHA TÉCNICA
-- Pode ligar insumos, embalagens ou itens manuais
-- ========================================

CREATE TABLE IF NOT EXISTS ficha_tecnica_itens (
id SERIAL PRIMARY KEY,
empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
ficha_tecnica_id INTEGER NOT NULL REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
tipo VARCHAR(80) NOT NULL DEFAULT 'Insumo',
item_origem_id INTEGER,
nome VARCHAR(180) NOT NULL,
quantidade NUMERIC(14,4) NOT NULL DEFAULT 0,
unidade VARCHAR(50),
custo_unitario NUMERIC(14,4) NOT NULL DEFAULT 0,
custo_total NUMERIC(14,2) NOT NULL DEFAULT 0,
criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========================================
-- TABELA: LOGS DO SISTEMA
-- Histórico de ações importantes
-- ========================================

CREATE TABLE IF NOT EXISTS logs_sistema (
id SERIAL PRIMARY KEY,
empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
tipo_evento VARCHAR(120) NOT NULL,
descricao TEXT,
origem VARCHAR(80) DEFAULT 'Sistema',
status VARCHAR(40) DEFAULT 'Sucesso',
criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);
-- ========================================
-- TABELA: LOGS DO PAINEL DE CONTROLE
-- Histórico interno dos donos do SaaS
-- ========================================

CREATE TABLE IF NOT EXISTS logs_painel_controle (
id SERIAL PRIMARY KEY,
empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
admin_nome VARCHAR(180),
tipo_evento VARCHAR(120) NOT NULL,
descricao TEXT,
modulo VARCHAR(120),
antes JSONB,
depois JSONB,
ip_acesso VARCHAR(80),
dispositivo TEXT,
status VARCHAR(40) DEFAULT 'Sucesso',
criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_painel_empresa ON logs_painel_controle(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_painel_usuario ON logs_painel_controle(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_painel_evento ON logs_painel_controle(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_logs_painel_data ON logs_painel_controle(criado_em);


-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);

CREATE INDEX IF NOT EXISTS idx_insumos_empresa ON insumos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_insumos_nome ON insumos(nome);
CREATE INDEX IF NOT EXISTS idx_insumos_status ON insumos(status);

CREATE INDEX IF NOT EXISTS idx_embalagens_empresa ON embalagens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_embalagens_nome ON embalagens(nome);
CREATE INDEX IF NOT EXISTS idx_embalagens_status ON embalagens(status);

CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa ON funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);

CREATE INDEX IF NOT EXISTS idx_compras_empresa ON compras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_compras_competencia ON compras(competencia);
CREATE INDEX IF NOT EXISTS idx_compras_status ON compras(status);

CREATE INDEX IF NOT EXISTS idx_compra_itens_empresa ON compra_itens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_compra_itens_compra ON compra_itens(compra_id);

CREATE INDEX IF NOT EXISTS idx_inventarios_empresa ON inventarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_competencia ON inventarios(competencia);
CREATE INDEX IF NOT EXISTS idx_inventarios_tipo ON inventarios(tipo);

CREATE INDEX IF NOT EXISTS idx_inventario_itens_empresa ON inventario_itens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventario_itens_inventario ON inventario_itens(inventario_id);

CREATE INDEX IF NOT EXISTS idx_cmv_empresa ON cmv_mensal(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cmv_competencia ON cmv_mensal(competencia);

CREATE INDEX IF NOT EXISTS idx_fichas_empresa ON fichas_tecnicas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fichas_status ON fichas_tecnicas(status);

CREATE INDEX IF NOT EXISTS idx_logs_empresa ON logs_sistema(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_evento ON logs_sistema(tipo_evento);

-- ========================================
-- DADOS INICIAIS PARA TESTE
-- ========================================

INSERT INTO planos (id, nome, valor_mensal, descricao, status)
VALUES
(1, 'Básico', 175.00, 'Plano inicial com recursos essenciais.', 'Ativo'),
(2, 'Pro', 350.00, 'Plano completo do BALU Food.', 'Ativo')
ON CONFLICT (id) DO NOTHING;

SELECT setval('planos_id_seq', (SELECT MAX(id) FROM planos));

INSERT INTO empresas (
id,
plano_id,
nome_fantasia,
razao_social,
cnpj,
slug,
responsavel,
email,
telefone,
segmento,
status,
status_pagamento,
data_inicio,
data_vencimento,
observacoes
)
VALUES (
1,
2,
'Empresa Teste BALU',
'Empresa Teste BALU LTDA',
'00.000.000/0001-00',
'empresa-teste-balu',
'Lucas Gabriel',
'[teste@balufood.com.br](mailto:teste@balufood.com.br)',
'(11) 99999-9999',
'Food Service',
'Ativo',
'Em dia',
CURRENT_DATE,
CURRENT_DATE + INTERVAL '30 days',
'Empresa padrão para testes locais com empresa_id = 1.'
)
ON CONFLICT (id) DO NOTHING;

SELECT setval('empresas_id_seq', (SELECT MAX(id) FROM empresas));

INSERT INTO usuarios (
empresa_id,
nome,
email,
senha_hash,
perfil,
status
)
VALUES (
1,
'Lucas Gabriel',
'[lucas@balufood.com.br](mailto:lucas@balufood.com.br)',
'$2y$12$P.QwSOOXqFfYxFxPauFls.AD6nIRkI1sqsSwwDk9rRrkt5ABGp4EC',
,
'Administrador',
'Ativo'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO assinaturas (
empresa_id,
plano_id,
valor_mensal,
status,
data_inicio,
data_vencimento,
ultimo_pagamento,
gateway,
observacoes
)
VALUES (
1,
2,
350.00,
'Ativa',
CURRENT_DATE,
CURRENT_DATE + INTERVAL '30 days',
CURRENT_DATE,
'Teste local',
'Assinatura fake para ambiente de desenvolvimento.'
)
ON CONFLICT DO NOTHING;

COMMIT;
