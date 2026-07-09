// Récupération des avis Google au moment du build.
// La clé API n'est utilisée que côté serveur (build GitHub Actions) : elle
// n'est jamais envoyée au navigateur. Repli sur des avis d'exemple si les
// identifiants ne sont pas fournis ou si l'API échoue.

export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  url?: string;
}

export interface ReviewsData {
  reviews: Review[];
  average: number;
  count: number;
  source: 'google' | 'example';
}

const exampleReviews: Review[] = [
  {
    author: 'Camille & Clément',
    rating: 5,
    text: "Léana a capté exactement l'ambiance que nous imaginions pour notre mariage. Des fleurs d'une fraîcheur incroyable et un sens du détail rare.",
    date: 'Mai 2026',
  },
  {
    author: 'Maison Pisco',
    rating: 5,
    text: 'Nos compositions hebdomadaires subliment la boutique. Toujours de saison, toujours justes.',
    date: 'Avril 2026',
  },
  {
    author: 'Sophie D.',
    rating: 5,
    text: 'Un atelier passionnant et une vraie générosité dans la transmission. On repart des étoiles plein les yeux.',
    date: 'Mars 2026',
  },
  {
    author: 'Domaine des Tilleuls',
    rating: 5,
    text: 'Scénographie florale à couper le souffle pour notre séminaire. Ponctuelle, à l’écoute, vraiment professionnelle.',
    date: 'Février 2026',
  },
  {
    author: 'Anaïs & Théo',
    rating: 4,
    text: 'Superbe travail pour notre cérémonie. Quelques ajustements de dernière minute gérés avec beaucoup de calme.',
    date: 'Janvier 2026',
  },
];

function average(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

let cache: ReviewsData | null = null;

export async function getReviews(): Promise<ReviewsData> {
  if (cache) return cache;

  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  const key = env.GOOGLE_PLACES_API_KEY || import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = env.GOOGLE_PLACE_ID || import.meta.env.GOOGLE_PLACE_ID;

  if (key && placeId) {
    try {
      // Places API (New) — Place Details. La clé passe par un en-tête (pas dans l'URL).
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr`,
        {
          headers: {
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
          },
        }
      );
      const json: any = await res.json();

      if (res.ok && (json.reviews || typeof json.rating === 'number')) {
        const reviews: Review[] = (json.reviews || [])
          .map((rv: any) => ({
            author: rv.authorAttribution?.displayName || 'Client Google',
            rating: rv.rating,
            text: (rv.text?.text || rv.originalText?.text || '').trim(),
            date: rv.relativePublishTimeDescription || '',
            url: rv.authorAttribution?.uri,
          }))
          .filter((rv: Review) => rv.text);

        if (reviews.length) {
          cache = {
            reviews,
            average: typeof json.rating === 'number' ? json.rating : average(reviews),
            count:
              typeof json.userRatingCount === 'number' ? json.userRatingCount : reviews.length,
            source: 'google',
          };
          return cache;
        }
      } else {
        console.warn('[avis Google] réponse API :', JSON.stringify(json).slice(0, 300));
      }
    } catch (e) {
      console.warn('[avis Google] échec de récupération, repli sur les exemples.', e);
    }
  }

  cache = {
    reviews: exampleReviews,
    average: average(exampleReviews),
    count: exampleReviews.length,
    source: 'example',
  };
  return cache;
}
