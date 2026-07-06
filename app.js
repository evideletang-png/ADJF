const accessView = document.querySelector("#accessView");
const appView = document.querySelector("#appView");
const accessForm = document.querySelector("#accessForm");
const pinInput = document.querySelector("#pinInput");
const lockButton = document.querySelector("#lockButton");
const tabs = document.querySelectorAll(".tab");
const panels = {
  today: document.querySelector("#todayView"),
  orders: document.querySelector("#ordersView"),
  clients: document.querySelector("#clientsView"),
  settings: document.querySelector("#settingsView")
};
const metricGrid = document.querySelector("#metricGrid");
const taskList = document.querySelector("#taskList");
const orderList = document.querySelector("#orderList");
const clientList = document.querySelector("#clientList");
const filterRow = document.querySelector("#filterRow");
const todayLabel = document.querySelector("#todayLabel");
const totalOpen = document.querySelector("#totalOpen");
const totalLate = document.querySelector("#totalLate");
const toast = document.querySelector("#toast");
const orderSheet = document.querySelector("#orderSheet");
const closeSheet = document.querySelector("#closeSheet");
const orderForm = document.querySelector("#orderForm");
const orderClientSelect = document.querySelector("#orderClientSelect");
const clientSheet = document.querySelector("#clientSheet");
const closeClientSheet = document.querySelector("#closeClientSheet");
const clientForm = document.querySelector("#clientForm");
const refreshButton = document.querySelector("#refreshButton");

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

const today = new Date("2026-07-06T09:00:00");
const STORAGE_VERSION = "empty-production-v1";

resetLegacyDemoData();

const defaultClients = [];
const defaultOrders = [];

let clients = loadClients();
let orders = loadOrders();
let activeFilter = "all";

function resetLegacyDemoData() {
  if (localStorage.getItem("atelier-storage-version") === STORAGE_VERSION) return;

  localStorage.removeItem("atelier-clients");
  localStorage.removeItem("atelier-orders");
  localStorage.setItem("atelier-storage-version", STORAGE_VERSION);
}

function loadClients() {
  const stored = localStorage.getItem("atelier-clients");
  if (!stored) return defaultClients;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultClients;
  }
}

function loadOrders() {
  const stored = localStorage.getItem("atelier-orders");
  if (!stored) return defaultOrders;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultOrders;
  }
}

function saveClients() {
  localStorage.setItem("atelier-clients", JSON.stringify(clients));
}

