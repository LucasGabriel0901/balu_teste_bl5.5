// ==============================
// BALU FOOD - PLANOS
// Plano único com ciclos mensal, trimestral e anual
// ==============================

var BALU_CICLOS_PLANO = {
  mensal: {
    nome: "Mensal",
    valor: 250,
    recorrencia: "mensal",
    descricao: "R$ 250,00/mês no cartão de crédito"
  },
  trimestral: {
    nome: "Trimestral",
    valor: 675,
    recorrencia: "a cada 3 meses",
    descricao: "R$ 675,00/trimestre no cartão de crédito"
  },
  anual: {
    nome: "Anual",
    valor: 2500,
    recorrencia: "anual",
    descricao: "R$ 2.500,00/ano no cartão de crédito"
  }
};

document.addEventListener("DOMContentLoaded", function () {
  initPlanosBalu();
});

function initPlanosBalu() {
  document.querySelectorAll("[data-plano-acao]").forEach(function (button) {
    button.addEventListener("click", function () {
      abrirModalPlano(button.getAttribute("data-plano-acao"));
    });
  });

  var fecharTopo = document.getElementById("btnFecharPlanoModal");
  var fecharFooter = document.getElementById("btnFecharPlanoModalFooter");
  var overlay = document.getElementById("planoModalOverlay");

  [fecharTopo, fecharFooter, overlay].forEach(function (elemento) {
    if (elemento) {
      elemento.addEventListener("click", fecharModalPlano);
    }
  });

  if (typeof window.BALU_RENDER_ICONS === "function") {
    window.BALU_RENDER_ICONS();
  }
}

function abrirModalPlano(ciclo) {
  var modal = document.getElementById("planoModal");
  var overlay = document.getElementById("planoModalOverlay");
  var descricao = document.getElementById("planoModalDescricao");
  var dados = BALU_CICLOS_PLANO[ciclo] || BALU_CICLOS_PLANO.mensal;

  if (descricao) {
    descricao.textContent = "Você selecionou o ciclo " + dados.nome + " (" + dados.descricao + "). A cobrança real será criada no backend via Mercado Pago/assinaturas, sem expor tokens no front-end.";
  }

  if (modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  if (overlay) {
    overlay.classList.add("is-open");
  }

  if (typeof window.BALU_RENDER_ICONS === "function") {
    window.BALU_RENDER_ICONS();
  }
}

function fecharModalPlano() {
  var modal = document.getElementById("planoModal");
  var overlay = document.getElementById("planoModalOverlay");

  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (overlay) {
    overlay.classList.remove("is-open");
  }
}
