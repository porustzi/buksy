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

export const productsByLang: Record<string, Product[]> = {
  uk: [{"id":"1","name":"Buksy T-Shirt","slug":"buksyshirt","price":1299,"originalPrice":1599,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"/uploads/43424234.jpg","image3":"/uploads/12313123133.jpg","sizes":[{"available":true,"name":"S"},{"available":true,"name":"M"},{"available":true,"name":"L"}],"inStock":true,"stock":2,"isNew":true,"isFeatured":false,"isBestseller":true,"rating":5,"shortDescription":"Культова футболка Buksy🩸\n\nЩільна 100% бавовна 250 г/м², вільний крій та характер, який відчувається з першого погляду. Створена для тих, хто обирає власний шлях, а не слідує за натовпом.\n","description":"Культова футболка Buksy🩸\n\nНе просто базова річ, а частина стилю. Преміальна щільна бавовна, комфортна посадка та дизайн, що залишається впізнаваним незалежно від часу та трендів.\n","details":["Щільна 100% бавовна 250 г/м²"],"care":["Прасувати навиворіт при середній температурі","Не використовувати відбілювач","Прати при температурі до 30°C"],"reviews":[],"images":["/uploads/11231321.jpg","/uploads/43424234.jpg","/uploads/12313123133.jpg"],"reviewCount":0}],
  en: [{"id":"1","name":"Buksy T-Shirt","slug":"buksyshirt","price":1299,"originalPrice":1599,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"/uploads/43424234.jpg","image3":"/uploads/12313123133.jpg","sizes":[{"available":true,"name":"S"},{"available":true,"name":"M"},{"available":true,"name":"L"}],"inStock":true,"stock":2,"isNew":true,"isFeatured":false,"isBestseller":true,"rating":5,"shortDescription":"The iconic Buksy 🩸 t-shirt\n\nDense 100% cotton 250 g/m², loose fit and character that is felt at first glance. Created for those who choose their own path and do not follow the crowd.","description":"The iconic Buksy 🩸 t-shirt\n\nNot just a basic thing, but a part of style. Premium dense cotton, comfortable fit and design that remains recognizable regardless of time and trends.","details":["Dense 100% cotton 250 g/m²"],"care":["Iron inside out at medium temperature","Do not use bleach","Wash at a temperature of up to 30°C"],"reviews":[],"images":["/uploads/11231321.jpg","/uploads/43424234.jpg","/uploads/12313123133.jpg"],"reviewCount":0}],
  pl: [{"id":"1","name":"Buksy T-Shirt","slug":"buksyshirt","price":1299,"originalPrice":1599,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"/uploads/43424234.jpg","image3":"/uploads/12313123133.jpg","sizes":[{"available":true,"name":"S"},{"available":true,"name":"M"},{"available":true,"name":"L"}],"inStock":true,"stock":2,"isNew":true,"isFeatured":false,"isBestseller":true,"rating":5,"shortDescription":"Kultowa koszulka Buksy 🩸\n\nGęsta 100% bawełna 250 g/m², luźny krój i charakter wyczuwalny na pierwszy rzut oka. Stworzony dla tych, którzy wybierają własną drogę i nie podążają za tłumem.","description":"Kultowa koszulka Buksy 🩸\n\nNie tylko podstawowa rzecz, ale część stylu. Wysokiej jakości gęsta bawełna, wygodny krój i design, który pozostaje rozpoznawalny niezależnie od czasu i trendów.","details":["Gęsta 100% bawełna 250 g/m²"],"care":["Prasować na lewej stronie w średniej temperaturze","Nie używaj wybielacza","Prać w temperaturze do 30°C"],"reviews":[],"images":["/uploads/11231321.jpg","/uploads/43424234.jpg","/uploads/12313123133.jpg"],"reviewCount":0}],
};

export const reviews: Review[] = products.flatMap(p => (p.reviews || []).map((r: Review) => ({ ...r, productId: p.id, productSlug: p.slug })));

export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {"t-shirts":"T-Shirts"};
  return names[category] || category;
};

export const categories = [{"id":"all","name":"All"},{"id":"t-shirts","name":"T-Shirts"}];

export const heroImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200';
export const editorialImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800';
