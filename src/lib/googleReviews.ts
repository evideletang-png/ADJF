// Les avis affichés viennent d'un fichier de cache (src/data/google-reviews.json),
// rafraîchi une fois par mois par le workflow « refresh-reviews » (1 seul appel
// à l'API Google par mois). Le build ne fait donc AUCUN appel API.
import data from '../data/google-reviews.json';

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

export function getReviews(): ReviewsData {
  return {
    reviews: (data.reviews as Review[]) ?? [],
    average: typeof data.average === 'number' ? data.average : 0,
    count: typeof data.count === 'number' ? data.count : 0,
    source: data.source === 'google' ? 'google' : 'example',
  };
}
