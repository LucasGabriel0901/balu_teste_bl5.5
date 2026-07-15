<?php
// ========================================
// BALU FOOD - API DE EMBALAGENS
// Listar, cadastrar, editar e excluir embalagens
// Padrão SaaS com empresa_id
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
  listarEmbalagens();
}

if ($metodo === "POST") {
  criarEmbalagem();
}

if ($metodo === "PUT") {
  atualizarEmbalagem();
}

if ($metodo === "DELETE") {
  excluirEmbalagem();
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
// LISTAR EMBALAGENS
// GET api/embalagens.php
// GET api/embalagens.php?id=1
// ========================================

function listarEmbalagens() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];

    $sql = "
      SELECT *
      FROM embalagens
      WHERE id = :id
      AND empresa_id = :empresa_id
      LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
      ":id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $embalagem = $stmt->fetch();

    if (!$embalagem) {
      respostaErro("Embalagem não encontrada.", 404);
    }

    respostaSucesso("Embalagem encontrada.", $embalagem);
  }

  $busca = isset($_GET["busca"]) ? limparTexto($_GET["busca"]) : "";
  $categoria = isset($_GET["categoria"]) ? limparTexto($_GET["categoria"]) : "";
  $status = isset($_GET["status"]) ? limparTexto($_GET["status"]) : "";

  $sql = "
    SELECT *
    FROM embalagens
    WHERE empresa_id = :empresa_id
  ";

  $params = [
    ":empresa_id" => $empresaId
  ];

  if ($busca !== "") {
    $sql .= " AND (
      nome ILIKE :busca OR
      codigo ILIKE :busca OR
      categoria ILIKE :busca OR
      descricao ILIKE :busca OR
      fornecedor_1 ILIKE :busca OR
      fornecedor_2 ILIKE :busca OR
      fornecedor_3 ILIKE :busca OR
      observacoes ILIKE :busca
    )";

    $params[":busca"] = "%" . $busca . "%";
  }

  if ($categoria !== "") {
    $sql .= " AND categoria = :categoria";
    $params[":categoria"] = $categoria;
  }

  if ($status !== "") {
    $sql .= " AND status = :status";
    $params[":status"] = $status;
  }

  $sql .= " ORDER BY criado_em DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  $embalagens = $stmt->fetchAll();

  respostaSucesso("Embalagens listadas com sucesso.", $embalagens);
}

// ========================================
// CRIAR EMBALAGEM
// POST api/embalagens.php
// ========================================

function criarEmbalagem() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  $nome = campoObrigatorio($dados, "nome", "Nome da embalagem");
  $categoria = campoObrigatorio($dados, "categoria", "Categoria");

  $codigo = isset($dados["codigo"]) && $dados["codigo"] !== ""
    ? limparTexto($dados["codigo"])
    : gerarCodigoEmbalagem();

  $calculos = calcularDadosEmbalagem($dados);

  $sql = "
    INSERT INTO embalagens (
      empresa_id,
      imagem,
      nome,
      codigo,
      categoria,
      unidade,
      quantidade_pacote,
      status,
      descricao,
      fornecedor_1,
      preco_fornecedor_1,
      fornecedor_2,
      preco_fornecedor_2,
      fornecedor_3,
      preco_fornecedor_3,
      preco_medio_pacote,
      preco_unitario,
      estoque_atual,
      estoque_minimo,
      estoque_ideal,
      valor_estoque,
      status_estoque,
      observacoes,
      criado_em,
      atualizado_em
    ) VALUES (
      :empresa_id,
      :imagem,
      :nome,
      :codigo,
      :categoria,
      :unidade,
      :quantidade_pacote,
      :status,
      :descricao,
      :fornecedor_1,
      :preco_fornecedor_1,
      :fornecedor_2,
      :preco_fornecedor_2,
      :fornecedor_3,
      :preco_fornecedor_3,
      :preco_medio_pacote,
      :preco_unitario,
      :estoque_atual,
      :estoque_minimo,
      :estoque_ideal,
      :valor_estoque,
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
    ":categoria" => $categoria,
    ":unidade" => pegarValor($dados, "unidade"),
    ":quantidade_pacote" => limparNumero(pegarValor($dados, "quantidadePacote")),
    ":status" => pegarValor($dados, "status", "Ativo"),
    ":descricao" => pegarValor($dados, "descricao"),
    ":fornecedor_1" => pegarValor($dados, "fornecedor1"),
    ":preco_fornecedor_1" => limparNumero(pegarValor($dados, "precoFornecedor1")),
    ":fornecedor_2" => pegarValor($dados, "fornecedor2"),
    ":preco_fornecedor_2" => limparNumero(pegarValor($dados, "precoFornecedor2")),
    ":fornecedor_3" => pegarValor($dados, "fornecedor3"),
    ":preco_fornecedor_3" => limparNumero(pegarValor($dados, "precoFornecedor3")),
    ":preco_medio_pacote" => $calculos["preco_medio_pacote"],
    ":preco_unitario" => $calculos["preco_unitario"],
    ":estoque_atual" => limparNumero(pegarValor($dados, "estoqueAtual")),
    ":estoque_minimo" => limparNumero(pegarValor($dados, "estoqueMinimo")),
    ":estoque_ideal" => limparNumero(pegarValor($dados, "estoqueIdeal")),
    ":valor_estoque" => $calculos["valor_estoque"],
    ":status_estoque" => $calculos["status_estoque"],
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $embalagem = $stmt->fetch();

  respostaSucesso("Embalagem cadastrada com sucesso.", $embalagem, 201);
}

