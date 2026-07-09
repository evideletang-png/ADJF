// Récupère les avis Google (Places API New) et met à jour
// src/data/google-reviews.json. Exécuté ~1 fois par mois par le workflow
// « refresh-reviews » (donc 1 seul appel API/mois → coût ~0 €).
//
// GOOGLE_PLACE_ID : soit un identifiant « ChIJ… », soit un texte de recherche.
// GOOGLE_PLACE_COORDS (optionnel) : « lat,lng » pour cibler la recherche.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/google-reviews.json', import.meta.url));
const key = process.env.GOOGLE_PLACES_API_KEY;
const idOrQuery = (process.env.GOOGLE_PLACE_ID || '').trim();
const coordsRaw = (process.env.GOOGLE_PLACE_COORDS || '').trim();

if (!key || !idOrQuery) {
  console.log('GOOGLE_PLACES_API_KEY ou GOOGLE_PLACE_ID manquant — rien à faire.');
  process.exit(0);
}

const isPlaceId = /^ChIJ|^places\//i.test(idOrQuery);
const FIELD_MASK = 'id,displayName,rating,userRatingCount,reviews';

async function readJson(res) {
  const raw = await res.text();
  console.log(`HTTP ${res.status} — réponse : ${raw ? raw.slice(0, 350) : '(vide)'}`);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function getPlace() {
  if (isPlaceId) {
    const id = idOrQuery.replace(/^places\//i, '');
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=fr`,
      { headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELD_MASK } }
    );
    return { res, place: await readJson(res) };
  }

  const body = { textQuery: idOrQuery, languageCode: 'fr', maxResultCount: 1 };
  const coords = coordsRaw.split(',').map((n) => Number(n.trim()));
  if (coords.length === 2 && coords.every((n) => Number.isFinite(n))) {
    body.locationBias = {
      circle: { center: { latitude: coords[0], longitude: coords[1] }, radius: 2000 },
    };
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.' + FIELD_MASK.split(',').join(',places.'),
    },
    body: JSON.stringify(body),
  });
  const json = await readJson(res);
  return { res, place: json.places && json.places[0], all: json };
}

const { res, place, all } = await getPlace();

if (!res.ok) {
  console.error('Erreur API Google :', JSON.stringify(place || all).slice(0, 500));
  process.exit(1);
}
if (!place || !place.id) {
  console.error('Fiche introuvable pour la recherche fournie.');
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
  console.log('Aucun avis textuel renvoyé par Google — on conserve le fichier actuel.');
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
