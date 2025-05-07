
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-ecommerce-dark-purple text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and about */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-bold">QuickShop</Link>
            <p className="mt-4 text-gray-300">
              Your one-stop shop for quality products with fast delivery and excellent service.
            </p>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/shop" className="text-gray-300 hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/cart" className="text-gray-300 hover:text-white transition-colors">Cart</Link></li>
              <li><Link to="/checkout" className="text-gray-300 hover:text-white transition-colors">Checkout</Link></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><Link to="/category/1" className="text-gray-300 hover:text-white transition-colors">Electronics</Link></li>
              <li><Link to="/category/2" className="text-gray-300 hover:text-white transition-colors">Clothing</Link></li>
              <li><Link to="/category/3" className="text-gray-300 hover:text-white transition-colors">Home & Kitchen</Link></li>
              <li><Link to="/category/4" className="text-gray-300 hover:text-white transition-colors">Books</Link></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Email: support@quickshop.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 E-Commerce St, Shopping City, SC 12345</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} QuickShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
