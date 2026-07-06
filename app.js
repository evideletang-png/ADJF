const accessView = document.querySelector("#accessView");
const appView = document.querySelector("#appView");
const accessForm = document.querySelector("#accessForm");
const userInput = document.querySelector("#userInput");
const passwordInput = document.querySelector("#passwordInput");
const accessHelp = document.querySelector("#accessHelp");
const accessButtonLabel = document.querySelector("#accessButtonLabel");
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
const greetingTitle = document.querySelector("#greetingTitle");
const profileName = document.querySelector("#profileName");

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

const today = new Date();
today.setHours(9, 0, 0, 0);
const STORAGE_VERSION = "empty-production-v1";
const DEFAULT_ADMIN_NAME = "Léana";
const AUTH_USER_KEY = "atelier-auth-user";
const AUTH_SALT_KEY = "atelier-auth-salt";
const AUTH_HASH_KEY = "atelier-auth-password-hash";

const WORKFLOWS = {
  event_pre3: {
    label: "Acompte signature + solde J-3",
    shortLabel: "Solde J-3",
    depositPercent: 30,
    balanceOffsetDays: -3,
    paymentOffsetDays: -3
  },
  event_post7: {
    label: "Acompte signature + solde J+7",
    shortLabel: "Solde J+7",
    depositPercent: 30,
    balanceOffsetDays: 0,
    paymentOffsetDays: 7
  },
  monthly: {
    label: "Facture mensuelle J+30",
    shortLabel: "Mensuel J+30",
    depositPercent: 0,
    balanceOffsetDays: 0,
    paymentOffsetDays: 30
  },
  immediate: {
    label: "Paiement immédiat",
    shortLabel: "Immédiat",
    depositPercent: 0,
    balanceOffsetDays: 0,
    paymentOffsetDays: 0
  }
};

