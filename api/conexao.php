<?php
// ========================================
// BALU FOOD - CONEXÃO COM BANCO DE DADOS
// Base das APIs + respostas + logs do sistema
// ========================================

header("Content-Type: application/json; charset=utf-8");

// Durante o desenvolvimento, deixamos liberado.
// Em produção, trocar "*" pelo domínio oficial do sistema.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// ========================================
// CONFIGURAÇÕES DO BANCO
// ========================================
// Ajustar esses dados quando o banco PostgreSQL estiver criado.

define("DB_HOST", getenv("DB_HOST") ?: "localhost");
define("DB_PORT", getenv("DB_PORT") ?: "5432");
define("DB_NAME", getenv("DB_NAME") ?: "balu_food");
define("DB_USER", getenv("DB_USER") ?: "postgres");
define("DB_PASS", getenv("DB_PASS") ?: "");

// ========================================
// CONEXÃO PDO
// ========================================

function conectarBanco() {
  try {
    $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;

    $pdo = new PDO($dsn, DB_USER, DB_PASS);

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    return $pdo;
  } catch (PDOException $erro) {
    respostaErro("Erro ao conectar ao banco de dados.", 500, $erro->getMessage());
  }
}

// ========================================
// RESPOSTAS PADRÃO DA API
// ========================================

function respostaSucesso($mensagem, $dados = null, $codigo = 200) {
  http_response_code($codigo);

  echo json_encode([
    "sucesso" => true,
    "mensagem" => $mensagem,
    "dados" => $dados
  ], JSON_UNESCAPED_UNICODE);

  exit;
}

function respostaErro($mensagem, $codigo = 400, $detalhes = null) {
  http_response_code($codigo);

  echo json_encode([
    "sucesso" => false,
    "mensagem" => $mensagem,
    "detalhes" => $detalhes
  ], JSON_UNESCAPED_UNICODE);

  exit;
}

// ========================================
// LEITURA DO JSON ENVIADO PELO FRONTEND
// ========================================

function lerJson() {
  $conteudo = file_get_contents("php://input");

  if (!$conteudo) {
    return [];
  }

  $dados = json_decode($conteudo, true);

  if (json_last_error() !== JSON_ERROR_NONE) {
    respostaErro("JSON inválido enviado para a API.", 400);
  }

  return $dados;
}

// ========================================
// VALIDAÇÃO SIMPLES DE CAMPOS
// ========================================

function campoObrigatorio($dados, $campo, $nomeCampo = null) {
  if (!isset($dados[$campo]) || trim((string) $dados[$campo]) === "") {
    $label = $nomeCampo ? $nomeCampo : $campo;

    respostaErro("O campo '" . $label . "' é obrigatório.", 422);
  }

  return trim((string) $dados[$campo]);
}

// ========================================
// SANITIZAÇÃO BÁSICA
// ========================================

function limparTexto($valor) {
  if ($valor === null) {
    return null;
  }

  return trim(strip_tags((string) $valor));
}

function limparNumero($valor) {
  if ($valor === null || $valor === "") {
    return 0;
  }

  $valor = str_replace(".", "", (string) $valor);
  $valor = str_replace(",", ".", $valor);

  return is_numeric($valor) ? (float) $valor : 0;
}

// ========================================
// INFORMAÇÕES DO ACESSO
// ========================================

function obterIpUsuario() {
  if (!empty($_SERVER["HTTP_CLIENT_IP"])) {
    return $_SERVER["HTTP_CLIENT_IP"];
  }

  if (!empty($_SERVER["HTTP_X_FORWARDED_FOR"])) {
    $ips = explode(",", $_SERVER["HTTP_X_FORWARDED_FOR"]);
    return trim($ips[0]);
  }

  if (!empty($_SERVER["REMOTE_ADDR"])) {
    return $_SERVER["REMOTE_ADDR"];
  }

  return "IP não identificado";
}

