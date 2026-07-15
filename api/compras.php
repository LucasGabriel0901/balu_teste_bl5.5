<?php
// ========================================
// BALU FOOD - API DE COMPRAS REALIZADAS
// Lista, cadastra, edita e exclui compras
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
  listarCompras();
}

if ($metodo === "POST") {
  criarCompra();
}

if ($metodo === "PUT") {
  atualizarCompra();
}

if ($metodo === "DELETE") {
  excluirCompra();
}

respostaErro("Método não permitido.", 405);

// ========================================
// IMPORTANTE SOBRE EMPRESA_ID
// ========================================
// No SaaS real, o empresa_id deve vir do login/sessão/token.
// Por enquanto, deixamos uma função provisória.
// Depois vamos trocar isso por autenticação real.

function obterEmpresaIdAtual() {
  return 1;
}

// ========================================
// LISTAR COMPRAS
// GET api/compras.php
// GET api/compras.php?id=1
// ========================================

function listarCompras() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];

    $compra = buscarCompraCompleta($pdo, $id, $empresaId);

    if (!$compra) {
      respostaErro("Compra não encontrada.", 404);
    }

    respostaSucesso("Compra encontrada.", $compra);
  }

  $busca = isset($_GET["busca"]) ? limparTexto($_GET["busca"]) : "";
  $tipo = isset($_GET["tipo"]) ? limparTexto($_GET["tipo"]) : "";
  $status = isset($_GET["status"]) ? limparTexto($_GET["status"]) : "";
  $competencia = isset($_GET["competencia"]) ? limparTexto($_GET["competencia"]) : "";

  $sql = "
    SELECT 
      c.*,
      (
        SELECT COUNT(*) 
        FROM compra_itens ci 
        WHERE ci.compra_id = c.id
      ) AS total_itens
    FROM compras c
    WHERE c.empresa_id = :empresa_id
  ";

  $params = [
    ":empresa_id" => $empresaId
  ];

  if ($busca !== "") {
    $sql .= " AND (
      c.fornecedor ILIKE :busca OR
      c.numero_nota ILIKE :busca OR
      c.tipo ILIKE :busca OR
      c.status ILIKE :busca OR
      c.observacoes ILIKE :busca
    )";

    $params[":busca"] = "%" . $busca . "%";
  }

  if ($tipo !== "") {
    $sql .= " AND c.tipo = :tipo";
    $params[":tipo"] = $tipo;
  }

  if ($status !== "") {
    $sql .= " AND c.status = :status";
    $params[":status"] = $status;
  }

  if ($competencia !== "") {
    $sql .= " AND c.competencia = :competencia";
    $params[":competencia"] = $competencia;
  }

  $sql .= " ORDER BY c.data_compra DESC, c.criado_em DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  $compras = $stmt->fetchAll();

  respostaSucesso("Compras listadas com sucesso.", $compras);
}

// ========================================
// CRIAR COMPRA
// POST api/compras.php
// ========================================

function criarCompra() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  $dataCompra = campoObrigatorio($dados, "data", "Data da compra");
  $fornecedor = campoObrigatorio($dados, "fornecedor", "Fornecedor");
  $tipo = campoObrigatorio($dados, "tipo", "Tipo da compra");

  $resultado = calcularDadosCompra($dados);

  if (count($resultado["itens"]) === 0) {
    respostaErro("A compra precisa ter pelo menos um item válido.", 422);
  }

  try {
    $pdo->beginTransaction();

    $sql = "
      INSERT INTO compras (
        empresa_id,
        imagem,
        data_compra,
        fornecedor,
        numero_nota,
        tipo,
        status,
        forma_pagamento,
        competencia,
        subtotal,
        desconto,
        frete,
        impostos,
        ajustes,
        total,
        observacoes,
        criado_em,
        atualizado_em
      ) VALUES (
        :empresa_id,
        :imagem,
        :data_compra,
        :fornecedor,
        :numero_nota,
        :tipo,
        :status,
        :forma_pagamento,
        :competencia,
        :subtotal,
        :desconto,
        :frete,
        :impostos,
        :ajustes,
        :total,
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
      ":data_compra" => $dataCompra,
      ":fornecedor" => $fornecedor,
      ":numero_nota" => pegarValor($dados, "numeroNota"),
      ":tipo" => $tipo,
      ":status" => pegarValor($dados, "status", "Confirmada"),
      ":forma_pagamento" => pegarValor($dados, "formaPagamento"),
      ":competencia" => pegarCompetenciaCompra($dados, $dataCompra),
      ":subtotal" => $resultado["subtotal"],
      ":desconto" => $resultado["desconto"],
      ":frete" => $resultado["frete"],
      ":impostos" => $resultado["impostos"],
      ":ajustes" => $resultado["ajustes"],
      ":total" => $resultado["total"],
      ":observacoes" => pegarValor($dados, "observacoes")
    ]);

    $compra = $stmt->fetch();

    inserirItensCompra($pdo, $empresaId, $compra["id"], $resultado["itens"]);

    $pdo->commit();

    $compraCompleta = buscarCompraCompleta($pdo, $compra["id"], $empresaId);

    respostaSucesso("Compra cadastrada com sucesso.", $compraCompleta, 201);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao cadastrar compra.", 500, $erro->getMessage());
  }
}

