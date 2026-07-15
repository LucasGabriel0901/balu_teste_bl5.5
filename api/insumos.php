<?php
// ========================================
// BALU FOOD - API DE INSUMOS
// Listar, cadastrar, editar e excluir insumos
// Padrão SaaS com empresa_id
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
  listarInsumos();
}

if ($metodo === "POST") {
  criarInsumo();
}

if ($metodo === "PUT") {
  atualizarInsumo();
}

if ($metodo === "DELETE") {
  excluirInsumo();
}

respostaErro("Método não permitido.", 405);

// ========================================
// IMPORTANTE SOBRE EMPRESA_ID
// ========================================
// No SaaS real, o empresa_id virá do login/sessão/token.
// Por enquanto, usamos empresa_id = 1 apenas para teste.

function obterEmpresaIdAtual() {
  return 1;
}

// ========================================
// LISTAR INSUMOS
// GET api/insumos.php
// GET api/insumos.php?id=1
// ========================================

function listarInsumos() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];

    $sql = "
      SELECT *
      FROM insumos
      WHERE id = :id
      AND empresa_id = :empresa_id
      LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
      ":id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $insumo = $stmt->fetch();

    if (!$insumo) {
      respostaErro("Insumo não encontrado.", 404);
    }

    respostaSucesso("Insumo encontrado.", $insumo);
  }

  $busca = isset($_GET["busca"]) ? limparTexto($_GET["busca"]) : "";
  $grupo = isset($_GET["grupo"]) ? limparTexto($_GET["grupo"]) : "";
  $status = isset($_GET["status"]) ? limparTexto($_GET["status"]) : "";

  $sql = "
    SELECT *
    FROM insumos
    WHERE empresa_id = :empresa_id
  ";

  $params = [
    ":empresa_id" => $empresaId
  ];

  if ($busca !== "") {
    $sql .= " AND (
      nome ILIKE :busca OR
      codigo ILIKE :busca OR
      grupo ILIKE :busca OR
      categoria ILIKE :busca OR
      fornecedor_1 ILIKE :busca OR
      fornecedor_2 ILIKE :busca OR
      fornecedor_3 ILIKE :busca OR
      observacoes ILIKE :busca
    )";

    $params[":busca"] = "%" . $busca . "%";
  }

  if ($grupo !== "") {
    $sql .= " AND grupo = :grupo";
    $params[":grupo"] = $grupo;
  }

  if ($status !== "") {
    $sql .= " AND status = :status";
    $params[":status"] = $status;
  }

  $sql .= " ORDER BY criado_em DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  $insumos = $stmt->fetchAll();

  respostaSucesso("Insumos listados com sucesso.", $insumos);
}

// ========================================
// CRIAR INSUMO
// POST api/insumos.php
// ========================================