function obterDispositivoUsuario() {
  if (!empty($_SERVER["HTTP_USER_AGENT"])) {
    return $_SERVER["HTTP_USER_AGENT"];
  }

  return "Dispositivo não identificado";
}

// ========================================
// LOG DO SISTEMA DO CLIENTE
// Registra ações normais dentro da empresa
// Ex: insumo criado, compra registrada, CMV fechado
// ========================================

function registrarLogSistema($pdo, $empresaId, $usuarioId, $tipoEvento, $descricao, $origem = "Sistema", $status = "Sucesso") {
  try {
    $sql = "
      INSERT INTO logs_sistema (
        empresa_id,
        usuario_id,
        tipo_evento,
        descricao,
        origem,
        status,
        criado_em
      ) VALUES (
        :empresa_id,
        :usuario_id,
        :tipo_evento,
        :descricao,
        :origem,
        :status,
        NOW()
      )
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
      ":empresa_id" => $empresaId,
      ":usuario_id" => $usuarioId,
      ":tipo_evento" => $tipoEvento,
      ":descricao" => $descricao,
      ":origem" => $origem,
      ":status" => $status
    ]);

    return true;
  } catch (Exception $erro) {
    return false;
  }
}

// ========================================
// LOG DO PAINEL DE CONTROLE
// Registra ações internas dos donos do SaaS
// Ex: cliente bloqueado, plano alterado, pagamento confirmado
// ========================================

function registrarLogPainel($pdo, $empresaId, $usuarioId, $adminNome, $tipoEvento, $descricao, $modulo = "Painel de Controle", $antes = null, $depois = null, $status = "Sucesso") {
  try {
    $antesJson = null;
    $depoisJson = null;

    if ($antes !== null) {
      $antesJson = json_encode($antes, JSON_UNESCAPED_UNICODE);
    }

    if ($depois !== null) {
      $depoisJson = json_encode($depois, JSON_UNESCAPED_UNICODE);
    }

    $sql = "
      INSERT INTO logs_painel_controle (
        empresa_id,
        usuario_id,
        admin_nome,
        tipo_evento,
        descricao,
        modulo,
        antes,
        depois,
        ip_acesso,
        dispositivo,
        status,
        criado_em
      ) VALUES (
        :empresa_id,
        :usuario_id,
        :admin_nome,
        :tipo_evento,
        :descricao,
        :modulo,
        :antes,
        :depois,
        :ip_acesso,
        :dispositivo,
        :status,
        NOW()
      )
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
      ":empresa_id" => $empresaId,
      ":usuario_id" => $usuarioId,
      ":admin_nome" => $adminNome,
      ":tipo_evento" => $tipoEvento,
      ":descricao" => $descricao,
      ":modulo" => $modulo,
      ":antes" => $antesJson,
      ":depois" => $depoisJson,
      ":ip_acesso" => obterIpUsuario(),
      ":dispositivo" => obterDispositivoUsuario(),
      ":status" => $status
    ]);

    return true;
  } catch (Exception $erro) {
    return false;
  }
}

// ========================================
// LOG DE ERRO DA API
// Pode ser usado quando alguma operação falhar
// ========================================

function registrarErroApi($pdo, $empresaId, $tipoEvento, $descricao, $detalhes = null) {
  try {
    $descricaoFinal = $descricao;

    if ($detalhes !== null) {
      $descricaoFinal .= " | Detalhes: " . (string) $detalhes;
    }

    registrarLogSistema(
      $pdo,
      $empresaId,
      null,
      $tipoEvento,
      $descricaoFinal,
      "API",
      "Erro"
    );

    return true;
  } catch (Exception $erro) {
    return false;
  }
}

// ========================================
// FUNÇÕES TEMPORÁRIAS PARA TESTE LOCAL
// Depois serão substituídas por login real
// ========================================

function obterEmpresaIdTeste() {
  return 1;
}

function obterUsuarioIdTeste() {
  return null;
}

function obterAdminNomeTeste() {
  return "Lucas Gabriel";
}