// ========================================
// ATUALIZAR EMBALAGEM
// PUT api/embalagens.php
// ========================================

function atualizarEmbalagem() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  if (!isset($dados["id"])) {
    respostaErro("ID da embalagem não informado.", 422);
  }

  $id = (int) $dados["id"];

  $nome = campoObrigatorio($dados, "nome", "Nome da embalagem");
  $categoria = campoObrigatorio($dados, "categoria", "Categoria");

  $calculos = calcularDadosEmbalagem($dados);

  $sql = "
    UPDATE embalagens SET
      imagem = :imagem,
      nome = :nome,
      codigo = :codigo,
      categoria = :categoria,
      unidade = :unidade,
      quantidade_pacote = :quantidade_pacote,
      status = :status,
      descricao = :descricao,
      fornecedor_1 = :fornecedor_1,
      preco_fornecedor_1 = :preco_fornecedor_1,
      fornecedor_2 = :fornecedor_2,
      preco_fornecedor_2 = :preco_fornecedor_2,
      fornecedor_3 = :fornecedor_3,
      preco_fornecedor_3 = :preco_fornecedor_3,
      preco_medio_pacote = :preco_medio_pacote,
      preco_unitario = :preco_unitario,
      estoque_atual = :estoque_atual,
      estoque_minimo = :estoque_minimo,
      estoque_ideal = :estoque_ideal,
      valor_estoque = :valor_estoque,
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
    ":categoria" => $categoria,
    ":unidade" => pegarValor($dados, "unidade"),
    ":quantidade_pacote" => limparNumero(pegarValor($dados, "quantidadePacote")),
    ":status" => pegarValor($dados, "status", "Ativo"),
    ":descricao" => pegarValor($dados, "descricao"),
    ":fornecedor_1" => pegarValor($dados, "fornecedor1"),
    ":preco_fornecedor_1" => limparNumero(pegarValor($dados, "precoFornecedor1")),
    ":fornecedor_2" => pegarValor($dados, "fornecedor2"),
    ":preco_fornecedor_2" => limparNumero(pegarValor($dados, "precoFornecedor2")),
    ":fornecedor_3" => pegarValor($dados, "fornecedor3"),
    ":preco_fornecedor_3" => limparNumero(pegarValor($dados, "precoFornecedor3")),
    ":preco_medio_pacote" => $calculos["preco_medio_pacote"],
    ":preco_unitario" => $calculos["preco_unitario"],
    ":estoque_atual" => limparNumero(pegarValor($dados, "estoqueAtual")),
    ":estoque_minimo" => limparNumero(pegarValor($dados, "estoqueMinimo")),
    ":estoque_ideal" => limparNumero(pegarValor($dados, "estoqueIdeal")),
    ":valor_estoque" => $calculos["valor_estoque"],
    ":status_estoque" => $calculos["status_estoque"],
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $embalagem = $stmt->fetch();

  if (!$embalagem) {
    respostaErro("Embalagem não encontrada para atualização.", 404);
  }

  respostaSucesso("Embalagem atualizada com sucesso.", $embalagem);
}

// ========================================
// EXCLUIR EMBALAGEM
// DELETE api/embalagens.php?id=1
// ========================================

function excluirEmbalagem() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (!isset($_GET["id"])) {
    respostaErro("ID da embalagem não informado.", 422);
  }

  $id = (int) $_GET["id"];

  $sql = "
    DELETE FROM embalagens
    WHERE id = :id
    AND empresa_id = :empresa_id
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $embalagem = $stmt->fetch();

  if (!$embalagem) {
    respostaErro("Embalagem não encontrada para exclusão.", 404);
  }

  respostaSucesso("Embalagem excluída com sucesso.", $embalagem);
}

// ========================================
// CÁLCULOS DA EMBALAGEM
// ========================================

function calcularDadosEmbalagem($dados) {
  $preco1 = limparNumero(pegarValor($dados, "precoFornecedor1"));
  $preco2 = limparNumero(pegarValor($dados, "precoFornecedor2"));
  $preco3 = limparNumero(pegarValor($dados, "precoFornecedor3"));

  $quantidadePacote = limparNumero(pegarValor($dados, "quantidadePacote"));
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

  $precoMedioPacote = 0;

  if (count($precos) > 0) {
    $precoMedioPacote = array_sum($precos) / count($precos);
  }

  $precoUnitario = $quantidadePacote > 0
    ? $precoMedioPacote / $quantidadePacote
    : 0;

  $valorEstoque = $estoqueAtual * $precoUnitario;

  $statusEstoque = "Ativo";

  if ($estoqueAtual <= 0) {
    $statusEstoque = "Crítico";
  } else if ($estoqueMinimo > 0 && $estoqueAtual <= $estoqueMinimo) {
    $statusEstoque = "Estoque baixo";
  }

  return [
    "preco_medio_pacote" => $precoMedioPacote,
    "preco_unitario" => $precoUnitario,
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

function gerarCodigoEmbalagem() {
  return "EMB-" . date("YmdHis");
}
