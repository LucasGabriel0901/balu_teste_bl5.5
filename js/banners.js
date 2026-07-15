// =====================================================
// BALU FOOD - BANNERS.JS
// Sistema global de propaganda / carrossel automático
// Banner fino estilo marketplace
// =====================================================

(function () {
  var BALU_BANNERS_KEY = "balu_publicidade_banners";
  var BALU_BANNER_INTERVALO = 5000;

  document.addEventListener("DOMContentLoaded", function () {
    baluInicializarBannersGlobais();
  });

  function baluInicializarBannersGlobais() {
    baluCriarBannersPadraoSeNaoExistir();

    var page = document.querySelector(".page");
    if (!page) return;

    var header = page.querySelector(".page-header");
    if (!header) return;

    var bannerExistente = document.getElementById("baluAdHero");
    if (bannerExistente) bannerExistente.remove();

    var paginaAtual = baluObterPaginaAtual();
    var banners = baluObterBannersAtivosPorPagina(paginaAtual, "hero");

    if (!banners.length) return;

    var hero = document.createElement("div");
    hero.id = "baluAdHero";
    hero.className = "balu-ad-hero";
    hero.innerHTML = baluMontarHtmlCarrossel(banners);

    header.insertAdjacentElement("afterend", hero);
    baluAtivarCarrossel(hero);
  }

  function baluObterPaginaAtual() {
    var arquivo = window.location.pathname.split("/").pop() || "dashboard.html";
    arquivo = arquivo.replace(".html", "");

    if (!arquivo || arquivo === "index") return "dashboard";
    return arquivo;
  }

  function baluCriarBannersPadraoSeNaoExistir() {
    var bannersExistentes = baluCarregarTodosBanners();
    if (bannersExistentes.length > 0) return;

    var bannersPadrao = [
      {
        id: "banner_demo_001",
        nome: "BALU Food - Gestão de estoque",
        tipoMidia: "arte",
        posicao: "hero",
        paginas: ["todas"],
        tag: "BALU FOOD",
        titulo: "Controle estoque, custos e lucro real",
        subtitulo: "Organize insumos, embalagens, compras e CMV em um sistema simples.",
        textoBotao: "",
        mediaUrl: "",
        linkUrl: "",
        abrirNovaAba: false,
        ordem: 1,
        ativo: true,
        dataInicio: "",
        dataFim: "",
        classeVisual: "balu-ad-gradient-1",
        visualizacoes: 0,
        cliques: 0
      },
      {
        id: "banner_demo_002",
        nome: "BALU Food - Embalagens",
        tipoMidia: "arte",
        posicao: "hero",
        paginas: ["dashboard", "cadastro-embalagens", "fichas-tecnicas"],
        tag: "CUSTO REAL",
        titulo: "Embalagem também entra no preço",
        subtitulo: "Cadastre marmitas, sacolas, potes e kits para precificar melhor.",
        textoBotao: "",
        mediaUrl: "",
        linkUrl: "",
        abrirNovaAba: false,
        ordem: 2,
        ativo: true,
        dataInicio: "",
        dataFim: "",
        classeVisual: "balu-ad-gradient-2",
        visualizacoes: 0,
        cliques: 0
      },
      {
        id: "banner_demo_003",
        nome: "BALU Food - Precificação",
        tipoMidia: "arte",
        posicao: "hero",
        paginas: ["dashboard", "cmv-real-mensal", "relatorios", "fichas-tecnicas"],
        tag: "PRECIFICAÇÃO",
        titulo: "Venda sabendo o lucro de verdade",
        subtitulo: "Use CMV, ficha técnica, custos e despesas para decidir preços.",
        textoBotao: "",
        mediaUrl: "",
        linkUrl: "",
        abrirNovaAba: false,
        ordem: 3,
        ativo: true,
        dataInicio: "",
        dataFim: "",
        classeVisual: "balu-ad-gradient-3",
        visualizacoes: 0,
        cliques: 0
      }
    ];

    baluSalvarTodosBanners(bannersPadrao);
  }

  function baluCarregarTodosBanners() {
    try {
      var texto = localStorage.getItem(BALU_BANNERS_KEY);
      var dados = texto ? JSON.parse(texto) : [];
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      console.error("Erro ao carregar banners:", erro);
      return [];
    }
  }

  function baluSalvarTodosBanners(banners) {
    try {
      localStorage.setItem(BALU_BANNERS_KEY, JSON.stringify(banners || []));
    } catch (erro) {
      console.error("Erro ao salvar banners:", erro);
    }
  }

  function baluObterBannersAtivosPorPagina(pagina, posicao) {
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return baluCarregarTodosBanners()
      .filter(function (banner) {
        if (!banner || banner.ativo !== true) return false;
        if ((banner.posicao || "hero") !== posicao) return false;

        var paginas = Array.isArray(banner.paginas) ? banner.paginas : [];
        var apareceNaPagina = paginas.indexOf("todas") >= 0 || paginas.indexOf(pagina) >= 0;

        if (!apareceNaPagina) return false;

        if (banner.dataInicio) {
          var inicio = new Date(banner.dataInicio + "T00:00:00");
          if (hoje < inicio) return false;
        }

        if (banner.dataFim) {
          var fim = new Date(banner.dataFim + "T23:59:59");
          if (hoje > fim) return false;
        }

        return true;
      })
      .sort(function (a, b) {
        return Number(a.ordem || 0) - Number(b.ordem || 0);
      });
  }

  function baluMontarHtmlCarrossel(banners) {
    var singleClass = banners.length <= 1 ? " single" : "";

    var slides = banners.map(function (banner, index) {
      return baluMontarHtmlSlide(banner, index);
    }).join("");

    var dots = banners.map(function (_, index) {
      return "<button type='button' class='balu-ad-dot" + (index === 0 ? " active" : "") + "' data-balu-ad-dot='" + index + "' aria-label='Ir para banner " + (index + 1) + "'></button>";
    }).join("");

    return "" +
      "<div class='balu-ad-carousel" + singleClass + "' data-balu-ad-carousel>" +
        "<div class='balu-ad-viewport'>" + slides + "</div>" +
        "<button type='button' class='balu-ad-arrow prev' data-balu-ad-prev aria-label='Banner anterior'>‹</button>" +
        "<button type='button' class='balu-ad-arrow next' data-balu-ad-next aria-label='Próximo banner'>›</button>" +
        "<div class='balu-ad-dots'>" + dots + "</div>" +
      "</div>";
  }

  function baluMontarHtmlSlide(banner, index) {
    var active = index === 0 ? " active" : "";
    var classeVisual = banner.classeVisual || "balu-ad-gradient-1";
    var media = baluMontarMidiaBanner(banner);
    var tag = banner.tag || "Publicidade";
    var titulo = banner.titulo || banner.nome || "";
    var subtitulo = banner.subtitulo || "";
    var botao = banner.textoBotao || "";
    var link = banner.linkUrl || "";
    var abrirNovaAba = banner.abrirNovaAba ? "true" : "false";
    var botaoHtml = "";

    if (botao) {
      botaoHtml = "<span class='balu-ad-button'>" + baluEscaparHtml(botao) + "</span>";
    }

    return "" +
      "<div class='balu-ad-slide " + classeVisual + active + "' data-balu-ad-slide='" + index + "' data-banner-id='" + baluEscaparAttr(banner.id || "") + "' data-banner-link='" + baluEscaparAttr(link) + "' data-banner-blank='" + abrirNovaAba + "' style='" + baluMontarEstiloSlide(banner) + "'>" +
        media +
        "<div class='balu-ad-content'>" +
          "<span class='balu-ad-tag'>" + baluEscaparHtml(tag) + "</span>" +
          "<h2 class='balu-ad-title'>" + baluEscaparHtml(titulo) + "</h2>" +
          "<p class='balu-ad-subtitle'>" + baluEscaparHtml(subtitulo) + "</p>" +
          botaoHtml +
        "</div>" +
      "</div>";
  }

  function baluMontarMidiaBanner(banner) {
    if (!banner.mediaUrl) return "";

    if (banner.tipoMidia === "video") {
      return "<div class='balu-ad-media'><video src='" + baluEscaparAttr(banner.mediaUrl) + "' autoplay muted loop playsinline></video></div>";
    }

    return "<div class='balu-ad-media'><img src='" + baluEscaparAttr(banner.mediaUrl) + "' alt='" + baluEscaparAttr(banner.nome || "Banner") + "'></div>";
  }

  function baluMontarEstiloSlide(banner) {
    if (banner.corFundo) return "background:" + banner.corFundo + ";";
    return "";
  }

  function baluAtivarCarrossel(hero) {
    var carousel = hero.querySelector("[data-balu-ad-carousel]");
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-balu-ad-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-balu-ad-dot]"));
    var btnPrev = hero.querySelector("[data-balu-ad-prev]");
    var btnNext = hero.querySelector("[data-balu-ad-next]");
    var indexAtual = 0;
    var timer = null;

    if (!carousel || !slides.length) return;

    baluRegistrarVisualizacao(slides[0].getAttribute("data-banner-id"));

    function irPara(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;

      slides.forEach(function (slide) { slide.classList.remove("active"); });
      dots.forEach(function (dot) { dot.classList.remove("active"); });

      slides[index].classList.add("active");
      if (dots[index]) dots[index].classList.add("active");

      indexAtual = index;
      baluRegistrarVisualizacao(slides[index].getAttribute("data-banner-id"));
    }

    function proximo() { irPara(indexAtual + 1); }
    function anterior() { irPara(indexAtual - 1); }

    function iniciarTimer() {
      pararTimer();
      if (slides.length <= 1) return;
      timer = setInterval(proximo, BALU_BANNER_INTERVALO);
    }

    function pararTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        proximo();
        iniciarTimer();
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        anterior();
        iniciarTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        irPara(Number(dot.getAttribute("data-balu-ad-dot")));
        iniciarTimer();
      });
    });

    slides.forEach(function (slide) {
      slide.addEventListener("click", function () {
        var link = slide.getAttribute("data-banner-link");
        var abrirNovaAba = slide.getAttribute("data-banner-blank") === "true";
        var id = slide.getAttribute("data-banner-id");

        if (!link) return;

        baluRegistrarClique(id);

        if (abrirNovaAba) {
          window.open(link, "_blank");
        } else {
          window.location.href = link;
        }
      });
    });

    carousel.addEventListener("mouseenter", pararTimer);
    carousel.addEventListener("mouseleave", iniciarTimer);

    iniciarTimer();
  }

  function baluRegistrarVisualizacao(id) {
    if (!id) return;

    var banners = baluCarregarTodosBanners();

    banners = banners.map(function (banner) {
      if (banner.id === id) {
        banner.visualizacoes = Number(banner.visualizacoes || 0) + 1;
      }

      return banner;
    });

    baluSalvarTodosBanners(banners);
  }

  function baluRegistrarClique(id) {
    if (!id) return;

    var banners = baluCarregarTodosBanners();

    banners = banners.map(function (banner) {
      if (banner.id === id) {
        banner.cliques = Number(banner.cliques || 0) + 1;
      }

      return banner;
    });

    baluSalvarTodosBanners(banners);
  }

  function baluEscaparHtml(valor) {
    return String(valor || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function baluEscaparAttr(valor) {
    return baluEscaparHtml(valor);
  }

  window.BALU_BANNERS = {
    key: BALU_BANNERS_KEY,
    listar: baluCarregarTodosBanners,
    salvar: baluSalvarTodosBanners,
    atualizar: baluInicializarBannersGlobais,
    paginaAtual: baluObterPaginaAtual
  };
})();


