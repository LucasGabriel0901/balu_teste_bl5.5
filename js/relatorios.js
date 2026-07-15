// ==============================
// BALU FOOD - RELATÓRIOS
// Resumo operacional, estoque, compras, CMV e fichas técnicas
// ==============================

var BALU_RELATORIOS_EXPORT_NAME = "balu-relatorios.csv";

document.addEventListener("DOMContentLoaded", function () {
initRelatorios();
});

function initRelatorios() {
initEventosRelatorios();
renderRelatorios();
criarIconesRelatorios();

console.log("BALU Relatórios carregado.");
}

function initEventosRelatorios() {
var btnAtualizar = document.getElementById("btnAtualizarRelatorios");
var btnExportar = document.getElementById("btnExportarRelatorios");
var periodo = document.getElementById("relatorioPeriodo");

if (btnAtualizar) {
btnAtualizar.addEventListener("click", function () {
renderRelatorios();
mensagemRelatorios("Relatórios atualizados.", "success");
});
}

if (btnExportar) {
btnExportar.addEventListener("click", function () {
exportarRelatorios();
});
}

if (periodo) {
periodo.addEventListener("change", function () {
renderRelatorios();
});
}
}

function renderRelatorios() {
var dados = carregarDadosRelatorios();
var resumo = calcularResumoRelatorios(dados);

renderCardsPrincipaisRelatorios(resumo);
renderVisaoGeralRelatorios(resumo);
renderIndicadoresRelatorios(resumo);
renderAtencoesRelatorios(resumo);
renderComprasRelatorios(resumo.comprasFiltradas);
renderVendasProducaoRelatorios(resumo.vendasProducaoFiltradas);
renderEstoqueRelatorios(resumo.itensEstoque);
renderFichasAtencaoRelatorios(resumo.fichasAtencao);

setTextRelatorio("relatorioUltimaAtualizacao", formatarDataHoraRelatorio(new Date()));

criarIconesRelatorios();
}

function carregarDadosRelatorios() {
return {
configuracoes: carregarObjetoRelatorio([
"balu_configuracoes_empresa"
]),


insumos: carregarListaRelatorio([
  "balu_insumos",
  "insumos"
]),

embalagens: carregarListaRelatorio([
  "balu_embalagens",
  "embalagens"
]),

funcionarios: carregarListaRelatorio([
  "balu_funcionarios",
  "funcionarios"
]),

compras: carregarListaRelatorio([
  "balu_compras_realizadas",
  "balu_compras",
  "compras"
]),

vendasProducao: carregarListaRelatorio([
  "balu_vendas_producao",
  "balu_vendas_manuais",
  "vendasProducao"
]),

inventarios: carregarListaRelatorio([
  "balu_inventarios",
  "inventarios"
]),

cmv: carregarListaRelatorio([
  "balu_cmv_mensal",
  "balu_cmv",
  "cmv",
  "cmv_mensal"
]),

fichas: carregarListaRelatorio([
  "balu_fichas_tecnicas",
  "balu_fichas_tecnicas_v2",
  "fichas_tecnicas"
]),

fornecedores: carregarListaRelatorio([
  "balu_fornecedores",
  "fornecedores"
]),

faturamento: carregarListaRelatorio([
  "balu_faturamento",
  "faturamento"
]),

faturamentoMensalValor: carregarValorRelatorio([
  "balu_faturamento_mensal",
  "faturamentoMensal"
]),

precificacoes: carregarListaRelatorio([
  "balu_precificacoes",
  "precificacoes"
]),

produtos: carregarListaRelatorio([
  "balu_produtos",
  "produtos"
]),

producaoPlanejada: carregarListaRelatorio([
  "balu_producao_planejada",
  "producao_planejada"
]),

custosOperacionais: carregarListaRelatorio([
  "balu_custos_operacionais",
  "custos_operacionais"
])


};
}

