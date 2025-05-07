import { Product, Category, Order } from '../types';

export const categories: Category[] = [
  { id: '1', name: 'Electronics' },
  { id: '2', name: 'Clothing' },
  { id: '3', name: 'Home & Kitchen' },
  { id: '4', name: 'Books' },
  { id: '5', name: 'Beauty' },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation technology. Perfect for music lovers who want to enjoy their favorite tunes without any distractions.',
    original_price: 199.99,
    selling_price: 179.99,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '1',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Smart Watch',
    description: 'A sleek smartwatch with health tracking features, notifications, and long battery life.',
    original_price: 299.99,
    selling_price: 299.99,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '1',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Designer T-Shirt',
    description: 'Premium cotton t-shirt with a modern design.',
    original_price: 49.99,
    selling_price: 42.49,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '2',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Denim Jeans',
    description: 'Classic denim jeans with a comfortable fit.',
    original_price: 79.99,
    selling_price: 79.99,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '2',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Coffee Maker',
    description: 'Automatic coffee maker with programmable settings.',
    original_price: 129.99,
    selling_price: 103.99,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '3',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Non-Stick Cookware Set',
    description: 'Complete set of non-stick cookware for your kitchen.',
    original_price: 199.99,
    selling_price: 199.99,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '3',
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Bestselling Novel',
    description: 'The latest bestselling fiction novel that everyone is talking about.',
    original_price: 24.99,
    selling_price: 24.99,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '4',
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Skincare Set',
    description: 'Complete skincare routine set for all skin types.',
    original_price: 89.99,
    selling_price: 85.49,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category_id: '5',
    created_at: new Date().toISOString(),
  },
];

export const orders: Order[] = [
  {
    id: '1',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '123-456-7890',
    shipping_address: '123 Main St, City, Country',
    status: 'pending',
    total_amount: products[0].selling_price + (products[2].selling_price * 2),
    created_at: new Date().toISOString(),
    order_items: [
      {
        id: '1',
        order_id: '1',
        product_id: '1',
        quantity: 1,
        price: products[0].selling_price,
        product: products[0]
      },
      {
        id: '2',
        order_id: '1',
        product_id: '3',
        quantity: 2,
        price: products[2].selling_price,
        product: products[2]
      }
    ]
  }
];
