<?php
// ========================================
// BALU FOOD - API DE AUTENTICAÇÃO
// Cadastro, login e validação de acesso
// ========================================

require_once __DIR__ . "/conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo !== "POST") {
  respostaErro("Método não permitido. Use POST.", 405);
}

$dados = lerJson();
$acao = pegarValor($dados, "acao", "login");

if ($acao === "login") {
  fazerLogin($dados);
}

if ($acao === "cadastrar_empresa") {
  cadastrarEmpresaEUsuario($dados);
}

if ($acao === "alterar_senha") {
  alterarSenha($dados);
}

respostaErro("Ação não reconhecida.", 400);

// ========================================
// LOGIN DO USUÁRIO
// ========================================

function fazerLogin($dados) {
  $pdo = conectarBanco();

  $email = campoObrigatorio($dados, "email", "E-mail");
  $senha = campoObrigatorio($dados, "senha", "Senha");

  $email = strtolower(trim($email));

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respostaErro("E-mail inválido.", 422);
  }

  $sql = "
    SELECT
      u.id AS usuario_id,
      u.empresa_id,
      u.nome AS usuario_nome,
      u.email,
      u.senha_hash,
      u.perfil,
      u.status AS usuario_status,
      e.nome_fantasia,
      e.slug,
      e.status AS empresa_status,
      e.status_pagamento,
      e.plano_id,
      p.nome AS plano_nome,
      p.valor_mensal AS plano_valor,
      a.status AS assinatura_status,
      a.data_vencimento
    FROM usuarios u
    INNER JOIN empresas e ON e.id = u.empresa_id
    LEFT JOIN planos p ON p.id = e.plano_id
    LEFT JOIN assinaturas a ON a.empresa_id = e.id
    WHERE u.email = :email
    LIMIT 1
  ";

  $stmt = $pdo->prepare($sql);

  $stmt->execute([
    ":email" => $email
  ]);

  $usuario = $stmt->fetch();

  if (!$usuario) {
    respostaErro("E-mail ou senha inválidos.", 401);
  }

  if (!password_verify($senha, $usuario["senha_hash"])) {
    respostaErro("E-mail ou senha inválidos.", 401);
  }

  if ($usuario["usuario_status"] !== "Ativo") {
    respostaErro("Usuário inativo. Entre em contato com o suporte.", 403);
  }

  if ($usuario["empresa_status"] === "Bloqueado") {
    respostaErro("Empresa bloqueada. Regularize o acesso para continuar.", 403);
  }

  if ($usuario["empresa_status"] === "Cancelado") {
    respostaErro("Empresa cancelada. Entre em contato com o suporte.", 403);
  }

  $acessoLiberado = true;
  $motivoBloqueio = null;

  if ($usuario["assinatura_status"] === "Bloqueada") {
    $acessoLiberado = false;
    $motivoBloqueio = "Assinatura bloqueada.";
  }

  if ($usuario["assinatura_status"] === "Cancelada") {
    $acessoLiberado = false;
    $motivoBloqueio = "Assinatura cancelada.";
  }

  if ($usuario["status_pagamento"] === "Atrasado") {
    $acessoLiberado = false;
    $motivoBloqueio = "Pagamento em atraso.";
  }

  $token = gerarTokenTemporario();

  $stmtUpdate = $pdo->prepare("
    UPDATE usuarios SET
      ultimo_acesso = NOW(),
      atualizado_em = NOW()
    WHERE id = :id
  ");

  $stmtUpdate->execute([
    ":id" => $usuario["usuario_id"]
  ]);

  registrarLogSistema(
    $pdo,
    $usuario["empresa_id"],
    $usuario["usuario_id"],
    "Login realizado",
    "Usuário realizou login no sistema.",
    "Auth",
    "Sucesso"
  );

  $retorno = [
    "token" => $token,
    "acesso_liberado" => $acessoLiberado,
    "motivo_bloqueio" => $motivoBloqueio,
    "usuario" => [
      "id" => $usuario["usuario_id"],
      "nome" => $usuario["usuario_nome"],
      "email" => $usuario["email"],
      "perfil" => $usuario["perfil"],
      "status" => $usuario["usuario_status"]
    ],
    "empresa" => [
      "id" => $usuario["empresa_id"],
      "nome_fantasia" => $usuario["nome_fantasia"],
      "slug" => $usuario["slug"],
      "status" => $usuario["empresa_status"],
      "status_pagamento" => $usuario["status_pagamento"]
    ],
    "plano" => [
      "id" => $usuario["plano_id"],
      "nome" => $usuario["plano_nome"],
      "valor" => $usuario["plano_valor"]
    ],
    "assinatura" => [
      "status" => $usuario["assinatura_status"],
      "data_vencimento" => $usuario["data_vencimento"]
    ]
  ];

  respostaSucesso("Login realizado com sucesso.", $retorno);
}