function calcularResumoRelatorios(dados) {
var periodo = getValueRelatorio("relatorioPeriodo") || "mes_atual";
var cmvIdeal = numeroRelatorio(dados.configuracoes.cmvIdeal || 30);

var comprasFiltradas = filtrarListaPorPeriodoRelatorio(dados.compras, periodo, function (compra) {
return compra.data || compra.dataCompra || compra.competencia || compra.criadoEm || compra.createdAt;
});

var vendasProducaoFiltradas = filtrarListaPorPeriodoRelatorio(dados.vendasProducao, periodo, function (registro) {
return registro.data || registro.dataVenda || registro.competencia || registro.criadoEm || registro.createdAt;
});

var faturamentoFiltrado = filtrarListaPorPeriodoRelatorio(dados.faturamento, periodo, function (registro) {
return registro.data || registro.competencia || registro.criadoEm || registro.createdAt;
});

var producaoPlanejadaFiltrada = filtrarListaPorPeriodoRelatorio(dados.producaoPlanejada, periodo, function (registro) {
return registro.data || registro.competencia || registro.criadoEm || registro.createdAt;
});

var custosFiltrados = filtrarListaPorPeriodoRelatorio(dados.custosOperacionais, periodo, function (registro) {
return registro.data || registro.competencia || registro.criadoEm || registro.createdAt;
});

var totalCompras = somarListaRelatorio(comprasFiltradas, function (compra) {
return obterTotalCompraRelatorio(compra);
});

var vendasProducaoConfirmadas = vendasProducaoFiltradas.filter(function (registro) {
return String(registro.status || "").toLowerCase() === "confirmada";
});

var quantidadeVendasProducao = somarListaRelatorio(vendasProducaoConfirmadas, function (registro) {
return registro.quantidade || registro.qtd || 0;
});

var custoVendasProducao = somarListaRelatorio(vendasProducaoConfirmadas, function (registro) {
return registro.custoEstoqueBaixado || registro.custoEstimado || registro.custoTotal || 0;
});

var faturamentoConfirmado = faturamentoFiltrado.filter(function (registro) {
var status = String(registro.status || "Confirmado").toLowerCase();
return status.indexOf("confirm") >= 0 || status.indexOf("receb") >= 0 || status.indexOf("pago") >= 0;
});

var totalFaturamento = somarListaRelatorio(faturamentoConfirmado, function (registro) {
return registro.valor || registro.total || registro.faturamento || 0;
});

var custosConfirmados = custosFiltrados.filter(function (registro) {
return String(registro.status || "Confirmado").toLowerCase().indexOf("confirm") >= 0;
});

var totalCustosOperacionais = somarListaRelatorio(custosConfirmados, function (registro) {
return registro.valor || registro.total || 0;
});

if (totalFaturamento <= 0) {
totalFaturamento = numeroRelatorio(dados.faturamentoMensalValor);
}

var percentualCustosOperacionais = totalFaturamento > 0 ? totalCustosOperacionais / totalFaturamento * 100 : 0;

var comprasPendentes = comprasFiltradas.filter(function (compra) {
var status = String(compra.status || compra.situacao || "").toLowerCase();


return status &&
  status.indexOf("confirm") < 0 &&
  status.indexOf("pago") < 0 &&
  status.indexOf("finaliz") < 0;


}).length;

var resumoInsumos = resumirEstoqueRelatorio(dados.insumos, "Insumo");
var resumoEmbalagens = resumirEstoqueRelatorio(dados.embalagens, "Embalagem");

var valorEstoque = resumoInsumos.valorEstoque + resumoEmbalagens.valorEstoque;
var itensEstoqueAtencao = resumoInsumos.itensAtencao.concat(resumoEmbalagens.itensAtencao);
var itensEstoque = resumoInsumos.itensEstoque.concat(resumoEmbalagens.itensEstoque);

var custoMaoObra = somarListaRelatorio(dados.funcionarios, function (funcionario) {
return numeroRelatorio(
funcionario.custoMensal ||
funcionario.custoTotal ||
funcionario.salario ||
funcionario.valorMensal ||
funcionario.remuneracao
);
});

var ultimoInventario = obterUltimoRegistroRelatorio(dados.inventarios, function (inventario) {
return inventario.data || inventario.dataInventario || inventario.competencia || inventario.criadoEm || inventario.createdAt;
});

var ultimoCmv = obterUltimoRegistroRelatorio(dados.cmv, function (item) {
return item.data || item.dataFechamento || item.competencia || item.criadoEm || item.createdAt;
});

var cmvPercentual = obterPercentualCmvRelatorio(ultimoCmv);
var cmvRealValor = ultimoCmv ? numeroRelatorio(
ultimoCmv.cmvReal ||
ultimoCmv.cmvValor ||
ultimoCmv.valorCmv ||
ultimoCmv.custoMercadoriaVendida
) : 0;

var fichasAtivas = dados.fichas.filter(function (ficha) {
return String(ficha.status || "").toLowerCase() !== "inativa";
});

var custoMedioFicha = 0;

if (fichasAtivas.length > 0) {
custoMedioFicha = somarListaRelatorio(fichasAtivas, function (ficha) {
return numeroRelatorio(ficha.custoPorPorcao || ficha.custoPorcao || ficha.custoUnitario);
}) / fichasAtivas.length;
}

var fichasAtencao = fichasAtivas.filter(function (ficha) {
var statusFinanceiro = String(ficha.statusFinanceiro || "").toLowerCase();
var cmv = numeroRelatorio(ficha.cmvAtual || ficha.cmv || ficha.cmvPercentual);
var margem = numeroRelatorio(ficha.margemContribuicao || ficha.margem || ficha.margemBruta);


return (
  statusFinanceiro.indexOf("aten") >= 0 ||
  statusFinanceiro.indexOf("preju") >= 0 ||
  cmv > 45 ||
  margem > 0 && margem < 20
);


});

var cmvAlto = cmvPercentual > cmvIdeal && cmvPercentual > 0;
var pontosAtencao = 0;

pontosAtencao = pontosAtencao + itensEstoqueAtencao.length;
pontosAtencao = pontosAtencao + comprasPendentes;
pontosAtencao = pontosAtencao + fichasAtencao.length;

if (cmvAlto) {
pontosAtencao = pontosAtencao + 1;
}

var saudeOperacional = classificarSaudeRelatorio(cmvPercentual, cmvIdeal, itensEstoqueAtencao.length, fichasAtencao.length);

return {
periodo: periodo,
cmvIdeal: cmvIdeal,


insumos: dados.insumos,
embalagens: dados.embalagens,
funcionarios: dados.funcionarios,
compras: dados.compras,
comprasFiltradas: comprasFiltradas,
vendasProducao: dados.vendasProducao,
vendasProducaoFiltradas: vendasProducaoFiltradas,
inventarios: dados.inventarios,
cmv: dados.cmv,
fichas: dados.fichas,
fornecedores: dados.fornecedores,
faturamento: dados.faturamento,
custosOperacionais: dados.custosOperacionais,
precificacoes: dados.precificacoes,
produtos: dados.produtos,
producaoPlanejada: dados.producaoPlanejada,

totalCompras: totalCompras,
qtdCompras: comprasFiltradas.length,
comprasPendentes: comprasPendentes,

totalVendasProducao: vendasProducaoFiltradas.length,
vendasProducaoConfirmadas: vendasProducaoConfirmadas.length,
quantidadeVendasProducao: quantidadeVendasProducao,
custoVendasProducao: custoVendasProducao,

totalFaturamento: totalFaturamento,
qtdFaturamento: faturamentoFiltrado.length,
totalCustosOperacionais: totalCustosOperacionais,
qtdCustosOperacionais: custosFiltrados.length,
percentualCustosOperacionais: percentualCustosOperacionais,

totalInsumos: dados.insumos.length,
valorInsumos: resumoInsumos.valorEstoque,

totalEmbalagens: dados.embalagens.length,
valorEmbalagens: resumoEmbalagens.valorEstoque,

valorEstoque: valorEstoque,
estoqueBaixo: itensEstoqueAtencao.length,
itensEstoqueAtencao: itensEstoqueAtencao,
itensEstoque: itensEstoque,

totalFuncionarios: dados.funcionarios.length,
custoMaoObra: custoMaoObra,
totalFornecedores: dados.fornecedores.length,

totalInventarios: dados.inventarios.length,
ultimoInventario: ultimoInventario,

ultimoCmv: ultimoCmv,
cmvPercentual: cmvPercentual,
cmvRealValor: cmvRealValor,
cmvAlto: cmvAlto,

totalFichas: dados.fichas.length,
custoMedioFicha: custoMedioFicha,
fichasAtencao: fichasAtencao,
totalProdutos: dados.produtos.length,
produtosAtivos: dados.produtos.filter(function (produto) {
  return String(produto.status || "Ativo").toLowerCase() !== "inativo";
}).length,
totalPrecificacoes: dados.precificacoes.length,
totalProducaoPlanejada: producaoPlanejadaFiltrada.length,
producaoPlanejadaAberta: producaoPlanejadaFiltrada.filter(function (registro) {
  var status = String(registro.status || "").toLowerCase();
  return status.indexOf("cancel") < 0 && status.indexOf("conclu") < 0;
}).length,

pontosAtencao: pontosAtencao,
saudeOperacional: saudeOperacional


};
}

