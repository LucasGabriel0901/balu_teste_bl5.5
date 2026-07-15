// =====================================================
// BALU FOOD - CADASTRO DE EMBALAGENS
// Versão limpa: embalagens + kits + localStorage + CSV
// =====================================================

var BALU_EMBALAGENS_KEY = "balu_embalagens";
var BALU_KITS_EMBALAGENS_KEY = "balu_kits_embalagens";

var embalagensCache = [];
var kitsEmbalagensCache = [];
var embalagensImportacaoCache = [];

var BALU_EMBALAGENS_HEADERS = [
  "Codigo",
  "Nome",
  "Categoria",
  "Unidade",
  "QuantidadePacote",
  "Fornecedor1",
  "PrecoFornecedor1",
  "Fornecedor2",
  "PrecoFornecedor2",
  "Fornecedor3",
  "PrecoFornecedor3",
  "EstoqueAtual",
  "EstoqueMinimo",
  "EstoqueIdeal",
  "LocalArmazenamento",
  "PosicaoArmazenamento",
  "ObservacaoArmazenamento",
  "Status",
  "Observacoes"
];

document.addEventListener("DOMContentLoaded", function () {
  iniciarCadastroEmbalagens();
});

function iniciarCadastroEmbalagens() {
  embalagensCache = carregarEmbalagensLocal();
  kitsEmbalagensCache = carregarKitsEmbalagensLocal();
  embalagensImportacaoCache = [];

  iniciarTabsEmbalagens();
  iniciarEventosEmbalagens();
  iniciarEventosKitsEmbalagens();
  iniciarImagemEmbalagem();
  iniciarImagemKitEmbalagem();

  renderizarEmbalagens();
  renderizarKitsEmbalagens();
  renderizarResumoEmbalagens();
  atualizarPreviewEmbalagem();

  criarIconesEmbalagens();

  console.log("BALU Food: Cadastro de Embalagens carregado com sucesso.");
}

// =====================================================
// EVENTOS
// =====================================================

function iniciarEventosEmbalagens() {
  var form = document.getElementById("formEmbalagem");
  var btnNova = document.getElementById("btnNovaEmbalagem");
  var btnExportar = document.getElementById("btnExportarEmbalagens");
  var btnImportar = document.getElementById("btnAbrirImportacaoEmbalagens");
  var inputCsv = document.getElementById("importEmbalagensCsvFile");
  var btnConfirmarImportacao = document.getElementById("btnConfirmarImportacaoEmbalagens");
  var btnLimparImportacao = document.getElementById("btnLimparImportacaoEmbalagens");
  var search = document.getElementById("searchEmbalagens");
  var filterCategoria = document.getElementById("filterCategoriaEmbalagem");
  var filterStatus = document.getElementById("filterStatusEmbalagem");
  var cardEstoque = document.getElementById("cardEmbalagensEstoqueBaixo");
  var btnExportarAlerta = document.getElementById("btnExportarAlertaEmbalagens");
  var previewTable = document.getElementById("importEmbalagensPreviewTable");

  if (btnNova) {
    btnNova.addEventListener("click", prepararNovaEmbalagem);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      salvarEmbalagem();
    });
  }

  document.querySelectorAll(".btnModeloCsvEmbalagens").forEach(function (botao) {
    botao.addEventListener("click", baixarModeloCsvEmbalagens);
  });

  if (btnExportar) {
    btnExportar.addEventListener("click", exportarEmbalagensCsv);
  }

  if (btnImportar) {
    btnImportar.addEventListener("click", function () {
      abrirDrawerBalu("drawerImportarEmbalagens");
    });
  }

  if (inputCsv) {
    inputCsv.addEventListener("change", function () {
      lerArquivoCsvEmbalagens(inputCsv.files && inputCsv.files[0]);
    });
  }

  if (btnConfirmarImportacao) {
    btnConfirmarImportacao.addEventListener("click", confirmarImportacaoEmbalagens);
  }

  if (btnLimparImportacao) {
    btnLimparImportacao.addEventListener("click", limparImportacaoEmbalagens);
  }

  if (search) {
    search.addEventListener("input", renderizarEmbalagens);
  }

  if (filterCategoria) {
    filterCategoria.addEventListener("change", renderizarEmbalagens);
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", renderizarEmbalagens);
  }

  if (cardEstoque) {
    cardEstoque.addEventListener("click", abrirDrawerAlertaEstoqueEmbalagens);
  }

  if (btnExportarAlerta) {
    btnExportarAlerta.addEventListener("click", exportarCsvAlertaEmbalagens);
  }

  if (previewTable) {
    previewTable.addEventListener("input", function (event) {
      atualizarCampoPreviewImportacaoEmbalagens(event);
    });

    previewTable.addEventListener("click", function (event) {
      var botao = event.target.closest("[data-remove-import-emb-index]");

      if (botao) {
        removerLinhaImportacaoEmbalagens(Number(botao.getAttribute("data-remove-import-emb-index")));
      }
    });
  }

  [
    "quantidadePacote",
    "embPrecoFornecedor1",
    "embPrecoFornecedor2",
    "embPrecoFornecedor3",
    "embEstoqueAtual",
    "embEstoqueMinimo",
    "embEstoqueIdeal",
    "embalagemStatus"
  ].forEach(function (id) {
    var campo = document.getElementById(id);

    if (campo) {
      campo.addEventListener("input", atualizarPreviewEmbalagem);
      campo.addEventListener("change", atualizarPreviewEmbalagem);
      campo.addEventListener("keyup", atualizarPreviewEmbalagem);
    }
  });
}

function iniciarEventosKitsEmbalagens() {
  var form = document.getElementById("formKitEmbalagem");
  var btnNovoKit = document.getElementById("btnNovoKit");
  var btnAdicionarItem = document.getElementById("btnAdicionarItemKit");
  var searchKits = document.getElementById("searchKits");
  var container = document.getElementById("kitItemsContainer");

  if (btnNovoKit) {
    btnNovoKit.addEventListener("click", prepararNovoKitEmbalagem);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      salvarKitEmbalagem();
    });
  }

  if (btnAdicionarItem) {
    btnAdicionarItem.addEventListener("click", function () {
      adicionarItemKitEmbalagem();
    });
  }

  if (searchKits) {
    searchKits.addEventListener("input", renderizarKitsEmbalagens);
  }

  if (container) {
    container.addEventListener("input", atualizarPreviewKitEmbalagem);
    container.addEventListener("change", atualizarPreviewKitEmbalagem);

    container.addEventListener("click", function (event) {
      var button = event.target.closest("button");

      if (!button) {
        return;
      }

      if (button.classList.contains("kitItemRemove")) {
        var item = button.closest(".kit-item");

        if (item) {
          item.remove();
          atualizarPreviewKitEmbalagem();
        }
      }
    });
  }
}

function iniciarTabsEmbalagens() {
  var tabs = document.querySelectorAll(".inner-tab");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");

      tabs.forEach(function (item) {
        item.classList.remove("active");
      });

      tab.classList.add("active");

      var tabEmbalagens = document.getElementById("tabEmbalagens");
      var tabKits = document.getElementById("tabKits");

      if (tabEmbalagens) {
        tabEmbalagens.style.display = target === "embalagens" ? "block" : "none";
      }

      if (tabKits) {
        tabKits.style.display = target === "kits" ? "block" : "none";
      }
    });
  });
}

// =====================================================
// IMAGENS
// =====================================================

function iniciarImagemEmbalagem() {
  var input = document.getElementById("embalagemImagemInput");
  var preview = document.getElementById("embalagemImagemPreview");
  var placeholder = document.getElementById("embalagemImagemPlaceholder");

  if (!input || !preview) {
    return;
  }

  input.addEventListener("change", function () {
    var file = input.files && input.files[0];

    if (!file) {
      return;
    }

    converterImagemEmbalagemBase64(file).then(function (base64) {
      input.dataset.imageBase64 = base64;
      preview.src = base64;
      preview.style.display = "block";

      if (placeholder) {
        placeholder.style.display = "none";
      }
    });
  });
}

