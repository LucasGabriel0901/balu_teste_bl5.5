<?php
// ========================================
// BALU FOOD - API DE CMV REAL MENSAL
// Estoque Inicial + Compras - Estoque Final
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
  listarCmv();
}

if ($metodo === "POST") {
  criarCmv();
}

if ($metodo === "PUT") {
  atualizarCmv();
}

if ($metodo === "DELETE") {
  excluirCmv();
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
// LISTAR FECHAMENTOS DE CMV
// GET api/cmv.php
// GET api/cmv.php?id=1
// ========================================

function listarCmv() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];

    $sql = "
      SELECT *
      FROM cmv_mensal
      WHERE id = :id
      AND empresa_id = :empresa_id
      LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
      ":id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $cmv = $stmt->fetch();

    if (!$cmv) {
      respostaErro("Fechamento de CMV não encontrado.", 404);
    }

    respostaSucesso("Fechamento encontrado.", $cmv);
  }

  $busca = isset($_GET["busca"]) ? limparTexto($_GET["busca"]) : "";
  $status = isset($_GET["status"]) ? limparTexto($_GET["status"]) : "";
  $classificacao = isset($_GET["classificacao"]) ? limparTexto($_GET["classificacao"]) : "";
  $competencia = isset($_GET["competencia"]) ? limparTexto($_GET["competencia"]) : "";

  $sql = "
    SELECT *
    FROM cmv_mensal
    WHERE empresa_id = :empresa_id
  ";

  $params = [
    ":empresa_id" => $empresaId
  ];

  if ($busca !== "") {
    $sql .= " AND (
      competencia ILIKE :busca OR
      responsavel ILIKE :busca OR
      status ILIKE :busca OR
      classificacao ILIKE :busca OR
      observacoes ILIKE :busca
    )";

    $params[":busca"] = "%" . $busca . "%";
  }

  if ($status !== "") {
    $sql .= " AND status = :status";
    $params[":status"] = $status;
  }

  if ($classificacao !== "") {
    $sql .= " AND classificacao = :classificacao";
    $params[":classificacao"] = $classificacao;
  }

  if ($competencia !== "") {
    $sql .= " AND competencia = :competencia";
    $params[":competencia"] = $competencia;
  }

  $sql .= " ORDER BY competencia DESC, criado_em DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  $fechamentos = $stmt->fetchAll();

  respostaSucesso("Fechamentos de CMV listados com sucesso.", $fechamentos);
}

// ========================================
// CRIAR FECHAMENTO DE CMV
// POST api/cmv.php
// ========================================

function criarCmv() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  $competencia = campoObrigatorio($dados, "competencia", "Competência");
  $dataFechamento = campoObrigatorio($dados, "dataFechamento", "Data de fechamento");
  $responsavel = campoObrigatorio($dados, "responsavel", "Responsável");

  $resultado = calcularDadosCmv($dados);

  $sql = "
    INSERT INTO cmv_mensal (
      empresa_id,
      competencia,
      data_fechamento,
      responsavel,
      status,
      faturamento,
      estoque_inicial,
      compras,
      estoque_final,
      perdas,
      ajustes,
      cmv_real,
      cmv_percentual,
      lucro_bruto,
      margem_bruta,
      classificacao,
      leitura,
      motivo_ajuste,
      observacoes,
      criado_em,
      atualizado_em
    ) VALUES (
      :empresa_id,
      :competencia,
      :data_fechamento,
      :responsavel,
      :status,
      :faturamento,
      :estoque_inicial,
      :compras,
      :estoque_final,
      :perdas,
      :ajustes,
      :cmv_real,
      :cmv_percentual,
      :lucro_bruto,
      :margem_bruta,
      :classificacao,
      :leitura,
      :motivo_ajuste,
      :observacoes,
      NOW(),
      NOW()
    )
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":empresa_id" => $empresaId,
    ":competencia" => $competencia,
    ":data_fechamento" => $dataFechamento,
    ":responsavel" => $responsavel,
    ":status" => pegarValor($dados, "status", "Aberto"),
    ":faturamento" => $resultado["faturamento"],
    ":estoque_inicial" => $resultado["estoque_inicial"],
    ":compras" => $resultado["compras"],
    ":estoque_final" => $resultado["estoque_final"],
    ":perdas" => $resultado["perdas"],
    ":ajustes" => $resultado["ajustes"],
    ":cmv_real" => $resultado["cmv_real"],
    ":cmv_percentual" => $resultado["cmv_percentual"],
    ":lucro_bruto" => $resultado["lucro_bruto"],
    ":margem_bruta" => $resultado["margem_bruta"],
    ":classificacao" => $resultado["classificacao"],
    ":leitura" => $resultado["leitura"],
    ":motivo_ajuste" => pegarValor($dados, "motivoAjuste"),
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $cmv = $stmt->fetch();

  respostaSucesso("Fechamento de CMV cadastrado com sucesso.", $cmv, 201);
}

// ========================================
// ATUALIZAR FECHAMENTO DE CMV
// PUT api/cmv.php
// ========================================