function renderCardsPrincipaisRelatorios(resumo) {
setTextRelatorio("relatorioTotalCompras", moedaRelatorio(resumo.totalCompras));
setTextRelatorio("relatorioQtdCompras", resumo.qtdCompras + " compras registradas.");
setTextRelatorio("relatorioValorEstoque", moedaRelatorio(resumo.valorEstoque));
setTextRelatorio("relatorioCmvReal", percentualRelatorio(resumo.cmvPercentual));

if (resumo.cmvPercentual > 0) {
if (resumo.cmvAlto) {
setTextRelatorio("relatorioCmvStatus", "Acima do ideal de " + percentualRelatorio(resumo.cmvIdeal) + ".");
} else {
setTextRelatorio("relatorioCmvStatus", "Dentro do ideal configurado.");
}
} else {
setTextRelatorio("relatorioCmvStatus", "Sem fechamento no período.");
}

setTextRelatorio("relatorioPontosAtencao", resumo.pontosAtencao);
}

function renderVisaoGeralRelatorios(resumo) {
setTextRelatorio("relatorioTotalInsumos", resumo.totalInsumos);
setTextRelatorio("relatorioInsumosValor", moedaRelatorio(resumo.valorInsumos) + " em estoque.");

setTextRelatorio("relatorioTotalEmbalagens", resumo.totalEmbalagens);
setTextRelatorio("relatorioEmbalagensValor", moedaRelatorio(resumo.valorEmbalagens) + " em estoque.");

setTextRelatorio("relatorioTotalFuncionarios", resumo.totalFuncionarios);
setTextRelatorio("relatorioCustoMaoObra", moedaRelatorio(resumo.custoMaoObra) + " de custo estimado.");

setTextRelatorio("relatorioTotalInventarios", resumo.totalInventarios);

if (resumo.ultimoInventario) {
var dataInventario =
resumo.ultimoInventario.data ||
resumo.ultimoInventario.dataInventario ||
resumo.ultimoInventario.competencia ||
resumo.ultimoInventario.criadoEm ||
resumo.ultimoInventario.createdAt ||
"";


setTextRelatorio("relatorioUltimoInventario", "Último: " + formatarDataTextoRelatorio(dataInventario));


} else {
setTextRelatorio("relatorioUltimoInventario", "Nenhum inventário encontrado.");
}

setTextRelatorio("relatorioTotalFichas", resumo.totalFichas);
setTextRelatorio("relatorioFichasMedia", "Custo médio " + moedaRelatorio(resumo.custoMedioFicha) + ".");

setTextRelatorio("relatorioTotalVendasProducao", resumo.totalVendasProducao);
setTextRelatorio(
"relatorioVendasProducaoResumo",
resumo.vendasProducaoConfirmadas + " confirmada(s), " +
numeroFormatoRelatorio(resumo.quantidadeVendasProducao) + " unidade(s), " +
moedaRelatorio(resumo.custoVendasProducao) + "."
);

setTextRelatorio("relatorioSaudeOperacional", resumo.saudeOperacional);
setTextRelatorio("relatorioFaturamentoTotal", moedaRelatorio(resumo.totalFaturamento));
setTextRelatorio("relatorioFaturamentoResumo", resumo.qtdFaturamento + " lançamento(s) no período.");
setTextRelatorio("relatorioCustosOperacionaisTotal", moedaRelatorio(resumo.totalCustosOperacionais));
setTextRelatorio("relatorioCustosOperacionaisResumo", percentualRelatorio(resumo.percentualCustosOperacionais) + " do faturamento.");
setTextRelatorio("relatorioTotalFornecedores", resumo.totalFornecedores);
setTextRelatorio("relatorioFornecedoresResumo", resumo.totalFornecedores + " fornecedor(es) cadastrado(s).");
setTextRelatorio("relatorioTotalProdutos", resumo.totalProdutos);
setTextRelatorio("relatorioProdutosResumo", resumo.produtosAtivos + " produto(s) ativo(s).");
setTextRelatorio("relatorioTotalCmv", resumo.cmv.length);
setTextRelatorio("relatorioCmvResumo", resumo.ultimoCmv ? "Último: " + formatarDataTextoRelatorio(resumo.ultimoCmv.competencia || resumo.ultimoCmv.dataFechamento || resumo.ultimoCmv.criadoEm) : "Nenhum fechamento encontrado.");
setTextRelatorio("relatorioTotalProducaoPlanejada", resumo.totalProducaoPlanejada);
setTextRelatorio("relatorioProducaoPlanejadaResumo", resumo.producaoPlanejadaAberta + " registro(s) em aberto.");
}