// ========================================
// ATUALIZAR COMPRA
// PUT api/compras.php
// ========================================

function atualizarCompra() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  if (!isset($dados["id"])) {
    respostaErro("ID da compra não informado.", 422);
  }

  $id = (int) $dados["id"];

  $dataCompra = campoObrigatorio($dados, "data", "Data da compra");
  $fornecedor = campoObrigatorio($dados, "fornecedor", "Fornecedor");
  $tipo = campoObrigatorio($dados, "tipo", "Tipo da compra");

  $resultado = calcularDadosCompra($dados);

  if (count($resultado["itens"]) === 0) {
    respostaErro("A compra precisa ter pelo menos um item válido.", 422);
  }

  try {
    $pdo->beginTransaction();

    $sql = "
      UPDATE compras SET
        imagem = :imagem,
        data_compra = :data_compra,
        fornecedor = :fornecedor,
        numero_nota = :numero_nota,
        tipo = :tipo,
        status = :status,
        forma_pagamento = :forma_pagamento,
        competencia = :competencia,
        subtotal = :subtotal,
        desconto = :desconto,
        frete = :frete,
        impostos = :impostos,
        ajustes = :ajustes,
        total = :total,
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
      ":data_compra" => $dataCompra,
      ":fornecedor" => $fornecedor,
      ":numero_nota" => pegarValor($dados, "numeroNota"),
      ":tipo" => $tipo,
      ":status" => pegarValor($dados, "status", "Confirmada"),
      ":forma_pagamento" => pegarValor($dados, "formaPagamento"),
      ":competencia" => pegarCompetenciaCompra($dados, $dataCompra),
      ":subtotal" => $resultado["subtotal"],
      ":desconto" => $resultado["desconto"],
      ":frete" => $resultado["frete"],
      ":impostos" => $resultado["impostos"],
      ":ajustes" => $resultado["ajustes"],
      ":total" => $resultado["total"],
      ":observacoes" => pegarValor($dados, "observacoes")
    ]);

    $compra = $stmt->fetch();

    if (!$compra) {
      $pdo->rollBack();
      respostaErro("Compra não encontrada para atualização.", 404);
    }

    $sqlDeleteItens = "
      DELETE FROM compra_itens
      WHERE compra_id = :compra_id
      AND empresa_id = :empresa_id
    ";

    $stmtDelete = $pdo->prepare($sqlDeleteItens);

    $stmtDelete->execute([
      ":compra_id" => $id,
      ":empresa_id" => $empresaId
    ]);

    inserirItensCompra($pdo, $empresaId, $id, $resultado["itens"]);

    $pdo->commit();

    $compraCompleta = buscarCompraCompleta($pdo, $id, $empresaId);

    respostaSucesso("Compra atualizada com sucesso.", $compraCompleta);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao atualizar compra.", 500, $erro->getMessage());
  }
}

// ========================================
// EXCLUIR COMPRA
// DELETE api/compras.php?id=1
// ========================================

