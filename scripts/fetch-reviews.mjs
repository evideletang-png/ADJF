// Récupère les avis Google (Places API New) et met à jour
// src/data/google-reviews.json. Exécuté ~1 fois par mois par le workflow
// « refresh-reviews » (donc 1 seul appel API/mois → coût ~0 €).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/google-reviews.json', import.meta.url));

const key = process.env.GOOGLE_PLACES_API_KEY;
const placeId = process.env.GOOGLE_PLACE_ID;

if (!key || !placeId) {
  console.log('GOOGLE_PLACES_API_KEY ou GOOGLE_PLACE_ID manquant — rien à faire.');
  process.exit(0);
}

const res = await fetch(
  `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr`,
  {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
    },
  }
);

const json = await res.json();

if (!res.ok) {
  console.error('Erreur API Google :', JSON.stringify(json).slice(0, 400));
  process.exit(1);
}

const reviews = (json.reviews || [])
  .map((rv) => ({
    author: rv.authorAttribution?.displayName || 'Client Google',
    rating: rv.rating,
    text: (rv.text?.text || rv.originalText?.text || '').trim(),
    date: rv.relativePublishTimeDescription || '',
    url: rv.authorAttribution?.uri,
  }))
  .filter((r) => r.text);

if (!reviews.length) {
  console.log('Aucun avis renvoyé par Google — on conserve le fichier actuel.');
  process.exit(0);
}

const average =
  typeof json.rating === 'number'
    ? json.rating
    : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

const out = {
  source: 'google',
  average: Number(average.toFixed(2)),
  count: typeof json.userRatingCount === 'number' ? json.userRatingCount : reviews.length,
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