function renderIndicadoresRelatorios(resumo) {
setTextRelatorio("relatorioEstoqueBaixo", resumo.estoqueBaixo + " itens");
setTextRelatorio("relatorioComprasPendentes", resumo.comprasPendentes);
setTextRelatorio("relatorioCmvAlto", resumo.cmvAlto ? "Sim" : "Não");
setTextRelatorio("relatorioFichasAtencao", resumo.fichasAtencao.length);
}

function renderAtencoesRelatorios(resumo) {
var container = document.getElementById("relatorioListaAtencoes");

if (!container) {
return;
}

var alertas = [];

if (resumo.cmvAlto) {
alertas.push({
tipo: "danger",
titulo: "CMV acima do ideal",
texto: "O CMV real está em " + percentualRelatorio(resumo.cmvPercentual) + ", acima da meta de " + percentualRelatorio(resumo.cmvIdeal) + "."
});
}

if (resumo.estoqueBaixo > 0) {
alertas.push({
tipo: "warning",
titulo: "Itens com estoque em atenção",
texto: resumo.estoqueBaixo + " item(ns) estão com estoque baixo, crítico ou sem valor definido."
});
}

if (resumo.comprasPendentes > 0) {
alertas.push({
tipo: "warning",
titulo: "Compras pendentes",
texto: resumo.comprasPendentes + " compra(s) ainda não foram confirmadas/finalizadas."
});
}

if (resumo.fichasAtencao.length > 0) {
alertas.push({
tipo: "danger",
titulo: "Fichas técnicas com margem baixa",
texto: resumo.fichasAtencao.length + " receita(s) precisam de revisão de preço ou custo."
});
}

if (alertas.length === 0) {
container.innerHTML =
"<div class='attention-item'>" +
"<div class='attention-icon info'>" +
"<i data-lucide='check-circle'></i>" +
"</div>" +
"<div>" +
"<strong>Sem alertas no momento</strong>" +
"<span>Cadastre mais dados para gerar análises mais completas.</span>" +
"</div>" +
"</div>";


return;


}

container.innerHTML = alertas.map(function (alerta) {
return (
"<div class='attention-item'>" +
"<div class='attention-icon " + alerta.tipo + "'>" +
"<i data-lucide='" + getIconeAtencaoRelatorio(alerta.tipo) + "'></i>" +
"</div>" +
"<div>" +
"<strong>" + textoSeguroRelatorio(alerta.titulo) + "</strong>" +
"<span>" + textoSeguroRelatorio(alerta.texto) + "</span>" +
"</div>" +
"</div>"
);
}).join("");
}