function saveOrders() {
  localStorage.setItem("atelier-orders", JSON.stringify(orders));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clientForOrder(order) {
  return clients.find((client) => client.id === order.clientId) || clients.find((client) => client.name === order.client) || {
    id: "",
    name: order.client,
    email: order.contact,
    phone: "",
    profile: "Client"
  };
}

function showApp() {
  localStorage.setItem("atelier-access", "open");
  accessView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  window.scrollTo(0, 0);
  render();
}

function lockApp() {
  localStorage.removeItem("atelier-access");
  appView.classList.add("is-hidden");
  accessView.classList.remove("is-hidden");
  pinInput.value = "";
  pinInput.focus();
}

function statusLabel(status) {
  return {
    deposit: "Acompte attendu",
    invoice: "À facturer",
    waiting: "Paiement attendu",
    late: "En retard",
    paid: "Payé"
  }[status];
}

function statusClass(status) {
  if (status === "late") return "late";
  if (status === "paid") return "paid";
  return "";
}

function parseDate(value) {
  return new Date(`${value}T10:00:00`);
}

function daysBetween(dateValue) {
  const diff = parseDate(dateValue).getTime() - today.getTime();
  return Math.round(diff / 86400000);
}

function dueCopy(order) {
  const days = daysBetween(order.dueDate);
  if (order.status === "paid") return "Réglé";
  if (days < 0) return `${Math.abs(days)} j de retard`;
  if (days === 0) return "Échéance aujourd'hui";
  if (days === 1) return "Échéance demain";
  return `Échéance J-${days}`;
}

function eventCopy(order) {
  return dateFormatter.format(parseDate(order.eventDate));
}

function actionableOrders() {
  return orders
    .filter((order) => order.status !== "paid")
    .sort((a, b) => {
      const priority = { late: 0, invoice: 1, deposit: 2, waiting: 3 };
      return priority[a.status] - priority[b.status] || parseDate(a.dueDate) - parseDate(b.dueDate);
    });
}

function render() {
  todayLabel.textContent = dateFormatter.format(today);
  renderClientOptions();
  renderTotals();
  renderMetrics();
  renderTasks();
  renderOrders();
  renderClients();
}

function renderTotals() {
  const open = orders
    .filter((order) => order.status !== "paid")
    .reduce((sum, order) => sum + order.amount, 0);
  const late = orders
    .filter((order) => order.status === "late")
    .reduce((sum, order) => sum + order.amount, 0);

  totalOpen.textContent = euro.format(open);
  totalLate.textContent = euro.format(late);
}

function renderMetrics() {
  const metrics = [
    ["À facturer", orders.filter((order) => order.status === "invoice").length],
    ["Acomptes", orders.filter((order) => order.status === "deposit").length],
    ["En retard", orders.filter((order) => order.status === "late").length]
  ];

  metricGrid.innerHTML = metrics
    .map(([label, value]) => `
      <article class="metric-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `)
    .join("");
}

function renderTasks() {
  const tasks = actionableOrders().slice(0, 5);

  if (!tasks.length) {
    taskList.innerHTML = `<div class="empty-state">Tout est à jour pour aujourd'hui.</div>`;
    return;
  }

  taskList.innerHTML = tasks.map(taskCard).join("");
}

function taskCard(order) {
  const primary = order.status === "deposit" ? "Demander acompte" : order.status === "invoice" ? "Envoyer facture" : "Relancer";
  const warning = order.status === "late" ? "warn" : "";
  const client = clientForOrder(order);

  return `
    <article class="task-card" data-id="${order.id}">
      <div class="card-topline">
        <div class="card-title">
          <h3>${escapeHtml(client.name)}</h3>
          <p>${escapeHtml(order.type)} · ${eventCopy(order)}</p>
        </div>
        <span class="amount-pill">${euro.format(order.amount)}</span>
      </div>
      <div class="task-meta">
        <span class="status-pill ${statusClass(order.status)}">${statusLabel(order.status)}</span>
        <span class="meta-chip">${dueCopy(order)}</span>
        <span class="meta-chip">${order.relances} relance${order.relances > 1 ? "s" : ""}</span>
      </div>
      <div class="quick-actions">
        <button class="quick-action primary ${warning}" type="button" data-action="advance">${primary}</button>
        <button class="quick-action" type="button" data-action="remind">Message</button>
        <button class="quick-action" type="button" data-action="paid">Payé</button>
      </div>
    </article>
  `;
}

function renderOrders() {
  const visible = orders.filter((order) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "invoice") return order.status === "invoice";
    if (activeFilter === "late") return order.status === "late";
    if (activeFilter === "paid") return order.status === "paid";
    return true;
  });

  if (!visible.length) {
    orderList.innerHTML = `<div class="empty-state">Aucune commande dans ce filtre.</div>`;
    return;
  }

  orderList.innerHTML = visible.map(orderCard).join("");
}

function orderCard(order) {
  const client = clientForOrder(order);

  return `
    <article class="order-card" data-id="${order.id}">
      <div class="order-topline">
        <div class="order-title">
          <h3>${escapeHtml(client.name)}</h3>
          <p>${escapeHtml(order.type)} · ${escapeHtml(client.email || client.phone || "contact à ajouter")}</p>
        </div>
        <span class="status-pill ${statusClass(order.status)}">${statusLabel(order.status)}</span>
      </div>
      <div class="order-meta">
        <span class="meta-chip">${euro.format(order.amount)}</span>
        <span class="meta-chip">${dueCopy(order)}</span>
        <span class="meta-chip">Prestation ${eventCopy(order)}</span>
      </div>
      <div class="quick-actions">
        <button class="quick-action" type="button" data-action="advance">Avancer</button>
        <button class="quick-action" type="button" data-action="remind">Relance</button>
        <button class="quick-action" type="button" data-action="paid">Payé</button>
      </div>
    </article>
  `;
}

