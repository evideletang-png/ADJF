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
  documents: document.querySelector("#documentsView"),
  site: document.querySelector("#siteView"),
  settings: document.querySelector("#settingsView")
};
const metricGrid = document.querySelector("#metricGrid");
const taskList = document.querySelector("#taskList");
const orderList = document.querySelector("#orderList");
const clientList = document.querySelector("#clientList");
const documentList = document.querySelector("#documentList");
const leadList = document.querySelector("#leadList");
const contentList = document.querySelector("#contentList");
const siteMetricGrid = document.querySelector("#siteMetricGrid");
const sitePreview = document.querySelector("#sitePreview");
const siteInfoForm = document.querySelector("#siteInfoForm");
const legalForm = document.querySelector("#legalForm");
const filterRow = document.querySelector("#filterRow");
const documentFilterButtons = document.querySelectorAll("[data-document-filter]");
const siteContentFilterButtons = document.querySelectorAll("[data-site-content-filter]");
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
const documentSheet = document.querySelector("#documentSheet");
const closeDocumentSheet = document.querySelector("#closeDocumentSheet");
const documentForm = document.querySelector("#documentForm");
const documentOrderSelect = document.querySelector("#documentOrderSelect");
const contentSheet = document.querySelector("#contentSheet");
const closeContentSheet = document.querySelector("#closeContentSheet");
const contentForm = document.querySelector("#contentForm");
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

const DOCUMENT_TYPES = {
  quote: {
    label: "Devis",
    prefix: "DEV",
    subject: "Votre devis - L'atelier des jours fleuris"
  },
  deposit_invoice: {
    label: "Facture d'acompte",
    prefix: "FAC-A",
    subject: "Votre facture d'acompte - L'atelier des jours fleuris"
  },
  balance_invoice: {
    label: "Facture de solde",
    prefix: "FAC-S",
    subject: "Votre facture de solde - L'atelier des jours fleuris"
  },
  final_invoice: {
    label: "Facture finale",
    prefix: "FAC",
    subject: "Votre facture - L'atelier des jours fleuris"
  },
  reminder: {
    label: "Relance",
    prefix: "REL",
    subject: "Relance paiement - L'atelier des jours fleuris"
  }
};

resetLegacyDemoData();

const defaultClients = [];
const defaultOrders = [];
const defaultDocuments = [];
const defaultSiteContent = [];
const defaultSiteLeads = [];
const defaultSiteSettings = {
  brandName: "L'atelier des jours fleuris",
  heroTitle: "L'atelier des jours fleuris",
  heroCopy: "Créations florales sensibles pour mariages, événements et lieux de vie professionnels. Une approche douce, structurée et pensée autour des saisons.",
  serviceArea: "France",
  promise: "Fleurs de saison, suivi clair, créations sur mesure",
  contactEmail: "",
  contactPhone: "",
  seoTitle: "L'atelier des jours fleuris - Fleuriste mariage, événement et abonnements floraux",
  seoDescription: "L'atelier des jours fleuris accompagne mariages, événements privés, événements professionnels et abonnements floraux avec des créations sensibles, saisonnières et sur mesure."
};
const defaultLegalPages = {
  legalNotice: "",
  terms: "",
  privacy: ""
};

let clients = loadClients();
let orders = loadOrders();
let documents = loadDocuments();
let siteContent = loadSiteContent();
let siteLeads = loadSiteLeads();
let siteSettings = loadSiteSettings();
let legalPages = loadLegalPages();
let activeFilter = "all";
let activeDocumentFilter = "all";
let activeSiteContentFilter = "all";
let editingContentId = "";

function resetLegacyDemoData() {
  if (localStorage.getItem("atelier-storage-version") === STORAGE_VERSION) return;

  localStorage.removeItem("atelier-clients");
  localStorage.removeItem("atelier-orders");
  localStorage.removeItem("atelier-documents");
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

function loadDocuments() {
  const stored = localStorage.getItem("atelier-documents");
  if (!stored) return defaultDocuments;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultDocuments;
  }
}