function excluirCompra() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (!isset($_GET["id"])) {
    respostaErro("ID da compra não informado.", 422);
  }

  $id = (int) $_GET["id"];

  try {
    $pdo->beginTransaction();

    $sqlDeleteItens = "
      DELETE FROM compra_itens
      WHERE compra_id = :compra_id
      AND empresa_id = :empresa_id
    ";

    $stmtItens = $pdo->prepare($sqlDeleteItens);

    $stmtItens->execute([
      ":compra_id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $sqlDeleteCompra = "
      DELETE FROM compras
      WHERE id = :id
      AND empresa_id = :empresa_id
      RETURNING *
    ";

    $stmtCompra = $pdo->prepare($sqlDeleteCompra);

    $stmtCompra->execute([
      ":id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $compra = $stmtCompra->fetch();

    if (!$compra) {
      $pdo->rollBack();
      respostaErro("Compra não encontrada para exclusão.", 404);
    }

    $pdo->commit();

    respostaSucesso("Compra excluída com sucesso.", $compra);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao excluir compra.", 500, $erro->getMessage());
  }
}

// ========================================
// BUSCAR COMPRA COMPLETA
// ========================================

function buscarCompraCompleta($pdo, $id, $empresaId) {
  $sqlCompra = "
    SELECT *
    FROM compras
    WHERE id = :id
    AND empresa_id = :empresa_id
    LIMIT 1
  ";

  $stmtCompra = $pdo->prepare($sqlCompra);

  $stmtCompra->execute([
    ":id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $compra = $stmtCompra->fetch();

  if (!$compra) {
    return null;
  }

  $sqlItens = "
    SELECT *
    FROM compra_itens
    WHERE compra_id = :compra_id
    AND empresa_id = :empresa_id
    ORDER BY id ASC
  ";

  $stmtItens = $pdo->prepare($sqlItens);

  $stmtItens->execute([
    ":compra_id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $compra["itens"] = $stmtItens->fetchAll();

  return $compra;
}

// ========================================
// INSERIR ITENS DA COMPRA
// ========================================

function inserirItensCompra($pdo, $empresaId, $compraId, $itens) {
  $sql = "
    INSERT INTO compra_itens (
      empresa_id,
      compra_id,
      tipo,
      nome,
      quantidade,
      unidade,
      valor_unitario,
      total,
      criado_em
    ) VALUES (
      :empresa_id,
      :compra_id,
      :tipo,
      :nome,
      :quantidade,
      :unidade,
      :valor_unitario,
      :total,
      NOW()
    )
  ";

  $stmt = $pdo->prepare($sql);

  foreach ($itens as $item) {
    $stmt->execute([
      ":empresa_id" => $empresaId,
      ":compra_id" => $compraId,
      ":tipo" => $item["tipo"],
      ":nome" => $item["nome"],
      ":quantidade" => $item["quantidade"],
      ":unidade" => $item["unidade"],
      ":valor_unitario" => $item["valor_unitario"],
      ":total" => $item["total"]
    ]);
  }
}

// ========================================
// CÁLCULOS DA COMPRA
// ========================================

function calcularDadosCompra($dados) {
  $itensRecebidos = isset($dados["itens"]) && is_array($dados["itens"])
    ? $dados["itens"]
    : [];

  $itens = [];
  $subtotal = 0;

  foreach ($itensRecebidos as $item) {
    $nome = isset($item["nome"]) ? limparTexto($item["nome"]) : "";

    if ($nome === "") {
      continue;
    }

    $tipo = isset($item["tipo"]) ? limparTexto($item["tipo"]) : "Insumo";
    $quantidade = isset($item["quantidade"]) ? limparNumero($item["quantidade"]) : 0;
    $unidade = isset($item["unidade"]) ? limparTexto($item["unidade"]) : "unidade";
    $valorUnitario = isset($item["valorUnitario"]) ? limparNumero($item["valorUnitario"]) : 0;

    if ($quantidade <= 0 || $valorUnitario <= 0) {
      continue;
    }

    $totalItem = $quantidade * $valorUnitario;

    $itens[] = [
      "tipo" => $tipo,
      "nome" => $nome,
      "quantidade" => $quantidade,
      "unidade" => $unidade,
      "valor_unitario" => $valorUnitario,
      "total" => $totalItem
    ];

    $subtotal += $totalItem;
  }

  $desconto = limparNumero(pegarValor($dados, "desconto"));
  $frete = limparNumero(pegarValor($dados, "frete"));
  $impostos = limparNumero(pegarValor($dados, "impostos"));

  $ajustes = $frete + $impostos - $desconto;
  $total = $subtotal + $ajustes;

  if ($total < 0) {
    $total = 0;
  }

  return [
    "itens" => $itens,
    "subtotal" => $subtotal,
    "desconto" => $desconto,
    "frete" => $frete,
    "impostos" => $impostos,
    "ajustes" => $ajustes,
    "total" => $total
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

function pegarCompetenciaCompra($dados, $dataCompra) {
  if (isset($dados["competencia"]) && $dados["competencia"] !== "") {
    return limparTexto($dados["competencia"]);
  }

  if ($dataCompra && strlen($dataCompra) >= 7) {
    return substr($dataCompra, 0, 7);
  }

  return date("Y-m");
}
