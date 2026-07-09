// Récupère les avis Google (Places API New) et met à jour
// src/data/google-reviews.json. Exécuté ~1 fois par mois par le workflow
// « refresh-reviews » (donc 1 seul appel API/mois → coût ~0 €).
//
// GOOGLE_PLACE_ID peut être :
//   - un identifiant de fiche « ChIJ… » (ou « places/ChIJ… »), utilisé directement ;
//   - OU un simple texte de recherche (ex. « L'atelier des jours fleuris Pontlevoy ») :
//     le script retrouve alors la fiche automatiquement et affiche son ID.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/google-reviews.json', import.meta.url));
const key = process.env.GOOGLE_PLACES_API_KEY;
const idOrQuery = (process.env.GOOGLE_PLACE_ID || '').trim();

if (!key || !idOrQuery) {
  console.log('GOOGLE_PLACES_API_KEY ou GOOGLE_PLACE_ID manquant — rien à faire.');
  process.exit(0);
}

const isPlaceId = /^ChIJ|^places\//i.test(idOrQuery);

async function getPlace() {
  if (isPlaceId) {
    const id = idOrQuery.replace(/^places\//i, '');
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=fr`,
      {
        headers: {
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews',
        },
      }
    );
    return { res, place: await res.json().catch(() => ({})) };
  }
  // Recherche par texte
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews',
    },
    body: JSON.stringify({ textQuery: idOrQuery, languageCode: 'fr' }),
  });
  const json = await res.json().catch(() => ({}));
  const place = json.places && json.places[0];
  return { res, place, all: json };
}

const { res, place, all } = await getPlace();

if (!res.ok) {
  console.error('Erreur API Google :', JSON.stringify(place || all).slice(0, 500));
  process.exit(1);
}
if (!place || !place.id) {
  console.error('Fiche introuvable pour :', idOrQuery, '—', JSON.stringify(all || {}).slice(0, 300));
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