function loadSiteContent() {
  const stored = localStorage.getItem("atelier-site-content");
  if (!stored) return defaultSiteContent;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultSiteContent;
  }
}

function loadSiteLeads() {
  const stored = localStorage.getItem("atelier-site-leads");
  if (!stored) return defaultSiteLeads;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultSiteLeads;
  }
}

function loadSiteSettings() {
  const stored = localStorage.getItem("atelier-site-settings");
  if (!stored) return { ...defaultSiteSettings };
  try {
    return { ...defaultSiteSettings, ...JSON.parse(stored) };
  } catch {
    return { ...defaultSiteSettings };
  }
}

function loadLegalPages() {
  const stored = localStorage.getItem("atelier-legal-pages");
  if (!stored) return { ...defaultLegalPages };
  try {
    return { ...defaultLegalPages, ...JSON.parse(stored) };
  } catch {
    return { ...defaultLegalPages };
  }
}

function saveClients() {
  localStorage.setItem("atelier-clients", JSON.stringify(clients));
}

function saveOrders() {
  localStorage.setItem("atelier-orders", JSON.stringify(orders));
}

function saveDocuments() {
  localStorage.setItem("atelier-documents", JSON.stringify(documents));
}

function saveSiteContent() {
  localStorage.setItem("atelier-site-content", JSON.stringify(siteContent));
}

function saveSiteLeads() {
  localStorage.setItem("atelier-site-leads", JSON.stringify(siteLeads));
}

function saveSiteSettings() {
  localStorage.setItem("atelier-site-settings", JSON.stringify(siteSettings));
}