// ========================================
// CADASTRAR EMPRESA + USUÁRIO ADMIN
// ========================================

function cadastrarEmpresaEUsuario($dados) {
  $pdo = conectarBanco();

  $nomeEmpresa = campoObrigatorio($dados, "nomeEmpresa", "Nome da empresa");
  $responsavel = campoObrigatorio($dados, "responsavel", "Nome do responsável");
  $email = campoObrigatorio($dados, "email", "E-mail");
  $senha = campoObrigatorio($dados, "senha", "Senha");

  $email = strtolower(trim($email));

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respostaErro("E-mail inválido.", 422);
  }

  validarSenhaForte($senha);

  if (emailJaExiste($pdo, $email)) {
    respostaErro("Este e-mail já está cadastrado.", 409);
  }

  $planoId = isset($dados["planoId"]) && $dados["planoId"] !== ""
    ? (int) $dados["planoId"]
    : 2;

  $plano = buscarPlanoPorIdAuth($pdo, $planoId);

  if (!$plano) {
    respostaErro("Plano informado não encontrado.", 404);
  }

  try {
    $pdo->beginTransaction();

    $slug = gerarSlugAuth($nomeEmpresa);

    $stmtEmpresa = $pdo->prepare("
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
        'Teste',
        'Pendente',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '7 days',
        :observacoes,
        NOW(),
        NOW()
      )
      RETURNING *
    ");

    $stmtEmpresa->execute([
      ":plano_id" => $planoId,
      ":nome_fantasia" => $nomeEmpresa,
      ":razao_social" => pegarValor($dados, "razaoSocial"),
      ":cnpj" => pegarValor($dados, "cnpj"),
      ":slug" => $slug,
      ":responsavel" => $responsavel,
      ":email" => $email,
      ":telefone" => pegarValor($dados, "telefone"),
      ":segmento" => pegarValor($dados, "segmento", "Food Service"),
      ":observacoes" => "Empresa criada pelo cadastro público do sistema."
    ]);

    $empresa = $stmtEmpresa->fetch();

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    $stmtUsuario = $pdo->prepare("
      INSERT INTO usuarios (
        empresa_id,
        nome,
        email,
        senha_hash,
        perfil,
        status,
        criado_em,
        atualizado_em
      ) VALUES (
        :empresa_id,
        :nome,
        :email,
        :senha_hash,
        'Administrador',
        'Ativo',
        NOW(),
        NOW()
      )
      RETURNING *
    ");

    $stmtUsuario->execute([
      ":empresa_id" => $empresa["id"],
      ":nome" => $responsavel,
      ":email" => $email,
      ":senha_hash" => $senhaHash
    ]);

    $usuario = $stmtUsuario->fetch();

    $stmtAssinatura = $pdo->prepare("
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
        'Aguardando pagamento',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '7 days',
        'Cadastro público',
        'Assinatura criada aguardando confirmação de pagamento.',
        NOW(),
        NOW()
      )
      RETURNING *
    ");

    $stmtAssinatura->execute([
      ":empresa_id" => $empresa["id"],
      ":plano_id" => $plano["id"],
      ":valor_mensal" => $plano["valor_mensal"]
    ]);

    $assinatura = $stmtAssinatura->fetch();

    registrarLogPainel(
      $pdo,
      $empresa["id"],
      $usuario["id"],
      "Sistema",
      "Cliente cadastrado",
      "Nova empresa cadastrada pelo formulário público: " . $empresa["nome_fantasia"],
      "Auth",
      null,
      $empresa,
      "Sucesso"
    );

    registrarLogSistema(
      $pdo,
      $empresa["id"],
      $usuario["id"],
      "Conta criada",
      "Empresa e usuário administrador criados com sucesso.",
      "Auth",
      "Sucesso"
    );

    $pdo->commit();

    respostaSucesso("Cadastro realizado com sucesso. Agora é necessário confirmar o pagamento para liberar o acesso completo.", [
      "empresa" => [
        "id" => $empresa["id"],
        "nome_fantasia" => $empresa["nome_fantasia"],
        "slug" => $empresa["slug"],
        "status" => $empresa["status"],
        "status_pagamento" => $empresa["status_pagamento"]
      ],
      "usuario" => [
        "id" => $usuario["id"],
        "nome" => $usuario["nome"],
        "email" => $usuario["email"],
        "perfil" => $usuario["perfil"]
      ],
      "assinatura" => [
        "id" => $assinatura["id"],
        "status" => $assinatura["status"],
        "valor_mensal" => $assinatura["valor_mensal"],
        "data_vencimento" => $assinatura["data_vencimento"]
      ]
    ], 201);
  } catch (Exception $erro) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }

    respostaErro("Erro ao cadastrar empresa e usuário.", 500, $erro->getMessage());
  }
}

