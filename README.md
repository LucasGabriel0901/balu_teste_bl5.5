# BALU Food

Sistema de Gestão para Food Service.

O **BALU Food** é um sistema voltado para restaurantes, marmitarias, buffets, lanchonetes e operações de food service que precisam controlar custos, insumos, embalagens, compras, inventários, mão de obra e CMV real mensal.

---

## Objetivo do sistema

O sistema tem como objetivo ajudar o cliente a entender:

* quanto custa produzir seus produtos;
* quanto existe em estoque;
* quanto foi gasto em compras no mês;
* qual foi o CMV real do período;
* quanto custa a mão de obra;
* quais produtos possuem melhor margem;
* qual foi o resultado real de eventos e operações.

---

## Tecnologias utilizadas

Nesta fase inicial, o projeto usa:

* HTML
* CSS
* JavaScript
* localStorage para simulação de dados

Na versão real, o sistema será preparado para:

* PHP no backend
* PostgreSQL no banco de dados
* API para comunicação entre frontend e backend

---

## Estrutura do projeto

```txt
balu_food_teste/
│
├── index.html
├── README.md
├── .gitignore
│
├── assets/
│   ├── logo/
│   ├── img/
│   └── icons/
│
├── css/
│   ├── global.css
│   ├── layout.css
│   ├── dashboard.css
│   ├── cadastros.css
│   ├── estoque.css
│   ├── financeiro.css
│   └── fichas-tecnicas.css
│
├── js/
│   ├── app.js
│   ├── layout.js
│   ├── dashboard.js
│   ├── cadastro-insumos.js
│   ├── cadastro-embalagens.js
│   ├── funcionarios.js
│   ├── compras-realizadas.js
│   ├── inventarios.js
│   └── cmv-real-mensal.js
│
├── pages/
│   ├── dashboard.html
│   ├── cadastro-insumos.html
│   ├── cadastro-embalagens.html
│   ├── funcionarios.html
│   ├── compras-realizadas.html
│   ├── inventarios.html
│   └── cmv-real-mensal.html
│
├── api/
│   ├── conexao.php
│   ├── insumos.php
│   ├── embalagens.php
│   ├── funcionarios.php
│   ├── compras.php
│   ├── inventarios.php
│   └── cmv.php
│
└── database/
    └── schema.sql
```

---

## Módulos iniciais

* Dashboard
* Cadastro de Insumos
* Cadastro de Embalagens
* Funcionários e Mão de Obra
* Compras Realizadas
* Inventários
* CMV Real Mensal

---

## Lógica principal do CMV

O CMV real mensal será calculado com base na fórmula:

```txt
CMV Real = Estoque Inicial + Compras do Mês - Estoque Final
```

E o percentual será calculado com:

```txt
CMV % = CMV Real / Faturamento do Mês x 100
```

---

## Fluxo ideal do CMV

1. O cliente faz o inventário inicial no começo do mês.
2. O sistema calcula o valor monetário do estoque inicial.
3. Durante o mês, o cliente registra as compras realizadas.
4. No final do mês, o cliente faz o inventário final.
5. O sistema calcula o estoque final.
6. O sistema calcula o CMV real em valor e percentual.

---

## Regra sobre cálculos

Nesta fase de protótipo, alguns cálculos podem aparecer no JavaScript apenas para simulação visual.

Na versão real:

```txt
JavaScript = interface e prévia visual
PHP = cálculos oficiais e regras de negócio
PostgreSQL = armazenamento dos dados e histórico
```

O frontend nunca deve ser a fonte oficial dos cálculos financeiros.

---

## Identidade visual

A identidade visual do sistema segue a marca **BALU**, com sidebar branca, cores modernas e interface limpa para SaaS.

Cores principais:

```txt
Vermelho: #E31E24
Laranja: #FF8A00
Verde: #00B050
Roxo: #6C2BD9
Azul escuro: #0D1B2A
Fundo claro: #F5F6F8
```

---

## Status do projeto

Projeto em fase inicial de estruturação e prototipação frontend.