function renderComprasRelatorios(compras) {
var table = document.getElementById("relatorioComprasTable");

if (!table) {
return;
}

if (!compras.length) {
table.innerHTML =
"<tr>" +
"<td colspan='5' class='text-muted'>Nenhuma compra encontrada.</td>" +
"</tr>";


return;


}

var comprasOrdenadas = compras.slice().sort(function (a, b) {
return dataTimestampRelatorio(b.data || b.dataCompra || b.competencia || b.criadoEm || b.createdAt) -
dataTimestampRelatorio(a.data || a.dataCompra || a.competencia || a.criadoEm || a.createdAt);
}).slice(0, 8);

table.innerHTML = comprasOrdenadas.map(function (compra) {
return (
"<tr>" +
"<td>" + textoSeguroRelatorio(formatarDataTextoRelatorio(compra.data || compra.dataCompra || compra.competencia || compra.criadoEm || compra.createdAt)) + "</td>" +
"<td>" + textoSeguroRelatorio(compra.fornecedor || compra.nomeFornecedor || compra.responsavel || "-") + "</td>" +
"<td>" + textoSeguroRelatorio(compra.categoria || compra.tipo || compra.tipoCompra || "-") + "</td>" +
"<td>" + badgeStatusRelatorio(compra.status || compra.situacao || "Sem status") + "</td>" +
"<td><strong>" + moedaRelatorio(obterTotalCompraRelatorio(compra)) + "</strong></td>" +
"</tr>"
);
}).join("");
}

function renderVendasProducaoRelatorios(registros) {
var table = document.getElementById("relatorioVendasProducaoTable");

if (!table) {
return;
}

if (!registros.length) {
table.innerHTML =
"<tr>" +
"<td colspan='6' class='text-muted'>Nenhuma venda ou produção encontrada.</td>" +
"</tr>";
return;
}

var registrosOrdenados = registros.slice().sort(function (a, b) {
return dataTimestampRelatorio(b.data || b.dataVenda || b.competencia || b.criadoEm || b.createdAt) -
dataTimestampRelatorio(a.data || a.dataVenda || a.competencia || a.criadoEm || a.createdAt);
}).slice(0, 10);

table.innerHTML = registrosOrdenados.map(function (registro) {
return (
"<tr>" +
"<td>" + textoSeguroRelatorio(formatarDataTextoRelatorio(registro.data || registro.dataVenda || registro.competencia || registro.criadoEm || registro.createdAt)) + "</td>" +
"<td><strong>" + textoSeguroRelatorio(registro.fichaNome || registro.produto || registro.nomeProduto || "-") + "</strong></td>" +
"<td>" + numeroFormatoRelatorio(registro.quantidade || registro.qtd || 0) + "</td>" +
"<td>" + textoSeguroRelatorio(registro.canal || "-") + "</td>" +
"<td>" + badgeStatusRelatorio(registro.status || "Sem status") + "</td>" +
"<td><strong>" + moedaRelatorio(registro.custoEstoqueBaixado || registro.custoEstimado || registro.custoTotal || 0) + "</strong></td>" +
"</tr>"
);
}).join("");
}

function renderEstoqueRelatorios(itens) {
var table = document.getElementById("relatorioEstoqueTable");

if (!table) {
return;
}

if (!itens.length) {
table.innerHTML =
"<tr>" +
"<td colspan='6' class='text-muted'>Nenhum item de estoque encontrado.</td>" +
"</tr>";


return;


}

table.innerHTML = itens.slice(0, 10).map(function (item) {
return (
"<tr>" +
"<td><strong>" + textoSeguroRelatorio(item.nome || "-") + "</strong></td>" +
"<td>" + textoSeguroRelatorio(item.tipo || "-") + "</td>" +
"<td>" + numeroFormatoRelatorio(item.estoqueAtual) + " " + textoSeguroRelatorio(item.unidade || "") + "</td>" +
"<td>" + numeroFormatoRelatorio(item.estoqueMinimo) + " " + textoSeguroRelatorio(item.unidade || "") + "</td>" +
"<td>" + moedaRelatorio(item.valorEstoque) + "</td>" +
"<td>" + badgeStatusRelatorio(item.status || "Atenção") + "</td>" +
"</tr>"
);
}).join("");
}

function renderFichasAtencaoRelatorios(fichas) {
var table = document.getElementById("relatorioFichasTable");

if (!table) {
return;
}

if (!fichas.length) {
table.innerHTML =
"<tr>" +
"<td colspan='7' class='text-muted'>Nenhuma ficha técnica em atenção.</td>" +
"</tr>";


return;


}

table.innerHTML = fichas.slice(0, 10).map(function (ficha) {
return (
"<tr>" +
"<td><strong>" + textoSeguroRelatorio(ficha.nome || "-") + "</strong></td>" +
"<td>" + textoSeguroRelatorio(ficha.categoria || "-") + "</td>" +
"<td>" + moedaRelatorio(ficha.custoPorPorcao || ficha.custoPorcao || ficha.custoUnitario) + "</td>" +
"<td>" + moedaRelatorio(ficha.precoVenda || ficha.preco || ficha.valorVenda) + "</td>" +
"<td>" + percentualRelatorio(ficha.cmvAtual || ficha.cmv || ficha.cmvPercentual) + "</td>" +
"<td>" + percentualRelatorio(ficha.margemContribuicao || ficha.margem || ficha.margemBruta) + "</td>" +
"<td>" + badgeStatusRelatorio(ficha.statusFinanceiro || "Atenção") + "</td>" +
"</tr>"
);
}).join("");
}

