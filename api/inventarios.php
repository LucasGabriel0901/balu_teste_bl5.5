<?php
// ========================================
// BALU FOOD - API DE INVENTÁRIOS
// Inventário inicial, parcial e final
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
  listarInventarios();
}

if ($metodo === "POST") {
  criarInventario();
}

if ($metodo === "PUT") {
  atualizarInventario();
}

if ($metodo === "DELETE") {
  excluirInventario();
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
// LISTAR INVENTÁRIOS
// GET api/inventarios.php
// GET api/inventarios.php?id=1
// ========================================

function listarInventarios() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];

    $inventario = buscarInventarioCompleto($pdo, $id, $empresaId);

    if (!$inventario) {
      respostaErro("Inventário não encontrado.", 404);
    }

    respostaSucesso("Inventário encontrado.", $inventario);
  }

  $busca = isset($_GET["busca"]) ? limparTexto($_GET["busca"]) : "";
  $tipo = isset($_GET["tipo"]) ? limparTexto($_GET["tipo"]) : "";
  $status = isset($_GET["status"]) ? limparTexto($_GET["status"]) : "";
  $competencia = isset($_GET["competencia"]) ? limparTexto($_GET["competencia"]) : "";

  $sql = "
    SELECT 
      i.*,
      (
        SELECT COUNT(*)
        FROM inventario_itens ii
        WHERE ii.inventario_id = i.id
      ) AS total_itens_lancados
    FROM inventarios i
    WHERE i.empresa_id = :empresa_id
  ";

  $params = [
    ":empresa_id" => $empresaId
  ];

  if ($busca !== "") {
    $sql .= " AND (
      i.tipo ILIKE :busca OR
      i.status ILIKE :busca OR
      i.responsavel ILIKE :busca OR
      i.local_estoque ILIKE :busca OR
      i.observacoes ILIKE :busca
    )";

    $params[":busca"] = "%" . $busca . "%";
  }

  if ($tipo !== "") {
    $sql .= " AND i.tipo = :tipo";
    $params[":tipo"] = $tipo;
  }

  if ($status !== "") {
    $sql .= " AND i.status = :status";
    $params[":status"] = $status;
  }

  if ($competencia !== "") {
    $sql .= " AND i.competencia = :competencia";
    $params[":competencia"] = $competencia;
  }

  $sql .= " ORDER BY i.data_inventario DESC, i.criado_em DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  $inventarios = $stmt->fetchAll();

  respostaSucesso("Inventários listados com sucesso.", $inventarios);
}

// ========================================
// CRIAR INVENTÁRIO
// POST api/inventarios.php
// ========================================

function criarInventario() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  $dataInventario = campoObrigatorio($dados, "data", "Data do inventário");
  $competencia = campoObrigatorio($dados, "competencia", "Competência");
  $tipo = campoObrigatorio($dados, "tipo", "Tipo do inventário");
  $responsavel = campoObrigatorio($dados, "responsavel", "Responsável");

  $resultado = calcularDadosInventario($dados);

  if (count($resultado["itens"]) === 0) {
    respostaErro("O inventário precisa ter pelo menos um item válido.", 422);
  }

  try {
    $pdo->beginTransaction();

    $sql = "
      INSERT INTO inventarios (
        empresa_id,
        imagem,
        data_inventario,
        competencia,
        tipo,
        status,
        responsavel,
        local_estoque,
        total_itens,
        total_insumos,
        total_embalagens,
        total_outros,
        total_geral,
        observacoes,
        criado_em,
        atualizado_em
      ) VALUES (
        :empresa_id,
        :imagem,
        :data_inventario,
        :competencia,
        :tipo,
        :status,
        :responsavel,
        :local_estoque,
        :total_itens,
        :total_insumos,
        :total_embalagens,
        :total_outros,
        :total_geral,
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
      ":data_inventario" => $dataInventario,
      ":competencia" => $competencia,
      ":tipo" => $tipo,
      ":status" => pegarValor($dados, "status", "Aberto"),
      ":responsavel" => $responsavel,
      ":local_estoque" => pegarValor($dados, "local"),
      ":total_itens" => $resultado["total_itens"],
      ":total_insumos" => $resultado["total_insumos"],
      ":total_embalagens" => $resultado["total_embalagens"],
      ":total_outros" => $resultado["total_outros"],
      ":total_geral" => $resultado["total_geral"],
      ":observacoes" => pegarValor($dados, "observacoes")
    ]);

    $inventario = $stmt->fetch();

    inserirItensInventario($pdo, $empresaId, $inventario["id"], $resultado["itens"]);

    $pdo->commit();

    $inventarioCompleto = buscarInventarioCompleto($pdo, $inventario["id"], $empresaId);

    respostaSucesso("Inventário cadastrado com sucesso.", $inventarioCompleto, 201);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao cadastrar inventário.", 500, $erro->getMessage());
  }
}