// ========================================
// ALTERAR SENHA
// ========================================

function alterarSenha($dados) {
  $pdo = conectarBanco();

  $email = campoObrigatorio($dados, "email", "E-mail");
  $senhaAtual = campoObrigatorio($dados, "senhaAtual", "Senha atual");
  $novaSenha = campoObrigatorio($dados, "novaSenha", "Nova senha");

  $email = strtolower(trim($email));

  validarSenhaForte($novaSenha);

  $stmt = $pdo->prepare("
    SELECT *
    FROM usuarios
    WHERE email = :email
    LIMIT 1
  ");

  $stmt->execute([
    ":email" => $email
  ]);

  $usuario = $stmt->fetch();

  if (!$usuario) {
    respostaErro("Usuário não encontrado.", 404);
  }

  if (!password_verify($senhaAtual, $usuario["senha_hash"])) {
    respostaErro("Senha atual inválida.", 401);
  }

  $novaSenhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);

  $stmtUpdate = $pdo->prepare("
    UPDATE usuarios SET
      senha_hash = :senha_hash,
      atualizado_em = NOW()
    WHERE id = :id
    RETURNING *
  ");

  $stmtUpdate->execute([
    ":id" => $usuario["id"],
    ":senha_hash" => $novaSenhaHash
  ]);

  $usuarioAtualizado = $stmtUpdate->fetch();

  registrarLogSistema(
    $pdo,
    $usuario["empresa_id"],
    $usuario["id"],
    "Senha alterada",
    "Usuário alterou a senha de acesso.",
    "Auth",
    "Sucesso"
  );

  respostaSucesso("Senha alterada com sucesso.", [
    "usuario_id" => $usuarioAtualizado["id"],
    "email" => $usuarioAtualizado["email"]
  ]);
}

// ========================================
// VALIDAÇÃO DE SENHA
// ========================================

function validarSenhaForte($senha) {
  if (strlen($senha) < 8) {
    respostaErro("A senha precisa ter no mínimo 8 caracteres.", 422);
  }

  if (!preg_match("/[A-Za-z]/", $senha)) {
    respostaErro("A senha precisa ter pelo menos uma letra.", 422);
  }

  if (!preg_match("/[0-9]/", $senha)) {
    respostaErro("A senha precisa ter pelo menos um número.", 422);
  }

  return true;
}

// ========================================
// HELPERS
// ========================================

function emailJaExiste($pdo, $email) {
  $stmt = $pdo->prepare("
    SELECT id
    FROM usuarios
    WHERE email = :email
    LIMIT 1
  ");

  $stmt->execute([
    ":email" => $email
  ]);

  return $stmt->fetch() ? true : false;
}

function buscarPlanoPorIdAuth($pdo, $planoId) {
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

function gerarTokenTemporario() {
  try {
    return bin2hex(random_bytes(32));
  } catch (Exception $erro) {
    return md5(uniqid("balu", true));
  }
}

function pegarValor($dados, $campo, $padrao = null) {
  if (!isset($dados[$campo])) {
    return $padrao;
  }

  if ($dados[$campo] === "") {
    return $padrao;
  }

  return limparTexto($dados[$campo]);
}

function gerarSlugAuth($texto) {
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
