# BALU Food - Como preparar o PostgreSQL

O front-end atual continua funcionando com localStorage. O PostgreSQL não é criado automaticamente pelo GitHub Pages.

Para preparar o banco local:

1. Crie um banco chamado `balu_food` no PostgreSQL.
2. Rode o schema principal:

```sql
\i database/schema.sql
```

3. Rode a migration complementar:

```sql
\i database/migrations/002_tabelas_mvp_complementares.sql
```

Observação: as APIs PHP em `/api` ainda precisam estar em uma hospedagem que suporte PHP com extensão PDO PostgreSQL. No GitHub Pages, PHP e PostgreSQL não rodam.