function iniciarImagemKitEmbalagem() {
  var input = document.getElementById("kitImagemInput");
  var preview = document.getElementById("kitImagemPreview");
  var placeholder = document.getElementById("kitImagemPlaceholder");

  if (!input || !preview) {
    return;
  }

  input.addEventListener("change", function () {
    var file = input.files && input.files[0];

    if (!file) {
      return;
    }

    converterImagemEmbalagemBase64(file).then(function (base64) {
      input.dataset.imageBase64 = base64;
      preview.src = base64;
      preview.style.display = "block";

      if (placeholder) {
        placeholder.style.display = "none";
      }
    });
  });
}

function converterImagemEmbalagemBase64(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =====================================================
// CRUD EMBALAGENS
// =====================================================

function prepararNovaEmbalagem() {
  resetarFormularioEmbalagem();

  setTextEmbalagem("drawerEmbalagemTitle", "Nova Embalagem");
  setValueEmbalagem("embalagemCodigo", gerarCodigoEmbalagem());

  atualizarPreviewEmbalagem();
  abrirDrawerBalu("drawerEmbalagem");
}

function resetarFormularioEmbalagem() {
  var form = document.getElementById("formEmbalagem");
  var inputImagem = document.getElementById("embalagemImagemInput");
  var preview = document.getElementById("embalagemImagemPreview");
  var placeholder = document.getElementById("embalagemImagemPlaceholder");

  if (form) {
    form.reset();
  }

  setValueEmbalagem("embalagemId", "");

  if (inputImagem) {
    inputImagem.value = "";
    inputImagem.dataset.imageBase64 = "";
  }

  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  if (placeholder) {
    placeholder.style.display = "flex";
  }
}

function salvarEmbalagem() {
  var id = getValueEmbalagem("embalagemId");
  var nome = getValueEmbalagem("embalagemNome");
  var categoria = getValueEmbalagem("embalagemCategoria");

  if (!nome) {
    mostrarMensagemEmbalagem("Informe o nome da embalagem.", "warning");
    return;
  }

  if (!categoria) {
    mostrarMensagemEmbalagem("Selecione a categoria da embalagem.", "warning");
    return;
  }

  var existente = id ? buscarEmbalagemPorId(id) : null;
  var calculos = calcularEmbalagem();

  var inputImagem = document.getElementById("embalagemImagemInput");
  var imagemNova = inputImagem && inputImagem.dataset.imageBase64 ? inputImagem.dataset.imageBase64 : "";
  var agora = new Date().toISOString();

  var embalagem = {
    id: id || gerarIdEmbalagem(),
    imagem: imagemNova || (existente && existente.imagem ? existente.imagem : ""),
    nome: nome,
    codigo: getValueEmbalagem("embalagemCodigo") || gerarCodigoEmbalagem(),
    categoria: categoria,
    unidade: getValueEmbalagem("embalagemUnidade"),
    quantidadePacote: calculos.quantidadePacote,
    status: getValueEmbalagem("embalagemStatus") || "Ativo",
    descricao: getValueEmbalagem("embalagemDescricao"),
    fornecedor1: getValueEmbalagem("embFornecedor1"),
    precoFornecedor1: calculos.precoFornecedor1,
    fornecedor2: getValueEmbalagem("embFornecedor2"),
    precoFornecedor2: calculos.precoFornecedor2,
    fornecedor3: getValueEmbalagem("embFornecedor3"),
    precoFornecedor3: calculos.precoFornecedor3,
    precoMedioPacote: calculos.precoMedioPacote,
    precoUnitario: calculos.precoUnitario,
    estoqueAtual: calculos.estoqueAtual,
    estoqueMinimo: calculos.estoqueMinimo,
    estoqueIdeal: calculos.estoqueIdeal,
    valorEstoque: calculos.valorEstoque,
    statusEstoque: calculos.statusEstoque,
    localArmazenamento: getValueEmbalagem("embLocalArmazenamento"),
    posicaoArmazenamento: getValueEmbalagem("embPosicaoArmazenamento"),
    observacaoArmazenamento: getValueEmbalagem("embObservacaoArmazenamento"),
    observacoes: getValueEmbalagem("embObservacoes"),
    criadoEm: existente && existente.criadoEm ? existente.criadoEm : agora,
    atualizadoEm: agora
  };

  if (id) {
    embalagensCache = embalagensCache.map(function (item) {
      return item.id === id ? embalagem : item;
    });

    mostrarMensagemEmbalagem("Embalagem atualizada com sucesso.", "success");
  } else {
    embalagensCache.push(embalagem);
    mostrarMensagemEmbalagem("Embalagem cadastrada com sucesso.", "success");
  }

  salvarEmbalagensLocal();
  resetarFormularioEmbalagem();
  fecharDrawerBalu();

  renderizarEmbalagens();
  renderizarResumoEmbalagens();
  popularSelectsKitEmbalagem();
}

function editarEmbalagem(id) {
  var embalagem = buscarEmbalagemPorId(id);

  if (!embalagem) {
    mostrarMensagemEmbalagem("Embalagem não encontrada.", "danger");
    return;
  }

  embalagem = normalizarEmbalagemSalva(embalagem);

  resetarFormularioEmbalagem();

  setValueEmbalagem("embalagemId", embalagem.id);
  setValueEmbalagem("embalagemNome", embalagem.nome);
  setValueEmbalagem("embalagemCodigo", embalagem.codigo);
  setValueEmbalagem("embalagemCategoria", embalagem.categoria);
  setValueEmbalagem("embalagemUnidade", embalagem.unidade);
  setValueEmbalagem("quantidadePacote", numeroParaInputEmbalagem(embalagem.quantidadePacote));
  setValueEmbalagem("embalagemStatus", embalagem.status || "Ativo");
  setValueEmbalagem("embalagemDescricao", embalagem.descricao);
  setValueEmbalagem("embFornecedor1", embalagem.fornecedor1);
  setValueEmbalagem("embPrecoFornecedor1", numeroParaInputEmbalagem(embalagem.precoFornecedor1));
  setValueEmbalagem("embFornecedor2", embalagem.fornecedor2);
  setValueEmbalagem("embPrecoFornecedor2", numeroParaInputEmbalagem(embalagem.precoFornecedor2));
  setValueEmbalagem("embFornecedor3", embalagem.fornecedor3);
  setValueEmbalagem("embPrecoFornecedor3", numeroParaInputEmbalagem(embalagem.precoFornecedor3));
  setValueEmbalagem("embEstoqueAtual", numeroParaInputEmbalagem(embalagem.estoqueAtual));
  setValueEmbalagem("embEstoqueMinimo", numeroParaInputEmbalagem(embalagem.estoqueMinimo));
  setValueEmbalagem("embEstoqueIdeal", numeroParaInputEmbalagem(embalagem.estoqueIdeal));
  setValueEmbalagem("embLocalArmazenamento", embalagem.localArmazenamento);
  setValueEmbalagem("embPosicaoArmazenamento", embalagem.posicaoArmazenamento);
  setValueEmbalagem("embObservacaoArmazenamento", embalagem.observacaoArmazenamento);
  setValueEmbalagem("embObservacoes", embalagem.observacoes);

  setTextEmbalagem("drawerEmbalagemTitle", "Editar Embalagem");

  var inputImagem = document.getElementById("embalagemImagemInput");
  var preview = document.getElementById("embalagemImagemPreview");
  var placeholder = document.getElementById("embalagemImagemPlaceholder");

  if (inputImagem) {
    inputImagem.dataset.imageBase64 = embalagem.imagem || "";
  }

  if (preview && embalagem.imagem) {
    preview.src = embalagem.imagem;
    preview.style.display = "block";

    if (placeholder) {
      placeholder.style.display = "none";
    }
  }

  atualizarPreviewEmbalagem();
  abrirDrawerBalu("drawerEmbalagem");
}

function excluirEmbalagem(id) {
  var embalagem = buscarEmbalagemPorId(id);

  if (!embalagem) {
    return;
  }

  var confirmar = confirm("Deseja excluir a embalagem " + embalagem.nome + "?");

  if (!confirmar) {
    return;
  }

  embalagensCache = embalagensCache.filter(function (item) {
    return item.id !== id;
  });

  salvarEmbalagensLocal();
  renderizarEmbalagens();
  renderizarResumoEmbalagens();
  popularSelectsKitEmbalagem();

  mostrarMensagemEmbalagem("Embalagem excluída com sucesso.", "success");
}

function buscarEmbalagemPorId(id) {
  return embalagensCache.find(function (item) {
    return item.id === id;
  });
}

// =====================================================
// CÁLCULOS
// =====================================================

function atualizarPreviewEmbalagem() {
  var calculos = calcularEmbalagem();

  setTextEmbalagem("embPrecoMedioPacotePreview", formatarMoedaEmbalagem(calculos.precoMedioPacote));
  setTextEmbalagem("embPrecoUnitarioPreview", formatarMoedaEmbalagem(calculos.precoUnitario));
  setTextEmbalagem("embValorEstoquePreview", formatarMoedaEmbalagem(calculos.valorEstoque));
  setTextEmbalagem("embStatusEstoquePreview", calculos.statusEstoque);
}

function calcularEmbalagem() {
  var precoFornecedor1 = numeroEmbalagem(getValueEmbalagem("embPrecoFornecedor1"));
  var precoFornecedor2 = numeroEmbalagem(getValueEmbalagem("embPrecoFornecedor2"));
  var precoFornecedor3 = numeroEmbalagem(getValueEmbalagem("embPrecoFornecedor3"));
  var quantidadePacote = numeroEmbalagem(getValueEmbalagem("quantidadePacote"));
  var estoqueAtual = numeroEmbalagem(getValueEmbalagem("embEstoqueAtual"));
  var estoqueMinimo = numeroEmbalagem(getValueEmbalagem("embEstoqueMinimo"));
  var estoqueIdeal = numeroEmbalagem(getValueEmbalagem("embEstoqueIdeal"));
  var statusCadastro = getValueEmbalagem("embalagemStatus") || "Ativo";

  var precos = [];

  if (precoFornecedor1 > 0) precos.push(precoFornecedor1);
  if (precoFornecedor2 > 0) precos.push(precoFornecedor2);
  if (precoFornecedor3 > 0) precos.push(precoFornecedor3);

  var precoMedioPacote = 0;

  if (precos.length > 0) {
    precoMedioPacote = precos.reduce(function (soma, preco) {
      return soma + preco;
    }, 0) / precos.length;
  }

  var precoUnitario = quantidadePacote > 0 ? precoMedioPacote / quantidadePacote : 0;
  var valorEstoque = estoqueAtual * precoUnitario;
  var statusEstoque = calcularStatusEstoqueEmbalagem(estoqueAtual, estoqueMinimo, estoqueIdeal, statusCadastro);

  return {
    quantidadePacote: quantidadePacote,
    precoFornecedor1: precoFornecedor1,
    precoFornecedor2: precoFornecedor2,
    precoFornecedor3: precoFornecedor3,
    estoqueAtual: estoqueAtual,
    estoqueMinimo: estoqueMinimo,
    estoqueIdeal: estoqueIdeal,
    precoMedioPacote: precoMedioPacote,
    precoUnitario: precoUnitario,
    valorEstoque: valorEstoque,
    statusEstoque: statusEstoque
  };
}

function calcularStatusEstoqueEmbalagem(estoqueAtual, estoqueMinimo, estoqueIdeal, statusCadastro) {
  if (statusCadastro === "Inativo") {
    return "Inativo";
  }

  if (estoqueAtual <= 0) {
    return "Crítico";
  }

  if (estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo) {
    return "Crítico";
  }

  if (estoqueIdeal > 0 && estoqueAtual < estoqueIdeal) {
    return "Atenção";
  }

  return "Estoque ok";
}

function getStatusFinalEmbalagem(embalagem) {
  if (!embalagem) {
    return "Estoque ok";
  }

  return calcularStatusEstoqueEmbalagem(
    numeroEmbalagem(embalagem.estoqueAtual),
    numeroEmbalagem(embalagem.estoqueMinimo),
    numeroEmbalagem(embalagem.estoqueIdeal),
    embalagem.status || "Ativo"
  );
}

// =====================================================
// RENDER EMBALAGENS
// =====================================================

function renderizarEmbalagens() {
  var table = document.getElementById("embalagensTable");

  if (!table) {
    return;
  }

  embalagensCache = embalagensCache.map(normalizarEmbalagemSalva);

  var lista = filtrarEmbalagens();

  if (!lista.length) {
    table.innerHTML = "<tr><td colspan='12' class='text-muted'>Nenhuma embalagem encontrada.</td></tr>";
    renderizarResumoEmbalagens();
    return;
  }

  table.innerHTML = lista.map(function (embalagem) {
    var statusFinal = getStatusFinalEmbalagem(embalagem);
    var localizacao = [embalagem.localArmazenamento, embalagem.posicaoArmazenamento].filter(Boolean).join(" / ");

    return "<tr>" +
      "<td><div class='product-cell'>" + renderThumbEmbalagem(embalagem.imagem, embalagem.nome) + "<div><strong>" + escapeHtmlEmbalagem(embalagem.nome || "-") + "</strong><span>" + escapeHtmlEmbalagem(embalagem.descricao || "Sem descrição") + "</span></div></div></td>" +
      "<td>" + escapeHtmlEmbalagem(embalagem.codigo || "-") + "</td>" +
      "<td>" + escapeHtmlEmbalagem(embalagem.categoria || "-") + "</td>" +
      "<td>" + escapeHtmlEmbalagem(embalagem.unidade || "-") + "</td>" +
      "<td>" + formatarNumeroEmbalagem(embalagem.quantidadePacote, 0) + "</td>" +
      "<td><strong>" + formatarMoedaEmbalagem(embalagem.precoMedioPacote) + "</strong></td>" +
      "<td><strong>" + formatarMoedaEmbalagem(embalagem.precoUnitario) + "</strong></td>" +
      "<td>" + formatarNumeroEmbalagem(embalagem.estoqueAtual, 0) + "</td>" +
      "<td>" + escapeHtmlEmbalagem(localizacao || "-") + "</td>" +
      "<td><strong>" + formatarMoedaEmbalagem(embalagem.valorEstoque) + "</strong></td>" +
      "<td>" + badgeStatusEmbalagem(statusFinal) + "</td>" +
      "<td><div class='table-actions'>" +
      "<button type='button' class='btn-icon' title='Editar' onclick='editarEmbalagem(\"" + escapeAttrEmbalagem(embalagem.id) + "\")'><i data-lucide='edit-3'></i></button>" +
      "<button type='button' class='btn-icon danger' title='Excluir' onclick='excluirEmbalagem(\"" + escapeAttrEmbalagem(embalagem.id) + "\")'><i data-lucide='trash-2'></i></button>" +
      "</div></td>" +
      "</tr>";
  }).join("");

  renderizarResumoEmbalagens();
  criarIconesEmbalagens();
}

function filtrarEmbalagens() {
  var search = getValueEmbalagem("searchEmbalagens").toLowerCase();
  var categoria = getValueEmbalagem("filterCategoriaEmbalagem");
  var status = getValueEmbalagem("filterStatusEmbalagem");

  return embalagensCache.filter(function (embalagem) {
    var statusFinal = getStatusFinalEmbalagem(embalagem);

    var texto = [
      embalagem.nome,
      embalagem.codigo,
      embalagem.categoria,
      embalagem.descricao,
      embalagem.fornecedor1,
      embalagem.fornecedor2,
      embalagem.fornecedor3,
      embalagem.localArmazenamento,
      embalagem.posicaoArmazenamento,
      embalagem.observacoes
    ].join(" ").toLowerCase();

    var passaBusca = !search || texto.indexOf(search) >= 0;
    var passaCategoria = !categoria || embalagem.categoria === categoria;
    var passaStatus = !status || embalagem.status === status || statusFinal === status;

    return passaBusca && passaCategoria && passaStatus;
  });
}

function renderizarResumoEmbalagens() {
  var total = embalagensCache.length;

  var semFornecedor = embalagensCache.filter(function (embalagem) {
    return !String(embalagem.fornecedor1 || "").trim();
  }).length;

  var cadastroIncompleto = embalagensCache.filter(function (embalagem) {
    var semPreco = numeroEmbalagem(embalagem.precoUnitario) <= 0 && numeroEmbalagem(embalagem.precoMedioPacote) <= 0;
    var semConversao = !embalagem.unidadeCompra || !embalagem.unidadeConsumo;
    return semPreco || semConversao;
  }).length;

  setTextEmbalagem("totalEmbalagens", total);
  setTextEmbalagem("valorEstoqueEmbalagens", semFornecedor);
  setTextEmbalagem("embalagensEstoqueBaixo", cadastroIncompleto);
  setTextEmbalagem("totalKitsEmbalagens", kitsEmbalagensCache.length);

  atualizarAlertaCardEmbalagens();
}

// =====================================================
// ALERTA DE ESTOQUE
// =====================================================

function obterEmbalagensComAlertaEstoque() {
  return embalagensCache
    .filter(function (embalagem) {
      if (!embalagem || embalagem.status === "Inativo") {
        return false;
      }

      var status = normalizarTextoEmbalagem(getStatusFinalEmbalagem(embalagem));

      return status.indexOf("critico") >= 0 || status.indexOf("atencao") >= 0 || status.indexOf("estoque baixo") >= 0;
    })
    .map(function (embalagem) {
      var estoqueAtual = numeroEmbalagem(embalagem.estoqueAtual);
      var estoqueMinimo = numeroEmbalagem(embalagem.estoqueMinimo);
      var estoqueIdeal = numeroEmbalagem(embalagem.estoqueIdeal);
      var precoUnitario = numeroEmbalagem(embalagem.precoUnitario);

      var faltaReposicao = 0;

      if (estoqueIdeal > estoqueAtual) {
        faltaReposicao = estoqueIdeal - estoqueAtual;
      } else if (estoqueMinimo > estoqueAtual) {
        faltaReposicao = estoqueMinimo - estoqueAtual;
      }

      return Object.assign({}, embalagem, {
        statusAlerta: getStatusFinalEmbalagem(embalagem),
        faltaReposicao: faltaReposicao,
        valorReposicao: faltaReposicao * precoUnitario
      });
    });
}

function atualizarAlertaCardEmbalagens() {
  var numeroCard = document.getElementById("embalagensEstoqueBaixo");
  var textoCard = document.getElementById("textoEmbalagensEstoqueBaixo");
  var card = document.getElementById("cardEmbalagensEstoqueBaixo");

  if (!numeroCard || !card) {
    return;
  }

  var lista = obterEmbalagensComAlertaEstoque();

  var criticos = lista.filter(function (item) {
    return normalizarTextoEmbalagem(item.statusAlerta).indexOf("critico") >= 0;
  }).length;

  var atencao = lista.filter(function (item) {
    return normalizarTextoEmbalagem(item.statusAlerta).indexOf("atencao") >= 0;
  }).length;

  numeroCard.textContent = lista.length;

  card.classList.remove("embalagens-stock-ok", "embalagens-stock-warning", "embalagens-stock-danger");

  if (criticos > 0) {
    card.classList.add("embalagens-stock-danger");

    if (textoCard) {
      textoCard.textContent = criticos + " item(ns) crítico(s)" + (atencao > 0 ? " e " + atencao + " em atenção" : "");
    }

    return;
  }

  if (atencao > 0) {
    card.classList.add("embalagens-stock-warning");

    if (textoCard) {
      textoCard.textContent = atencao + " item(ns) precisam de reposição";
    }

    return;
  }

  card.classList.add("embalagens-stock-ok");

  if (textoCard) {
    textoCard.textContent = "Nenhum item em atenção";
  }
}

function abrirDrawerAlertaEstoqueEmbalagens() {
  renderizarDrawerAlertaEstoqueEmbalagens();
  abrirDrawerBalu("drawerAlertaEstoqueEmbalagens");
}

function renderizarDrawerAlertaEstoqueEmbalagens() {
  var table = document.getElementById("alertaEmbalagensTable");
  var lista = obterEmbalagensComAlertaEstoque();

  var criticos = lista.filter(function (item) {
    return normalizarTextoEmbalagem(item.statusAlerta).indexOf("critico") >= 0;
  }).length;

  var atencao = lista.filter(function (item) {
    return normalizarTextoEmbalagem(item.statusAlerta).indexOf("atencao") >= 0;
  }).length;

  setTextEmbalagem("alertaEmbalagensTotal", lista.length);
  setTextEmbalagem("alertaEmbalagensCriticos", criticos);
  setTextEmbalagem("alertaEmbalagensAtencao", atencao);

  if (!table) {
    return;
  }

  if (!lista.length) {
    table.innerHTML = "<tr><td colspan='12' class='text-muted'>Nenhuma embalagem em alerta.</td></tr>";
    return;
  }

  table.innerHTML = lista.map(function (item) {
    return "<tr>" +
      "<td>" + escapeHtmlEmbalagem(item.codigo || "-") + "</td>" +
      "<td><strong>" + escapeHtmlEmbalagem(item.nome || "-") + "</strong></td>" +
      "<td>" + escapeHtmlEmbalagem(item.categoria || "-") + "</td>" +
      "<td>" + escapeHtmlEmbalagem(item.unidade || "-") + "</td>" +
      "<td>" + formatarNumeroEmbalagem(item.estoqueAtual, 0) + "</td>" +
      "<td>" + formatarNumeroEmbalagem(item.estoqueMinimo, 0) + "</td>" +
      "<td>" + formatarNumeroEmbalagem(item.estoqueIdeal, 0) + "</td>" +
      "<td><strong>" + formatarNumeroEmbalagem(item.faltaReposicao, 0) + "</strong></td>" +
      "<td>" + formatarMoedaEmbalagem(item.precoUnitario) + "</td>" +
      "<td><strong>" + formatarMoedaEmbalagem(item.valorReposicao) + "</strong></td>" +
      "<td>" + badgeStatusEmbalagem(item.statusAlerta) + "</td>" +
      "<td><button type='button' class='btn btn-outline btn-small' onclick='editarEmbalagem(\"" + escapeAttrEmbalagem(item.id) + "\")'>Editar</button></td>" +
      "</tr>";
  }).join("");

  criarIconesEmbalagens();
}

function exportarCsvAlertaEmbalagens() {
  var lista = obterEmbalagensComAlertaEstoque();

  var linhas = [
    "Codigo;Nome;Categoria;Unidade;EstoqueAtual;EstoqueMinimo;EstoqueIdeal;FaltaRepor;PrecoUnitario;ValorEstimado;Status"
  ];

  lista.forEach(function (item) {
    linhas.push(csvLinhaEmbalagem([
      item.codigo || "",
      item.nome || "",
      item.categoria || "",
      item.unidade || "",
      item.estoqueAtual || 0,
      item.estoqueMinimo || 0,
      item.estoqueIdeal || 0,
      item.faltaReposicao || 0,
      numeroParaCsvEmbalagem(item.precoUnitario),
      numeroParaCsvEmbalagem(item.valorReposicao),
      item.statusAlerta || ""
    ]));
  });

  baixarArquivoTextoEmbalagem("embalagens-para-repor-balu.csv", "\ufeff" + linhas.join("\n"), "text/csv;charset=utf-8;");
}

// =====================================================
// KITS
// =====================================================

function prepararNovoKitEmbalagem() {
  resetarFormularioKitEmbalagem();

  setTextEmbalagem("drawerKitTitle", "Novo Kit de Embalagens");
  setValueEmbalagem("kitCodigo", gerarCodigoKitEmbalagem());

  popularSelectsKitEmbalagem();
  adicionarItemKitEmbalagem();
  atualizarPreviewKitEmbalagem();

  abrirDrawerBalu("drawerKitEmbalagem");
}

function resetarFormularioKitEmbalagem() {
  var form = document.getElementById("formKitEmbalagem");
  var inputImagem = document.getElementById("kitImagemInput");
  var preview = document.getElementById("kitImagemPreview");
  var placeholder = document.getElementById("kitImagemPlaceholder");
  var container = document.getElementById("kitItemsContainer");

  if (form) {
    form.reset();
  }

  setValueEmbalagem("kitId", "");

  if (inputImagem) {
    inputImagem.value = "";
    inputImagem.dataset.imageBase64 = "";
  }

  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  if (placeholder) {
    placeholder.style.display = "flex";
  }

  if (container) {
    container.innerHTML = "";
  }
}

function adicionarItemKitEmbalagem(itemSalvo) {
  var container = document.getElementById("kitItemsContainer");

  if (!container) {
    return;
  }

  var div = document.createElement("div");
  div.className = "kit-item";

  div.innerHTML =
    "<div class='kit-item-grid'>" +
      "<div class='form-field'>" +
        "<label>Embalagem</label>" +
        "<select class='kitItemEmbalagem'></select>" +
      "</div>" +
      "<div class='form-field'>" +
        "<label>Quantidade</label>" +
        "<input type='number' class='kitItemQuantidade' min='0' step='1' placeholder='1'>" +
      "</div>" +
      "<div class='form-field'>" +
        "<label>Custo unitário</label>" +
        "<input type='text' class='kitItemCustoUnitario calculated-field' readonly value='R$ 0,00'>" +
      "</div>" +
      "<button type='button' class='btn btn-outline btn-small kitItemRemove'>Remover</button>" +
    "</div>";

  container.appendChild(div);

  var select = div.querySelector(".kitItemEmbalagem");
  var quantidade = div.querySelector(".kitItemQuantidade");

  popularSelectItemKitEmbalagem(select);

  if (itemSalvo) {
    if (select) {
      select.value = itemSalvo.embalagemId || "";
    }

    if (quantidade) {
      quantidade.value = itemSalvo.quantidade || 1;
    }
  }

  atualizarPreviewKitEmbalagem();
}

function popularSelectsKitEmbalagem() {
  var selects = document.querySelectorAll(".kitItemEmbalagem");

  selects.forEach(function (select) {
    var valorAtual = select.value;
    popularSelectItemKitEmbalagem(select);
    select.value = valorAtual;
  });
}

function popularSelectItemKitEmbalagem(select) {
  if (!select) {
    return;
  }

  select.innerHTML = "<option value=''>Selecione uma embalagem</option>";

  embalagensCache.forEach(function (embalagem) {
    if (embalagem.status === "Inativo") {
      return;
    }

    select.innerHTML += "<option value='" + escapeAttrEmbalagem(embalagem.id) + "'>" + escapeHtmlEmbalagem(embalagem.nome || "-") + "</option>";
  });
}

function calcularKitEmbalagem() {
  var items = document.querySelectorAll(".kit-item");
  var custoTotal = 0;
  var totalItens = 0;
  var itens = [];

  items.forEach(function (item) {
    var select = item.querySelector(".kitItemEmbalagem");
    var quantidadeInput = item.querySelector(".kitItemQuantidade");

    if (!select || !quantidadeInput) {
      return;
    }

    var embalagem = buscarEmbalagemPorId(select.value);
    var quantidade = numeroEmbalagem(quantidadeInput.value);

    if (embalagem && quantidade > 0) {
      var custoUnitario = numeroEmbalagem(embalagem.precoUnitario);
      var totalItem = custoUnitario * quantidade;

      custoTotal += totalItem;
      totalItens += quantidade;

      itens.push({
        embalagemId: embalagem.id,
        nome: embalagem.nome,
        quantidade: quantidade,
        custoUnitario: custoUnitario,
        total: totalItem
      });
    }
  });

  return {
    custoTotal: custoTotal,
    totalItens: totalItens,
    itens: itens
  };
}

function atualizarPreviewKitEmbalagem() {
  var resultado = calcularKitEmbalagem();

  setTextEmbalagem("kitTotalItensPreview", formatarNumeroEmbalagem(resultado.totalItens, 0));
  setTextEmbalagem("kitCustoTotalPreview", formatarMoedaEmbalagem(resultado.custoTotal));

  var items = document.querySelectorAll(".kit-item");

  items.forEach(function (item) {
    var select = item.querySelector(".kitItemEmbalagem");
    var custoInput = item.querySelector(".kitItemCustoUnitario");

    if (!select || !custoInput) {
      return;
    }

    var embalagem = buscarEmbalagemPorId(select.value);
    var custoUnitario = embalagem ? numeroEmbalagem(embalagem.precoUnitario) : 0;

    custoInput.value = formatarMoedaEmbalagem(custoUnitario);
  });
}

function salvarKitEmbalagem() {
  var id = getValueEmbalagem("kitId");
  var nome = getValueEmbalagem("kitNome");

  if (!nome) {
    mostrarMensagemEmbalagem("Informe o nome do kit.", "warning");
    return;
  }

  var resultado = calcularKitEmbalagem();

  if (!resultado.itens.length) {
    mostrarMensagemEmbalagem("Adicione pelo menos uma embalagem ao kit.", "warning");
    return;
  }

  var existente = id ? buscarKitPorId(id) : null;

  var inputImagem = document.getElementById("kitImagemInput");
  var imagemNova = inputImagem && inputImagem.dataset.imageBase64 ? inputImagem.dataset.imageBase64 : "";
  var agora = new Date().toISOString();

  var kit = {
    id: id || gerarIdKitEmbalagem(),
    imagem: imagemNova || (existente && existente.imagem ? existente.imagem : ""),
    nome: nome,
    codigo: getValueEmbalagem("kitCodigo") || gerarCodigoKitEmbalagem(),
    descricao: getValueEmbalagem("kitDescricao"),
    itens: resultado.itens,
    totalItens: resultado.totalItens,
    custoTotal: resultado.custoTotal,
    status: getValueEmbalagem("kitStatus") || "Ativo",
    observacoes: getValueEmbalagem("kitObservacoes"),
    criadoEm: existente && existente.criadoEm ? existente.criadoEm : agora,
    atualizadoEm: agora
  };

  if (id) {
    kitsEmbalagensCache = kitsEmbalagensCache.map(function (item) {
      return item.id === id ? kit : item;
    });

    mostrarMensagemEmbalagem("Kit atualizado com sucesso.", "success");
  } else {
    kitsEmbalagensCache.push(kit);
    mostrarMensagemEmbalagem("Kit cadastrado com sucesso.", "success");
  }

  salvarKitsEmbalagensLocal();
  resetarFormularioKitEmbalagem();
  fecharDrawerBalu();

  renderizarKitsEmbalagens();
  renderizarResumoEmbalagens();
}

function editarKit(id) {
  var kit = buscarKitPorId(id);

  if (!kit) {
    mostrarMensagemEmbalagem("Kit não encontrado.", "danger");
    return;
  }

  resetarFormularioKitEmbalagem();

  setValueEmbalagem("kitId", kit.id);
  setValueEmbalagem("kitNome", kit.nome);
  setValueEmbalagem("kitCodigo", kit.codigo);
  setValueEmbalagem("kitDescricao", kit.descricao);
  setValueEmbalagem("kitStatus", kit.status || "Ativo");
  setValueEmbalagem("kitObservacoes", kit.observacoes);

  setTextEmbalagem("drawerKitTitle", "Editar Kit de Embalagens");

  var inputImagem = document.getElementById("kitImagemInput");
  var preview = document.getElementById("kitImagemPreview");
  var placeholder = document.getElementById("kitImagemPlaceholder");

  if (inputImagem) {
    inputImagem.dataset.imageBase64 = kit.imagem || "";
  }

  if (preview && kit.imagem) {
    preview.src = kit.imagem;
    preview.style.display = "block";

    if (placeholder) {
      placeholder.style.display = "none";
    }
  }

  if (Array.isArray(kit.itens)) {
    kit.itens.forEach(function (item) {
      adicionarItemKitEmbalagem(item);
    });
  }

  atualizarPreviewKitEmbalagem();
  abrirDrawerBalu("drawerKitEmbalagem");
}

function excluirKit(id) {
  var kit = buscarKitPorId(id);

  if (!kit) {
    return;
  }

  var confirmar = confirm("Deseja excluir o kit " + kit.nome + "?");

  if (!confirmar) {
    return;
  }

  kitsEmbalagensCache = kitsEmbalagensCache.filter(function (item) {
    return item.id !== id;
  });

  salvarKitsEmbalagensLocal();
  renderizarKitsEmbalagens();
  renderizarResumoEmbalagens();

  mostrarMensagemEmbalagem("Kit excluído com sucesso.", "success");
}

function buscarKitPorId(id) {
  return kitsEmbalagensCache.find(function (item) {
    return item.id === id;
  });
}

function renderizarKitsEmbalagens() {
  var table = document.getElementById("kitsEmbalagensTable");

  if (!table) {
    return;
  }

  var search = getValueEmbalagem("searchKits").toLowerCase();

  var lista = kitsEmbalagensCache.filter(function (kit) {
    var texto = [kit.nome, kit.codigo, kit.descricao].join(" ").toLowerCase();

    return !search || texto.indexOf(search) >= 0;
  });

  if (!lista.length) {
    table.innerHTML = "<tr><td colspan='6' class='text-muted'>Nenhum kit encontrado.</td></tr>";
    return;
  }

  table.innerHTML = lista.map(function (kit) {
    return "<tr>" +
      "<td><div class='product-cell'>" + renderThumbEmbalagem(kit.imagem, kit.nome) + "<div><strong>" + escapeHtmlEmbalagem(kit.nome || "-") + "</strong><span>" + escapeHtmlEmbalagem(kit.descricao || "Sem descrição") + "</span></div></div></td>" +
      "<td>" + escapeHtmlEmbalagem(kit.codigo || "-") + "</td>" +
      "<td>" + formatarNumeroEmbalagem(kit.totalItens, 0) + " item(ns)</td>" +
      "<td><strong>" + formatarMoedaEmbalagem(kit.custoTotal) + "</strong></td>" +
      "<td>" + badgeStatusEmbalagem(kit.status || "Ativo") + "</td>" +
      "<td><div class='table-actions'>" +
      "<button type='button' class='btn-icon' title='Editar' onclick='editarKit(\"" + escapeAttrEmbalagem(kit.id) + "\")'><i data-lucide='edit-3'></i></button>" +
      "<button type='button' class='btn-icon danger' title='Excluir' onclick='excluirKit(\"" + escapeAttrEmbalagem(kit.id) + "\")'><i data-lucide='trash-2'></i></button>" +
      "</div></td>" +
      "</tr>";
  }).join("");

  criarIconesEmbalagens();
}

// =====================================================
// CSV - EXPORTAR / MODELO / IMPORTAR
// =====================================================

function baixarModeloCsvEmbalagens() {
  var linhas = [];

  linhas.push(BALU_EMBALAGENS_HEADERS.join(";"));

  linhas.push(csvLinhaEmbalagem([
    "EMB-0001",
    "Marmita isopor 500ml",
    "Marmitas",
    "pacote",
    "100",
    "Embalagens & Cia",
    "80,00",
    "Atacado Exemplo",
    "75,00",
    "",
    "",
    "30",
    "20",
    "100",
    "Estoque principal",
    "Prateleira 1",
    "Manter longe de umidade",
    "Ativo",
    "Pacote com 100 unidades"
  ]));

  linhas.push(csvLinhaEmbalagem([
    "EMB-0002",
    "Sacola delivery pequena",
    "Sacolas",
    "pacote",
    "100",
    "Distribuidora Exemplo",
    "30,00",
    "",
    "",
    "",
    "",
    "250",
    "100",
    "400",
    "Estoque principal",
    "Caixa 2",
    "",
    "Ativo",
    ""
  ]));

  baixarArquivoTextoEmbalagem("modelo-embalagens-balu.csv", "\ufeff" + linhas.join("\n"), "text/csv;charset=utf-8;");
  mostrarMensagemEmbalagem("Modelo CSV de embalagens baixado.", "success");
}

function exportarEmbalagensCsv() {
  if (!embalagensCache.length) {
    mostrarMensagemEmbalagem("Não há embalagens para exportar.", "warning");
    return;
  }

  var linhas = [];

  linhas.push(BALU_EMBALAGENS_HEADERS.join(";"));

  embalagensCache.forEach(function (item) {
    linhas.push(csvLinhaEmbalagem([
      item.codigo || "",
      item.nome || "",
      item.categoria || "",
      item.unidade || "",
      item.quantidadePacote || 0,
      item.fornecedor1 || "",
      numeroParaCsvEmbalagem(item.precoFornecedor1),
      item.fornecedor2 || "",
      numeroParaCsvEmbalagem(item.precoFornecedor2),
      item.fornecedor3 || "",
      numeroParaCsvEmbalagem(item.precoFornecedor3),
      item.estoqueAtual || 0,
      item.estoqueMinimo || 0,
      item.estoqueIdeal || 0,
      item.localArmazenamento || "",
      item.posicaoArmazenamento || "",
      item.observacaoArmazenamento || "",
      item.status || "Ativo",
      item.observacoes || ""
    ]));
  });

  baixarArquivoTextoEmbalagem("balu-embalagens.csv", "\ufeff" + linhas.join("\n"), "text/csv;charset=utf-8;");
  mostrarMensagemEmbalagem("Arquivo de embalagens exportado.", "success");
}

function lerArquivoCsvEmbalagens(file) {
  if (!file) {
    return;
  }

  var nome = String(file.name || "").toLowerCase();

  if (!nome.endsWith(".csv")) {
    mostrarMensagemEmbalagem("Envie apenas arquivo CSV.", "warning");
    return;
  }

  var reader = new FileReader();

  reader.onload = function (event) {
    try {
      processarCsvEmbalagens(String(event.target.result || ""));
    } catch (erro) {
      console.error(erro);
      mostrarMensagemEmbalagem("Erro ao ler o CSV. Baixe o modelo oficial e tente novamente.", "danger");
    }
  };

  reader.readAsText(file, "UTF-8");
}

function processarCsvEmbalagens(texto) {
  texto = texto.replace(/^\uFEFF/, "");

  var linhas = parseCsvEmbalagem(texto);

  if (!linhas.length) {
    limparImportacaoEmbalagens();
    mostrarMensagemEmbalagem("CSV vazio.", "warning");
    return;
  }

  var headers = linhas[0].map(function (header) {
    return limparTextoEmbalagem(header);
  });

  var validacao = validarCabecalhoCsvEmbalagens(headers);

  if (!validacao.ok) {
    limparImportacaoEmbalagens();
    setTextEmbalagem("importEmbalagensStatus", "Modelo inválido. Coluna ausente: " + validacao.coluna);
    mostrarMensagemEmbalagem("Modelo inválido. Baixe o modelo CSV oficial do BALU.", "danger");
    return;
  }

  var objetos = [];

  for (var i = 1; i < linhas.length; i++) {
    var linha = linhas[i];

    var vazio = linha.every(function (valor) {
      return !limparTextoEmbalagem(valor);
    });

    if (vazio) {
      continue;
    }

    var obj = {};

    headers.forEach(function (header, index) {
      obj[header] = linha[index] || "";
    });

    objetos.push(montarEmbalagemDoCsv(obj));
  }

  embalagensImportacaoCache = objetos;

  renderizarPreviewImportacaoEmbalagens();
  atualizarStatusImportacaoEmbalagens();

  mostrarMensagemEmbalagem("CSV carregado. Confira e edite a prévia antes de importar.", "success");
}

function validarCabecalhoCsvEmbalagens(headers) {
  var obrigatorias = ["Nome", "Categoria"];

  for (var i = 0; i < obrigatorias.length; i++) {
    if (headers.indexOf(obrigatorias[i]) < 0) {
      return { ok: false, coluna: obrigatorias[i] };
    }
  }

  return { ok: true, coluna: "" };
}

function montarEmbalagemDoCsv(obj) {
  var embalagem = {
    id: "",
    imagem: "",
    codigo: limparTextoEmbalagem(obj.Codigo),
    nome: limparTextoEmbalagem(obj.Nome),
    categoria: limparTextoEmbalagem(obj.Categoria),
    unidade: limparTextoEmbalagem(obj.Unidade || "pacote"),
    quantidadePacote: numeroEmbalagem(obj.QuantidadePacote),
    fornecedor1: limparTextoEmbalagem(obj.Fornecedor1),
    precoFornecedor1: numeroEmbalagem(obj.PrecoFornecedor1),
    fornecedor2: limparTextoEmbalagem(obj.Fornecedor2),
    precoFornecedor2: numeroEmbalagem(obj.PrecoFornecedor2),
    fornecedor3: limparTextoEmbalagem(obj.Fornecedor3),
    precoFornecedor3: numeroEmbalagem(obj.PrecoFornecedor3),
    estoqueAtual: numeroEmbalagem(obj.EstoqueAtual),
    estoqueMinimo: numeroEmbalagem(obj.EstoqueMinimo),
    estoqueIdeal: numeroEmbalagem(obj.EstoqueIdeal),
    localArmazenamento: limparTextoEmbalagem(obj.LocalArmazenamento),
    posicaoArmazenamento: limparTextoEmbalagem(obj.PosicaoArmazenamento),
    observacaoArmazenamento: limparTextoEmbalagem(obj.ObservacaoArmazenamento),
    status: limparTextoEmbalagem(obj.Status) || "Ativo",
    observacoes: limparTextoEmbalagem(obj.Observacoes)
  };

  return normalizarEmbalagemSalva(embalagem);
}

function renderizarPreviewImportacaoEmbalagens() {
  var table = document.getElementById("importEmbalagensPreviewTable");

  if (!table) {
    return;
  }

  if (!embalagensImportacaoCache.length) {
    table.innerHTML = "<tr><td colspan='19' class='text-muted'>Carregue o modelo CSV preenchido para visualizar a prévia.</td></tr>";
    return;
  }

  table.innerHTML = embalagensImportacaoCache.map(function (item, index) {
    var erros = validarLinhaImportacaoEmbalagem(item);
    var statusLinha = erros.length ? "Corrigir: " + erros.join(", ") : "OK";
    var badgeClasse = erros.length ? "danger" : "success";

    return "<tr>" +
      "<td>" + (index + 1) + "</td>" +
      campoPreviewEmbalagem(index, "codigo", item.codigo) +
      campoPreviewEmbalagem(index, "nome", item.nome) +
      campoPreviewEmbalagem(index, "categoria", item.categoria) +
      campoPreviewEmbalagem(index, "unidade", item.unidade) +
      campoPreviewEmbalagem(index, "quantidadePacote", numeroParaInputEmbalagem(item.quantidadePacote)) +
      campoPreviewEmbalagem(index, "fornecedor1", item.fornecedor1) +
      campoPreviewEmbalagem(index, "precoFornecedor1", numeroParaInputEmbalagem(item.precoFornecedor1)) +
      campoPreviewEmbalagem(index, "fornecedor2", item.fornecedor2) +
      campoPreviewEmbalagem(index, "precoFornecedor2", numeroParaInputEmbalagem(item.precoFornecedor2)) +
      campoPreviewEmbalagem(index, "fornecedor3", item.fornecedor3) +
      campoPreviewEmbalagem(index, "precoFornecedor3", numeroParaInputEmbalagem(item.precoFornecedor3)) +
      campoPreviewEmbalagem(index, "estoqueAtual", numeroParaInputEmbalagem(item.estoqueAtual)) +
      campoPreviewEmbalagem(index, "estoqueMinimo", numeroParaInputEmbalagem(item.estoqueMinimo)) +
      campoPreviewEmbalagem(index, "estoqueIdeal", numeroParaInputEmbalagem(item.estoqueIdeal)) +
      campoPreviewEmbalagem(index, "localArmazenamento", item.localArmazenamento) +
      campoPreviewEmbalagem(index, "posicaoArmazenamento", item.posicaoArmazenamento) +
      "<td><span class='badge " + badgeClasse + "'>" + escapeHtmlEmbalagem(statusLinha) + "</span></td>" +
      "<td><button type='button' class='btn-icon danger' data-remove-import-emb-index='" + index + "'><i data-lucide='trash-2'></i></button></td>" +
      "</tr>";
  }).join("");

  criarIconesEmbalagens();
}

function campoPreviewEmbalagem(index, campo, valor) {
  return "<td><input class='import-edit-input' data-import-emb-index='" + index + "' data-import-emb-field='" + campo + "' value='" + escapeAttrEmbalagem(valor || "") + "'></td>";
}

function atualizarCampoPreviewImportacaoEmbalagens(event) {
  var input = event.target.closest("[data-import-emb-index]");

  if (!input) {
    return;
  }

  var index = Number(input.getAttribute("data-import-emb-index"));
  var field = input.getAttribute("data-import-emb-field");

  if (!embalagensImportacaoCache[index]) {
    return;
  }

  var valor = input.value;

  if (["quantidadePacote", "precoFornecedor1", "precoFornecedor2", "precoFornecedor3", "estoqueAtual", "estoqueMinimo", "estoqueIdeal"].indexOf(field) >= 0) {
    embalagensImportacaoCache[index][field] = numeroEmbalagem(valor);
  } else {
    embalagensImportacaoCache[index][field] = limparTextoEmbalagem(valor);
  }

  embalagensImportacaoCache[index] = normalizarEmbalagemSalva(embalagensImportacaoCache[index]);

  renderizarPreviewImportacaoEmbalagens();
  atualizarStatusImportacaoEmbalagens();
}

function removerLinhaImportacaoEmbalagens(index) {
  embalagensImportacaoCache.splice(index, 1);

  renderizarPreviewImportacaoEmbalagens();
  atualizarStatusImportacaoEmbalagens();
}

function validarLinhaImportacaoEmbalagem(item) {
  var erros = [];

  if (!limparTextoEmbalagem(item.nome)) {
    erros.push("Nome");
  }

  if (!limparTextoEmbalagem(item.categoria)) {
    erros.push("Categoria");
  }

  if (numeroEmbalagem(item.quantidadePacote) <= 0) {
    erros.push("Qtd. pacote");
  }

  return erros;
}

function atualizarStatusImportacaoEmbalagens() {
  var total = embalagensImportacaoCache.length;
  var invalidas = embalagensImportacaoCache.filter(function (item) {
    return validarLinhaImportacaoEmbalagem(item).length > 0;
  }).length;

  var status = document.getElementById("importEmbalagensStatus");

  if (!status) {
    return;
  }

  status.classList.remove("warning", "success", "danger");

  if (!total) {
    status.classList.add("warning");
    status.textContent = "Nenhum arquivo carregado.";
    return;
  }

  if (invalidas > 0) {
    status.classList.add("danger");
    status.textContent = total + " linha(s) carregada(s), " + invalidas + " com pendência.";
    return;
  }

  status.classList.add("success");
  status.textContent = total + " linha(s) pronta(s) para importar.";
}

function confirmarImportacaoEmbalagens() {
  if (!embalagensImportacaoCache.length) {
    mostrarMensagemEmbalagem("Nenhuma embalagem para importar.", "warning");
    return;
  }

  var invalidas = embalagensImportacaoCache.filter(function (item) {
    return validarLinhaImportacaoEmbalagem(item).length > 0;
  });

  if (invalidas.length) {
    mostrarMensagemEmbalagem("Corrija as linhas com pendência antes de importar.", "warning");
    return;
  }

  var agora = new Date().toISOString();

  embalagensImportacaoCache.forEach(function (item) {
    var novo = normalizarEmbalagemSalva(item);

    novo.id = gerarIdEmbalagem();
    novo.codigo = novo.codigo || gerarCodigoEmbalagem();
    novo.criadoEm = agora;
    novo.atualizadoEm = agora;

    embalagensCache.push(novo);
  });

  salvarEmbalagensLocal();
  limparImportacaoEmbalagens();
  renderizarEmbalagens();
  renderizarResumoEmbalagens();
  popularSelectsKitEmbalagem();

  mostrarMensagemEmbalagem("Embalagens importadas com sucesso.", "success");
  fecharDrawerBalu();
}

function limparImportacaoEmbalagens() {
  embalagensImportacaoCache = [];

  var input = document.getElementById("importEmbalagensCsvFile");

  if (input) {
    input.value = "";
  }

  renderizarPreviewImportacaoEmbalagens();
  atualizarStatusImportacaoEmbalagens();
}

// =====================================================
// STORAGE
// =====================================================

function carregarEmbalagensLocal() {
  try {
    var texto = localStorage.getItem(BALU_EMBALAGENS_KEY);
    var dados = texto ? JSON.parse(texto) : [];

    if (Array.isArray(dados)) {
      return dados.map(normalizarEmbalagemSalva);
    }

    return [];
  } catch (erro) {
    return [];
  }
}

function salvarEmbalagensLocal() {
  localStorage.setItem(BALU_EMBALAGENS_KEY, JSON.stringify(embalagensCache));
}

function carregarKitsEmbalagensLocal() {
  try {
    var texto = localStorage.getItem(BALU_KITS_EMBALAGENS_KEY);
    var dados = texto ? JSON.parse(texto) : [];

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    return [];
  }
}

function salvarKitsEmbalagensLocal() {
  localStorage.setItem(BALU_KITS_EMBALAGENS_KEY, JSON.stringify(kitsEmbalagensCache));
}

// =====================================================
// NORMALIZAÇÃO
// =====================================================

function normalizarEmbalagemSalva(item) {
  item = item || {};

  var embalagem = {
    id: item.id || gerarIdEmbalagem(),
    imagem: item.imagem || "",
    nome: limparTextoEmbalagem(item.nome),
    codigo: limparTextoEmbalagem(item.codigo),
    categoria: limparTextoEmbalagem(item.categoria),
    unidade: limparTextoEmbalagem(item.unidade || "pacote"),
    quantidadePacote: numeroEmbalagem(item.quantidadePacote),
    status: limparTextoEmbalagem(item.status) || "Ativo",
    descricao: limparTextoEmbalagem(item.descricao),
    fornecedor1: limparTextoEmbalagem(item.fornecedor1),
    precoFornecedor1: numeroEmbalagem(item.precoFornecedor1),
    fornecedor2: limparTextoEmbalagem(item.fornecedor2),
    precoFornecedor2: numeroEmbalagem(item.precoFornecedor2),
    fornecedor3: limparTextoEmbalagem(item.fornecedor3),
    precoFornecedor3: numeroEmbalagem(item.precoFornecedor3),
    estoqueAtual: numeroEmbalagem(item.estoqueAtual),
    estoqueMinimo: numeroEmbalagem(item.estoqueMinimo),
    estoqueIdeal: numeroEmbalagem(item.estoqueIdeal),
    localArmazenamento: limparTextoEmbalagem(item.localArmazenamento),
    posicaoArmazenamento: limparTextoEmbalagem(item.posicaoArmazenamento),
    observacaoArmazenamento: limparTextoEmbalagem(item.observacaoArmazenamento),
    observacoes: limparTextoEmbalagem(item.observacoes),
    criadoEm: item.criadoEm || "",
    atualizadoEm: item.atualizadoEm || ""
  };

  var precos = [];

  if (embalagem.precoFornecedor1 > 0) precos.push(embalagem.precoFornecedor1);
  if (embalagem.precoFornecedor2 > 0) precos.push(embalagem.precoFornecedor2);
  if (embalagem.precoFornecedor3 > 0) precos.push(embalagem.precoFornecedor3);

  embalagem.precoMedioPacote = precos.length ? precos.reduce(function (soma, preco) {
    return soma + preco;
  }, 0) / precos.length : numeroEmbalagem(item.precoMedioPacote);

  embalagem.precoUnitario = embalagem.quantidadePacote > 0 ? embalagem.precoMedioPacote / embalagem.quantidadePacote : numeroEmbalagem(item.precoUnitario);
  embalagem.valorEstoque = embalagem.estoqueAtual * embalagem.precoUnitario;
  embalagem.statusEstoque = calcularStatusEstoqueEmbalagem(embalagem.estoqueAtual, embalagem.estoqueMinimo, embalagem.estoqueIdeal, embalagem.status);

  return embalagem;
}

// =====================================================
// HELPERS
// =====================================================

function getValueEmbalagem(id) {
  var element = document.getElementById(id);

  if (!element) {
    return "";
  }

  return element.value || "";
}

function setValueEmbalagem(id, value) {
  var element = document.getElementById(id);

  if (element) {
    element.value = value === undefined || value === null ? "" : value;
  }
}

function setTextEmbalagem(id, value) {
  var element = document.getElementById(id);

  if (!element) {
    return;
  }

  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
    element.value = value === undefined || value === null ? "" : value;
  } else {
    element.textContent = value === undefined || value === null ? "" : value;
  }
}

