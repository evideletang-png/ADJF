// Récupère les avis Google (Places API New) -> src/data/google-reviews.json.
// Méthode en 2 temps : 1) trouver la fiche (Text Search, champs minimaux)
// 2) récupérer ses avis (Place Details). ~1 appel/mois via le workflow.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/google-reviews.json', import.meta.url));
const key = process.env.GOOGLE_PLACES_API_KEY;
const idOrQuery = (process.env.GOOGLE_PLACE_ID || '').trim();
const coords = (process.env.GOOGLE_PLACE_COORDS || '')
  .split(',')
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isFinite(n));

if (!key || !idOrQuery) {
  console.log('GOOGLE_PLACES_API_KEY ou GOOGLE_PLACE_ID manquant — rien à faire.');
  process.exit(0);
}

async function readJson(res, label) {
  const raw = await res.text();
  console.log(`[${label}] HTTP ${res.status} — ${raw ? raw.slice(0, 300) : '(vide)'}`);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function searchPlaceId(query) {
  const body = { textQuery: query, languageCode: 'fr', maxResultCount: 3 };
  if (coords.length === 2) {
    body.locationBias = { circle: { center: { latitude: coords[0], longitude: coords[1] }, radius: 3000 } };
  }
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify(body),
  });
  const json = await readJson(res, `recherche "${query}"`);
  const list = json.places || [];
  list.forEach((p) => console.log(`   → ${p.displayName?.text} — ${p.formattedAddress} [${p.id}]`));
  return list[0]?.id || null;
}

// 1) Trouver l'identifiant de la fiche
let placeId = /^ChIJ|^places\//i.test(idOrQuery) ? idOrQuery.replace(/^places\//i, '') : null;

if (!placeId) {
  placeId = await searchPlaceId(idOrQuery);
  if (!placeId) {
    console.log('Recherche spécifique vide — test large « fleuriste » pour vérifier l’indexation…');
    const test = await searchPlaceId('fleuriste');
    console.log(
      test
        ? '➡️ Des fleuristes existent dans la zone, mais pas votre fiche : nom à ajuster, ou fiche pas encore indexée par nom.'
        : '➡️ Aucun établissement trouvé dans la zone via l’API : votre fiche Google n’est probablement pas encore indexée dans l’API Places (fréquent pour une fiche récente). Réessayez plus tard.'
    );
    process.exit(1);
  }
}

// 2) Récupérer les avis de la fiche
const res = await fetch(
  `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr`,
  { headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews' } }
);
const place = await readJson(res, 'détails');

if (!res.ok || !place.id) {
  console.error('Impossible de récupérer les détails de la fiche.');
  process.exit(1);
}

console.log(`Fiche : ${place.displayName?.text || '?'} — Place ID : ${place.id}`);

const reviews = (place.reviews || [])
  .map((rv) => ({
    author: rv.authorAttribution?.displayName || 'Client Google',
    rating: rv.rating,
    text: (rv.text?.text || rv.originalText?.text || '').trim(),
    date: rv.relativePublishTimeDescription || '',
    url: rv.authorAttribution?.uri,
  }))
  .filter((r) => r.text);

if (!reviews.length) {
  console.log('Aucun avis textuel sur la fiche — on conserve le fichier actuel.');
  process.exit(0);
}

const average =
  typeof place.rating === 'number'
    ? place.rating
    : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

const out = {
  source: 'google',
  average: Number(average.toFixed(2)),
  count: typeof place.userRatingCount === 'number' ? place.userRatingCount : reviews.length,
  updatedAt: new Date().toISOString(),
  reviews,
};

const previous = (() => {
  try {
    return readFileSync(OUT, 'utf8');
  } catch {
    return '';
  }
})();
const next = JSON.stringify(out, null, 2) + '\n';

if (previous === next) {
  console.log('Avis inchangés.');
} else {
  writeFileSync(OUT, next);
  console.log(`Avis mis à jour : ${reviews.length} affichés, note ${out.average}, ${out.count} au total.`);
}