// ========================================
// ATUALIZAR INVENTÁRIO
// PUT api/inventarios.php
// ========================================

function atualizarInventario() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  if (!isset($dados["id"])) {
    respostaErro("ID do inventário não informado.", 422);
  }

  $id = (int) $dados["id"];

  $dataInventario = campoObrigatorio($dados, "data", "Data do inventário");
  $competencia = campoObrigatorio($dados, "competencia", "Competência");
  $tipo = campoObrigatorio($dados, "tipo", "Tipo do inventário");
  $responsavel = campoObrigatorio($dados, "responsavel", "Responsável");

  $resultado = calcularDadosInventario($dados);

  if (count($resultado["itens"]) === 0) {
    respostaErro("O inventário precisa ter pelo menos um item válido.", 422);
  }

  try {
    $pdo->beginTransaction();

    $sql = "
      UPDATE inventarios SET
        imagem = :imagem,
        data_inventario = :data_inventario,
        competencia = :competencia,
        tipo = :tipo,
        status = :status,
        responsavel = :responsavel,
        local_estoque = :local_estoque,
        total_itens = :total_itens,
        total_insumos = :total_insumos,
        total_embalagens = :total_embalagens,
        total_outros = :total_outros,
        total_geral = :total_geral,
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
      ":data_inventario" => $dataInventario,
      ":competencia" => $competencia,
      ":tipo" => $tipo,
      ":status" => pegarValor($dados, "status", "Aberto"),
      ":responsavel" => $responsavel,
      ":local_estoque" => pegarValor($dados, "local"),
      ":total_itens" => $resultado["total_itens"],
      ":total_insumos" => $resultado["total_insumos"],
      ":total_embalagens" => $resultado["total_embalagens"],
      ":total_outros" => $resultado["total_outros"],
      ":total_geral" => $resultado["total_geral"],
      ":observacoes" => pegarValor($dados, "observacoes")
    ]);

    $inventario = $stmt->fetch();

    if (!$inventario) {
      $pdo->rollBack();
      respostaErro("Inventário não encontrado para atualização.", 404);
    }

    $sqlDeleteItens = "
      DELETE FROM inventario_itens
      WHERE inventario_id = :inventario_id
      AND empresa_id = :empresa_id
    ";

    $stmtDelete = $pdo->prepare($sqlDeleteItens);

    $stmtDelete->execute([
      ":inventario_id" => $id,
      ":empresa_id" => $empresaId
    ]);

    inserirItensInventario($pdo, $empresaId, $id, $resultado["itens"]);

    $pdo->commit();

    $inventarioCompleto = buscarInventarioCompleto($pdo, $id, $empresaId);

    respostaSucesso("Inventário atualizado com sucesso.", $inventarioCompleto);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao atualizar inventário.", 500, $erro->getMessage());
  }
}

// ========================================
// EXCLUIR INVENTÁRIO
// DELETE api/inventarios.php?id=1
// ========================================

