require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/db');

const users = [
  { nome: 'Desenvolvedor BALU', email: 'dev@balufood.com.br', senha: 'BaluDev2026!', perfil: 'desenvolvedor_balu', empresa: null },
  { nome: 'Admin BALU', email: 'admin@balufood.com.br', senha: 'BaluAdmin2026!', perfil: 'admin_balu', empresa: null },
  { nome: 'Representante BALU', email: 'representante@balufood.com.br', senha: 'BaluRep2026!', perfil: 'representante_balu', empresa: null },
];

async function main() {
  await query(`insert into planos (nome) values ('BALU Food') on conflict (nome) do nothing`);
  const plano = (await query(`select id from planos where nome = 'BALU Food' limit 1`)).rows[0];

  await query(`insert into planos_ciclos (plano_id, ciclo, valor_ciclo, meses_equivalentes)
    values ($1,'Mensal',250,1),($1,'Trimestral',675,3),($1,'Anual',2500,12)
    on conflict (plano_id, ciclo) do update set valor_ciclo = excluded.valor_ciclo`, [plano.id]);

  const empresa = (await query(`insert into empresas (nome_fantasia, slug, responsavel, email, status, status_pagamento)
    values ('Empresa Teste BALU','empresa-teste-balu','Cliente Teste','cliente@balufood.com.br','Ativo','Em dia')
    on conflict (slug) do update set atualizado_em = now()
    returning id`)).rows[0];

  await query(`insert into assinaturas (empresa_id, plano_id, ciclo, valor_ciclo, forma_pagamento, status, data_inicio, data_vencimento)
    values ($1,$2,'Mensal',250,'Cartão de crédito','Ativa',current_date,current_date + interval '30 days')
    on conflict do nothing`, [empresa.id, plano.id]);

  users.push({ nome: 'Cliente Teste', email: 'cliente@balufood.com.br', senha: 'BaluCliente2026!', perfil: 'cliente_admin', empresa: empresa.id });

  for (const user of users) {
    const senhaHash = await bcrypt.hash(user.senha, 10);
    await query(`insert into usuarios (empresa_id, nome, email, senha_hash, perfil, status)
      values ($1,$2,$3,$4,$5,'Ativo')
      on conflict (email) do update set senha_hash = excluded.senha_hash, perfil = excluded.perfil, status = 'Ativo', atualizado_em = now()`,
      [user.empresa, user.nome, user.email, senhaHash, user.perfil]);
  }

  console.log('Seed demo BALU concluído.');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => pool.end());
