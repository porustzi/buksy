import { Product, Review } from '../types';

export const products: Product[] = [
  {
    "id": "12",
    "name": "Лонгслив Hysteric Glamour",
    "slug": "ауа",
    "price": 199,
    "originalPrice": 299,
    "category": "t-shirts",
    "image1": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNSBVIxZdE6aOq2cDsSGp3nPgX1BTIu9CPjw&s",
    "image2": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNSBVIxZdE6aOq2cDsSGp3nPgX1BTIu9CPjw&s",
    "image3": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNSBVIxZdE6aOq2cDsSGp3nPgX1BTIu9CPjw&s",
    "sizes": [
      {
        "available": true,
        "name": "39"
      },
      {
        "available": false,
        "name": "40"
      }
    ],
    "inStock": true,
    "isNew": true,
    "isFeatured": true,
    "isBestseller": true,
    "rating": 4.8,
    "shortDescription": "шмотка",
    "description": "крутая шмотка",
    "details": [
      "заебанный"
    ],
    "care": [
      "отличный"
    ],
    "reviews": [
      {
        "rating": 5,
        "verified": true,
        "id": "1",
        "author": "егор",
        "title": "ахуенно",
        "content": "я еблан"
      }
    ],
    "images": [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNSBVIxZdE6aOq2cDsSGp3nPgX1BTIu9CPjw&s",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNSBVIxZdE6aOq2cDsSGp3nPgX1BTIu9CPjw&s",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNSBVIxZdE6aOq2cDsSGp3nPgX1BTIu9CPjw&s"
    ],
    "reviewCount": 1
  }
];

export const reviews: Review[] = products.flatMap(p => (p.reviews || []).map((r: Review) => ({ ...r, productId: p.id, productSlug: p.slug })));

export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {"t-shirts":"T-Shirts"};
  return names[category] || category;
};

export const categories = [{"id":"all","name":"All"},{"id":"t-shirts","name":"T-Shirts"}];

export const heroImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200';
export const editorialImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800';