function saveLegalPages() {
  localStorage.setItem("atelier-legal-pages", JSON.stringify(legalPages));
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

function fillForm(form, values) {
  Object.entries(values).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
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

function orderById(orderId) {
  return orders.find((order) => order.id === orderId);
}

function documentTypeConfig(type) {
  return DOCUMENT_TYPES[type] || DOCUMENT_TYPES.quote;
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

function depositAmount(order) {
  return Math.round(order.amount * (order.depositPercent || 0) / 100);
}

function balanceAmount(order) {
  return Math.max(order.amount - depositAmount(order), 0);
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

function defaultDocumentTypeForOrder(order) {
  if (!order) return "quote";
  if (order.status === "quote" || order.status === "signature") return "quote";
  if (order.status === "deposit") return "deposit_invoice";
  if (order.status === "balance" || order.status === "invoice" || order.status === "waiting") return "balance_invoice";
  if (isOrderLate(order) || order.status === "late") return "reminder";
  return "final_invoice";
}

function defaultDocumentAmount(order, type) {
  if (!order) return 0;
  if (type === "quote" || type === "final_invoice") return order.amount;
  if (type === "deposit_invoice") return depositAmount(order);
  if (type === "balance_invoice") return balanceAmount(order);
  if (type === "reminder") return payableAmount(order) || currentAmount(order) || order.amount;
  return order.amount;
}

function defaultDocumentDueDate(order, type) {
  if (!order) return formatDateInput(today);
  if (type === "quote") return addDays(formatDateInput(today), 15);
  if (type === "deposit_invoice") return order.signedDate || order.quoteDate || formatDateInput(today);
  if (type === "balance_invoice" || type === "reminder") return currentMilestone(order).dueDate;
  return currentMilestone(order).dueDate || order.eventDate;
}

function nextDocumentNumber(type) {
  const year = today.getFullYear();
  const prefix = documentTypeConfig(type).prefix;
  const count = documents.filter((doc) => doc.number?.startsWith(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
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
  renderDocumentOrderOptions();
  renderTotals();
  renderMetrics();
  renderTasks();
  renderOrders();
  renderClients();
  renderDocuments();
  renderSite();
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
        <button class="quick-action" type="button" data-action="document">Doc</button>
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
        <button class="quick-action" type="button" data-action="document">Doc</button>
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

function renderDocuments() {
  const filteredDocuments = documents.filter((doc) => {
    if (activeDocumentFilter === "all") return true;
    if (activeDocumentFilter === "invoice") return doc.type.includes("invoice");
    return doc.type === activeDocumentFilter;
  });

  if (!filteredDocuments.length) {
    documentList.innerHTML = `<div class="empty-state">Aucun document pour le moment. Crée un devis ou une facture depuis une commande.</div>`;
    return;
  }

  documentList.innerHTML = filteredDocuments
    .slice()
    .sort((a, b) => parseDate(b.issueDate) - parseDate(a.issueDate))
    .map(documentCard)
    .join("");
}

function documentEmailStatusLabel(status) {
  if (status === "sent") return "Envoyé";
  if (status === "prepared") return "E-mail préparé";
  return "Brouillon";
}

function documentCard(doc) {
  const order = orderById(doc.orderId);
  const client = order ? clientForOrder(order) : clients.find((item) => item.id === doc.clientId);
  const type = documentTypeConfig(doc.type);

  return `
    <article class="document-card" data-document-id="${escapeHtml(doc.id)}">
      <div class="order-topline">
        <div class="order-title">
          <h3>${escapeHtml(type.label)} ${escapeHtml(doc.number)}</h3>
          <p>${escapeHtml(client?.name || "Client à retrouver")} · ${escapeHtml(order?.type || "Commande")}</p>
        </div>
        <span class="status-pill ${doc.emailStatus === "sent" ? "paid" : ""}">${documentEmailStatusLabel(doc.emailStatus)}</span>
      </div>
      <div class="order-meta">
        <span class="meta-chip">${euro.format(doc.amount)}</span>
        <span class="meta-chip">Émis ${dateFormatter.format(parseDate(doc.issueDate))}</span>
        <span class="meta-chip">Échéance ${dateFormatter.format(parseDate(doc.dueDate))}</span>
      </div>
      <div class="quick-actions">
        <button class="quick-action primary" type="button" data-document-action="pdf">PDF</button>
        <button class="quick-action" type="button" data-document-action="email">E-mail</button>
        <button class="quick-action" type="button" data-document-action="sent">Envoyé</button>
      </div>
    </article>
  `;
}

function renderSite() {
  const publishedArticles = siteContent.filter((item) => item.kind === "article" && item.status === "published").length;
  const publishedServices = siteContent.filter((item) => item.kind === "service" && item.status === "published").length;
  const draftContent = siteContent.filter((item) => item.status === "draft").length;
  const newLeads = siteLeads.filter((lead) => lead.status === "new").length;
  const legalReady = legalPages.legalNotice && legalPages.terms ? "OK" : "À compléter";

  siteMetricGrid.innerHTML = [
    ["Demandes", newLeads],
    ["Articles publiés", publishedArticles],
    ["Prestations", publishedServices],
    ["Légal", legalReady],
    ["Brouillons", draftContent]
  ].map(([label, value]) => `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </article>
  `).join("");

  fillForm(siteInfoForm, siteSettings);
  fillForm(legalForm, legalPages);
  renderSitePreview();
  renderLeads();
  renderSiteContent();
}

function renderSitePreview() {
  sitePreview.innerHTML = `
    <div class="preview-topbar">
      <div class="preview-logo">
        <img src="logo.jpg" alt="">
        <span>${escapeHtml(siteSettings.brandName)}</span>
      </div>
      <span>Site public</span>
    </div>
    <div class="preview-hero">
      <p class="eyebrow">Fleuriste événementielle</p>
      <h3>${escapeHtml(siteSettings.heroTitle)}</h3>
      <p>${escapeHtml(siteSettings.heroCopy)}</p>
      <div class="preview-chips">
        <span class="preview-chip">${escapeHtml(siteSettings.serviceArea || "Zone à préciser")}</span>
        <span class="preview-chip">${escapeHtml(siteSettings.promise || "Promesse à préciser")}</span>
      </div>
    </div>
    <div class="preview-chips">
      <span class="preview-chip">${siteContent.filter((item) => item.status === "published").length} contenu(s) publié(s)</span>
      <span class="preview-chip">${siteLeads.filter((lead) => lead.status === "new").length} demande(s) à traiter</span>
    </div>
  `;
}

function renderLeads() {
  if (!siteLeads.length) {
    leadList.innerHTML = `<div class="empty-state">Aucune demande reçue depuis le formulaire public pour le moment.</div>`;
    return;
  }

  leadList.innerHTML = siteLeads
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((lead) => `
      <article class="lead-card" data-lead-id="${escapeHtml(lead.id)}">
        <div class="lead-topline">
          <div class="lead-title">
            <h3>${escapeHtml(lead.name)}</h3>
            <p>${escapeHtml(lead.projectType || "Projet floral")} · ${escapeHtml(lead.location || "Lieu à préciser")}</p>
          </div>
          <span class="status-pill ${lead.status === "done" || lead.status === "client" ? "paid" : ""}">${leadStatusLabel(lead.status)}</span>
        </div>
        <div class="task-meta">
          <span class="meta-chip">${escapeHtml(lead.email || "email à ajouter")}</span>
          <span class="meta-chip">${escapeHtml(lead.phone || "téléphone à ajouter")}</span>
          <span class="meta-chip">${lead.eventDate ? dateFormatter.format(parseDate(lead.eventDate)) : "Date à préciser"}</span>
        </div>
        <p>${escapeHtml(lead.message || "Aucun message complémentaire.")}</p>
        <div class="quick-actions">
          <button class="quick-action primary" type="button" data-lead-action="client">Créer client</button>
          <button class="quick-action" type="button" data-lead-action="done">Traité</button>
        </div>
      </article>
    `)
    .join("");
}

function leadStatusLabel(status) {
  if (status === "client") return "Client créé";
  if (status === "done") return "Traité";
  return "Nouveau";
}

function renderSiteContent() {
  const visibleContent = siteContent.filter((item) => {
    if (activeSiteContentFilter === "all") return true;
    if (activeSiteContentFilter === "draft") return item.status === "draft";
    return item.kind === activeSiteContentFilter;
  });

  if (!visibleContent.length) {
    contentList.innerHTML = `<div class="empty-state">Aucun contenu personnalisé. Ajoute un article ou une prestation pour enrichir le site public.</div>`;
    return;
  }

  contentList.innerHTML = visibleContent
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((item) => `
      <article class="content-card" data-content-id="${escapeHtml(item.id)}">
        <div class="order-topline">
          <div class="order-title">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.kind === "service" ? "Prestation" : "Article")} · ${escapeHtml(item.keyword || "mot-clé à préciser")}</p>
          </div>
          <span class="status-pill ${item.status === "published" ? "paid" : ""}">${item.status === "published" ? "Publié" : "Brouillon"}</span>
        </div>
        <p>${escapeHtml(item.excerpt)}</p>
        <div class="content-meta">
          <span class="meta-chip">${escapeHtml(item.intent || "Intention")}</span>
          <span class="meta-chip">${escapeHtml(item.location || "Zone à préciser")}</span>
          <span class="meta-chip">${escapeHtml(item.readingTime || "Lecture à préciser")}</span>
          <span class="meta-chip">${escapeHtml(item.metaDescription ? "Méta prête" : "Méta à compléter")}</span>
        </div>
        <div class="quick-actions">
          <button class="quick-action primary" type="button" data-content-action="edit">Modifier</button>
          <button class="quick-action" type="button" data-content-action="toggle">${item.status === "published" ? "Brouillon" : "Publier"}</button>
          <button class="quick-action" type="button" data-content-action="duplicate">Dupliquer</button>
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

function renderDocumentOrderOptions() {
  const selected = documentOrderSelect.value;
  documentOrderSelect.disabled = orders.length === 0;

  if (!orders.length) {
    documentOrderSelect.innerHTML = `<option value="">Crée d'abord une commande</option>`;
    return;
  }

  documentOrderSelect.innerHTML = orders
    .map((order) => {
      const client = clientForOrder(order);
      return `<option value="${escapeHtml(order.id)}">${escapeHtml(client.name)} · ${escapeHtml(order.type)} · ${eventCopy(order)}</option>`;
    })
    .join("");

  if (orders.some((order) => order.id === selected)) {
    documentOrderSelect.value = selected;
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
  if (action === "document") openDocumentSheet(order.id);
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

function defaultEmailBody(order, documentType, amount, dueDate) {
  const type = documentTypeConfig(documentType);
  const formattedDueDate = dateFormatter.format(parseDate(dueDate));

  if (documentType === "quote") {
    return `Bonjour,\n\nVous trouverez ci-joint le devis pour votre prestation ${order.type.toLowerCase()} prévue le ${dateFormatter.format(parseDate(order.eventDate))}.\n\nJe reste disponible si vous avez des questions.\n\nMerci beaucoup,\nLéana\nL'atelier des jours fleuris`;
  }

  if (documentType === "reminder") {
    return `Bonjour,\n\nJe me permets de vous relancer concernant ${type.label.toLowerCase()} d'un montant de ${euro.format(amount)}, attendu pour le ${formattedDueDate}.\n\nMerci beaucoup,\nLéana\nL'atelier des jours fleuris`;
  }

  return `Bonjour,\n\nVous trouverez ci-joint ${type.label.toLowerCase()} d'un montant de ${euro.format(amount)}, avec une échéance au ${formattedDueDate}.\n\nMerci beaucoup,\nLéana\nL'atelier des jours fleuris`;
}

function fillDocumentForm(orderId, documentType = "") {
  const order = orderById(orderId || documentOrderSelect.value);
  if (!order) return;

  const type = documentType || defaultDocumentTypeForOrder(order);
  const amount = defaultDocumentAmount(order, type);
  const dueDate = defaultDocumentDueDate(order, type);
  const config = documentTypeConfig(type);

  documentOrderSelect.value = order.id;
  documentForm.elements.documentType.value = type;
  documentForm.elements.issueDate.value = formatDateInput(today);
  documentForm.elements.dueDate.value = dueDate;
  documentForm.elements.amount.value = String(amount);
  documentForm.elements.emailSubject.value = config.subject;
  documentForm.elements.emailBody.value = defaultEmailBody(order, type, amount, dueDate);
}

function openDocumentSheet(orderId = "") {
  if (!orders.length) {
    setView("orders");
    showToast("Crée d'abord une commande.");
    return;
  }

  documentSheet.classList.remove("is-hidden");
  const selectedOrderId = orderId || documentOrderSelect.value || orders[0].id;
  fillDocumentForm(selectedOrderId);
  setTimeout(() => documentOrderSelect.focus(), 80);
}

function closeDocumentForm() {
  documentSheet.classList.add("is-hidden");
  documentForm.reset();
}

function addDocument(event) {
  event.preventDefault();
  const data = new FormData(documentForm);
  const order = orderById(data.get("orderId"));
  if (!order) return showToast("Commande introuvable.");

  const client = clientForOrder(order);
  const type = data.get("documentType");
  const doc = {
    id: `document-${Date.now()}`,
    number: nextDocumentNumber(type),
    type,
    orderId: order.id,
    clientId: client.id,
    amount: Number(data.get("amount")),
    issueDate: data.get("issueDate"),
    dueDate: data.get("dueDate"),
    emailSubject: data.get("emailSubject").trim(),
    emailBody: data.get("emailBody").trim(),
    emailStatus: "draft",
    createdAt: new Date().toISOString()
  };

  documents.unshift(doc);
  saveDocuments();
  closeDocumentForm();
  setView("documents");
  render();
  showToast("Document créé.");
}

function documentById(documentId) {
  return documents.find((doc) => doc.id === documentId);
}

function printableDocumentHtml(doc) {
  const order = orderById(doc.orderId);
  const client = order ? clientForOrder(order) : clients.find((item) => item.id === doc.clientId);
  const type = documentTypeConfig(doc.type);
  const issueDate = dateFormatter.format(parseDate(doc.issueDate));
  const dueDate = dateFormatter.format(parseDate(doc.dueDate));
  const prestationDate = order ? dateFormatter.format(parseDate(order.eventDate)) : "";
  const logoUrl = new URL("logo.jpg", window.location.href).href;

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(type.label)} ${escapeHtml(doc.number)}</title>
        <style>
          :root { font-family: Inter, Arial, sans-serif; color: #263532; }
          body { margin: 0; background: #fffdf7; }
          .page { max-width: 820px; margin: 0 auto; padding: 44px; }
          header { display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid #d8e3e2; padding-bottom: 24px; }
          img { width: 86px; height: 86px; object-fit: cover; border-radius: 8px; }
          h1 { margin: 0; font-size: 30px; }
          h2 { margin: 0 0 10px; font-size: 18px; }
          p { margin: 0; line-height: 1.45; }
          .muted { color: #6f7d7a; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin: 30px 0; }
          .box { border: 1px solid #d8e3e2; border-radius: 8px; padding: 16px; background: #ffffff; }
          table { width: 100%; border-collapse: collapse; margin-top: 28px; }
          th, td { border-bottom: 1px solid #d8e3e2; padding: 14px 0; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
          .total { display: flex; justify-content: flex-end; margin-top: 22px; }
          .total strong { min-width: 220px; border-radius: 8px; background: #b9dce8; padding: 18px; font-size: 24px; text-align: right; }
          footer { margin-top: 46px; color: #6f7d7a; font-size: 13px; }
          @media print { body { background: #fff; } .page { padding: 24px; } }
        </style>
      </head>
      <body>
        <main class="page">
          <header>
            <div>
              <h1>${escapeHtml(type.label)}</h1>
              <p class="muted">${escapeHtml(doc.number)}</p>
            </div>
            <div>
              <img src="${escapeHtml(logoUrl)}" alt="">
            </div>
          </header>

          <section class="grid">
            <div class="box">
              <h2>L'atelier des jours fleuris</h2>
              <p>Léana</p>
              <p class="muted">Créations florales et événements</p>
            </div>
            <div class="box">
              <h2>Client</h2>
              <p>${escapeHtml(client?.name || "Client")}</p>
              <p class="muted">${escapeHtml(client?.email || "")}</p>
              <p class="muted">${escapeHtml(client?.phone || "")}</p>
            </div>
          </section>

          <section class="grid">
            <div class="box">
              <h2>Dates</h2>
              <p>Document : ${issueDate}</p>
              <p>Échéance : ${dueDate}</p>
              ${prestationDate ? `<p>Prestation : ${prestationDate}</p>` : ""}
            </div>
            <div class="box">
              <h2>Commande</h2>
              <p>${escapeHtml(order?.type || "Prestation")}</p>
              <p class="muted">${escapeHtml(order ? workflowForOrder(order).label : "")}</p>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${escapeHtml(type.label)} - ${escapeHtml(order?.type || "Prestation florale")}</td>
                <td>${euro.format(doc.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            <strong>${euro.format(doc.amount)}</strong>
          </div>

          <footer>
            <p>Document généré par L'atelier des jours fleuris. Les mentions légales, TVA, SIRET et conditions de règlement seront à compléter dans la prochaine version serveur.</p>
          </footer>
        </main>
        <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
      </body>
    </html>
  `;
}

function openPrintableDocument(documentId) {
  const doc = documentById(documentId);
  if (!doc) return showToast("Document introuvable.");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showToast("Autorise les fenêtres pour générer le PDF.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(printableDocumentHtml(doc));
  printWindow.document.close();
}

function prepareDocumentEmail(documentId) {
  const doc = documentById(documentId);
  if (!doc) return showToast("Document introuvable.");

  const order = orderById(doc.orderId);
  const client = order ? clientForOrder(order) : clients.find((item) => item.id === doc.clientId);
  const email = client?.email;

  if (!email) {
    showToast("Ajoute un e-mail client avant l'envoi.");
    return;
  }

  doc.emailStatus = "prepared";
  saveDocuments();
  renderDocuments();

  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(doc.emailSubject)}&body=${encodeURIComponent(doc.emailBody)}`;
  window.location.href = mailto;
  showToast("E-mail préparé.");
}

function markDocumentSent(documentId) {
  const doc = documentById(documentId);
  if (!doc) return showToast("Document introuvable.");
  doc.emailStatus = "sent";
  saveDocuments();
  renderDocuments();
  showToast("Document marqué envoyé.");
}

function handleDocumentAction(event) {
  const button = event.target.closest("[data-document-action]");
  if (!button) return;
  const card = event.target.closest("[data-document-id]");
  if (!card) return;

  const documentId = card.dataset.documentId;
  if (button.dataset.documentAction === "pdf") openPrintableDocument(documentId);
  if (button.dataset.documentAction === "email") prepareDocumentEmail(documentId);
  if (button.dataset.documentAction === "sent") markDocumentSent(documentId);
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

function openContentSheet(kind = "article", contentId = "") {
  editingContentId = contentId;
  const existing = siteContent.find((item) => item.id === contentId);
  const initialKind = existing?.kind || kind || "article";

  document.querySelector("#contentSheetTitle").textContent = existing ? "Modifier le contenu" : "Nouveau contenu";
  contentForm.reset();
  fillForm(contentForm, {
    kind: initialKind,
    title: existing?.title || "",
    slug: existing?.slug || "",
    excerpt: existing?.excerpt || "",
    body: existing?.body || "",
    keyword: existing?.keyword || "",
    location: existing?.location || "",
    metaTitle: existing?.metaTitle || "",
    readingTime: existing?.readingTime || "",
    metaDescription: existing?.metaDescription || "",
    faq: existing?.faq || "",
    intent: existing?.intent || "Conseil",
    status: existing?.status || "published"
  });
  contentSheet.classList.remove("is-hidden");
  setTimeout(() => contentForm.elements.title.focus(), 80);
}

function closeContentForm() {
  contentSheet.classList.add("is-hidden");
  contentForm.reset();
  editingContentId = "";
}

function addSiteContent(event) {
  event.preventDefault();
  const data = new FormData(contentForm);
  const title = data.get("title").trim();
  const existing = siteContent.find((item) => item.id === editingContentId);
  const content = {
    id: existing?.id || `${data.get("kind")}-${Date.now()}`,
    kind: data.get("kind"),
    title,
    slug: data.get("slug").trim() || slugify(title),
    excerpt: data.get("excerpt").trim(),
    body: data.get("body").trim(),
    keyword: data.get("keyword").trim(),
    location: data.get("location").trim(),
    metaTitle: data.get("metaTitle").trim(),
    metaDescription: data.get("metaDescription").trim(),
    readingTime: data.get("readingTime").trim(),
    faq: data.get("faq").trim(),
    intent: data.get("intent"),
    status: data.get("status"),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    siteContent = siteContent.map((item) => item.id === existing.id ? content : item);
  } else {
    siteContent.unshift(content);
  }
  saveSiteContent();
  closeContentForm();
  setView("site");
  render();
  showToast(existing ? "Contenu mis à jour." : content.status === "published" ? "Contenu publié sur le site." : "Brouillon enregistré.");
}

function saveSiteInfo(event) {
  event.preventDefault();
  const data = new FormData(siteInfoForm);
  siteSettings = {
    brandName: data.get("brandName").trim(),
    heroTitle: data.get("heroTitle").trim(),
    heroCopy: data.get("heroCopy").trim(),
    serviceArea: data.get("serviceArea").trim(),
    promise: data.get("promise").trim(),
    contactEmail: data.get("contactEmail").trim(),
    contactPhone: data.get("contactPhone").trim(),
    seoTitle: data.get("seoTitle").trim(),
    seoDescription: data.get("seoDescription").trim()
  };
  saveSiteSettings();
  renderSitePreview();
  showToast("Infos du site enregistrées.");
}

function saveLegalInfo(event) {
  event.preventDefault();
  const data = new FormData(legalForm);
  legalPages = {
    legalNotice: data.get("legalNotice").trim(),
    terms: data.get("terms").trim(),
    privacy: data.get("privacy").trim()
  };
  saveLegalPages();
  render();
  showToast("Mentions légales et CGV enregistrées.");
}

function leadById(leadId) {
  return siteLeads.find((lead) => lead.id === leadId);
}

function convertLeadToClient(lead) {
  if (lead.status === "client") {
    showToast("Client déjà créé depuis cette demande.");
    return;
  }

  const exists = clients.some((client) => {
    if (client.email && lead.email && client.email === lead.email) return true;
    return !lead.email && client.name === lead.name;
  });
  if (!exists) {
    const idBase = slugify(lead.name) || "client";
    const id = clients.some((client) => client.id === idBase) ? `${idBase}-${Date.now()}` : idBase;
    clients.unshift({
      id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      profile: lead.projectType === "Événement professionnel" || lead.projectType === "Abonnement floral" ? "Professionnel" : "Particulier"
    });
    saveClients();
  }

  lead.status = "client";
  saveSiteLeads();
  render();
  showToast(exists ? "Client déjà présent, demande liée mentalement." : "Client créé depuis la demande.");
}

function handleLeadAction(event) {
  const button = event.target.closest("[data-lead-action]");
  if (!button) return;
  const card = event.target.closest("[data-lead-id]");
  if (!card) return;
  const lead = leadById(card.dataset.leadId);
  if (!lead) return showToast("Demande introuvable.");

  if (button.dataset.leadAction === "client") {
    convertLeadToClient(lead);
    return;
  }

  if (button.dataset.leadAction === "done") {
    lead.status = "done";
    saveSiteLeads();
    render();
    showToast("Demande marquée traitée.");
  }
}

function handleContentAction(event) {
  const button = event.target.closest("[data-content-action]");
  if (!button) return;
  const card = event.target.closest("[data-content-id]");
  if (!card) return;
  const item = siteContent.find((content) => content.id === card.dataset.contentId);
  if (!item) return showToast("Contenu introuvable.");

  if (button.dataset.contentAction === "edit") {
    openContentSheet(item.kind, item.id);
    return;
  }

  if (button.dataset.contentAction === "duplicate") {
    const copy = {
      ...item,
      id: `${item.kind}-${Date.now()}`,
      title: `${item.title} - copie`,
      slug: `${item.slug || slugify(item.title)}-copie`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    siteContent.unshift(copy);
    saveSiteContent();
    render();
    showToast("Contenu dupliqué en brouillon.");
    return;
  }

  if (button.dataset.contentAction === "toggle") {
    item.status = item.status === "published" ? "draft" : "published";
    item.updatedAt = new Date().toISOString();
    saveSiteContent();
    render();
    showToast(item.status === "published" ? "Contenu publié." : "Contenu repassé en brouillon.");
  }
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
  filterRow.querySelectorAll("[data-filter]").forEach((item) => {
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

document.querySelectorAll("[data-open-document-sheet]").forEach((button) => {
  button.addEventListener("click", () => openDocumentSheet());
});

document.querySelectorAll("[data-open-content-sheet]").forEach((button) => {
  button.addEventListener("click", () => openContentSheet(button.dataset.contentKind || "article"));
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

closeContentSheet.addEventListener("click", closeContentForm);
contentSheet.addEventListener("click", (event) => {
  if (event.target === contentSheet) closeContentForm();
});
contentForm.addEventListener("submit", addSiteContent);
siteInfoForm.addEventListener("submit", saveSiteInfo);
legalForm.addEventListener("submit", saveLegalInfo);
leadList.addEventListener("click", handleLeadAction);
contentList.addEventListener("click", handleContentAction);
siteContentFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeSiteContentFilter = button.dataset.siteContentFilter;
    siteContentFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderSiteContent();
  });
});

closeDocumentSheet.addEventListener("click", closeDocumentForm);
documentSheet.addEventListener("click", (event) => {
  if (event.target === documentSheet) closeDocumentForm();
});
documentForm.addEventListener("submit", addDocument);
documentForm.elements.orderId.addEventListener("change", () => fillDocumentForm(documentForm.elements.orderId.value));
documentForm.elements.documentType.addEventListener("change", () => fillDocumentForm(documentForm.elements.orderId.value, documentForm.elements.documentType.value));
documentList.addEventListener("click", handleDocumentAction);
documentFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeDocumentFilter = button.dataset.documentFilter;
    documentFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderDocuments();
  });
});

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
