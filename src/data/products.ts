import { Product, Review } from '../types';

export const products: Product[] = [
  {
    "id": "4",
    "name": "ABYSS CARGO PANTS",
    "slug": "abyss-cargo-pants",
    "price": 209,
    "category": "pants",
    "sizes": [
      {
        "name": "28",
        "available": true
      },
      {
        "name": "30",
        "available": true
      },
      {
        "name": "32",
        "available": true
      },
      {
        "name": "34",
        "available": true
      },
      {
        "name": "36",
        "available": false
      }
    ],
    "inStock": true,
    "isNew": true,
    "rating": 4.7,
    "shortDescription": "Карго штани з парашутним силуетом та знімними ременями, натхненні японським дизайном.",
    "description": "Abyss Cargo Pants переосмислюють форму карго через призму японського дизайну. Виготовлені з важкої бавовни з еластаном, штани мають знімні ремені на литках, регульовані манжети та фірмову вишивку на задній кишені. Конструкція з 8 кишенями забезпечує функціональність, а вільний крій — неперевершений комфорт.",
    "details": [
      "Важка бавовна з еластаном",
      "Парашутний силует зі знімними ременями",
      "Регульовані манжети на липучках",
      "Вісім кишень різного призначення",
      "Фірмова вишивка на задній кишені"
    ],
    "reviews": [],
    "image1": "https://images.pexels.com/photos/12982896/pexels-photo-12982896.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/1598503/pexels-photo-1598503.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=800",
    "care": [],
    "reviewCount": 0,
    "images": [
      "https://images.pexels.com/photos/12982896/pexels-photo-12982896.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1598503/pexels-photo-1598503.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    "id": "5",
    "name": "BLOOD MOON CHAIN",
    "slug": "blood-moon-chain",
    "price": 149,
    "category": "accessories",
    "sizes": [
      {
        "name": "18\"",
        "available": true
      },
      {
        "name": "20\"",
        "available": true
      },
      {
        "name": "22\"",
        "available": true
      },
      {
        "name": "24\"",
        "available": false
      }
    ],
    "inStock": true,
    "isFeatured": true,
    "rating": 4.9,
    "shortDescription": "Масивний ланцюг зі стерлінгового срібла 925 з 24k позолотою. Ручна робота.",
    "description": "Blood Moon Chain — це більше ніж прикраса, це заява. Виготовлений вручну зі стерлінгового срібла 925, ланцюг покритий 24-каратним золотом методом гальваніки. Застібка-карабін та гравіювання логотипу на бірці завершують образ. Кожен ланцюг проходить 5 етапів полірування для досягнення фірмового блиску.",
    "details": [
      "Стерлінгове срібло 925",
      "24k позолота методом гальваніки",
      "Застібка-карабін ручної роботи",
      "Гравіювання логотипу на бірці",
      "Довжина: 50 см (20\")"
    ],
    "care": [
      "Уникати контакту з водою та парфумами",
      "Зберігати у фірмовому мішечку",
      "Полірувати м'якою тканиною без абразивів"
    ],
    "reviews": [],
    "image1": "https://images.pexels.com/photos/11229341/pexels-photo-11229341.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/12982896/pexels-photo-12982896.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/723509/pexels-photo-723509.jpeg?auto=compress&cs=tinysrgb&w=800",
    "reviewCount": 0,
    "images": [
      "https://images.pexels.com/photos/11229341/pexels-photo-11229341.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/12982896/pexels-photo-12982896.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/723509/pexels-photo-723509.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    "id": "6",
    "name": "FALLEN ANGEL BOOTS",
    "slug": "fallen-angel-boots",
    "price": 389,
    "category": "footwear",
    "sizes": [
      {
        "name": "39",
        "available": true
      },
      {
        "name": "40",
        "available": true
      },
      {
        "name": "41",
        "available": true
      },
      {
        "name": "42",
        "available": true
      },
      {
        "name": "43",
        "available": false
      },
      {
        "name": "44",
        "available": true
      }
    ],
    "inStock": true,
    "isNew": true,
    "isBestseller": true,
    "rating": 4.8,
    "shortDescription": "Шкіряні черевики на масивній підошві з тисненим логотипом та посиленою конструкцією.",
    "description": "Fallen Angel Boots — це втілення брутальної естетики BUKSY. Верх з преміальної шкіри, масивна гумова підошва з глибоким протектором, посилений носок та задник. Металеві люверси для шнурівки додають індустріального характеру. Кожна пара збирається вручну на португальській мануфактурі з використанням технології Goodyear welt.",
    "details": [
      "Верх з преміальної шкіри",
      "Масивна гумова підошва (35 мм)",
      "Конструкція Goodyear welt",
      "Посилені носок та задник",
      "Металеві люверси для шнурівки"
    ],
    "care": [
      "Регулярно чистити м'якою щіткою та спеціальним кремом для шкіри",
      "Використовувати колодки для збереження форми",
      "Уникати тривалого намокання",
      "Зберігати в дихаючому чохлі подалі від прямих сонячних променів"
    ],
    "reviews": [
      {
        "id": "4",
        "author": "Sarah M.",
        "rating": 5,
        "title": "Ідеальна пара",
        "content": "Вражаюча якість. Так, вони важкі, але це частина їхнього характеру. Розносилися за два дні, тепер сидять як влиті. Матеріали преміальні, конструкція бездоганна. Найкращі черевики у моїй колекції.",
        "date": "2023-12-28",
        "verified": true
      }
    ],
    "image1": "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/16196537/pexels-photo-16196537.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/267301/pexels-photo-267301.jpeg?auto=compress&cs=tinysrgb&w=800",
    "reviewCount": 1,
    "images": [
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/16196537/pexels-photo-16196537.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/267301/pexels-photo-267301.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    "id": "3",
    "name": "OBSCURA LEATHER JACKET",
    "slug": "obscura-leather-jacket",
    "price": 549,
    "originalPrice": 699,
    "category": "jackets",
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
      },
      {
        "name": "XL",
        "available": false
      }
    ],
    "inStock": true,
    "isFeatured": true,
    "isBestseller": true,
    "rating": 5,
    "shortDescription": "Шкіряна куртка з італійської шкіри повного зерна, фурнітура YKK, підкладка з віскози.",
    "description": "Куртка Obscura Leather Jacket — це маніфест безкомпромісної майстерності. Виготовлена з італійської шкіри повного зерна, вона має асиметричну блискавку YKK, підкладку з віскози та фірмові нашивки на плечах. Кожна куртка проходить 12-етапний процес обробки шкіри, включаючи ручне полірування країв. З віком шкіра набуває унікальної патини, роблячи кожен виріб по-справжньому індивідуальним.",
    "details": [
      "Італійська шкіра повного зерна",
      "Асиметрична блискавка YKK",
      "Підкладка з віскози",
      "Чотири зовнішні кишені, дві внутрішні",
      "Фірмові металеві нашивки на плечах"
    ],
    "care": [
      "Професійна чистка шкіри раз на рік",
      "Не прати у воді, уникати потрапляння дощу",
      "Кондиціонер для шкіри раз на квартал",
      "Зберігати на широких плічках у дихаючому чохлі"
    ],
    "reviews": [
      {
        "id": "3",
        "author": "Dante R.",
        "rating": 4,
        "title": "Чудова робота",
        "content": "Шкіра неймовірно м'яка прямо з коробки. Єдине — розмір трохи більший, ніж очікував, але після кількох днів носіння куртка сіла по фігурі. Загалом дуже задоволений якістю та дизайном.",
        "date": "2024-01-05",
        "verified": true
      }
    ],
    "image1": "https://images.pexels.com/photos/1126964/pexels-photo-1126964.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/10409446/pexels-photo-10409446.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/16196537/pexels-photo-16196537.jpeg?auto=compress&cs=tinysrgb&w=800",
    "reviewCount": 1,
    "images": [
      "https://images.pexels.com/photos/1126964/pexels-photo-1126964.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/10409446/pexels-photo-10409446.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/16196537/pexels-photo-16196537.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    "id": "7",
    "name": "RITUAL ZIP HOODIE",
    "slug": "ritual-zip-hoodie",
    "price": 219,
    "category": "hoodies",
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
        "available": false
      },
      {
        "name": "XL",
        "available": true
      }
    ],
    "inStock": true,
    "rating": 4.6,
    "shortDescription": "Худі на блискавці з важкої бавовни 400 г/м² з контрастною фурнітурою та декоративними швами.",
    "description": "Ritual Zip Hoodie поєднує класичний силует худі на блискавці з фірмовою естетикою BUKSY. Виготовлене з важкої бавовни 400 г/м², худі має контрастну блискавку YKK, посилені ліктьові вставки, регульований капюшон та внутрішню кишеню для навушників. Декоративна строчка на плечах і спині створює впізнаваний силует бренду.",
    "details": [
      "Важка бавовна 400 г/м²",
      "Контрастна блискавка YKK з логотипом",
      "Посилені ліктьові вставки",
      "Внутрішня кишеня для навушників",
      "Декоративна строчка на плечах"
    ],
    "reviews": [],
    "image1": "https://images.pexels.com/photos/6311390/pexels-photo-6311390.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/17854971/pexels-photo-17854971.jpeg?auto=compress&cs=tinysrgb&w=800",
    "care": [],
    "reviewCount": 0,
    "images": [
      "https://images.pexels.com/photos/6311390/pexels-photo-6311390.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/17854971/pexels-photo-17854971.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    "id": "2",
    "name": "SACRIFICE TEE",
    "slug": "sacrifice-tee",
    "price": 89,
    "category": "t-shirts",
    "sizes": [
      {
        "name": "XS",
        "available": true
      },
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
      },
      {
        "name": "XL",
        "available": true
      },
      {
        "name": "XXL",
        "available": true
      }
    ],
    "inStock": true,
    "isFeatured": true,
    "isBestseller": true,
    "rating": 4.8,
    "shortDescription": "Футболка з важкої бавовни 180 г/м² з ензимним пранням та рельєфною графікою на спині.",
    "description": "Sacrifice Tee — наша відповідь на запит про ідеальну футболку. Створена з преміальної бавовни 180 г/м², оброблена stone-wash для м'якості, яку зазвичай знаходиш лише у вінтажних речах. Ребристий комір зберігає форму, а посилені плечові шви гарантують довговічність. Рельєфний принт на спині створює фірмовий вигляд.",
    "details": [
      "Важка бавовна 180 г/м²",
      "Обробка stone-wash для м'якості",
      "Ребристий комір, що не розтягується",
      "Посилені плечові шви",
      "Рельєфний принт на спині"
    ],
    "reviews": [
      {
        "id": "2",
        "author": "Elena K.",
        "rating": 5,
        "title": "М'якість неймовірна",
        "content": "Замовила цю футболку після того, як побачила її в лукбуці. Якість перевершила всі очікування. Тканина приємна до тіла, а крій достатньо вільний для повсякденного носіння. Колір і текстура — саме те, що я шукала.",
        "date": "2024-01-10",
        "verified": true
      }
    ],
    "image1": "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/17854971/pexels-photo-17854971.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=800",
    "care": [],
    "reviewCount": 1,
    "images": [
      "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/17854971/pexels-photo-17854971.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    "id": "8",
    "name": "SHADOW TECH PANTS",
    "slug": "shadow-tech-pants",
    "price": 179,
    "category": "pants",
    "sizes": [
      {
        "name": "28",
        "available": false
      },
      {
        "name": "30",
        "available": true
      },
      {
        "name": "32",
        "available": true
      },
      {
        "name": "34",
        "available": true
      },
      {
        "name": "36",
        "available": true
      }
    ],
    "inStock": true,
    "rating": 4.5,
    "shortDescription": "Технологічні штани з тканини shadow-tech з вентиляційними вставками та водовідштовхувальним покриттям.",
    "description": "Shadow Tech Pants створені для міських умов. Тканина shadow-tech забезпечує водовідштовхування, вітрозахист та повітропроникність. Штани мають вентиляційні вставки на стегнах, регульований пояс, посилені коліна та гнучкі вставки для максимальної свободи рухів. Ідеальний вибір для динамічного міського життя.",
    "details": [
      "Тканина shadow-tech (водовідштовхувальна, вітрозахисна)",
      "Вентиляційні вставки на стегнах",
      "Регульований пояс",
      "Посилені коліна",
      "Гнучкі вставки для свободи рухів"
    ],
    "reviews": [],
    "image1": "https://images.pexels.com/photos/1598503/pexels-photo-1598503.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/10409446/pexels-photo-10409446.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=800",
    "care": [],
    "reviewCount": 0,
    "images": [
      "https://images.pexels.com/photos/1598503/pexels-photo-1598503.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/10409446/pexels-photo-10409446.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  },
  {
    "id": "1",
    "name": "VOID OVERSIZED HOODIE",
    "slug": "void-oversized-hoodie",
    "price": 189,
    "category": "hoodies",
    "sizes": [
      {
        "name": "XS",
        "available": true
      },
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
      },
      {
        "name": "XL",
        "available": true
      },
      {
        "name": "XXL",
        "available": false
      }
    ],
    "inStock": true,
    "isNew": true,
    "isFeatured": true,
    "isBestseller": false,
    "rating": 4.9,
    "shortDescription": "Преміальне оверсайз худі з важкої бавовни 400 г/м². Вільний крій, спущене плече, внутрішнє плетіння з начосом.",
    "description": "Void Oversized Hoodie виготовлене з важкої 100% бавовни щільністю 400 г/м². Масивний капюшон з подвійною куліскою, посилені шви на плечах, манжети з ребристого трикотажу. Боковий шов винесений вперед для анатомічної посадки. Передня кишеня-кенгуру з прихованим відділенням для телефону. Випране ензимами для м'якості — худи готове до носіння одразу.",
    "details": [
      "100% важка бавовна (400 г/м²)",
      "Оверсайз крій зі спущеним плечем",
      "Посилені ребристі манжети та низ",
      "Подвійна куліска капюшона",
      "Кишеня-кенгуру з прихованим відділенням"
    ],
    "care": [
      "Прати вивернутим у холодній воді, делікатний режим",
      "Не відбілювати",
      "Сушити на повітрі, не використовувати сушильну машину",
      "Прасувати з вивороту при низькій температурі"
    ],
    "reviews": [
      {
        "id": "1",
        "author": "Marcus V.",
        "rating": 5,
        "title": "Найкраще худі в моєму гардеробі",
        "content": "Рідко зустрічаєш таку якість. Тканина важка й тепла, але при цьому дихає. Крій ідеальний — достатньо вільний, але не мішкуватий. Це вже моє друге замовлення BUKSY, і точно не останнє. Рекомендую всім, хто цінує якісний стрітвір.",
        "date": "2024-01-15",
        "verified": true
      }
    ],
    "image1": "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image2": "https://images.pexels.com/photos/6311390/pexels-photo-6311390.jpeg?auto=compress&cs=tinysrgb&w=800",
    "image3": "https://images.pexels.com/photos/17854971/pexels-photo-17854971.jpeg?auto=compress&cs=tinysrgb&w=800",
    "reviewCount": 1,
    "images": [
      "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/6311390/pexels-photo-6311390.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/17854971/pexels-photo-17854971.jpeg?auto=compress&cs=tinysrgb&w=800"
    ]
  }
];

export const reviews: Review[] = products.flatMap(p => (p.reviews || []).map((r: Review) => ({ ...r, productId: p.id, productSlug: p.slug })));

export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {"pants":"Pants","accessories":"Accessories","footwear":"Footwear","jackets":"Jackets","hoodies":"Hoodies","t-shirts":"T-Shirts"};
  return names[category] || category;
};

export const categories = [{"id":"all","name":"All"},{"id":"pants","name":"Pants"},{"id":"accessories","name":"Accessories"},{"id":"footwear","name":"Footwear"},{"id":"jackets","name":"Jackets"},{"id":"hoodies","name":"Hoodies"},{"id":"t-shirts","name":"T-Shirts"}];

export const heroImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200';
export const editorialImage = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800';
