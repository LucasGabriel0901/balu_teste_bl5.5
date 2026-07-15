// =====================================================
// BALU FOOD - PAINEL DE BANNERS
// Cadastro e controle das propagandas do sistema
// =====================================================

(function () {
  var BALU_BANNERS_KEY = "balu_publicidade_banners";
  var bannersPainelCache = [];
  var bannerImagemBase64Temp = "";

  document.addEventListener("DOMContentLoaded", function () {
    iniciarPainelBannersPublicidade();
  });

  function iniciarPainelBannersPublicidade() {
    if (!document.getElementById("painelBannersModule")) return;

    bannersPainelCache = carregarBannersPublicidade();
    iniciarEventosPainelBanners();
    renderizarPainelBanners();

    if (window.lucide) lucide.createIcons();
  }

  function iniciarEventosPainelBanners() {
    var btnNovo = document.getElementById("btnNovoBannerPublicidade");
    var form = document.getElementById("formBannerPublicidade");
    var search = document.getElementById("searchBannersPublicidade");
    var filterStatus = document.getElementById("filterBannersStatus");
    var tipoMidia = document.getElementById("bannerTipoMidia");
    var imagemInput = document.getElementById("bannerImagemInput");

    if (btnNovo) btnNovo.addEventListener("click", prepararNovoBannerPublicidade);

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        salvarBannerPublicidade();
      });
    }

    if (search) search.addEventListener("input", renderizarPainelBanners);
    if (filterStatus) filterStatus.addEventListener("change", renderizarPainelBanners);
    if (tipoMidia) tipoMidia.addEventListener("change", atualizarCamposMidiaBanner);

    if (imagemInput) {
      imagemInput.addEventListener("change", function () {
        var file = imagemInput.files && imagemInput.files[0];
        if (!file) return;

        converterImagemBannerBase64(file).then(function (base64) {
          bannerImagemBase64Temp = base64;
          atualizarPreviewBannerPublicidade();
        });
      });
    }

    [
      "bannerNome",
      "bannerTag",
      "bannerTitulo",
      "bannerSubtitulo",
      "bannerTipoMidia",
      "bannerMediaUrl",
      "bannerClasseVisual",
      "bannerLinkUrl",
      "bannerStatus"
    ].forEach(function (id) {
      var campo = document.getElementById(id);

      if (campo) {
        campo.addEventListener("input", atualizarPreviewBannerPublicidade);
        campo.addEventListener("change", atualizarPreviewBannerPublicidade);
      }
    });
  }

  function prepararNovoBannerPublicidade() {
    resetarFormularioBannerPublicidade();
    setTextBanner("drawerBannerPublicidadeTitle", "Novo Banner");
    setValueBanner("bannerOrdem", bannersPainelCache.length + 1);
    setValueBanner("bannerTag", "PUBLICIDADE");
    marcarPaginasBanner(["todas"]);
    atualizarCamposMidiaBanner();
    atualizarPreviewBannerPublicidade();
    abrirDrawerBanner("drawerBannerPublicidade");
  }

  function resetarFormularioBannerPublicidade() {
    var form = document.getElementById("formBannerPublicidade");
    if (form) form.reset();

    bannerImagemBase64Temp = "";

    setValueBanner("bannerPublicidadeId", "");
    setValueBanner("bannerTipoMidia", "arte");
    setValueBanner("bannerStatus", "ativo");
    setValueBanner("bannerClasseVisual", "balu-ad-gradient-1");
    setValueBanner("bannerAbrirNovaAba", "true");

    document.querySelectorAll(".bannerPaginaCheck").forEach(function (check) {
      check.checked = false;
    });
  }

  function salvarBannerPublicidade() {
    var id = getValueBanner("bannerPublicidadeId");
    var nome = getValueBanner("bannerNome");
    var titulo = getValueBanner("bannerTitulo");
    var tipoMidia = getValueBanner("bannerTipoMidia");
    var paginas = obterPaginasSelecionadasBanner();

    if (!nome) {
      mostrarMensagemBanner("Informe o nome interno da campanha.", "warning");
      return;
    }

    if (!titulo) {
      mostrarMensagemBanner("Informe o título do banner.", "warning");
      return;
    }

    if (!paginas.length) {
      mostrarMensagemBanner("Selecione pelo menos uma aba onde o banner vai aparecer.", "warning");
      return;
    }

    var existente = id ? buscarBannerPorId(id) : null;
    var mediaUrl = getValueBanner("bannerMediaUrl");

    if (tipoMidia === "imagem") {
      mediaUrl = bannerImagemBase64Temp || (existente && existente.mediaUrl ? existente.mediaUrl : "");
    }

    var banner = {
      id: id || gerarIdBanner(),
      nome: nome,
      tipoMidia: tipoMidia,
      posicao: "hero",
      paginas: paginas,
      tag: getValueBanner("bannerTag") || "PUBLICIDADE",
      titulo: titulo,
      subtitulo: getValueBanner("bannerSubtitulo"),
      textoBotao: "",
      mediaUrl: mediaUrl,
      linkUrl: getValueBanner("bannerLinkUrl"),
      abrirNovaAba: getValueBanner("bannerAbrirNovaAba") === "true",
      ordem: numeroBanner(getValueBanner("bannerOrdem")) || 1,
      ativo: getValueBanner("bannerStatus") === "ativo",
      dataInicio: getValueBanner("bannerDataInicio"),
      dataFim: getValueBanner("bannerDataFim"),
      classeVisual: getValueBanner("bannerClasseVisual") || "balu-ad-gradient-1",
      visualizacoes: existente ? numeroBanner(existente.visualizacoes) : 0,
      cliques: existente ? numeroBanner(existente.cliques) : 0,
      criadoEm: existente && existente.criadoEm ? existente.criadoEm : new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    if (id) {
      bannersPainelCache = bannersPainelCache.map(function (item) {
        return item.id === id ? banner : item;
      });

      mostrarMensagemBanner("Banner atualizado com sucesso.", "success");
    } else {
      bannersPainelCache.push(banner);
      mostrarMensagemBanner("Banner cadastrado com sucesso.", "success");
    }

    salvarBannersPublicidade();
    renderizarPainelBanners();

    if (window.BALU_BANNERS && typeof window.BALU_BANNERS.atualizar === "function") {
      window.BALU_BANNERS.atualizar();
    }

    fecharDrawerBanner();
  }

  function editarBannerPublicidade(id) {
    var banner = buscarBannerPorId(id);

    if (!banner) {
      mostrarMensagemBanner("Banner não encontrado.", "danger");
      return;
    }

    resetarFormularioBannerPublicidade();

    setTextBanner("drawerBannerPublicidadeTitle", "Editar Banner");

    setValueBanner("bannerPublicidadeId", banner.id);
    setValueBanner("bannerNome", banner.nome);
    setValueBanner("bannerTag", banner.tag);
    setValueBanner("bannerTitulo", banner.titulo);
    setValueBanner("bannerSubtitulo", banner.subtitulo);
    setValueBanner("bannerTipoMidia", banner.tipoMidia || "arte");
    setValueBanner("bannerMediaUrl", banner.tipoMidia === "video" ? banner.mediaUrl : "");
    setValueBanner("bannerClasseVisual", banner.classeVisual || "balu-ad-gradient-1");
    setValueBanner("bannerOrdem", banner.ordem || 1);
    setValueBanner("bannerLinkUrl", banner.linkUrl);
    setValueBanner("bannerAbrirNovaAba", banner.abrirNovaAba ? "true" : "false");
    setValueBanner("bannerDataInicio", banner.dataInicio);
    setValueBanner("bannerDataFim", banner.dataFim);
    setValueBanner("bannerStatus", banner.ativo ? "ativo" : "inativo");

    bannerImagemBase64Temp = banner.tipoMidia === "imagem" ? banner.mediaUrl || "" : "";

    marcarPaginasBanner(Array.isArray(banner.paginas) ? banner.paginas : []);
    atualizarCamposMidiaBanner();
    atualizarPreviewBannerPublicidade();
    abrirDrawerBanner("drawerBannerPublicidade");
  }

  function excluirBannerPublicidade(id) {
    var banner = buscarBannerPorId(id);
    if (!banner) return;

    var confirmar = confirm("Deseja excluir o banner " + banner.nome + "?");
    if (!confirmar) return;

    bannersPainelCache = bannersPainelCache.filter(function (item) {
      return item.id !== id;
    });

    salvarBannersPublicidade();
    renderizarPainelBanners();

    if (window.BALU_BANNERS && typeof window.BALU_BANNERS.atualizar === "function") {
      window.BALU_BANNERS.atualizar();
    }

    mostrarMensagemBanner("Banner excluído com sucesso.", "success");
  }

  function alternarStatusBannerPublicidade(id) {
    bannersPainelCache = bannersPainelCache.map(function (banner) {
      if (banner.id === id) {
        banner.ativo = !banner.ativo;
        banner.atualizadoEm = new Date().toISOString();
      }

      return banner;
    });

    salvarBannersPublicidade();
    renderizarPainelBanners();

    if (window.BALU_BANNERS && typeof window.BALU_BANNERS.atualizar === "function") {
      window.BALU_BANNERS.atualizar();
    }
  }

 function renderizarPainelBanners() {
var table = document.getElementById("bannersPublicidadeTable");

if (!table) {
return;
}

var lista = filtrarBannersPainel();

if (!lista.length) {
table.innerHTML = "<tr><td colspan='8' class='text-muted'>Nenhum banner encontrado.</td></tr>";
renderizarResumoBanners();
return;
}

table.innerHTML = lista.map(function (banner) {
var paginasTexto = formatarPaginasBanner(banner.paginas);
      

var statusBadge = banner.ativo
  ? "<span class='badge success'>Ativo</span>"
  : "<span class='badge neutral'>Inativo</span>";

return "" +
  "<tr>" +
    "<td>" +
      "<div class='banner-campaign-cell'>" +
        renderizarThumbBanner(banner) +
        "<div>" +
          "<strong>" + escapeHtmlBanner(banner.nome || "-") + "</strong>" +
          "<span>" + escapeHtmlBanner(banner.titulo || "-") + "</span>" +
        "</div>" +
      "</div>" +
    "</td>" +
    "<td>" + escapeHtmlBanner(banner.tipoMidia || "arte") + "</td>" +
    "<td>" + escapeHtmlBanner(paginasTexto) + "</td>" +
    "<td>" + numeroBanner(banner.ordem) + "</td>" +
    "<td>" + statusBadge + "</td>" +
    "<td>" + numeroBanner(banner.visualizacoes) + "</td>" +
    "<td>" + numeroBanner(banner.cliques) + "</td>" +
    "<td>" +
      "<div class='table-actions'>" +
        "<button type='button' class='btn-icon' title='Ativar/Inativar' data-banner-action='toggle' data-banner-id='" + escapeAttrBanner(banner.id) + "'>" +
          "<i data-lucide='power'></i>" +
        "</button>" +

        "<button type='button' class='btn-icon' title='Editar' data-banner-action='edit' data-banner-id='" + escapeAttrBanner(banner.id) + "'>" +
          "<i data-lucide='edit-3'></i>" +
        "</button>" +

        "<button type='button' class='btn-icon danger' title='Excluir' data-banner-action='delete' data-banner-id='" + escapeAttrBanner(banner.id) + "'>" +
          "<i data-lucide='trash-2'></i>" +
        "</button>" +
      "</div>" +
    "</td>" +
  "</tr>";
                                    

}).join("");

vincularAcoesTabelaBanners();
renderizarResumoBanners();

if (window.lucide) {
lucide.createIcons();
}
}

function vincularAcoesTabelaBanners() {
document.querySelectorAll("[data-banner-action]").forEach(function (botao) {
botao.addEventListener("click", function () {
var acao = botao.getAttribute("data-banner-action");
var id = botao.getAttribute("data-banner-id");


  if (!id) {
    return;
  }

  if (acao === "toggle") {
    alternarStatusBannerPublicidade(id);
  }

  if (acao === "edit") {
    editarBannerPublicidade(id);
  }

  if (acao === "delete") {
    excluirBannerPublicidade(id);
  }
});


});
}

  function filtrarBannersPainel() {
    var search = getValueBanner("searchBannersPublicidade").toLowerCase();
    var status = getValueBanner("filterBannersStatus");

    return bannersPainelCache
      .filter(function (banner) {
        var texto = [
          banner.nome,
          banner.titulo,
          banner.subtitulo,
          Array.isArray(banner.paginas) ? banner.paginas.join(" ") : ""
        ].join(" ").toLowerCase();

        var passaBusca = !search || texto.indexOf(search) >= 0;
        var passaStatus =
          !status ||
          (status === "ativo" && banner.ativo === true) ||
          (status === "inativo" && banner.ativo !== true);

        return passaBusca && passaStatus;
      })
      .sort(function (a, b) {
        return numeroBanner(a.ordem) - numeroBanner(b.ordem);
      });
  }

  function renderizarResumoBanners() {
    var total = bannersPainelCache.length;
    var ativos = bannersPainelCache.filter(function (banner) { return banner.ativo === true; }).length;

    var views = bannersPainelCache.reduce(function (soma, banner) {
      return soma + numeroBanner(banner.visualizacoes);
    }, 0);

    var cliques = bannersPainelCache.reduce(function (soma, banner) {
      return soma + numeroBanner(banner.cliques);
    }, 0);

    setTextBanner("totalBannersPublicidade", total);
    setTextBanner("totalBannersAtivos", ativos);
    setTextBanner("totalBannersVisualizacoes", views);
    setTextBanner("totalBannersCliques", cliques);
  }

  function atualizarCamposMidiaBanner() {
    var tipo = getValueBanner("bannerTipoMidia");
    var areaImagem = document.getElementById("bannerImagemArea");
    var areaVideo = document.getElementById("bannerVideoArea");

    if (areaImagem) areaImagem.style.display = tipo === "imagem" ? "flex" : "none";
    if (areaVideo) areaVideo.style.display = tipo === "video" ? "flex" : "none";

    atualizarPreviewBannerPublicidade();
  }

  function atualizarPreviewBannerPublicidade() {
    var preview = document.getElementById("bannerPreviewPublicidade");
    if (!preview) return;

    var tipo = getValueBanner("bannerTipoMidia");
    var titulo = getValueBanner("bannerTitulo") || "Título do banner";
    var subtitulo = getValueBanner("bannerSubtitulo") || "Subtítulo da campanha";
    var classeVisual = getValueBanner("bannerClasseVisual") || "balu-ad-gradient-1";
    var mediaUrl = tipo === "imagem" ? bannerImagemBase64Temp : getValueBanner("bannerMediaUrl");

    preview.className = "banner-preview-content " + classeVisual;

    if (tipo === "imagem" && mediaUrl) {
      preview.innerHTML = "<img src='" + escapeAttrBanner(mediaUrl) + "' alt='Prévia do banner'>";
      return;
    }

    if (tipo === "video" && mediaUrl) {
      preview.innerHTML = "<video src='" + escapeAttrBanner(mediaUrl) + "' autoplay muted loop playsinline></video>";
      return;
    }

    preview.innerHTML = "<div><strong>" + escapeHtmlBanner(titulo) + "</strong><small style='display:block;margin-top:4px;color:rgba(255,255,255,.8);font-size:11px;'>" + escapeHtmlBanner(subtitulo) + "</small></div>";
  }

  function obterPaginasSelecionadasBanner() {
    var selecionadas = [];

    document.querySelectorAll(".bannerPaginaCheck").forEach(function (check) {
      if (check.checked) selecionadas.push(check.value);
    });

    if (selecionadas.indexOf("todas") >= 0) return ["todas"];
    return selecionadas;
  }

  function marcarPaginasBanner(paginas) {
    paginas = Array.isArray(paginas) ? paginas : [];

    document.querySelectorAll(".bannerPaginaCheck").forEach(function (check) {
      check.checked = paginas.indexOf(check.value) >= 0;
    });
  }

  function renderizarThumbBanner(banner) {
    if (banner.tipoMidia === "imagem" && banner.mediaUrl) {
      return "<div class='banner-thumb'><img src='" + escapeAttrBanner(banner.mediaUrl) + "' alt='" + escapeAttrBanner(banner.nome || "Banner") + "'></div>";
    }

    if (banner.tipoMidia === "video" && banner.mediaUrl) {
      return "<div class='banner-thumb'><video src='" + escapeAttrBanner(banner.mediaUrl) + "' muted></video></div>";
    }

    return "<div class='banner-thumb'>BALU</div>";
  }

  function formatarPaginasBanner(paginas) {
    if (!Array.isArray(paginas) || !paginas.length) return "-";
    if (paginas.indexOf("todas") >= 0) return "Todas";
    return paginas.join(", ");
  }

  function carregarBannersPublicidade() {
    try {
      var texto = localStorage.getItem(BALU_BANNERS_KEY);
      var dados = texto ? JSON.parse(texto) : [];
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      console.error("Erro ao carregar banners:", erro);
      return [];
    }
  }

  function salvarBannersPublicidade() {
    localStorage.setItem(BALU_BANNERS_KEY, JSON.stringify(bannersPainelCache));
  }

  function buscarBannerPorId(id) {
    return bannersPainelCache.find(function (banner) {
      return banner.id === id;
    });
  }

  function converterImagemBannerBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function gerarIdBanner() {
    return "banner_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
  }

  function getValueBanner(id) {
    var element = document.getElementById(id);
    if (!element) return "";
    return element.value || "";
  }

  function setValueBanner(id, value) {
    var element = document.getElementById(id);
    if (element) element.value = value === undefined || value === null ? "" : value;
  }

  function setTextBanner(id, value) {
    var element = document.getElementById(id);
    if (!element) return;

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
      element.value = value === undefined || value === null ? "" : value;
    } else {
      element.textContent = value === undefined || value === null ? "" : value;
    }
  }

  function numeroBanner(valor) {
    var numero = Number(valor);
    return isNaN(numero) ? 0 : numero;
  }

  function mostrarMensagemBanner(mensagem, tipo) {
    if (typeof showToast === "function") {
      showToast(mensagem, tipo || "success");
      return;
    }

    alert(mensagem);
  }

  function abrirDrawerBanner(id) {
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

  function fecharDrawerBanner() {
    if (typeof closeDrawer === "function") {
      closeDrawer();
      return;
    }

    document.querySelectorAll(".drawer").forEach(function (drawer) {
      drawer.classList.remove("active");
      drawer.style.display = "none";
    });
  }

  function escapeHtmlBanner(valor) {
    return String(valor || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttrBanner(valor) {
    return escapeHtmlBanner(valor);
  }

  window.editarBannerPublicidade = editarBannerPublicidade;
  window.excluirBannerPublicidade = excluirBannerPublicidade;
  window.alternarStatusBannerPublicidade = alternarStatusBannerPublicidade;
})();