const STATUS_PRIORITY = {
  late: 0,
  quote: 1,
  signature: 2,
  deposit: 3,
  balance: 4,
  invoice: 5,
  waiting: 6,
  paid: 7
};

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
    return JSON.parse(stored).map(normalizeOrder);
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

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateValue, days) {
  const date = parseDate(dateValue);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

function workflowForOrder(order) {
  return WORKFLOWS[order.workflow] || WORKFLOWS.event_pre3;
}

function defaultWorkflowForType(type) {
  if (type === "Abonnement entreprise") return "monthly";
  if (type === "Commande boutique") return "immediate";
  if (type === "Événement professionnel") return "event_post7";
  return "event_pre3";
}

function normalizeStatus(status) {
  if (STATUS_PRIORITY[status] === undefined) return "quote";
  return status;
}

function normalizeOrder(order) {
  const workflow = order.workflow || defaultWorkflowForType(order.type);
  const workflowConfig = WORKFLOWS[workflow] || WORKFLOWS.event_pre3;
  const eventDate = order.eventDate || order.dueDate || formatDateInput(today);

  return {
    ...order,
    workflow,
    eventDate,
    quoteDate: order.quoteDate || order.createdDate || formatDateInput(today),
    signedDate: order.signedDate || "",
    depositPercent: Number(order.depositPercent ?? workflowConfig.depositPercent),
    status: normalizeStatus(order.status),
    relances: Number(order.relances || 0)
  };
}

function clientForOrder(order) {
  return clients.find((client) => client.id === order.clientId) || clients.find((client) => client.name === order.client) || {
    id: "",
    name: order.client,
    email: order.contact,
    phone: "",
    profile: "Particulier"
  };
}

function normalizeClientProfile(profile) {
  return profile === "Particulier" ? "Particulier" : "Professionnel";
}

function configuredUserName() {
  return localStorage.getItem(AUTH_USER_KEY) || DEFAULT_ADMIN_NAME;
}

function firstName(name) {
  return name.trim().split(/\s+/)[0] || DEFAULT_ADMIN_NAME;
}

function applyUserName(name) {
  const cleanName = name.trim() || DEFAULT_ADMIN_NAME;
  greetingTitle.textContent = `Bonjour ${firstName(cleanName)}`;
  profileName.textContent = cleanName;
}

function configureAccessForm() {
  const hasPassword = Boolean(localStorage.getItem(AUTH_HASH_KEY));
  userInput.value = configuredUserName();
  passwordInput.value = "";
  passwordInput.placeholder = hasPassword ? "Mot de passe" : "Créer un mot de passe";
  passwordInput.autocomplete = hasPassword ? "current-password" : "new-password";
  accessHelp.textContent = hasPassword ? "" : "Première connexion : choisis le mot de passe de Léana.";
  accessButtonLabel.textContent = hasPassword ? "Ouvrir le tableau de bord" : "Créer l'accès";
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  if (!crypto.subtle) {
    let hash = 0;
    const value = `${salt}:${password}`;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return `fallback-${Math.abs(hash).toString(16)}`;
  }

  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function unlockApp() {
  const userName = userInput.value.trim();
  const password = passwordInput.value;
  const storedHash = localStorage.getItem(AUTH_HASH_KEY);
  const storedSalt = localStorage.getItem(AUTH_SALT_KEY);
  const storedUser = configuredUserName();

  if (!userName || !password) {
    showToast("Utilisateur et mot de passe requis.");
    return;
  }

  if (!storedHash || !storedSalt) {
    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);
    localStorage.setItem(AUTH_USER_KEY, userName);
    localStorage.setItem(AUTH_SALT_KEY, salt);
    localStorage.setItem(AUTH_HASH_KEY, passwordHash);
    showApp(userName);
    return;
  }

  const passwordHash = await hashPassword(password, storedSalt);
  if (userName !== storedUser || passwordHash !== storedHash) {
    showToast("Accès refusé.");
    return;
  }

  showApp(userName);
}

function showApp(userName = configuredUserName()) {
  localStorage.setItem("atelier-access", "open");
  localStorage.setItem(AUTH_USER_KEY, userName);
  accessView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  applyUserName(userName);
  window.scrollTo(0, 0);
  render();
}

function lockApp() {
  localStorage.removeItem("atelier-access");
  appView.classList.add("is-hidden");
  accessView.classList.remove("is-hidden");
  configureAccessForm();
  passwordInput.focus();
}

function statusLabel(status) {
  return {
    quote: "Devis à envoyer",
    signature: "Signature attendue",
    deposit: "Acompte attendu",
    balance: "Solde à facturer",
    invoice: "Facture à envoyer",
    waiting: "Paiement attendu",
    late: "En retard",
    paid: "Payé"
  }[status];
}

function statusClass(status) {
  if (status === "late") return "late";
  if (status === "paid") return "paid";
  if (status === "quote" || status === "signature") return "quote";
  return "";
}

function parseDate(value) {
  return new Date(`${value}T10:00:00`);
}

function daysBetween(dateValue) {
  const diff = parseDate(dateValue).getTime() - today.getTime();
  return Math.round(diff / 86400000);
}

function buildSchedule(order) {
  const workflow = workflowForOrder(order);
  const eventDate = order.eventDate || formatDateInput(today);
  const quoteDate = order.quoteDate || formatDateInput(today);
  const signatureDate = order.signedDate || quoteDate;
  const balanceDueDate = addDays(eventDate, workflow.balanceOffsetDays);
  const paymentDueDate = addDays(eventDate, workflow.paymentOffsetDays);
  const depositAmount = Math.round(order.amount * (order.depositPercent || 0) / 100);
  const balanceAmount = Math.max(order.amount - depositAmount, 0);

  if (order.workflow === "immediate") {
    return [
      { key: "waiting", label: "Paiement à la livraison", dueDate: paymentDueDate, amount: order.amount },
      { key: "paid", label: "Commande clôturée", dueDate: paymentDueDate, amount: 0 }
    ];
  }

  if (order.workflow === "monthly") {
    return [
      { key: "invoice", label: "Facture mensuelle", dueDate: eventDate, amount: order.amount },
      { key: "waiting", label: "Paiement attendu", dueDate: paymentDueDate, amount: order.amount },
      { key: "late", label: "Relance si impayé", dueDate: addDays(paymentDueDate, 7), amount: order.amount }
    ];
  }

  return [
    { key: "quote", label: "Devis à envoyer", dueDate: quoteDate, amount: order.amount },
    { key: "signature", label: "Signature du devis", dueDate: signatureDate, amount: 0 },
    { key: "deposit", label: `Acompte ${order.depositPercent || 0}%`, dueDate: signatureDate, amount: depositAmount },
    { key: "balance", label: "Solde à facturer", dueDate: balanceDueDate, amount: balanceAmount },
    { key: "waiting", label: "Paiement du solde", dueDate: paymentDueDate, amount: balanceAmount },
    { key: "late", label: "Relance si impayé", dueDate: addDays(paymentDueDate, 7), amount: balanceAmount }
  ];
}

function currentMilestone(order) {
  if (order.status === "paid") {
    return { key: "paid", label: "Commande clôturée", dueDate: order.eventDate || formatDateInput(today), amount: 0 };
  }

  const schedule = buildSchedule(order);
  return schedule.find((step) => step.key === order.status) || (order.status === "invoice" ? schedule.find((step) => step.key === "balance") : null) || schedule[0];
}

function currentAmount(order) {
  return currentMilestone(order)?.amount ?? order.amount;
}

function payableAmount(order) {
  if (order.status === "quote" || order.status === "signature" || order.status === "paid") return 0;
  return currentAmount(order);
}

function displayAmount(order) {
  return currentAmount(order) > 0 ? currentAmount(order) : order.amount;
}

function amountChipLabel(order) {
  return currentAmount(order) > 0 ? `${euro.format(currentAmount(order))} à suivre` : `${euro.format(order.amount)} devis`;
}

function isOrderLate(order) {
  return order.status !== "paid" && daysBetween(currentMilestone(order).dueDate) < 0;
}

function dueCopy(order) {
  if (order.status === "paid") return "Réglé";
  const milestone = currentMilestone(order);
  const days = daysBetween(milestone.dueDate);
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
      const aMilestone = currentMilestone(a);
      const bMilestone = currentMilestone(b);
      return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || parseDate(aMilestone.dueDate) - parseDate(bMilestone.dueDate);
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
    .reduce((sum, order) => sum + payableAmount(order), 0);
  const late = orders
    .filter((order) => isOrderLate(order))
    .reduce((sum, order) => sum + payableAmount(order), 0);

  totalOpen.textContent = euro.format(open);
  totalLate.textContent = euro.format(late);
}

function renderMetrics() {
  const metrics = [
    ["Devis", orders.filter((order) => order.status === "quote" || order.status === "signature").length],
    ["Acomptes", orders.filter((order) => order.status === "deposit").length],
    ["Soldes", orders.filter((order) => order.status === "balance" || order.status === "invoice").length],
    ["En retard", orders.filter((order) => isOrderLate(order)).length]
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

function primaryActionLabel(order) {
  return {
    quote: "Envoyer devis",
    signature: "Marquer signé",
    deposit: "Acompte reçu",
    balance: "Facturer solde",
    invoice: "Envoyer facture",
    waiting: "Relancer",
    late: "Relancer",
    paid: "Payé"
  }[order.status] || "Avancer";
}

function scheduleMarkup(order) {
  const currentKey = order.status;
  const steps = buildSchedule(order)
    .filter((step) => step.key !== "late")
    .slice(0, 5);

  return `
    <ol class="schedule-list" aria-label="Échéancier">
      ${steps.map((step) => `
        <li class="schedule-item ${step.key === currentKey ? "is-current" : ""}">
          <span>${escapeHtml(step.label)}</span>
          <strong>${dateFormatter.format(parseDate(step.dueDate))}</strong>
        </li>
      `).join("")}
    </ol>
  `;
}

function taskCard(order) {
  const primary = primaryActionLabel(order);
  const warning = isOrderLate(order) ? "warn" : "";
  const client = clientForOrder(order);
  const workflow = workflowForOrder(order);
  const milestone = currentMilestone(order);

  return `
    <article class="task-card" data-id="${order.id}">
      <div class="card-topline">
        <div class="card-title">
          <h3>${escapeHtml(client.name)}</h3>
          <p>${escapeHtml(order.type)} · ${escapeHtml(workflow.shortLabel)} · ${eventCopy(order)}</p>
        </div>
        <span class="amount-pill">${euro.format(displayAmount(order))}</span>
      </div>
      <div class="task-meta">
        <span class="status-pill ${isOrderLate(order) ? "late" : statusClass(order.status)}">${statusLabel(order.status)}</span>
        <span class="meta-chip">${escapeHtml(milestone.label)}</span>
        <span class="meta-chip">${dueCopy(order)}</span>
        <span class="meta-chip">${order.relances} relance${order.relances > 1 ? "s" : ""}</span>
      </div>
      ${scheduleMarkup(order)}
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
    if (activeFilter === "invoice") return ["quote", "signature", "deposit", "balance", "invoice"].includes(order.status);
    if (activeFilter === "late") return isOrderLate(order);
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
  const workflow = workflowForOrder(order);
  const milestone = currentMilestone(order);

  return `
    <article class="order-card" data-id="${order.id}">
      <div class="order-topline">
        <div class="order-title">
          <h3>${escapeHtml(client.name)}</h3>
          <p>${escapeHtml(order.type)} · ${escapeHtml(workflow.label)}</p>
        </div>
        <span class="status-pill ${isOrderLate(order) ? "late" : statusClass(order.status)}">${statusLabel(order.status)}</span>
      </div>
      <div class="order-meta">
        <span class="meta-chip">${amountChipLabel(order)}</span>
        <span class="meta-chip">${escapeHtml(milestone.label)}</span>
        <span class="meta-chip">${dueCopy(order)}</span>
        <span class="meta-chip">Prestation ${eventCopy(order)}</span>
      </div>
      ${scheduleMarkup(order)}
      <div class="quick-actions">
        <button class="quick-action" type="button" data-action="advance">${primaryActionLabel(order)}</button>
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
            <p>${escapeHtml(normalizeClientProfile(client.profile))} · ${client.count} commande${client.count > 1 ? "s" : ""}</p>
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

function statusSequence(order) {
  if (order.workflow === "immediate") return ["waiting", "paid"];
  if (order.workflow === "monthly") return ["invoice", "waiting", "paid"];
  return ["quote", "signature", "deposit", "balance", "waiting", "paid"];
}

function updateOrderDueDate(order) {
  order.dueDate = currentMilestone(order).dueDate;
}

function advanceOrder(order) {
  if (order.status === "late" || order.status === "waiting") {
    order.relances += 1;
    showToast(`Relance enregistrée pour ${order.client}.`);
    return;
  }

  const sequence = statusSequence(order);
  const currentIndex = sequence.indexOf(order.status);
  const nextStatus = sequence[currentIndex + 1] || "waiting";
  order.status = nextStatus;
  updateOrderDueDate(order);

  const messages = {
    signature: `Devis envoyé à ${order.client}.`,
    deposit: `Signature enregistrée, acompte à suivre pour ${order.client}.`,
    balance: `Acompte enregistré, solde planifié pour ${order.client}.`,
    waiting: `Facturation envoyée, paiement à suivre pour ${order.client}.`,
    paid: `${order.client} marqué payé.`
  };

  showToast(messages[nextStatus] || `Commande mise à jour pour ${order.client}.`);
}

function reminderMessage(order) {
  const milestone = currentMilestone(order);
  const dueDate = dateFormatter.format(parseDate(milestone.dueDate));
  const amount = currentAmount(order);

  if (order.status === "deposit") {
    return `Bonjour, je vous confirme que l'acompte de ${euro.format(amount)} lié au devis est attendu pour le ${dueDate}. Merci beaucoup, Léana - L'atelier des jours fleuris.`;
  }

  if (order.status === "balance" || order.status === "invoice" || order.status === "waiting" || order.status === "late") {
    return `Bonjour, je me permets de vous relancer concernant le solde de ${euro.format(amount)} attendu pour le ${dueDate}. Merci beaucoup, Léana - L'atelier des jours fleuris.`;
  }

  return `Bonjour, je reviens vers vous concernant ${milestone.label.toLowerCase()} prévu le ${dueDate}. Merci beaucoup, Léana - L'atelier des jours fleuris.`;
}

function prepareReminder(order) {
  order.relances += 1;
  const message = reminderMessage(order);

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
  orderForm.elements.eventDate.value = addDays(formatDateInput(today), 7);
  orderForm.elements.quoteDate.value = formatDateInput(today);
  orderForm.elements.signedDate.value = "";
  orderForm.elements.depositPercent.value = String(WORKFLOWS.event_pre3.depositPercent);
  orderForm.elements.workflow.value = "event_pre3";
  orderForm.elements.status.value = "quote";
  if (clientId) orderClientSelect.value = clientId;
  setTimeout(() => orderClientSelect.focus(), 80);
}

function closeOrderSheet() {
  orderSheet.classList.add("is-hidden");
  orderForm.reset();
}

function applyWorkflowDefaultsFromType() {
  const workflowKey = defaultWorkflowForType(orderForm.elements.type.value);
  const workflow = WORKFLOWS[workflowKey];
  orderForm.elements.workflow.value = workflowKey;
  orderForm.elements.depositPercent.value = String(workflow.depositPercent);
  orderForm.elements.status.value = workflowKey === "immediate" ? "waiting" : workflowKey === "monthly" ? "invoice" : "quote";
}

function applyWorkflowDepositDefault() {
  const workflow = WORKFLOWS[orderForm.elements.workflow.value] || WORKFLOWS.event_pre3;
  orderForm.elements.depositPercent.value = String(workflow.depositPercent);
  if (orderForm.elements.workflow.value === "immediate") orderForm.elements.status.value = "waiting";
  if (orderForm.elements.workflow.value === "monthly") orderForm.elements.status.value = "invoice";
}

function addOrder(event) {
  event.preventDefault();
  const data = new FormData(orderForm);
  const clientId = data.get("clientId");
  const client = clients.find((item) => item.id === clientId);
  const amount = Number(data.get("amount"));
  const type = data.get("type");
  const workflow = data.get("workflow") || defaultWorkflowForType(type);
  const eventDate = data.get("eventDate");
  const quoteDate = data.get("quoteDate") || formatDateInput(today);
  const signedDate = data.get("signedDate") || "";
  const depositPercent = Number(data.get("depositPercent") || WORKFLOWS[workflow]?.depositPercent || 0);
  if (!client) return showToast("Crée d'abord le client.");

  const order = normalizeOrder({
    id: `${slugify(client.name)}-${Date.now()}`,
    clientId: client.id,
    client: client.name,
    type,
    workflow,
    amount,
    eventDate,
    quoteDate,
    signedDate,
    depositPercent,
    status: data.get("status"),
    contact: client.email || client.phone || "contact à ajouter",
    relances: 0
  });
  updateOrderDueDate(order);
  orders.unshift(order);

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
  const profile = normalizeClientProfile(data.get("profile"));
  const idBase = slugify(name) || "client";
  const id = clients.some((client) => client.id === idBase) ? `${idBase}-${Date.now()}` : idBase;

  clients.unshift({ id, name, email, phone, profile });
  saveClients();
  closeClientForm();
  setView("clients");
  render();
  showToast("Client créé.");
}

accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await unlockApp();
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
orderForm.elements.type.addEventListener("change", applyWorkflowDefaultsFromType);
orderForm.elements.workflow.addEventListener("change", applyWorkflowDepositDefault);

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

if (localStorage.getItem("atelier-access") === "open" && localStorage.getItem(AUTH_HASH_KEY)) {
  showApp();
} else {
  localStorage.removeItem("atelier-access");
  configureAccessForm();
  passwordInput.focus();
}
