import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Menu, X, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryService } from '../../lib/services/categoryService';
import { Category } from '../../types';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppLogo } from '@/hooks/useAppLogo';
import { supabase } from '@/lib/supabase';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { logoData } = useAppLogo();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);
  
  // Helper to get localized category name
  const getLocalizedCategoryName = (category: Category) => {
    const lang = i18n.language;
    return category[`name_${lang}`] || category.name_en;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src={logoData.url} 
                alt="AlmatjarX Logo" 
                style={{ 
                  height: `${logoData.height}px`,
                  width: `${logoData.width}px`
                }} 
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <Link to="/" className="text-gray-700 hover:text-ecommerce-purple transition-colors">
                  {t('common.home')}
                </Link>
              </li>
              <li className="relative group">
                <button className="text-gray-700 hover:text-ecommerce-purple transition-colors flex items-center">
                  {t('common.categories')}
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="py-2">
                    {!loading && categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/category/${category.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-ecommerce-light-purple hover:text-ecommerce-deep-purple"
                      >
                        {getLocalizedCategoryName(category)}
                      </Link>
                    ))}
                    {loading && (
                      <div className="px-4 py-2 text-sm text-gray-500">{t('common.loading')}</div>
                    )}
                  </div>
                </div>
              </li>
            </ul>
          </nav>
          
          {/* Desktop Right-side icons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Change Language">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
                  {t('common.languages.en')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage('fr')}>
                  {t('common.languages.fr')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage('ar')}>
                  {t('common.languages.ar')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" aria-label="Shopping Cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ecommerce-purple text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Link to="/cart" className="relative mr-4">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-ecommerce-purple text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-ecommerce-purple focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-md">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-ecommerce-light-purple hover:text-ecommerce-deep-purple">
              {t('common.home')}
            </Link>
            {!loading && categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-ecommerce-light-purple hover:text-ecommerce-deep-purple"
              >
                {getLocalizedCategoryName(category)}
              </Link>
            ))}
            {loading && (
              <div className="px-3 py-2 text-base text-gray-500">{t('common.loading')}</div>
            )}
            <Link to="/cart" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-ecommerce-light-purple hover:text-ecommerce-deep-purple">
              {t('cart.title')} ({totalItems})
            </Link>
            {/* Mobile Language Switcher */}
            <div className="px-3 py-2">
              <div className="text-base font-medium text-gray-700 mb-2">{t('common.language')}</div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => i18n.changeLanguage('en')}
                  className="flex-1"
                >
                  {t('common.languages.en')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => i18n.changeLanguage('fr')}
                  className="flex-1"
                >
                  {t('common.languages.fr')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => i18n.changeLanguage('ar')}
                  className="flex-1"
                >
                  {t('common.languages.ar')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