function renderClients() {
  const clientStats = clients.map((client) => {
    const clientOrders = orders.filter((order) => {
      const orderClient = clientForOrder(order);
      return orderClient.id === client.id || orderClient.name === client.name;
    });
    const open = clientOrders
      .filter((order) => order.status !== "paid")
      .reduce((sum, order) => sum + order.amount, 0);

    return {
      ...client,
      open,
      count: clientOrders.length
    };
  });

  if (!clientStats.length) {
    clientList.innerHTML = `<div class="empty-state">Aucun client pour le moment. Crée un client avant d'ajouter une commande.</div>`;
    return;
  }

  clientList.innerHTML = clientStats
    .sort((a, b) => b.open - a.open)
    .map((client) => `
      <article class="client-card" data-client-id="${escapeHtml(client.id)}">
        <div class="client-topline">
          <div class="client-title">
            <h3>${escapeHtml(client.name)}</h3>
            <p>${escapeHtml(client.profile)} · ${client.count} commande${client.count > 1 ? "s" : ""}</p>
          </div>
          <div class="client-balance">
            <strong>${euro.format(client.open)}</strong>
            <span>à suivre</span>
          </div>
        </div>
        <div class="task-meta">
          <span class="meta-chip">${escapeHtml(client.email || "email à ajouter")}</span>
          <span class="meta-chip">${escapeHtml(client.phone || "téléphone à ajouter")}</span>
        </div>
        <div class="client-actions">
          <button class="quick-action primary" type="button" data-client-order="${escapeHtml(client.id)}">Nouvelle commande</button>
          <button class="quick-action" type="button" data-client-note="${escapeHtml(client.id)}">Note</button>
        </div>
      </article>
    `)
    .join("");
}

function renderClientOptions() {
  const selected = orderClientSelect.value;
  orderClientSelect.disabled = clients.length === 0;

  if (!clients.length) {
    orderClientSelect.innerHTML = `<option value="">Crée d'abord un client</option>`;
    return;
  }

  orderClientSelect.innerHTML = clients
    .map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(client.name)}</option>`)
    .join("");

  if (clients.some((client) => client.id === selected)) {
    orderClientSelect.value = selected;
  }
}

function setView(name) {
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === name));
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle("is-hidden", key !== name);
  });
}

function findOrderFromEvent(event) {
  const card = event.target.closest("[data-id]");
  if (!card) return null;
  return orders.find((order) => order.id === card.dataset.id);
}

function handleOrderAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const order = findOrderFromEvent(event);
  if (!order) return;

  const action = button.dataset.action;
  if (action === "advance") advanceOrder(order);
  if (action === "remind") prepareReminder(order);
  if (action === "paid") markPaid(order);

  saveOrders();
  render();
}

function advanceOrder(order) {
  if (order.status === "deposit") {
    order.status = "waiting";
    showToast(`Demande d'acompte prête pour ${order.client}.`);
    return;
  }

  if (order.status === "invoice") {
    order.status = "waiting";
    showToast(`Facture marquée envoyée à ${order.client}.`);
    return;
  }

  if (order.status === "late" || order.status === "waiting") {
    order.relances += 1;
    showToast(`Relance enregistrée pour ${order.client}.`);
  }
}

function prepareReminder(order) {
  order.relances += 1;
  const message = `Bonjour, je me permets de vous relancer concernant la facture ${order.client} d'un montant de ${euro.format(order.amount)}. Merci beaucoup, Léana - L'atelier des jours fleuris.`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(message).then(
      () => showToast("Message de relance copié."),
      () => showToast("Message de relance préparé.")
    );
  } else {
    showToast("Message de relance préparé.");
  }
}

