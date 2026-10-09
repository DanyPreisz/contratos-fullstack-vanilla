import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#contract-form");
const preview = document.querySelector("#preview");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };
function today() { return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10); }
function payload() {
  return { title: document.querySelector("#title").value.trim(), partyA: document.querySelector("#partyA").value.trim(), partyB: document.querySelector("#partyB").value.trim(), day: document.querySelector("#day").value, amount: document.querySelector("#amount").value, object: document.querySelector("#object").value.trim() };
}
function paint() {
  const c = payload();
  preview.textContent = `${c.title || "Contrato simple"}\n\nEntre ${c.partyA || "Parte A"} y ${c.partyB || "Parte B"}, con fecha ${c.day || "sin fecha"}.\n\nObjeto: ${c.object || "sin objeto"}.\nMonto: ${c.amount || 0}.\n\nPlantilla de practica. No es un documento legal.`;
}

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/contracts");
  listEl.innerHTML = "";
  data.contracts.forEach((contract) => {
    const li = document.createElement("li");
    li.className = "item";
    const text = document.createElement("span");
    text.textContent = `${contract.title} \u00b7 ${contract.partyA} / ${contract.partyB}`;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/contracts/${contract.id}`, { method: "DELETE" }); await refresh(); });
    li.append(text, del);
    listEl.append(li);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    document.querySelector("#day").value = today();
    paint();
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
form.addEventListener("input", paint);
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/contracts", { method: "POST", body: JSON.stringify(payload()) });
    form.reset();
    document.querySelector("#day").value = today();
    paint();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
