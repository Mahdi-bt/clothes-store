import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface ContactInfo {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  logo_url?: string;
  logo_height?: number;
  logo_width?: number;
  store_description_en?: string;
  store_description_fr?: string;
  store_description_ar?: string;
}

interface Category {
  id: number;
  name_en: string;
  name_fr: string;
  name_ar: string;
}

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    logo_url: '',
    logo_height: 100,
    logo_width: 100,
    store_description_en: '',
    store_description_fr: '',
    store_description_ar: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contact info
        const { data: contactData, error: contactError } = await supabase
          .from('delivery_settings')
          .select('contact_email, contact_phone, contact_address, logo_url, logo_height, logo_width, store_description_en, store_description_fr, store_description_ar')
          .single();

        if (contactError) throw contactError;
        if (contactData) {
          setContactInfo(contactData);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name_en, name_fr, name_ar')
          .order('id');

        if (categoriesError) throw categoriesError;
        if (categoriesData) {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching footer data:', error);
      }
    };

    fetchData();
  }, []);

  const getCategoryName = (category: Category) => {
    switch (currentLanguage) {
      case 'fr':
        return category.name_fr;
      case 'ar':
        return category.name_ar;
      default:
        return category.name_en;
    }
  };

  const getStoreDescription = () => {
    switch (currentLanguage) {
      case 'fr':
        return contactInfo.store_description_fr || contactInfo.store_description_en || 'Your one-stop shop for quality products with fast delivery and excellent service.';
      case 'ar':
        return contactInfo.store_description_ar || contactInfo.store_description_en || 'Your one-stop shop for quality products with fast delivery and excellent service.';
      default:
        return contactInfo.store_description_en || 'Your one-stop shop for quality products with fast delivery and excellent service.';
    }
  };

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
          {/* Logo and About Section */}
          <div className="space-y-4">
            {contactInfo.logo_url ? (
              <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                <Link to="/" className="flex items-center">
                  <img 
                    src={contactInfo.logo_url} 
                    alt="Store Logo" 
                    style={{ 
                      height: `${contactInfo.logo_height}px`,
                      width: `${contactInfo.logo_width}px`
                    }} 
                    className="hover:opacity-90 transition-opacity"
                  />
                </Link>
              </div>
            ) : (
              <Link to="/" className="text-2xl font-bold hover:text-blue-400 transition-colors">
                QuickShop
              </Link>
            )}
            <p className="text-gray-400 leading-relaxed text-sm">
              {getStoreDescription()}
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors transform hover:scale-110 duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors transform hover:scale-110 duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors transform hover:scale-110 duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-blue-400/30 pb-2 inline-block">
              {t('common.categories')}
            </h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link 
                    to={`/category/${category.id}`} 
                    className="text-gray-400 hover:text-blue-400 transition-colors flex items-center group"
                  >
                    <span className={`w-1.5 h-1.5 bg-blue-400 rounded-full ${currentLanguage === 'ar' ? 'ml-2' : 'mr-2'} group-hover:scale-150 transition-transform duration-300`}></span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300 text-sm">
                      {getCategoryName(category)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-blue-400/30 pb-2 inline-block">
              {t('checkout.deliveryInfo')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 group">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400 group-hover:text-blue-400 transition-colors text-sm">{contactInfo.contact_email || 'support@quickshop.com'}</span>
              </li>
              <li className="flex items-start space-x-3 group">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-400 group-hover:text-blue-400 transition-colors text-sm">{contactInfo.contact_phone || '+1 (555) 123-4567'}</span>
              </li>
              <li className="flex items-start space-x-3 group">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400 group-hover:text-blue-400 transition-colors text-sm">{contactInfo.contact_address || '123 E-Commerce St, Shopping City, SC 12345'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-400/20 mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-gray-500 text-xs">
              &copy; {new Date().getFullYear()} QuickShop. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-blue-400 text-xs transition-colors hover:underline">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-blue-400 text-xs transition-colors hover:underline">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-blue-400 text-xs transition-colors hover:underline">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
