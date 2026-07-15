<?php
// ========================================
// BALU FOOD - API DE EMPRESAS / CLIENTES
// Usada pelo Painel de Controle interno do SaaS
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
  listarEmpresas();
}

if ($metodo === "POST") {
  criarEmpresa();
}

if ($metodo === "PUT") {
  atualizarEmpresa();
}

if ($metodo === "DELETE") {
  excluirEmpresa();
}

respostaErro("Método não permitido.", 405);

// ========================================
// LISTAR EMPRESAS
// GET api/empresas.php
// GET api/empresas.php?id=1
// ========================================

function listarEmpresas() {
  $pdo = conectarBanco();

  if (isset($_GET["id"])) {
    $id = (int) $_GET["id"];

    $empresa = buscarEmpresaCompleta($pdo, $id);

    if (!$empresa) {
      respostaErro("Empresa não encontrada.", 404);
    }

    respostaSucesso("Empresa encontrada.", $empresa);
  }

  $busca = isset($_GET["busca"]) ? limparTexto($_GET["busca"]) : "";
  $status = isset($_GET["status"]) ? limparTexto($_GET["status"]) : "";
  $statusPagamento = isset($_GET["status_pagamento"]) ? limparTexto($_GET["status_pagamento"]) : "";
  $planoId = isset($_GET["plano_id"]) ? (int) $_GET["plano_id"] : 0;

  $sql = "
    SELECT 
      e.*,
      p.nome AS plano_nome,
      p.valor_mensal AS plano_valor,
      a.status AS assinatura_status,
      a.valor_mensal AS assinatura_valor
    FROM empresas e
    LEFT JOIN planos p ON p.id = e.plano_id
    LEFT JOIN assinaturas a ON a.empresa_id = e.id
    WHERE 1 = 1
  ";

  $params = [];

  if ($busca !== "") {
    $sql .= " AND (
      e.nome_fantasia ILIKE :busca OR
      e.razao_social ILIKE :busca OR
      e.responsavel ILIKE :busca OR
      e.email ILIKE :busca OR
      e.telefone ILIKE :busca OR
      e.slug ILIKE :busca
    )";

    $params[":busca"] = "%" . $busca . "%";
  }

  if ($status !== "") {
    $sql .= " AND e.status = :status";
    $params[":status"] = $status;
  }

  if ($statusPagamento !== "") {
    $sql .= " AND e.status_pagamento = :status_pagamento";
    $params[":status_pagamento"] = $statusPagamento;
  }

  if ($planoId > 0) {
    $sql .= " AND e.plano_id = :plano_id";
    $params[":plano_id"] = $planoId;
  }

  $sql .= " ORDER BY e.criado_em DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  $empresas = $stmt->fetchAll();

  $resumo = gerarResumoEmpresas($pdo);

  respostaSucesso("Empresas listadas com sucesso.", [
    "resumo" => $resumo,
    "empresas" => $empresas
  ]);
}

// ========================================
// CRIAR EMPRESA / CLIENTE
// POST api/empresas.php
// ========================================

