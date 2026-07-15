// ==============================
// BALU FOOD - API CLIENT FUTURO
// O sistema usa localStorage por padrão.
// Ative BALU_USE_API apenas quando o backend estiver publicado.
// ==============================

window.BALU_USE_API = false;
window.BALU_API_BASE_URL = window.BALU_API_BASE_URL || "http://localhost:3000/api";

async function baluApiFetch(path, options) {
  var token = localStorage.getItem("balu_api_token") || (typeof baluGetToken === "function" ? baluGetToken() : "") || "";
  var config = Object.assign({
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? "Bearer " + token : ""
    }
  }, options || {});

  var response = await fetch(window.BALU_API_BASE_URL + path, config);
  var data = await response.json().catch(function () { return null; });

  if (!response.ok) {
    throw new Error((data && data.message) || "Erro na API BALU.");
  }

  return data;
}