function markPaid(order) {
  order.status = "paid";
  showToast(`${order.client} marqué payé.`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function openSheet(clientId = "") {
  if (!clients.length) {
    setView("clients");
    openClientSheet();
    showToast("Crée d'abord un client.");
    return;
  }

  orderSheet.classList.remove("is-hidden");
  const dateInput = orderForm.elements.date;
  dateInput.value = "2026-07-10";
  if (clientId) orderClientSelect.value = clientId;
  setTimeout(() => orderClientSelect.focus(), 80);
}

function closeOrderSheet() {
  orderSheet.classList.add("is-hidden");
  orderForm.reset();
}

function addOrder(event) {
  event.preventDefault();
  const data = new FormData(orderForm);
  const clientId = data.get("clientId");
  const client = clients.find((item) => item.id === clientId);
  const amount = Number(data.get("amount"));
  const date = data.get("date");
  if (!client) return showToast("Crée d'abord le client.");

  orders.unshift({
    id: `${slugify(client.name)}-${Date.now()}`,
    clientId: client.id,
    client: client.name,
    type: data.get("type"),
    amount,
    dueDate: date,
    eventDate: date,
    status: data.get("status"),
    contact: client.email || client.phone || "contact à ajouter",
    relances: 0
  });

  saveOrders();
  closeOrderSheet();
  setView("today");
  render();
  showToast("Commande ajoutée au suivi.");
}

function openClientSheet() {
  clientSheet.classList.remove("is-hidden");
  setTimeout(() => clientForm.elements.name.focus(), 80);
}

function closeClientForm() {
  clientSheet.classList.add("is-hidden");
  clientForm.reset();
}

function addClient(event) {
  event.preventDefault();
  const data = new FormData(clientForm);
  const name = data.get("name").trim();
  const email = data.get("email").trim();
  const phone = data.get("phone").trim();
  const profile = data.get("profile");
  const idBase = slugify(name) || "client";
  const id = clients.some((client) => client.id === idBase) ? `${idBase}-${Date.now()}` : idBase;

  clients.unshift({ id, name, email, phone, profile });
  saveClients();
  closeClientForm();
  setView("clients");
  render();
  showToast("Client créé.");
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showApp();
});

lockButton.addEventListener("click", lockApp);

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

taskList.addEventListener("click", handleOrderAction);
orderList.addEventListener("click", handleOrderAction);
clientList.addEventListener("click", (event) => {
  const orderButton = event.target.closest("[data-client-order]");
  const noteButton = event.target.closest("[data-client-note]");

  if (orderButton) {
    openSheet(orderButton.dataset.clientOrder);
    return;
  }

  if (noteButton) {
    showToast("Notes client prévues pour la prochaine version.");
  }
});

filterRow.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;

  activeFilter = chip.dataset.filter;
  document.querySelectorAll(".filter-chip").forEach((item) => {
    item.classList.toggle("is-active", item === chip);
  });
  renderOrders();
});

document.querySelectorAll("[data-open-sheet]").forEach((button) => {
  button.addEventListener("click", openSheet);
});

document.querySelectorAll("[data-open-client-sheet]").forEach((button) => {
  button.addEventListener("click", openClientSheet);
});

closeSheet.addEventListener("click", closeOrderSheet);
orderSheet.addEventListener("click", (event) => {
  if (event.target === orderSheet) closeOrderSheet();
});
orderForm.addEventListener("submit", addOrder);

closeClientSheet.addEventListener("click", closeClientForm);
clientSheet.addEventListener("click", (event) => {
  if (event.target === clientSheet) closeClientForm();
});
clientForm.addEventListener("submit", addClient);

refreshButton.addEventListener("click", () => {
  render();
  showToast("Tableau de bord actualisé.");
});

document.querySelectorAll("[data-setting]").forEach((button) => {
  button.addEventListener("click", () => showToast("Réglage prêt pour la prochaine version."));
});

if (localStorage.getItem("atelier-access") === "open") {
  showApp();
} else {
  pinInput.focus();
}