function resumirEstoqueRelatorio(lista, tipo) {
var valorEstoque = 0;
var itensAtencao = [];
var itensEstoque = [];

lista.forEach(function (item) {
var nome = obterNomeItemRelatorio(item);
var estoqueAtual = numeroRelatorio(item.estoqueAtual || item.quantidadeEstoque || item.quantidade || item.qtdAtual);
var estoqueMinimo = numeroRelatorio(item.estoqueMinimo || item.minimo || item.qtdMinima);
var estoqueIdeal = numeroRelatorio(item.estoqueIdeal || item.ideal || item.qtdIdeal);
var valorItem = obterValorEstoqueRelatorio(item, tipo);
var status = item.statusEstoque || item.status || "";
var unidade = obterUnidadeEstoqueRelatorio(item, tipo);


valorEstoque = valorEstoque + valorItem;

var statusLower = String(status).toLowerCase();

var emAtencao =
  estoqueAtual <= 0 ||
  estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo ||
  statusLower.indexOf("baixo") >= 0 ||
  statusLower.indexOf("crítico") >= 0 ||
  statusLower.indexOf("critico") >= 0;

if (emAtencao) {
  itensAtencao.push({
    nome: nome,
    tipo: tipo,
    estoqueAtual: estoqueAtual,
    estoqueMinimo: estoqueMinimo,
    estoqueIdeal: estoqueIdeal,
    valorEstoque: valorItem,
    status: status || classificarEstoqueRelatorio(estoqueAtual, estoqueMinimo, estoqueIdeal)
  });
}

itensEstoque.push({
  nome: nome,
  tipo: tipo,
  unidade: unidade,
  estoqueAtual: estoqueAtual,
  estoqueMinimo: estoqueMinimo,
  estoqueIdeal: estoqueIdeal,
  valorEstoque: valorItem,
  status: status || classificarEstoqueRelatorio(estoqueAtual, estoqueMinimo, estoqueIdeal)
});


});

return {
valorEstoque: valorEstoque,
itensAtencao: itensAtencao,
itensEstoque: itensEstoque
};
}

function classificarEstoqueRelatorio(estoqueAtual, estoqueMinimo, estoqueIdeal) {
if (estoqueAtual <= 0) {
return "Crítico";
}

if (estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo) {
return "Estoque baixo";
}

if (estoqueIdeal > 0 && estoqueAtual >= estoqueIdeal) {
return "Estoque ideal";
}

return "Estoque ok";
}

function obterNomeItemRelatorio(item) {
return (
item.nome ||
item.nomeInsumo ||
item.nomeEmbalagem ||
item.descricao ||
item.item ||
item.produto ||
"-"
);
}

function obterValorEstoqueRelatorio(item, tipo) {
var valorDireto = numeroRelatorio(
item.valorEstoque ||
item.valorEstoqueAtual ||
item.valorTotalEstoque ||
item.totalEstoque
);

if (valorDireto > 0) {
return valorDireto;
}

var estoqueAtual = numeroRelatorio(item.estoqueAtual || item.quantidadeEstoque || item.quantidade || item.qtdAtual);
var tipoNormalizado = String(tipo || "").toLowerCase();

if (tipoNormalizado.indexOf("insumo") >= 0) {
var unidade = obterUnidadeEstoqueRelatorio(item, tipo);
var precoMedioKg = numeroRelatorio(item.precoMedioKg);
var custoUnitario = numeroRelatorio(item.custoUnitario || item.precoUnitario);
var precoMedio = numeroRelatorio(item.precoMedio || item.valorUnitario);

if (unidade === "g" && precoMedioKg > 0) {
  return (estoqueAtual / 1000) * precoMedioKg;
}

if (unidade === "kg" && precoMedioKg > 0) {
  return estoqueAtual * precoMedioKg;
}

return estoqueAtual * (custoUnitario || precoMedio || precoMedioKg);
}

var precoUnitario = numeroRelatorio(item.precoUnitario);
var precoMedioPacote = numeroRelatorio(item.precoMedioPacote);
var quantidadePacote = numeroRelatorio(item.quantidadePacote);

if (precoUnitario <= 0 && quantidadePacote > 0 && precoMedioPacote > 0) {
precoUnitario = precoMedioPacote / quantidadePacote;
}

return estoqueAtual * precoUnitario;
}

