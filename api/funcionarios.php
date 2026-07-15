<?php
// ========================================
// BALU FOOD - API DE FUNCIONÁRIOS
// CLT, Freelancer, Pró-labore e MEI
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
  listarFuncionarios();
}

if ($metodo === "POST") {
  criarFuncionario();
}

if ($metodo === "PUT") {
  atualizarFuncionario();
}

if ($metodo === "DELETE") {
  excluirFuncionario();
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
// LISTAR FUNCIONÁRIOS
// GET api/funcionarios.php
// GET api/funcionarios.php?id=1
// ========================================

function listarFuncionarios() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];

    $sql = "
      SELECT *
      FROM funcionarios
      WHERE id = :id
      AND empresa_id = :empresa_id
      LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
      ":id" => $id,
      ":empresa_id" => $empresaId
    ]);

    $funcionario = $stmt->fetch();

    if (!$funcionario) {
      respostaErro("Funcionário não encontrado.", 404);
    }

    respostaSucesso("Funcionário encontrado.", $funcionario);
  }

  $busca = isset($_GET["busca"]) ? limparTexto($_GET["busca"]) : "";
  $tipo = isset($_GET["tipo"]) ? limparTexto($_GET["tipo"]) : "";
  $status = isset($_GET["status"]) ? limparTexto($_GET["status"]) : "";

  $sql = "
    SELECT *
    FROM funcionarios
    WHERE empresa_id = :empresa_id
  ";

  $params = [
    ":empresa_id" => $empresaId
  ];

  if ($busca !== "") {
    $sql .= " AND (
      nome ILIKE :busca OR
      tipo ILIKE :busca OR
      cargo ILIKE :busca OR
      departamento ILIKE :busca OR
      observacoes ILIKE :busca
    )";

    $params[":busca"] = "%" . $busca . "%";
  }

  if ($tipo !== "") {
    $sql .= " AND tipo = :tipo";
    $params[":tipo"] = $tipo;
  }

  if ($status !== "") {
    $sql .= " AND status = :status";
    $params[":status"] = $status;
  }

  $sql .= " ORDER BY criado_em DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  $funcionarios = $stmt->fetchAll();

  respostaSucesso("Funcionários listados com sucesso.", $funcionarios);
}

// ========================================
// CRIAR FUNCIONÁRIO
// POST api/funcionarios.php
// ========================================

function criarFuncionario() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  $nome = campoObrigatorio($dados, "nome", "Nome ou função");
  $tipo = campoObrigatorio($dados, "tipo", "Tipo de contratação");

  $calculos = calcularDadosFuncionario($dados);

  $sql = "
    INSERT INTO funcionarios (
      empresa_id,
      imagem,
      nome,
      tipo,
      cargo,
      departamento,
      status,
      salario_base,
      encargos_percentual,
      valor_encargos,
      horas_mensais_clt,
      valor_diaria,
      dias_mes,
      horas_diaria,
      valor_mensal,
      horas_mensais_mensal,
      custo_mensal,
      custo_hora,
      horas_mes,
      participacao,
      observacoes,
      criado_em,
      atualizado_em
    ) VALUES (
      :empresa_id,
      :imagem,
      :nome,
      :tipo,
      :cargo,
      :departamento,
      :status,
      :salario_base,
      :encargos_percentual,
      :valor_encargos,
      :horas_mensais_clt,
      :valor_diaria,
      :dias_mes,
      :horas_diaria,
      :valor_mensal,
      :horas_mensais_mensal,
      :custo_mensal,
      :custo_hora,
      :horas_mes,
      :participacao,
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
    ":tipo" => $tipo,
    ":cargo" => pegarValor($dados, "cargo"),
    ":departamento" => pegarValor($dados, "departamento"),
    ":status" => pegarValor($dados, "status", "Ativo"),
    ":salario_base" => limparNumero(pegarValor($dados, "salarioBase")),
    ":encargos_percentual" => limparNumero(pegarValor($dados, "encargosPercentual")),
    ":valor_encargos" => $calculos["valor_encargos"],
    ":horas_mensais_clt" => limparNumero(pegarValor($dados, "horasMensaisClt")),
    ":valor_diaria" => limparNumero(pegarValor($dados, "valorDiaria")),
    ":dias_mes" => limparNumero(pegarValor($dados, "diasMes")),
    ":horas_diaria" => limparNumero(pegarValor($dados, "horasDiaria")),
    ":valor_mensal" => limparNumero(pegarValor($dados, "valorMensal")),
    ":horas_mensais_mensal" => limparNumero(pegarValor($dados, "horasMensaisMensal")),
    ":custo_mensal" => $calculos["custo_mensal"],
    ":custo_hora" => $calculos["custo_hora"],
    ":horas_mes" => $calculos["horas_mes"],
    ":participacao" => $calculos["participacao"],
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $funcionario = $stmt->fetch();

  respostaSucesso("Funcionário cadastrado com sucesso.", $funcionario, 201);
}

// ========================================
// ATUALIZAR FUNCIONÁRIO
// PUT api/funcionarios.php
// ========================================

