import { Product, Review } from '../types';

export const products: Product[] = [
  {
    "id": "1",
    "name": "Buksy T-Shirt",
    "slug": "buksyshirt",
    "price": 1299,
    "originalPrice": 1599,
    "category": "t-shirts",
    "image1": "/uploads/11231321.jpg",
    "image2": "/uploads/43424234.jpg",
    "image3": "/uploads/12313123133.jpg",
    "sizes": [
      {
        "available": true,
        "name": "S"
      },
      {
        "available": true,
        "name": "M"
      },
      {
        "available": true,
        "name": "L"
      }
    ],
    "inStock": true,
    "stock": 2,
    "isNew": true,
    "isFeatured": false,
    "isBestseller": true,
    "rating": 5,
    "shortDescription": "Культова футболка Buksy🩸\n\nЩільна 100% бавовна 250 г/м², вільний крій та характер, який відчувається з першого погляду. Створена для тих, хто обирає власний шлях, а не слідує за натовпом.\n",
    "description": "Культова футболка Buksy🩸\n\nНе просто базова річ, а частина стилю. Преміальна щільна бавовна, комфортна посадка та дизайн, що залишається впізнаваним незалежно від часу та трендів.\n",
    "details": [
      "Щільна 100% бавовна 250 г/м²"
    ],
    "care": [
      "Прасувати навиворіт при середній температурі",
      "Не використовувати відбілювач",
      "Прати при температурі до 30°C"
    ],
    "reviews": [],
    "images": [
      "/uploads/11231321.jpg",
      "/uploads/43424234.jpg",
      "/uploads/12313123133.jpg"
    ],
    "reviewCount": 0
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