function obterUnidadeEstoqueRelatorio(item, tipo) {
var unidade = tipo === "Insumo"
? item.unidadeConsumo || item.unidadeCompra || item.unidade || "unidade"
: item.unidade || "unidade";

var texto = String(unidade || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();

if (["g", "gr", "grama", "gramas"].indexOf(texto) >= 0) {
return "g";
}

if (["kg", "quilo", "quilos", "quilograma", "quilogramas", "kilograma", "kilogramas"].indexOf(texto) >= 0) {
return "kg";
}

if (["ml", "mililitro", "mililitros"].indexOf(texto) >= 0) {
return "ml";
}

if (["l", "lt", "litro", "litros"].indexOf(texto) >= 0) {
return "litro";
}

if (["un", "und", "unid", "unidade", "unidades"].indexOf(texto) >= 0) {
return "unidade";
}

return texto || "unidade";
}

function obterTotalCompraRelatorio(compra) {
var totalDireto = numeroRelatorio(
compra.total ||
compra.valorTotal ||
compra.compraTotal ||
compra.totalCompra ||
compra.valorFinal
);

if (totalDireto > 0) {
return totalDireto;
}

if (Array.isArray(compra.itens)) {
return somarListaRelatorio(compra.itens, function (item) {
var totalItem = numeroRelatorio(item.total || item.valorTotal || item.subtotal);


  if (totalItem > 0) {
    return totalItem;
  }

  var quantidade = numeroRelatorio(item.quantidade || item.qtd);
  var valorUnitario = numeroRelatorio(item.valorUnitario || item.precoUnitario || item.custoUnitario);

  return quantidade * valorUnitario;
});


}

return 0;
}

function obterPercentualCmvRelatorio(cmv) {
if (!cmv) {
return 0;
}

return numeroRelatorio(
cmv.cmvPercentual ||
cmv.cmvPercent ||
cmv.percentualCmv ||
cmv.cmvAtual ||
cmv.percentual ||
cmv.cmv
);
}

function obterUltimoRegistroRelatorio(lista, getDataFn) {
if (!Array.isArray(lista) || lista.length === 0) {
return null;
}

return lista.slice().sort(function (a, b) {
return dataTimestampRelatorio(getDataFn(b)) - dataTimestampRelatorio(getDataFn(a));
})[0];
}

function filtrarListaPorPeriodoRelatorio(lista, periodo, getDataFn) {
if (periodo === "todos") {
return lista.slice();
}

var agora = new Date();

return lista.filter(function (item) {
var valorData = getDataFn(item);


if (!valorData) {
  return true;
}

var data = converterDataRelatorio(valorData);

if (!data) {
  return true;
}

if (periodo === "ultimos_30") {
  var limite = new Date();
  limite.setDate(limite.getDate() - 30);

  return data >= limite;
}

if (periodo === "mes_atual") {
  return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
}

return true;


});
}

function classificarSaudeRelatorio(cmvPercentual, cmvIdeal, estoqueBaixo, fichasAtencao) {
if (cmvPercentual <= 0 && estoqueBaixo === 0 && fichasAtencao === 0) {
return "Sem dados";
}

if (cmvPercentual > cmvIdeal + 10 || estoqueBaixo >= 5 || fichasAtencao >= 5) {
return "Crítica";
}

if (cmvPercentual > cmvIdeal || estoqueBaixo > 0 || fichasAtencao > 0) {
return "Atenção";
}

return "Saudável";
}

function exportarRelatorios() {
var dados = carregarDadosRelatorios();
var resumo = calcularResumoRelatorios(dados);

var linhas = [];

linhas.push("Indicador;Valor");
linhas.push("Compras no periodo;" + numeroExportRelatorio(resumo.totalCompras));
linhas.push("Quantidade de compras;" + resumo.qtdCompras);
linhas.push("Valor em estoque;" + numeroExportRelatorio(resumo.valorEstoque));
linhas.push("CMV real;" + numeroExportRelatorio(resumo.cmvPercentual));
linhas.push("Pontos de atencao;" + resumo.pontosAtencao);
linhas.push("Insumos cadastrados;" + resumo.totalInsumos);
linhas.push("Embalagens cadastradas;" + resumo.totalEmbalagens);
linhas.push("Funcionarios;" + resumo.totalFuncionarios);
linhas.push("Fornecedores;" + resumo.totalFornecedores);
linhas.push("Inventarios;" + resumo.totalInventarios);
linhas.push("Fechamentos CMV;" + resumo.cmv.length);
linhas.push("Fichas tecnicas;" + resumo.totalFichas);
linhas.push("Faturamento;" + numeroExportRelatorio(resumo.totalFaturamento));
linhas.push("Produtos;" + resumo.totalProdutos);
linhas.push("Precificacoes;" + resumo.totalPrecificacoes);
linhas.push("Producao planejada;" + resumo.totalProducaoPlanejada);
linhas.push("Vendas/Producao;" + resumo.totalVendasProducao);
linhas.push("Vendas/Producao confirmadas;" + resumo.vendasProducaoConfirmadas);
linhas.push("Quantidade vendas/producao;" + numeroExportRelatorio(resumo.quantidadeVendasProducao));
linhas.push("Custo vendas/producao;" + numeroExportRelatorio(resumo.custoVendasProducao));
linhas.push("Saude operacional;" + resumo.saudeOperacional);

var blob = new Blob([linhas.join("\n")], {
type: "text/csv;charset=utf-8;"
});

var url = URL.createObjectURL(blob);
var link = document.createElement("a");

link.href = url;
link.download = BALU_RELATORIOS_EXPORT_NAME;
link.click();

URL.revokeObjectURL(url);

mensagemRelatorios("Relatório exportado com sucesso.", "success");
}

function carregarListaRelatorio(chaves) {
for (var i = 0; i < chaves.length; i++) {
var chave = chaves[i];


try {
  if (typeof loadData === "function") {
    var dadosLoad = loadData(chave, []);

    if (Array.isArray(dadosLoad) && dadosLoad.length > 0) {
      return dadosLoad;
    }
  }

  var dados = localStorage.getItem(chave);

  if (!dados) {
    continue;
  }

  var parsed = JSON.parse(dados);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && Array.isArray(parsed.data)) {
    return parsed.data;
  }

  if (parsed && Array.isArray(parsed.items)) {
    return parsed.items;
  }
} catch (erro) {
  console.warn("Erro ao carregar lista:", chave, erro);
}


}

return [];
}