function atualizarFuncionario() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();
  $dados = lerJson();

  if (!isset($dados["id"])) {
    respostaErro("ID do funcionário não informado.", 422);
  }

  $id = (int) $dados["id"];

  $nome = campoObrigatorio($dados, "nome", "Nome ou função");
  $tipo = campoObrigatorio($dados, "tipo", "Tipo de contratação");

  $calculos = calcularDadosFuncionario($dados);

  $sql = "
    UPDATE funcionarios SET
      imagem = :imagem,
      nome = :nome,
      tipo = :tipo,
      cargo = :cargo,
      departamento = :departamento,
      status = :status,
      salario_base = :salario_base,
      encargos_percentual = :encargos_percentual,
      valor_encargos = :valor_encargos,
      horas_mensais_clt = :horas_mensais_clt,
      valor_diaria = :valor_diaria,
      dias_mes = :dias_mes,
      horas_diaria = :horas_diaria,
      valor_mensal = :valor_mensal,
      horas_mensais_mensal = :horas_mensais_mensal,
      custo_mensal = :custo_mensal,
      custo_hora = :custo_hora,
      horas_mes = :horas_mes,
      participacao = :participacao,
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
    ":tipo" => $tipo,
    ":cargo" => pegarValor($dados, "cargo"),
    ":departamento" => pegarValor($dados, "departamento"),
    ":status" => pegarValor($dados, "status", "Ativo"),
    ":salario_base" => limparNumero(pegarValor($dados, "salarioBase")),
    ":encargos_percentual" => limparNumero(pegarValor($dados, "encargosPercentual")),
    ":valor_encargos" => $calculos["valor_encargos"],
    ":horas_mensais_clt" => limparNumero(pegarValor($dados, "horasMensaisClt")),
    ":valor_diaria" => limparNumero(pegarValor($dados, "valorDiaria")),
    ":dias_mes" => limparNumero(pegarValor($dados, "diasMes")),
    ":horas_diaria" => limparNumero(pegarValor($dados, "horasDiaria")),
    ":valor_mensal" => limparNumero(pegarValor($dados, "valorMensal")),
    ":horas_mensais_mensal" => limparNumero(pegarValor($dados, "horasMensaisMensal")),
    ":custo_mensal" => $calculos["custo_mensal"],
    ":custo_hora" => $calculos["custo_hora"],
    ":horas_mes" => $calculos["horas_mes"],
    ":participacao" => $calculos["participacao"],
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $funcionario = $stmt->fetch();

  if (!$funcionario) {
    respostaErro("Funcionário não encontrado para atualização.", 404);
  }

  respostaSucesso("Funcionário atualizado com sucesso.", $funcionario);
}

// ========================================
// EXCLUIR FUNCIONÁRIO
// DELETE api/funcionarios.php?id=1
// ========================================

function excluirFuncionario() {
  $pdo = conectarBanco();
  $empresaId = obterEmpresaIdAtual();

  if (!isset($_GET["id"])) {
    respostaErro("ID do funcionário não informado.", 422);
  }

  $id = (int) $_GET["id"];

  $sql = "
    DELETE FROM funcionarios
    WHERE id = :id
    AND empresa_id = :empresa_id
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id,
    ":empresa_id" => $empresaId
  ]);

  $funcionario = $stmt->fetch();

  if (!$funcionario) {
    respostaErro("Funcionário não encontrado para exclusão.", 404);
  }

  respostaSucesso("Funcionário excluído com sucesso.", $funcionario);
}

// ========================================
// CÁLCULOS DE MÃO DE OBRA
// ========================================

function calcularDadosFuncionario($dados) {
  $tipo = pegarValor($dados, "tipo", "CLT");
  $faturamento = limparNumero(pegarValor($dados, "faturamento"));

  $custoMensal = 0;
  $horasMes = 0;
  $valorEncargos = 0;

  if ($tipo === "CLT") {
    $salarioBase = limparNumero(pegarValor($dados, "salarioBase"));
    $encargosPercentual = limparNumero(pegarValor($dados, "encargosPercentual"));
    $horasMensaisClt = limparNumero(pegarValor($dados, "horasMensaisClt"));

    $valorEncargos = $salarioBase * ($encargosPercentual / 100);
    $custoMensal = $salarioBase + $valorEncargos;
    $horasMes = $horasMensaisClt;
  }

  if ($tipo === "Freelancer") {
    $valorDiaria = limparNumero(pegarValor($dados, "valorDiaria"));
    $diasMes = limparNumero(pegarValor($dados, "diasMes"));
    $horasDiaria = limparNumero(pegarValor($dados, "horasDiaria"));

    $custoMensal = $valorDiaria * $diasMes;
    $horasMes = $diasMes * $horasDiaria;
  }

  if ($tipo === "Pró-labore" || $tipo === "MEI") {
    $valorMensal = limparNumero(pegarValor($dados, "valorMensal"));
    $horasMensaisMensal = limparNumero(pegarValor($dados, "horasMensaisMensal"));

    $custoMensal = $valorMensal;
    $horasMes = $horasMensaisMensal;
  }

  $custoHora = $horasMes > 0 ? $custoMensal / $horasMes : 0;
  $participacao = $faturamento > 0 ? ($custoMensal / $faturamento) * 100 : 0;

  return [
    "valor_encargos" => $valorEncargos,
    "custo_mensal" => $custoMensal,
    "custo_hora" => $custoHora,
    "horas_mes" => $horasMes,
    "participacao" => $participacao
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