function numeroEmbalagem(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return isNaN(valor) ? 0 : valor;
  }

  var texto = String(valor)
    .replace("R$", "")
    .replace("%", "")
    .replace(/\s/g, "")
    .trim();

  if (texto.indexOf(",") >= 0) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  var numero = Number(texto);

  return isNaN(numero) ? 0 : numero;
}

function numeroParaInputEmbalagem(valor) {
  var numero = numeroEmbalagem(valor);

  if (numero === 0) {
    return "";
  }

  return String(numero).replace(".", ",");
}

function numeroParaCsvEmbalagem(valor) {
  var numero = numeroEmbalagem(valor);

  return String(numero).replace(".", ",");
}

function formatarMoedaEmbalagem(valor) {
  var numero = numeroEmbalagem(valor);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumeroEmbalagem(valor, casas) {
  var numero = numeroEmbalagem(valor);

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function limparTextoEmbalagem(valor) {
  return String(valor || "").trim();
}

function normalizarTextoEmbalagem(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escapeHtmlEmbalagem(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttrEmbalagem(valor) {
  return escapeHtmlEmbalagem(valor);
}

function primeiraLetraEmbalagem(nome) {
  var texto = limparTextoEmbalagem(nome);

  if (!texto) {
    return "E";
  }

  return texto.charAt(0).toUpperCase();
}

function renderThumbEmbalagem(imagem, nome) {
  if (imagem) {
    return "<img class='product-thumb' src='" + escapeAttrEmbalagem(imagem) + "' alt='" + escapeAttrEmbalagem(nome || "Embalagem") + "'>";
  }

  return "<div class='product-thumb placeholder'>" + escapeHtmlEmbalagem(primeiraLetraEmbalagem(nome)) + "</div>";
}

function badgeStatusEmbalagem(status) {
  var texto = status || "Ativo";
  var normalizado = normalizarTextoEmbalagem(texto);
  var classe = "neutral";

  if (normalizado.indexOf("ok") >= 0 || normalizado === "ativo") {
    classe = "success";
  }

  if (normalizado.indexOf("atencao") >= 0 || normalizado.indexOf("baixo") >= 0) {
    classe = "warning";
  }

  if (normalizado.indexOf("critico") >= 0) {
    classe = "danger";
  }

  return "<span class='badge " + classe + "'>" + escapeHtmlEmbalagem(texto) + "</span>";
}

function gerarIdEmbalagem() {
  return "EMB-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function gerarCodigoEmbalagem() {
  var proximo = embalagensCache.length + embalagensImportacaoCache.length + 1;

  return "EMB-" + String(proximo).padStart(4, "0");
}

function gerarIdKitEmbalagem() {
  return "KIT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function gerarCodigoKitEmbalagem() {
  var proximo = kitsEmbalagensCache.length + 1;

  return "KIT-" + String(proximo).padStart(4, "0");
}

function criarIconesEmbalagens() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function mostrarMensagemEmbalagem(mensagem, tipo) {
  if (typeof showToast === "function") {
    showToast(mensagem, tipo || "success");
    return;
  }

  console.log((tipo || "info") + ": " + mensagem);
}

function abrirDrawerBalu(id) {
  if (typeof openDrawer === "function") {
    openDrawer(id);
    return;
  }

  var drawer = document.getElementById(id);

  if (drawer) {
    drawer.classList.add("active");
    drawer.style.display = "block";
  }
}

function fecharDrawerBalu() {
  if (typeof closeDrawer === "function") {
    closeDrawer();
    return;
  }

  document.querySelectorAll(".drawer").forEach(function (drawer) {
    drawer.classList.remove("active");
    drawer.style.display = "none";
  });
}

function baixarArquivoTextoEmbalagem(nome, conteudo, tipo) {
  var blob = new Blob([conteudo], { type: tipo || "text/plain;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");

  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function csvLinhaEmbalagem(valores) {
  return valores.map(function (valor) {
    var texto = String(valor === undefined || valor === null ? "" : valor);

    if (texto.indexOf(";") >= 0 || texto.indexOf('"') >= 0 || texto.indexOf("\n") >= 0) {
      texto = '"' + texto.replace(/"/g, '""') + '"';
    }

    return texto;
  }).join(";");
}

function parseCsvEmbalagem(texto) {
  var linhas = [];
  var atual = [];
  var valor = "";
  var aspas = false;

  for (var i = 0; i < texto.length; i++) {
    var char = texto[i];
    var proximo = texto[i + 1];

    if (char === '"' && aspas && proximo === '"') {
      valor += '"';
      i++;
      continue;
    }

    if (char === '"') {
      aspas = !aspas;
      continue;
    }

    if (char === ";" && !aspas) {
      atual.push(valor);
      valor = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !aspas) {
      if (char === "\r" && proximo === "\n") {
        i++;
      }

      atual.push(valor);
      linhas.push(atual);
      atual = [];
      valor = "";
      continue;
    }

    valor += char;
  }

  atual.push(valor);
  linhas.push(atual);

  return linhas.filter(function (linha) {
    return linha.some(function (coluna) {
      return limparTextoEmbalagem(coluna);
    });
  });
}


