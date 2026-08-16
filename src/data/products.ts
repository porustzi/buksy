import { Product, Review } from '../types';

export const products: Product[] = [
  {
    "id": "1",
    "name": "Buksy T-Shirt",
    "slug": "buksyshirt",
    "price": 10,
    "originalPrice": 1299,
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
    "stock": 10,
    "isNew": false,
    "isFeatured": false,
    "isBestseller": false,
    "rating": 5,
    "shortDescription": "",
    "description": "футболка Buksy🩸 ткань: 2х кулір 240г/2м принт: шокодрук вишивка",
    "details": [
      "Щільна 100% бавовна 240 г/м²"
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
  },
  {
    "id": "1786798484638",
    "name": "Longsleeve BUKSY",
    "slug": "product-msudomfy",
    "price": 1349,
    "category": "longsleeves",
    "image1": "/uploads/1786802808298_xr6i.png",
    "image2": "/uploads/1786798624330_u1jz.jpg",
    "image3": "/uploads/1786799287680_vwfq.jpg",
    "sizes": [
      {
        "name": "S",
        "available": true
      },
      {
        "name": "M",
        "available": true
      },
      {
        "name": "L",
        "available": true
      }
    ],
    "inStock": true,
    "stock": 12,
    "isNew": true,
    "isHot": true,
    "isFeatured": false,
    "isBestseller": false,
    "rating": 0,
    "shortDescription": "",
    "description": "лонгслів \nткань кулір 250гм2\nпринт дтф\nдістрес по всьому лонгсліві",
    "details": [
      "дістрес",
      "принт дтф"
    ],
    "care": [
      ""
    ],
    "images": [
      "/uploads/1786802808298_xr6i.png",
      "/uploads/1786798624330_u1jz.jpg",
      "/uploads/1786799287680_vwfq.jpg"
    ],
    "reviewCount": 0
  },
  {
    "id": "1786802892510",
    "name": "Double belt shorts Buksy🩸",
    "slug": "product-msugb3ku",
    "price": 1349,
    "category": "shorts",
    "image1": "/uploads/1786802960883_271v.jpg",
    "image2": "/uploads/1786802965153_oedk.jpg",
    "image3": "/uploads/1786802978421_5euu.jpg",
    "sizes": [
      {
        "name": "S",
        "available": true
      },
      {
        "name": "M",
        "available": true
      },
      {
        "name": "L",
        "available": true
      }
    ],
    "inStock": true,
    "stock": 30,
    "isNew": false,
    "isHot": false,
    "isFeatured": true,
    "isBestseller": false,
    "rating": 0,
    "shortDescription": "",
    "description": "Double belt shorts Buksy🩸\nМатеріал: Футер 3х нитка 320/м2\nпринт дтф\nвишивка",
    "details": [
      "принт дтф",
      "вишивка"
    ],
    "care": [],
    "originalPrice": 1699,
    "images": [
      "/uploads/1786802960883_271v.jpg",
      "/uploads/1786802965153_oedk.jpg",
      "/uploads/1786802978421_5euu.jpg"
    ],
    "reviewCount": 0
  },
  {
    "id": "test-5grn",
    "name": "Тестовий товар 5 грн",
    "slug": "test-5grn",
    "price": 5,
    "category": "t-shirts",
    "image1": "/uploads/11231321.jpg",
    "image2": "",
    "image3": "",
    "sizes": [
      {
        "name": "S",
        "available": true
      },
      {
        "name": "M",
        "available": true
      },
      {
        "name": "L",
        "available": true
      }
    ],
    "inStock": true,
    "stock": 100,
    "isNew": false,
    "isHot": true,
    "isFeatured": false,
    "isBestseller": false,
    "rating": 0,
    "shortDescription": "Тестовий товар за 5 грн для перевірки оплати",
    "description": "Тестовий товар для перевірки оплати Monobank",
    "details": [],
    "care": [],
    "reviews": [],
    "images": [
      "/uploads/11231321.jpg"
    ],
    "reviewCount": 0
  }
];

export const productsByLang: Record<string, Product[]> = {
  uk: [{"id":"1","name":"Buksy T-Shirt","slug":"buksyshirt","price":10,"originalPrice":1299,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"/uploads/43424234.jpg","image3":"/uploads/12313123133.jpg","sizes":[{"available":true,"name":"S"},{"available":true,"name":"M"},{"available":true,"name":"L"}],"inStock":true,"stock":10,"isNew":false,"isFeatured":false,"isBestseller":false,"rating":5,"shortDescription":"","description":"футболка Buksy🩸 ткань: 2х кулір 240г/2м принт: шокодрук вишивка","details":["Щільна 100% бавовна 240 г/м²"],"care":["Прасувати навиворіт при середній температурі","Не використовувати відбілювач","Прати при температурі до 30°C"],"reviews":[],"images":["/uploads/11231321.jpg","/uploads/43424234.jpg","/uploads/12313123133.jpg"],"reviewCount":0},{"id":"1786798484638","name":"Longsleeve BUKSY","slug":"product-msudomfy","price":1349,"category":"longsleeves","image1":"/uploads/1786802808298_xr6i.png","image2":"/uploads/1786798624330_u1jz.jpg","image3":"/uploads/1786799287680_vwfq.jpg","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":12,"isNew":true,"isHot":true,"isFeatured":false,"isBestseller":false,"rating":0,"shortDescription":"","description":"лонгслів \nткань кулір 250гм2\nпринт дтф\nдістрес по всьому лонгсліві","details":["дістрес","принт дтф"],"care":[""],"images":["/uploads/1786802808298_xr6i.png","/uploads/1786798624330_u1jz.jpg","/uploads/1786799287680_vwfq.jpg"],"reviewCount":0},{"id":"1786802892510","name":"Double belt shorts Buksy🩸","slug":"product-msugb3ku","price":1349,"category":"shorts","image1":"/uploads/1786802960883_271v.jpg","image2":"/uploads/1786802965153_oedk.jpg","image3":"/uploads/1786802978421_5euu.jpg","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":30,"isNew":false,"isHot":false,"isFeatured":true,"isBestseller":false,"rating":0,"shortDescription":"","description":"Double belt shorts Buksy🩸\nМатеріал: Футер 3х нитка 320/м2\nпринт дтф\nвишивка","details":["принт дтф","вишивка"],"care":[],"originalPrice":1699,"images":["/uploads/1786802960883_271v.jpg","/uploads/1786802965153_oedk.jpg","/uploads/1786802978421_5euu.jpg"],"reviewCount":0},{"id":"test-5grn","name":"Тестовий товар 5 грн","slug":"test-5grn","price":5,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"","image3":"","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":100,"isNew":false,"isHot":true,"isFeatured":false,"isBestseller":false,"rating":0,"shortDescription":"Тестовий товар за 5 грн для перевірки оплати","description":"Тестовий товар для перевірки оплати Monobank","details":[],"care":[],"reviews":[],"images":["/uploads/11231321.jpg"],"reviewCount":0}],
  en: [{"id":"1","name":"Buksy T-Shirt","slug":"buksyshirt","price":10,"originalPrice":1299,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"/uploads/43424234.jpg","image3":"/uploads/12313123133.jpg","sizes":[{"available":true,"name":"S"},{"available":true,"name":"M"},{"available":true,"name":"L"}],"inStock":true,"stock":10,"isNew":false,"isFeatured":false,"isBestseller":false,"rating":5,"shortDescription":"","description":"T-shirt Buksy 🩸 fabric: 2x cooler 240g/2m print: shock print embroidery","details":["Dense 100% cotton 240 g/m²"],"care":["Iron inside out at medium temperature","Do not use bleach","Wash at a temperature of up to 30°C"],"reviews":[],"images":["/uploads/11231321.jpg","/uploads/43424234.jpg","/uploads/12313123133.jpg"],"reviewCount":0},{"id":"1786798484638","name":"Longsleeve BUKSY","slug":"product-msudomfy","price":1349,"category":"longsleeves","image1":"/uploads/1786802808298_xr6i.png","image2":"/uploads/1786798624330_u1jz.jpg","image3":"/uploads/1786799287680_vwfq.jpg","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":12,"isNew":true,"isHot":true,"isFeatured":false,"isBestseller":false,"rating":0,"shortDescription":"","description":"longsword \nCooler fabric 250 gm2\ndtf print\ndistress throughout Longsleeve","details":["distress","dtf print"],"care":[""],"images":["/uploads/1786802808298_xr6i.png","/uploads/1786798624330_u1jz.jpg","/uploads/1786799287680_vwfq.jpg"],"reviewCount":0},{"id":"1786802892510","name":"Double belt shorts Buksy🩸","slug":"product-msugb3ku","price":1349,"category":"shorts","image1":"/uploads/1786802960883_271v.jpg","image2":"/uploads/1786802965153_oedk.jpg","image3":"/uploads/1786802978421_5euu.jpg","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":30,"isNew":false,"isHot":false,"isFeatured":true,"isBestseller":false,"rating":0,"shortDescription":"","description":"Double belt shorts Buksy 🩸\nMaterial: Footer 3x thread 320/m2\ndtf print\nembroidery","details":["dtf print","embroidery"],"care":[],"originalPrice":1699,"images":["/uploads/1786802960883_271v.jpg","/uploads/1786802965153_oedk.jpg","/uploads/1786802978421_5euu.jpg"],"reviewCount":0},{"id":"test-5grn","name":"Test product UAH 5","slug":"test-5grn","price":5,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"","image3":"","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":100,"isNew":false,"isHot":true,"isFeatured":false,"isBestseller":false,"rating":0,"shortDescription":"Test product for UAH 5 to check payment","description":"Test product for Monobank payment verification","details":[],"care":[],"reviews":[],"images":["/uploads/11231321.jpg"],"reviewCount":0}],
  pl: [{"id":"1","name":"Buksy T-Shirt","slug":"buksyshirt","price":10,"originalPrice":1299,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"/uploads/43424234.jpg","image3":"/uploads/12313123133.jpg","sizes":[{"available":true,"name":"S"},{"available":true,"name":"M"},{"available":true,"name":"L"}],"inStock":true,"stock":10,"isNew":false,"isFeatured":false,"isBestseller":false,"rating":5,"shortDescription":"","description":"T-shirt Buksy 🩸 materiał: 2x chłodnica 240g/2m nadruk: haft typu Shock Print","details":["Gęsta 100% bawełna 240 g/m²"],"care":["Prasować na lewej stronie w średniej temperaturze","Nie używaj wybielacza","Prać w temperaturze do 30°C"],"reviews":[],"images":["/uploads/11231321.jpg","/uploads/43424234.jpg","/uploads/12313123133.jpg"],"reviewCount":0},{"id":"1786798484638","name":"Longsleeve BUKSY","slug":"product-msudomfy","price":1349,"category":"longsleeves","image1":"/uploads/1786802808298_xr6i.png","image2":"/uploads/1786798624330_u1jz.jpg","image3":"/uploads/1786799287680_vwfq.jpg","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":12,"isNew":true,"isHot":true,"isFeatured":false,"isBestseller":false,"rating":0,"shortDescription":"","description":"długi miecz \nTkanina chłodząca 250 gm2\nwydruk dtf\nniepokój w całym Longsleeve","details":["rozpacz","wydruk dtf"],"care":[""],"images":["/uploads/1786802808298_xr6i.png","/uploads/1786798624330_u1jz.jpg","/uploads/1786799287680_vwfq.jpg"],"reviewCount":0},{"id":"1786802892510","name":"Double belt shorts Buksy🩸","slug":"product-msugb3ku","price":1349,"category":"shorts","image1":"/uploads/1786802960883_271v.jpg","image2":"/uploads/1786802965153_oedk.jpg","image3":"/uploads/1786802978421_5euu.jpg","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":30,"isNew":false,"isHot":false,"isFeatured":true,"isBestseller":false,"rating":0,"shortDescription":"","description":"Spodenki z podwójnym paskiem Buksy 🩸\nMateriał: Stopka 3x gwint 320/m2\nwydruk dtf\nhaft","details":["wydruk dtf","haft"],"care":[],"originalPrice":1699,"images":["/uploads/1786802960883_271v.jpg","/uploads/1786802965153_oedk.jpg","/uploads/1786802978421_5euu.jpg"],"reviewCount":0},{"id":"test-5grn","name":"Testuj produkt 5 UAH","slug":"test-5grn","price":5,"category":"t-shirts","image1":"/uploads/11231321.jpg","image2":"","image3":"","sizes":[{"name":"S","available":true},{"name":"M","available":true},{"name":"L","available":true}],"inStock":true,"stock":100,"isNew":false,"isHot":true,"isFeatured":false,"isBestseller":false,"rating":0,"shortDescription":"Przetestuj produkt za 5 UAH, aby sprawdzić płatność","description":"Produkt testowy do weryfikacji płatności Monobank","details":[],"care":[],"reviews":[],"images":["/uploads/11231321.jpg"],"reviewCount":0}],
};

export const reviews: Review[] = products.flatMap(p => (p.reviews || []).map((r: Review) => ({ ...r, productId: p.id, productSlug: p.slug })));

export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {"t-shirts":"T-Shirts","longsleeves":"Long Sleeves","shorts":"Shorts"};
  return names[category] || category;
};

export const categories = [{"id":"all","name":"All"},{"id":"t-shirts","name":"T-Shirts"},{"id":"longsleeves","name":"Long Sleeves"},{"id":"shorts","name":"Shorts"}];

export const heroImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200';
export const editorialImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800';