function excluirInventario() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (!isset($_GET["id"])) {
    respostaErro("ID do inventário não informado.", 422);
  }

  $id = (int) $_GET["id"];

  try {
    $pdo->beginTransaction();

    $sqlDeleteItens = "
      DELETE FROM inventario_itens
      WHERE inventario_id = :inventario_id
      AND empresa_id = :empresa_id
    ";

    $stmtItens = $pdo->prepare($sqlDeleteItens);

    $stmtItens->execute([
      ":inventario_id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $sqlDeleteInventario = "
      DELETE FROM inventarios
      WHERE id = :id
      AND empresa_id = :empresa_id
      RETURNING *
    ";

    $stmtInventario = $pdo->prepare($sqlDeleteInventario);

    $stmtInventario->execute([
      ":id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $inventario = $stmtInventario->fetch();

    if (!$inventario) {
      $pdo->rollBack();
      respostaErro("Inventário não encontrado para exclusão.", 404);
    }

    $pdo->commit();

    respostaSucesso("Inventário excluído com sucesso.", $inventario);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao excluir inventário.", 500, $erro->getMessage());
  }
}

// ========================================
// BUSCAR INVENTÁRIO COMPLETO
// ========================================

function buscarInventarioCompleto($pdo, $id, $empresaId) {
  $sqlInventario = "
    SELECT *
    FROM inventarios
    WHERE id = :id
    AND empresa_id = :empresa_id
    LIMIT 1
  ";

  $stmtInventario = $pdo->prepare($sqlInventario);

  $stmtInventario->execute([
    ":id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $inventario = $stmtInventario->fetch();

  if (!$inventario) {
    return null;
  }

  $sqlItens = "
    SELECT *
    FROM inventario_itens
    WHERE inventario_id = :inventario_id
    AND empresa_id = :empresa_id
    ORDER BY id ASC
  ";

  $stmtItens = $pdo->prepare($sqlItens);

  $stmtItens->execute([
    ":inventario_id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $inventario["itens"] = $stmtItens->fetchAll();

  return $inventario;
}

// ========================================
// INSERIR ITENS DO INVENTÁRIO
// ========================================

function inserirItensInventario($pdo, $empresaId, $inventarioId, $itens) {
  $sql = "
    INSERT INTO inventario_itens (
      empresa_id,
      inventario_id,
      tipo,
      nome,
      quantidade,
      unidade,
      custo_unitario,
      total,
      criado_em
    ) VALUES (
      :empresa_id,
      :inventario_id,
      :tipo,
      :nome,
      :quantidade,
      :unidade,
      :custo_unitario,
      :total,
      NOW()
    )
  ";

  $stmt = $pdo->prepare($sql);

  foreach ($itens as $item) {
    $stmt->execute([
      ":empresa_id" => $empresaId,
      ":inventario_id" => $inventarioId,
      ":tipo" => $item["tipo"],
      ":nome" => $item["nome"],
      ":quantidade" => $item["quantidade"],
      ":unidade" => $item["unidade"],
      ":custo_unitario" => $item["custo_unitario"],
      ":total" => $item["total"]
    ]);
  }
}

// ========================================
// CÁLCULOS DO INVENTÁRIO
// ========================================

function calcularDadosInventario($dados) {
  $itensRecebidos = isset($dados["itens"]) && is_array($dados["itens"])
    ? $dados["itens"]
    : [];

  $itens = [];
  $totalInsumos = 0;
  $totalEmbalagens = 0;
  $totalOutros = 0;

  foreach ($itensRecebidos as $item) {
    $nome = isset($item["nome"]) ? limparTexto($item["nome"]) : "";

    if ($nome === "") {
      continue;
    }

    $tipo = isset($item["tipo"]) ? limparTexto($item["tipo"]) : "Insumo";
    $quantidade = isset($item["quantidade"]) ? limparNumero($item["quantidade"]) : 0;
    $unidade = isset($item["unidade"]) ? limparTexto($item["unidade"]) : "unidade";
    $custoUnitario = isset($item["custoUnitario"]) ? limparNumero($item["custoUnitario"]) : 0;

    if ($quantidade <= 0) {
      continue;
    }

    $totalItem = $quantidade * $custoUnitario;

    $itens[] = [
      "tipo" => $tipo,
      "nome" => $nome,
      "quantidade" => $quantidade,
      "unidade" => $unidade,
      "custo_unitario" => $custoUnitario,
      "total" => $totalItem
    ];

    if ($tipo === "Insumo") {
      $totalInsumos += $totalItem;
    } else if ($tipo === "Embalagem") {
      $totalEmbalagens += $totalItem;
    } else {
      $totalOutros += $totalItem;
    }
  }

  $totalGeral = $totalInsumos + $totalEmbalagens + $totalOutros;

  return [
    "itens" => $itens,
    "total_itens" => count($itens),
    "total_insumos" => $totalInsumos,
    "total_embalagens" => $totalEmbalagens,
    "total_outros" => $totalOutros,
    "total_geral" => $totalGeral
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