function criarEmpresa() {
  $pdo = conectarBanco();
  $dados = lerJson();

  $nomeFantasia = campoObrigatorio($dados, "nomeFantasia", "Nome fantasia");
  $responsavel = campoObrigatorio($dados, "responsavel", "Responsável");
  $email = campoObrigatorio($dados, "email", "E-mail");

  $planoId = isset($dados["planoId"]) && $dados["planoId"] !== ""
    ? (int) $dados["planoId"]
    : 2;

  $slug = isset($dados["slug"]) && $dados["slug"] !== ""
    ? limparTexto($dados["slug"])
    : gerarSlug($nomeFantasia);

  $plano = buscarPlanoPorId($pdo, $planoId);

  if (!$plano) {
    respostaErro("Plano informado não existe.", 404);
  }

  try {
    $pdo->beginTransaction();

    $sql = "
      INSERT INTO empresas (
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
        ultimo_pagamento,
        observacoes,
        criado_em,
        atualizado_em
      ) VALUES (
        :plano_id,
        :nome_fantasia,
        :razao_social,
        :cnpj,
        :slug,
        :responsavel,
        :email,
        :telefone,
        :segmento,
        :status,
        :status_pagamento,
        :data_inicio,
        :data_vencimento,
        :ultimo_pagamento,
        :observacoes,
        NOW(),
        NOW()
      )
      RETURNING *
    ";

    $stmt = $pdo->prepare($sql);

    $statusInicial = pegarValor($dados, "status", "Teste");
    $statusPagamento = pegarValor($dados, "statusPagamento", "Pendente");
    $dataInicio = pegarValor($dados, "dataInicio", date("Y-m-d"));
    $dataVencimento = pegarValor($dados, "dataVencimento", date("Y-m-d", strtotime("+30 days")));

    $stmt->execute([
      ":plano_id" => $planoId,
      ":nome_fantasia" => $nomeFantasia,
      ":razao_social" => pegarValor($dados, "razaoSocial"),
      ":cnpj" => pegarValor($dados, "cnpj"),
      ":slug" => $slug,
      ":responsavel" => $responsavel,
      ":email" => $email,
      ":telefone" => pegarValor($dados, "telefone"),
      ":segmento" => pegarValor($dados, "segmento", "Food Service"),
      ":status" => $statusInicial,
      ":status_pagamento" => $statusPagamento,
      ":data_inicio" => $dataInicio,
      ":data_vencimento" => $dataVencimento,
      ":ultimo_pagamento" => pegarValor($dados, "ultimoPagamento"),
      ":observacoes" => pegarValor($dados, "observacoes")
    ]);

    $empresa = $stmt->fetch();

    criarAssinaturaInicial($pdo, $empresa["id"], $plano, $statusInicial, $dataInicio, $dataVencimento);

    registrarLogPainel(
      $pdo,
      $empresa["id"],
      null,
      obterAdminNomeTeste(),
      "Cliente criado",
      "Empresa criada pelo Painel de Controle: " . $empresa["nome_fantasia"],
      "Empresas",
      null,
      $empresa,
      "Sucesso"
    );

    $pdo->commit();

    $empresaCompleta = buscarEmpresaCompleta($pdo, $empresa["id"]);

    respostaSucesso("Empresa criada com sucesso.", $empresaCompleta, 201);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao criar empresa.", 500, $erro->getMessage());
  }
}

// ========================================
// ATUALIZAR EMPRESA
// PUT api/empresas.php
// Ação normal ou ação especial
// ========================================

function atualizarEmpresa() {
  $pdo = conectarBanco();
  $dados = lerJson();

  if (!isset($dados["id"])) {
    respostaErro("ID da empresa não informado.", 422);
  }

  $acao = pegarValor($dados, "acao", "editar");

  if ($acao === "bloquear") {
    bloquearEmpresa($pdo, $dados);
  }

  if ($acao === "desbloquear") {
    desbloquearEmpresa($pdo, $dados);
  }

  if ($acao === "cancelar") {
    cancelarEmpresa($pdo, $dados);
  }

  if ($acao === "alterar_plano") {
    alterarPlanoEmpresa($pdo, $dados);
  }

  if ($acao === "registrar_pagamento") {
    registrarPagamentoEmpresa($pdo, $dados);
  }

  editarEmpresa($pdo, $dados);
}

// ========================================
// EDITAR DADOS CADASTRAIS
// ========================================

