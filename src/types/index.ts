export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  images: string[];
  image1?: string;
  image2?: string;
  image3?: string;
  sizes: Size[];
  colors?: string[];
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  rating: number;
  reviewCount: number;
  stock?: number;
  details?: string[];
  care?: string[];
  reviews?: Review[];
}

export type ProductCategory =
  | 'hoodies'
  | 't-shirts'
  | 'jackets'
  | 'pants'
  | 'accessories'
  | 'footwear';

export interface Size {
  name: string;
  available: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date?: string;
  verified: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
