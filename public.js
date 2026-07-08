const serviceGrid = document.querySelector("#serviceGrid");
const articleGrid = document.querySelector("#articleGrid");
const leadForm = document.querySelector("#leadForm");
const leadStatus = document.querySelector("#leadStatus");

const defaultServices = [
  {
    title: "Mariages",
    description: "Bouquet, boutonnières, cérémonie, tables et scénographie florale pour composer un fil rouge élégant du premier rendez-vous au jour J.",
    tags: ["Bouquet", "Cérémonie", "Tables"]
  },
  {
    title: "Événements privés",
    description: "Anniversaire, dîner, baptême ou fête familiale : des fleurs pensées pour l'ambiance, le lieu et le rythme de la journée.",
    tags: ["Dîner", "Fête", "Décor"]
  },
  {
    title: "Événements professionnels",
    description: "Lancements, séminaires, vitrines, cocktails et réceptions avec des compositions qui soutiennent l'image de marque.",
    tags: ["Cocktail", "Marque", "Scénographie"]
  },
  {
    title: "Abonnements floraux",
    description: "Des compositions régulières pour accueil, boutique, cabinet, hôtel ou bureau, avec une fréquence adaptée au lieu.",
    tags: ["Entreprise", "Accueil", "Récurrent"]
  },
  {
    title: "Ateliers floraux",
    description: "Un moment guidé autour des gestes, des saisons et des compositions, pour groupes privés ou équipes professionnelles.",
    tags: ["Groupe", "Saison", "Transmission"]
  },
  {
    title: "Conseil floral",
    description: "Un accompagnement pour cadrer palette, budget, priorités, volumes et calendrier avant la création du devis.",
    tags: ["Budget", "Palette", "Calendrier"]
  }
];

const defaultArticles = [
  {
    title: "Quelles fleurs choisir selon la saison ?",
    category: "Conseil",
    area: "Mariage",
    excerpt: "Un guide simple pour relier palette couleur, disponibilité et ambiance florale sans forcer la nature."
  },
  {
    title: "Comment préparer une demande de devis floral ?",
    category: "Checklist",
    area: "Événement",
    excerpt: "Les informations utiles à rassembler avant le premier échange : lieu, date, volume, inspirations et budget."
  },
  {
    title: "Fleurs pour entreprise : abonnement ou événement ponctuel ?",
    category: "Professionnel",
    area: "Entreprise",
    excerpt: "Comprendre les différences entre abonnement régulier, composition d'accueil et scénographie événementielle."
  }
];

function storedPublishedContent() {
  try {
    const items = JSON.parse(localStorage.getItem("atelier-site-content") || "[]");
    return items.filter((item) => item.status === "published");
  } catch {
    return [];
  }
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

function renderServices() {
  const customServices = storedPublishedContent()
    .filter((item) => item.kind === "service")
    .map((item) => ({
      title: item.title,
      description: item.excerpt,
      tags: [item.location, item.intent, item.keyword].filter(Boolean)
    }));
  const services = customServices.length ? customServices : defaultServices;

  serviceGrid.innerHTML = services.map((service) => `
    <article class="service-card" id="${escapeHtml(slugify(service.title))}">
      <div>
        <h3>${escapeHtml(service.title)}</h3>
        <p>${escapeHtml(service.description)}</p>
      </div>
      <div class="tag-list">
        ${service.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderArticles() {
  const customArticles = storedPublishedContent()
    .filter((item) => item.kind === "article")
    .map((item) => ({
      title: item.title,
      category: item.intent || "Article",
      area: item.location || item.keyword || "Guide",
      excerpt: item.excerpt
    }));
  const articles = [...customArticles, ...defaultArticles].slice(0, 6);

  articleGrid.innerHTML = articles.map((article) => `
    <article class="article-card">
      <div>
        <div class="article-meta">
          <span>${escapeHtml(article.category)}</span>
          <span>${escapeHtml(article.area)}</span>
        </div>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.excerpt)}</p>
      </div>
      <a class="text-link" href="#demande">Préparer mon projet</a>
    </article>
  `).join("");
}

function saveLead(lead) {
  const leads = JSON.parse(localStorage.getItem("atelier-site-leads") || "[]");
  leads.unshift(lead);
  localStorage.setItem("atelier-site-leads", JSON.stringify(leads));
}

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(leadForm);
  const lead = {
    id: `lead-${Date.now()}`,
    name: data.get("name").trim(),
    email: data.get("email").trim(),
    phone: data.get("phone").trim(),
    projectType: data.get("projectType"),
    eventDate: data.get("eventDate"),
    location: data.get("location").trim(),
    message: data.get("message").trim(),
    status: "new",
    createdAt: new Date().toISOString()
  };

  saveLead(lead);
  leadForm.reset();
  leadStatus.textContent = "Demande enregistrée. Léana pourra la retrouver dans son espace ADJF.";
});

renderServices();
renderArticles();