function carregarValorRelatorio(chaves) {
for (var i = 0; i < chaves.length; i++) {
var chave = chaves[i];

try {
  if (typeof loadData === "function") {
    var valorLoad = loadData(chave, null);

    if (valorLoad !== null && valorLoad !== undefined && !Array.isArray(valorLoad) && typeof valorLoad !== "object") {
      return valorLoad;
    }
  }

  var dados = localStorage.getItem(chave);

  if (!dados) {
    continue;
  }

  try {
    var parsed = JSON.parse(dados);

    if (typeof parsed === "number" || typeof parsed === "string") {
      return parsed;
    }
  } catch (erroJson) {
    return dados;
  }
} catch (erro) {
  console.warn("Erro ao carregar valor:", chave, erro);
}
}

return 0;
}

function carregarObjetoRelatorio(chaves) {
for (var i = 0; i < chaves.length; i++) {
var chave = chaves[i];

try {
  var dados = localStorage.getItem(chave);

  if (!dados) {
    continue;
  }

  var parsed = JSON.parse(dados);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }
} catch (erro) {
  console.warn("Erro ao carregar objeto:", chave, erro);
}


}

return {};
}

function somarListaRelatorio(lista, getValorFn) {
return lista.reduce(function (total, item) {
return total + numeroRelatorio(getValorFn(item));
}, 0);
}

function getValueRelatorio(id) {
var campo = document.getElementById(id);

if (!campo) {
return "";
}

return campo.value;
}

function setTextRelatorio(id, value) {
var campo = document.getElementById(id);

if (!campo) {
return;
}

campo.textContent = value === undefined || value === null ? "" : value;
}

function numeroRelatorio(valor) {
if (valor === null || valor === undefined || valor === "") {
return 0;
}

if (typeof valor === "number") {
return isNaN(valor) ? 0 : valor;
}

var texto = String(valor)
.replace("R$", "")
.replace("%", "")
.replace("x", "")
.replace(/\s/g, "")
.trim();

if (texto.indexOf(",") >= 0) {
texto = texto.replace(/\./g, "").replace(",", ".");
}

var numero = Number(texto);

if (isNaN(numero)) {
return 0;
}

return numero;
}

function moedaRelatorio(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function percentualRelatorio(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: 2,
maximumFractionDigits: 2
}) + "%";
}

function numeroFormatoRelatorio(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toLocaleString("pt-BR", {
minimumFractionDigits: 0,
maximumFractionDigits: 2
});
}

function numeroExportRelatorio(valor) {
var numero = Number(valor);

if (isNaN(numero)) {
numero = 0;
}

return numero.toFixed(2).replace(".", ",");
}

function converterDataRelatorio(valor) {
if (!valor) {
return null;
}

if (valor instanceof Date) {
return valor;
}

var texto = String(valor);

if (/^\d{4}-\d{2}$/.test(texto)) {
texto = texto + "-01";
}

var data = new Date(texto);

if (isNaN(data.getTime())) {
return null;
}

return data;
}

function dataTimestampRelatorio(valor) {
var data = converterDataRelatorio(valor);

if (!data) {
return 0;
}

return data.getTime();
}

function formatarDataTextoRelatorio(valor) {
var data = converterDataRelatorio(valor);

if (!data) {
return "-";
}

return data.toLocaleDateString("pt-BR");
}

function formatarDataHoraRelatorio(data) {
return data.toLocaleString("pt-BR", {
day: "2-digit",
month: "2-digit",
year: "numeric",
hour: "2-digit",
minute: "2-digit"
});
}

function badgeStatusRelatorio(status) {
var texto = String(status || "Sem status");
var statusLower = texto.toLowerCase();

var classe = "purple";

if (
statusLower.indexOf("ativo") >= 0 ||
statusLower.indexOf("ok") >= 0 ||
statusLower.indexOf("ideal") >= 0 ||
statusLower.indexOf("confirm") >= 0 ||
statusLower.indexOf("pago") >= 0 ||
statusLower.indexOf("lucrativo") >= 0
) {
classe = "green";
}

if (
statusLower.indexOf("baixo") >= 0 ||
statusLower.indexOf("aten") >= 0 ||
statusLower.indexOf("pendente") >= 0 ||
statusLower.indexOf("revis") >= 0
) {
classe = "orange";
}

if (
statusLower.indexOf("crítico") >= 0 ||
statusLower.indexOf("critico") >= 0 ||
statusLower.indexOf("preju") >= 0 ||
statusLower.indexOf("atrasado") >= 0 ||
statusLower.indexOf("bloqueado") >= 0
) {
classe = "red";
}

return "<span class='badge " + classe + "'>" + textoSeguroRelatorio(texto) + "</span>";
}

function getIconeAtencaoRelatorio(tipo) {
if (tipo === "danger") {
return "alert-triangle";
}

if (tipo === "warning") {
return "alert-circle";
}

return "info";
}

function textoSeguroRelatorio(value) {
if (value === null || value === undefined) {
return "";
}

return String(value)
.replace(/&/g, String.fromCharCode(38) + "amp;")
.replace(/</g, String.fromCharCode(38) + "lt;")
.replace(/>/g, String.fromCharCode(38) + "gt;")
.replace(/"/g, String.fromCharCode(38) + "quot;")
.replace(/'/g, String.fromCharCode(38) + "#039;");
}

function mensagemRelatorios(texto, tipo) {
if (typeof showToast === "function") {
showToast(texto, tipo || "info");
return;
}

alert(texto);
}

function criarIconesRelatorios() {
if (window.lucide) {
lucide.createIcons();
}
}