function criarInsumo() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  $nome = campoObrigatorio($dados, "nome", "Nome do insumo");
  $grupo = campoObrigatorio($dados, "grupo", "Grupo");

  $codigo = isset($dados["codigo"]) && $dados["codigo"] !== ""
    ? limparTexto($dados["codigo"])
    : gerarCodigoInsumo();

  $calculos = calcularDadosInsumo($dados);

  $sql = "
    INSERT INTO insumos (
      empresa_id,
      imagem,
      nome,
      codigo,
      grupo,
      categoria,
      unidade_compra,
      unidade_consumo,
      descricao,
      peso_bruto,
      peso_liquido,
      fator_correcao,
      perda_percentual,
      fornecedor_1,
      preco_fornecedor_1,
      fornecedor_2,
      preco_fornecedor_2,
      fornecedor_3,
      preco_fornecedor_3,
      preco_medio,
      preco_medio_kg,
      estoque_atual,
      estoque_minimo,
      estoque_ideal,
      valor_estoque,
      status,
      status_estoque,
      observacoes,
      criado_em,
      atualizado_em
    ) VALUES (
      :empresa_id,
      :imagem,
      :nome,
      :codigo,
      :grupo,
      :categoria,
      :unidade_compra,
      :unidade_consumo,
      :descricao,
      :peso_bruto,
      :peso_liquido,
      :fator_correcao,
      :perda_percentual,
      :fornecedor_1,
      :preco_fornecedor_1,
      :fornecedor_2,
      :preco_fornecedor_2,
      :fornecedor_3,
      :preco_fornecedor_3,
      :preco_medio,
      :preco_medio_kg,
      :estoque_atual,
      :estoque_minimo,
      :estoque_ideal,
      :valor_estoque,
      :status,
      :status_estoque,
      :observacoes,
      NOW(),
      NOW()
    )
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":empresa_id" => $empresaId,
    ":imagem" => pegarValor($dados, "imagem"),
    ":nome" => $nome,
    ":codigo" => $codigo,
    ":grupo" => $grupo,
    ":categoria" => pegarValor($dados, "categoria"),
    ":unidade_compra" => pegarValor($dados, "unidadeCompra"),
    ":unidade_consumo" => pegarValor($dados, "unidadeConsumo"),
    ":descricao" => pegarValor($dados, "descricao"),
    ":peso_bruto" => limparNumero(pegarValor($dados, "pesoBruto")),
    ":peso_liquido" => limparNumero(pegarValor($dados, "pesoLiquido")),
    ":fator_correcao" => $calculos["fator_correcao"],
    ":perda_percentual" => $calculos["perda_percentual"],
    ":fornecedor_1" => pegarValor($dados, "fornecedor1"),
    ":preco_fornecedor_1" => limparNumero(pegarValor($dados, "precoFornecedor1")),
    ":fornecedor_2" => pegarValor($dados, "fornecedor2"),
    ":preco_fornecedor_2" => limparNumero(pegarValor($dados, "precoFornecedor2")),
    ":fornecedor_3" => pegarValor($dados, "fornecedor3"),
    ":preco_fornecedor_3" => limparNumero(pegarValor($dados, "precoFornecedor3")),
    ":preco_medio" => $calculos["preco_medio"],
    ":preco_medio_kg" => $calculos["preco_medio_kg"],
    ":estoque_atual" => limparNumero(pegarValor($dados, "estoqueAtual")),
    ":estoque_minimo" => limparNumero(pegarValor($dados, "estoqueMinimo")),
    ":estoque_ideal" => limparNumero(pegarValor($dados, "estoqueIdeal")),
    ":valor_estoque" => $calculos["valor_estoque"],
    ":status" => pegarValor($dados, "status", "Ativo"),
    ":status_estoque" => $calculos["status_estoque"],
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $insumo = $stmt->fetch();

  respostaSucesso("Insumo cadastrado com sucesso.", $insumo, 201);
}

// ========================================
// ATUALIZAR INSUMO
// PUT api/insumos.php
// ========================================

function atualizarInsumo() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  if (!isset($dados["id"])) {
    respostaErro("ID do insumo não informado.", 422);
  }

  $id = (int) $dados["id"];

  $nome = campoObrigatorio($dados, "nome", "Nome do insumo");
  $grupo = campoObrigatorio($dados, "grupo", "Grupo");

  $calculos = calcularDadosInsumo($dados);

  $sql = "
    UPDATE insumos SET
      imagem = :imagem,
      nome = :nome,
      codigo = :codigo,
      grupo = :grupo,
      categoria = :categoria,
      unidade_compra = :unidade_compra,
      unidade_consumo = :unidade_consumo,
      descricao = :descricao,
      peso_bruto = :peso_bruto,
      peso_liquido = :peso_liquido,
      fator_correcao = :fator_correcao,
      perda_percentual = :perda_percentual,
      fornecedor_1 = :fornecedor_1,
      preco_fornecedor_1 = :preco_fornecedor_1,
      fornecedor_2 = :fornecedor_2,
      preco_fornecedor_2 = :preco_fornecedor_2,
      fornecedor_3 = :fornecedor_3,
      preco_fornecedor_3 = :preco_fornecedor_3,
      preco_medio = :preco_medio,
      preco_medio_kg = :preco_medio_kg,
      estoque_atual = :estoque_atual,
      estoque_minimo = :estoque_minimo,
      estoque_ideal = :estoque_ideal,
      valor_estoque = :valor_estoque,
      status = :status,
      status_estoque = :status_estoque,
      observacoes = :observacoes,
      atualizado_em = NOW()
    WHERE id = :id
    AND empresa_id = :empresa_id
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id,
    ":empresa_id" => $empresaId,
    ":imagem" => pegarValor($dados, "imagem"),
    ":nome" => $nome,
    ":codigo" => pegarValor($dados, "codigo"),
    ":grupo" => $grupo,
    ":categoria" => pegarValor($dados, "categoria"),
    ":unidade_compra" => pegarValor($dados, "unidadeCompra"),
    ":unidade_consumo" => pegarValor($dados, "unidadeConsumo"),
    ":descricao" => pegarValor($dados, "descricao"),
    ":peso_bruto" => limparNumero(pegarValor($dados, "pesoBruto")),
    ":peso_liquido" => limparNumero(pegarValor($dados, "pesoLiquido")),
    ":fator_correcao" => $calculos["fator_correcao"],
    ":perda_percentual" => $calculos["perda_percentual"],
    ":fornecedor_1" => pegarValor($dados, "fornecedor1"),
    ":preco_fornecedor_1" => limparNumero(pegarValor($dados, "precoFornecedor1")),
    ":fornecedor_2" => pegarValor($dados, "fornecedor2"),
    ":preco_fornecedor_2" => limparNumero(pegarValor($dados, "precoFornecedor2")),
    ":fornecedor_3" => pegarValor($dados, "fornecedor3"),
    ":preco_fornecedor_3" => limparNumero(pegarValor($dados, "precoFornecedor3")),
    ":preco_medio" => $calculos["preco_medio"],
    ":preco_medio_kg" => $calculos["preco_medio_kg"],
    ":estoque_atual" => limparNumero(pegarValor($dados, "estoqueAtual")),
    ":estoque_minimo" => limparNumero(pegarValor($dados, "estoqueMinimo")),
    ":estoque_ideal" => limparNumero(pegarValor($dados, "estoqueIdeal")),
    ":valor_estoque" => $calculos["valor_estoque"],
    ":status" => pegarValor($dados, "status", "Ativo"),
    ":status_estoque" => $calculos["status_estoque"],
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $insumo = $stmt->fetch();

  if (!$insumo) {
    respostaErro("Insumo não encontrado para atualização.", 404);
  }

  respostaSucesso("Insumo atualizado com sucesso.", $insumo);
}