function editarEmpresa($pdo, $dados) {
  $id = (int) $dados["id"];

  $empresaAntes = buscarEmpresaCompleta($pdo, $id);

  if (!$empresaAntes) {
    respostaErro("Empresa não encontrada para edição.", 404);
  }

  $nomeFantasia = campoObrigatorio($dados, "nomeFantasia", "Nome fantasia");
  $responsavel = campoObrigatorio($dados, "responsavel", "Responsável");
  $email = campoObrigatorio($dados, "email", "E-mail");

  $planoId = isset($dados["planoId"]) && $dados["planoId"] !== ""
    ? (int) $dados["planoId"]
    : (int) $empresaAntes["plano_id"];

  $sql = "
    UPDATE empresas SET
      plano_id = :plano_id,
      nome_fantasia = :nome_fantasia,
      razao_social = :razao_social,
      cnpj = :cnpj,
      slug = :slug,
      responsavel = :responsavel,
      email = :email,
      telefone = :telefone,
      segmento = :segmento,
      status = :status,
      status_pagamento = :status_pagamento,
      data_inicio = :data_inicio,
      data_vencimento = :data_vencimento,
      ultimo_pagamento = :ultimo_pagamento,
      observacoes = :observacoes,
      atualizado_em = NOW()
    WHERE id = :id
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id,
    ":plano_id" => $planoId,
    ":nome_fantasia" => $nomeFantasia,
    ":razao_social" => pegarValor($dados, "razaoSocial"),
    ":cnpj" => pegarValor($dados, "cnpj"),
    ":slug" => pegarValor($dados, "slug", $empresaAntes["slug"]),
    ":responsavel" => $responsavel,
    ":email" => $email,
    ":telefone" => pegarValor($dados, "telefone"),
    ":segmento" => pegarValor($dados, "segmento"),
    ":status" => pegarValor($dados, "status", $empresaAntes["status"]),
    ":status_pagamento" => pegarValor($dados, "statusPagamento", $empresaAntes["status_pagamento"]),
    ":data_inicio" => pegarValor($dados, "dataInicio", $empresaAntes["data_inicio"]),
    ":data_vencimento" => pegarValor($dados, "dataVencimento", $empresaAntes["data_vencimento"]),
    ":ultimo_pagamento" => pegarValor($dados, "ultimoPagamento", $empresaAntes["ultimo_pagamento"]),
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $empresaDepois = $stmt->fetch();

  registrarLogPainel(
    $pdo,
    $id,
    null,
    obterAdminNomeTeste(),
    "Cliente editado",
    "Dados da empresa foram editados: " . $empresaDepois["nome_fantasia"],
    "Empresas",
    $empresaAntes,
    $empresaDepois,
    "Sucesso"
  );

  respostaSucesso("Empresa atualizada com sucesso.", buscarEmpresaCompleta($pdo, $id));
}

// ========================================
// BLOQUEAR EMPRESA
// ========================================