function atualizarCmv() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  if (!isset($dados["id"])) {
    respostaErro("ID do fechamento não informado.", 422);
  }

  $id = (int) $dados["id"];

  $competencia = campoObrigatorio($dados, "competencia", "Competência");
  $dataFechamento = campoObrigatorio($dados, "dataFechamento", "Data de fechamento");
  $responsavel = campoObrigatorio($dados, "responsavel", "Responsável");

  $resultado = calcularDadosCmv($dados);

  $sql = "
    UPDATE cmv_mensal SET
      competencia = :competencia,
      data_fechamento = :data_fechamento,
      responsavel = :responsavel,
      status = :status,
      faturamento = :faturamento,
      estoque_inicial = :estoque_inicial,
      compras = :compras,
      estoque_final = :estoque_final,
      perdas = :perdas,
      ajustes = :ajustes,
      cmv_real = :cmv_real,
      cmv_percentual = :cmv_percentual,
      lucro_bruto = :lucro_bruto,
      margem_bruta = :margem_bruta,
      classificacao = :classificacao,
      leitura = :leitura,
      motivo_ajuste = :motivo_ajuste,
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
    ":competencia" => $competencia,
    ":data_fechamento" => $dataFechamento,
    ":responsavel" => $responsavel,
    ":status" => pegarValor($dados, "status", "Aberto"),
    ":faturamento" => $resultado["faturamento"],
    ":estoque_inicial" => $resultado["estoque_inicial"],
    ":compras" => $resultado["compras"],
    ":estoque_final" => $resultado["estoque_final"],
    ":perdas" => $resultado["perdas"],
    ":ajustes" => $resultado["ajustes"],
    ":cmv_real" => $resultado["cmv_real"],
    ":cmv_percentual" => $resultado["cmv_percentual"],
    ":lucro_bruto" => $resultado["lucro_bruto"],
    ":margem_bruta" => $resultado["margem_bruta"],
    ":classificacao" => $resultado["classificacao"],
    ":leitura" => $resultado["leitura"],
    ":motivo_ajuste" => pegarValor($dados, "motivoAjuste"),
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $cmv = $stmt->fetch();

  if (!$cmv) {
    respostaErro("Fechamento de CMV não encontrado para atualização.", 404);
  }

  respostaSucesso("Fechamento de CMV atualizado com sucesso.", $cmv);
}

// ========================================
// EXCLUIR FECHAMENTO DE CMV
// DELETE api/cmv.php?id=1
// ========================================

function excluirCmv() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (!isset($_GET["id"])) {
    respostaErro("ID do fechamento não informado.", 422);
  }

  $id = (int) $_GET["id"];

  $sql = "
    DELETE FROM cmv_mensal
    WHERE id = :id
    AND empresa_id = :empresa_id
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $cmv = $stmt->fetch();

  if (!$cmv) {
    respostaErro("Fechamento de CMV não encontrado para exclusão.", 404);
  }

  respostaSucesso("Fechamento de CMV excluído com sucesso.", $cmv);
}

// ========================================
// CÁLCULOS DO CMV
// ========================================

function calcularDadosCmv($dados) {
  $faturamento = limparNumero(pegarValor($dados, "faturamento"));
  $estoqueInicial = limparNumero(pegarValor($dados, "estoqueInicial"));
  $compras = limparNumero(pegarValor($dados, "compras"));
  $estoqueFinal = limparNumero(pegarValor($dados, "estoqueFinal"));
  $perdas = limparNumero(pegarValor($dados, "perdas"));
  $ajustes = limparNumero(pegarValor($dados, "ajustes"));

  $cmvReal = $estoqueInicial + $compras - $estoqueFinal + $perdas + $ajustes;

  if ($cmvReal < 0) {
    $cmvReal = 0;
  }

  $cmvPercentual = 0;

  if ($faturamento > 0) {
    $cmvPercentual = ($cmvReal / $faturamento) * 100;
  }

  $lucroBruto = $faturamento - $cmvReal;

  $margemBruta = 0;

  if ($faturamento > 0) {
    $margemBruta = ($lucroBruto / $faturamento) * 100;
  }

  $classificacao = classificarCmv($cmvPercentual, $faturamento, $cmvReal);
  $leitura = gerarLeituraCmv($classificacao);

  return [
    "faturamento" => $faturamento,
    "estoque_inicial" => $estoqueInicial,
    "compras" => $compras,
    "estoque_final" => $estoqueFinal,
    "perdas" => $perdas,
    "ajustes" => $ajustes,
    "cmv_real" => $cmvReal,
    "cmv_percentual" => $cmvPercentual,
    "lucro_bruto" => $lucroBruto,
    "margem_bruta" => $margemBruta,
    "classificacao" => $classificacao,
    "leitura" => $leitura
  ];
}

function classificarCmv($percentual, $faturamento, $cmvReal) {
  if ($faturamento <= 0 || $cmvReal <= 0) {
    return "Não calculado";
  }

  if ($percentual <= 30) {
    return "Excelente";
  }

  if ($percentual <= 35) {
    return "Dentro do esperado";
  }

  if ($percentual <= 40) {
    return "Atenção";
  }

  return "Crítico";
}

function gerarLeituraCmv($classificacao) {
  if ($classificacao === "Excelente") {
    return "Operação com bom controle de custo e margem saudável.";
  }

  if ($classificacao === "Dentro do esperado") {
    return "Resultado dentro de uma faixa aceitável para operação food service.";
  }

  if ($classificacao === "Atenção") {
    return "Revisar compras, perdas, estoque final e precificação dos produtos.";
  }

  if ($classificacao === "Crítico") {
    return "CMV elevado. O custo está comprometendo a margem da operação.";
  }

  return "Aguardando faturamento e dados suficientes para calcular o CMV.";
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