// ========================================
// EXCLUIR INSUMO
// DELETE api/insumos.php?id=1
// ========================================

function excluirInsumo() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (!isset($_GET["id"])) {
    respostaErro("ID do insumo não informado.", 422);
  }

  $id = (int) $_GET["id"];

  $sql = "
    DELETE FROM insumos
    WHERE id = :id
    AND empresa_id = :empresa_id
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $insumo = $stmt->fetch();

  if (!$insumo) {
    respostaErro("Insumo não encontrado para exclusão.", 404);
  }

  respostaSucesso("Insumo excluído com sucesso.", $insumo);
}

// ========================================
// CÁLCULOS DO INSUMO
// ========================================

function calcularDadosInsumo($dados) {
  $pesoBruto = limparNumero(pegarValor($dados, "pesoBruto"));
  $pesoLiquido = limparNumero(pegarValor($dados, "pesoLiquido"));

  $preco1 = limparNumero(pegarValor($dados, "precoFornecedor1"));
  $preco2 = limparNumero(pegarValor($dados, "precoFornecedor2"));
  $preco3 = limparNumero(pegarValor($dados, "precoFornecedor3"));

  $estoqueAtual = limparNumero(pegarValor($dados, "estoqueAtual"));
  $estoqueMinimo = limparNumero(pegarValor($dados, "estoqueMinimo"));

  $precos = [];

  if ($preco1 > 0) {
    $precos[] = $preco1;
  }

  if ($preco2 > 0) {
    $precos[] = $preco2;
  }

  if ($preco3 > 0) {
    $precos[] = $preco3;
  }

  $precoMedio = 0;

  if (count($precos) > 0) {
    $precoMedio = array_sum($precos) / count($precos);
  }

  $fatorCorrecao = $pesoLiquido > 0 ? $pesoBruto / $pesoLiquido : 0;

  $perdaPercentual = $pesoBruto > 0
    ? (($pesoBruto - $pesoLiquido) / $pesoBruto) * 100
    : 0;

  if ($perdaPercentual < 0) {
    $perdaPercentual = 0;
  }

  $pesoLiquidoKg = $pesoLiquido > 0 ? $pesoLiquido / 1000 : 0;

  $precoMedioKg = $pesoLiquidoKg > 0
    ? $precoMedio / $pesoLiquidoKg
    : $precoMedio;

  $valorEstoque = $estoqueAtual * $precoMedioKg;

  $statusEstoque = "Ativo";

  if ($estoqueAtual <= 0) {
    $statusEstoque = "Crítico";
  } else if ($estoqueMinimo > 0 && $estoqueAtual <= $estoqueMinimo) {
    $statusEstoque = "Estoque baixo";
  }

  return [
    "preco_medio" => $precoMedio,
    "preco_medio_kg" => $precoMedioKg,
    "fator_correcao" => $fatorCorrecao,
    "perda_percentual" => $perdaPercentual,
    "valor_estoque" => $valorEstoque,
    "status_estoque" => $statusEstoque
  ];
}

// ========================================
// HELPERS
// ========================================

function pegarValor($dados, $campo, $padrao = null) {
  if (!isset($dados[$campo])) {
    return $padrao;
  }

  if ($dados[$campo] === "") {
    return $padrao;
  }

  return limparTexto($dados[$campo]);
}

function gerarCodigoInsumo() {
  return "INS-" . date("YmdHis");
}