function bloquearEmpresa($pdo, $dados) {
  $id = (int) $dados["id"];
  $empresaAntes = buscarEmpresaCompleta($pdo, $id);

  if (!$empresaAntes) {
    respostaErro("Empresa não encontrada para bloqueio.", 404);
  }

  $stmt = $pdo->prepare("
    UPDATE empresas SET
      status = 'Bloqueado',
      atualizado_em = NOW()
    WHERE id = :id
    RETURNING *
  ");

  $stmt->execute([
    ":id" => $id
  ]);

  $empresaDepois = $stmt->fetch();

  atualizarStatusAssinatura($pdo, $id, "Bloqueada");

  registrarLogPainel(
    $pdo,
    $id,
    null,
    obterAdminNomeTeste(),
    "Cliente bloqueado",
    "Empresa bloqueada pelo Painel de Controle: " . $empresaDepois["nome_fantasia"],
    "Empresas",
    $empresaAntes,
    $empresaDepois,
    "Sucesso"
  );

  respostaSucesso("Empresa bloqueada com sucesso.", buscarEmpresaCompleta($pdo, $id));
}

// ========================================
// DESBLOQUEAR EMPRESA
// ========================================

function desbloquearEmpresa($pdo, $dados) {
  $id = (int) $dados["id"];
  $empresaAntes = buscarEmpresaCompleta($pdo, $id);

  if (!$empresaAntes) {
    respostaErro("Empresa não encontrada para desbloqueio.", 404);
  }

  $stmt = $pdo->prepare("
    UPDATE empresas SET
      status = 'Ativo',
      status_pagamento = 'Em dia',
      atualizado_em = NOW()
    WHERE id = :id
    RETURNING *
  ");

  $stmt->execute([
    ":id" => $id
  ]);

  $empresaDepois = $stmt->fetch();

  atualizarStatusAssinatura($pdo, $id, "Ativa");

  registrarLogPainel(
    $pdo,
    $id,
    null,
    obterAdminNomeTeste(),
    "Cliente desbloqueado",
    "Empresa desbloqueada pelo Painel de Controle: " . $empresaDepois["nome_fantasia"],
    "Empresas",
    $empresaAntes,
    $empresaDepois,
    "Sucesso"
  );

  respostaSucesso("Empresa desbloqueada com sucesso.", buscarEmpresaCompleta($pdo, $id));
}

// ========================================
// CANCELAR EMPRESA
// ========================================

function cancelarEmpresa($pdo, $dados) {
  $id = (int) $dados["id"];
  $empresaAntes = buscarEmpresaCompleta($pdo, $id);

  if (!$empresaAntes) {
    respostaErro("Empresa não encontrada para cancelamento.", 404);
  }

  $stmt = $pdo->prepare("
    UPDATE empresas SET
      status = 'Cancelado',
      status_pagamento = 'Cancelado',
      atualizado_em = NOW()
    WHERE id = :id
    RETURNING *
  ");

  $stmt->execute([
    ":id" => $id
  ]);

  $empresaDepois = $stmt->fetch();

  atualizarStatusAssinatura($pdo, $id, "Cancelada");

  registrarLogPainel(
    $pdo,
    $id,
    null,
    obterAdminNomeTeste(),
    "Cliente cancelado",
    "Empresa cancelada pelo Painel de Controle: " . $empresaDepois["nome_fantasia"],
    "Empresas",
    $empresaAntes,
    $empresaDepois,
    "Sucesso"
  );

  respostaSucesso("Empresa cancelada com sucesso.", buscarEmpresaCompleta($pdo, $id));
}

// ========================================
// ALTERAR PLANO
// ========================================

function alterarPlanoEmpresa($pdo, $dados) {
  $id = (int) $dados["id"];

  if (!isset($dados["planoId"])) {
    respostaErro("Novo plano não informado.", 422);
  }

  $planoId = (int) $dados["planoId"];
  $plano = buscarPlanoPorId($pdo, $planoId);

  if (!$plano) {
    respostaErro("Plano não encontrado.", 404);
  }

  $empresaAntes = buscarEmpresaCompleta($pdo, $id);

  if (!$empresaAntes) {
    respostaErro("Empresa não encontrada para alteração de plano.", 404);
  }

  $stmt = $pdo->prepare("
    UPDATE empresas SET
      plano_id = :plano_id,
      atualizado_em = NOW()
    WHERE id = :id
    RETURNING *
  ");

  $stmt->execute([
    ":id" => $id,
    ":plano_id" => $planoId
  ]);

  $empresaDepois = $stmt->fetch();

  $stmtAss = $pdo->prepare("
    UPDATE assinaturas SET
      plano_id = :plano_id,
      valor_mensal = :valor_mensal,
      atualizado_em = NOW()
    WHERE empresa_id = :empresa_id
  ");

  $stmtAss->execute([
    ":empresa_id" => $id,
    ":plano_id" => $planoId,
    ":valor_mensal" => $plano["valor_mensal"]
  ]);

  registrarLogPainel(
    $pdo,
    $id,
    null,
    obterAdminNomeTeste(),
    "Plano alterado",
    "Plano da empresa alterado para " . $plano["nome"],
    "Assinaturas",
    $empresaAntes,
    $empresaDepois,
    "Sucesso"
  );

  respostaSucesso("Plano alterado com sucesso.", buscarEmpresaCompleta($pdo, $id));
}

// ========================================
// REGISTRAR PAGAMENTO
// ========================================

function registrarPagamentoEmpresa($pdo, $dados) {
  $id = (int) $dados["id"];

  $empresaAntes = buscarEmpresaCompleta($pdo, $id);

  if (!$empresaAntes) {
    respostaErro("Empresa não encontrada para registrar pagamento.", 404);
  }

  $valor = isset($dados["valor"]) && $dados["valor"] !== ""
    ? limparNumero($dados["valor"])
    : limparNumero($empresaAntes["assinatura_valor"]);

  $dataPagamento = pegarValor($dados, "dataPagamento", date("Y-m-d"));
  $dataVencimento = pegarValor($dados, "dataVencimento", date("Y-m-d", strtotime("+30 days")));

  $assinaturaId = isset($empresaAntes["assinatura_id"]) ? $empresaAntes["assinatura_id"] : null;

  $stmtPagamento = $pdo->prepare("
    INSERT INTO pagamentos (
      empresa_id,
      assinatura_id,
      valor,
      status,
      metodo,
      gateway,
      gateway_pagamento_id,
      data_pagamento,
      data_vencimento,
      observacoes,
      criado_em
    ) VALUES (
      :empresa_id,
      :assinatura_id,
      :valor,
      'Pago',
      :metodo,
      :gateway,
      :gateway_pagamento_id,
      :data_pagamento,
      :data_vencimento,
      :observacoes,
      NOW()
    )
    RETURNING *
  ");

  $stmtPagamento->execute([
    ":empresa_id" => $id,
    ":assinatura_id" => $assinaturaId,
    ":valor" => $valor,
    ":metodo" => pegarValor($dados, "metodo", "Manual"),
    ":gateway" => pegarValor($dados, "gateway", "Painel de Controle"),
    ":gateway_pagamento_id" => pegarValor($dados, "gatewayPagamentoId"),
    ":data_pagamento" => $dataPagamento,
    ":data_vencimento" => $dataVencimento,
    ":observacoes" => pegarValor($dados, "observacoes")
  ]);

  $pagamento = $stmtPagamento->fetch();

  $stmtEmpresa = $pdo->prepare("
    UPDATE empresas SET
      status = 'Ativo',
      status_pagamento = 'Em dia',
      ultimo_pagamento = :ultimo_pagamento,
      data_vencimento = :data_vencimento,
      atualizado_em = NOW()
    WHERE id = :id
    RETURNING *
  ");

  $stmtEmpresa->execute([
    ":id" => $id,
    ":ultimo_pagamento" => $dataPagamento,
    ":data_vencimento" => $dataVencimento
  ]);

  $empresaDepois = $stmtEmpresa->fetch();

  $stmtAss = $pdo->prepare("
    UPDATE assinaturas SET
      status = 'Ativa',
      ultimo_pagamento = :ultimo_pagamento,
      data_vencimento = :data_vencimento,
      atualizado_em = NOW()
    WHERE empresa_id = :empresa_id
  ");

  $stmtAss->execute([
    ":empresa_id" => $id,
    ":ultimo_pagamento" => $dataPagamento,
    ":data_vencimento" => $dataVencimento
  ]);

  registrarLogPainel(
    $pdo,
    $id,
    null,
    obterAdminNomeTeste(),
    "Pagamento registrado",
    "Pagamento registrado manualmente no painel. Valor: R$ " . number_format($valor, 2, ",", "."),
    "Pagamentos",
    $empresaAntes,
    $empresaDepois,
    "Sucesso"
  );

  respostaSucesso("Pagamento registrado com sucesso.", [
    "empresa" => buscarEmpresaCompleta($pdo, $id),
    "pagamento" => $pagamento
  ]);
}

// ========================================
// EXCLUIR EMPRESA
// DELETE api/empresas.php?id=1
// ========================================

function excluirEmpresa() {
  $pdo = conectarBanco();

  if (!isset($_GET["id"])) {
    respostaErro("ID da empresa não informado.", 422);
  }

  $id = (int) $_GET["id"];

  $empresaAntes = buscarEmpresaCompleta($pdo, $id);

  if (!$empresaAntes) {
    respostaErro("Empresa não encontrada para exclusão.", 404);
  }

  $sql = "
    DELETE FROM empresas
    WHERE id = :id
    RETURNING *
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id
  ]);

  $empresa = $stmt->fetch();

  registrarLogPainel(
    $pdo,
    null,
    null,
    obterAdminNomeTeste(),
    "Cliente excluído",
    "Empresa excluída do sistema: " . $empresaAntes["nome_fantasia"],
    "Empresas",
    $empresaAntes,
    null,
    "Sucesso"
  );

  respostaSucesso("Empresa excluída com sucesso.", $empresa);
}

// ========================================
// BUSCAR EMPRESA COMPLETA
// ========================================

function buscarEmpresaCompleta($pdo, $id) {
  $sql = "
    SELECT 
      e.*,
      p.nome AS plano_nome,
      p.valor_mensal AS plano_valor,
      a.id AS assinatura_id,
      a.status AS assinatura_status,
      a.valor_mensal AS assinatura_valor,
      a.gateway AS assinatura_gateway,
      a.gateway_assinatura_id
    FROM empresas e
    LEFT JOIN planos p ON p.id = e.plano_id
    LEFT JOIN assinaturas a ON a.empresa_id = e.id
    WHERE e.id = :id
    LIMIT 1
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":id" => $id
  ]);

  return $stmt->fetch();
}

// ========================================
// RESUMO DO PAINEL
// ========================================

function gerarResumoEmpresas($pdo) {
  $sql = "
    SELECT
      COUNT(*) AS total_empresas,
      COUNT(*) FILTER (WHERE status = 'Ativo') AS ativas,
      COUNT(*) FILTER (WHERE status = 'Teste') AS teste,
      COUNT(*) FILTER (WHERE status = 'Bloqueado') AS bloqueadas,
      COUNT(*) FILTER (WHERE status = 'Cancelado') AS canceladas,
      COUNT(*) FILTER (WHERE status_pagamento = 'Em dia') AS em_dia,
      COUNT(*) FILTER (WHERE status_pagamento = 'Pendente') AS pendentes,
      COUNT(*) FILTER (WHERE status_pagamento = 'Atrasado') AS atrasadas
    FROM empresas
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute();

  return $stmt->fetch();
}

// ========================================
// HELPERS DE PLANO E ASSINATURA
// ========================================

function buscarPlanoPorId($pdo, $planoId) {
  $stmt = $pdo->prepare("
    SELECT *
    FROM planos
    WHERE id = :id
    LIMIT 1
  ");

  $stmt->execute([
    ":id" => $planoId
  ]);

  return $stmt->fetch();
}

function criarAssinaturaInicial($pdo, $empresaId, $plano, $statusEmpresa, $dataInicio, $dataVencimento) {
  $statusAssinatura = "Aguardando pagamento";

  if ($statusEmpresa === "Ativo") {
    $statusAssinatura = "Ativa";
  }

  if ($statusEmpresa === "Teste") {
    $statusAssinatura = "Teste";
  }

  $stmt = $pdo->prepare("
    INSERT INTO assinaturas (
      empresa_id,
      plano_id,
      valor_mensal,
      status,
      data_inicio,
      data_vencimento,
      gateway,
      observacoes,
      criado_em,
      atualizado_em
    ) VALUES (
      :empresa_id,
      :plano_id,
      :valor_mensal,
      :status,
      :data_inicio,
      :data_vencimento,
      'Painel de Controle',
      'Assinatura criada automaticamente junto com a empresa.',
      NOW(),
      NOW()
    )
  ");

  $stmt->execute([
    ":empresa_id" => $empresaId,
    ":plano_id" => $plano["id"],
    ":valor_mensal" => $plano["valor_mensal"],
    ":status" => $statusAssinatura,
    ":data_inicio" => $dataInicio,
    ":data_vencimento" => $dataVencimento
  ]);
}

function atualizarStatusAssinatura($pdo, $empresaId, $status) {
  $stmt = $pdo->prepare("
    UPDATE assinaturas SET
      status = :status,
      atualizado_em = NOW()
    WHERE empresa_id = :empresa_id
  ");

  $stmt->execute([
    ":empresa_id" => $empresaId,
    ":status" => $status
  ]);
}

// ========================================
// HELPERS GERAIS
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

function gerarSlug($texto) {
  $texto = strtolower(trim($texto));

  $mapa = [
    "á" => "a",
    "à" => "a",
    "ã" => "a",
    "â" => "a",
    "é" => "e",
    "ê" => "e",
    "í" => "i",
    "ó" => "o",
    "ô" => "o",
    "õ" => "o",
    "ú" => "u",
    "ç" => "c"
  ];

  $texto = strtr($texto, $mapa);
  $texto = preg_replace("/[^a-z0-9]+/", "-", $texto);
  $texto = trim($texto, "-");

  if ($texto === "") {
    $texto = "empresa";
  }

  return $texto . "-" . date("His");
}
