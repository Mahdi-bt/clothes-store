import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Twitter, Music } from 'lucide-react';

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
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  facebook_url_fr?: string;
  instagram_url_fr?: string;
  twitter_url_fr?: string;
  tiktok_url_fr?: string;
  facebook_url_ar?: string;
  instagram_url_ar?: string;
  twitter_url_ar?: string;
  tiktok_url_ar?: string;
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
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    tiktok_url: '',
    facebook_url_fr: '',
    instagram_url_fr: '',
    twitter_url_fr: '',
    tiktok_url_fr: '',
    facebook_url_ar: '',
    instagram_url_ar: '',
    twitter_url_ar: '',
    tiktok_url_ar: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contact info and social media links
        const { data: contactData, error: contactError } = await supabase
          .from('delivery_settings')
          .select(`
            contact_email, 
            contact_phone, 
            contact_address, 
            logo_url, 
            logo_height, 
            logo_width, 
            store_description_en, 
            store_description_fr, 
            store_description_ar,
            facebook_url,
            instagram_url,
            twitter_url,
            tiktok_url,
            facebook_url_fr,
            instagram_url_fr,
            twitter_url_fr,
            tiktok_url_fr,
            facebook_url_ar,
            instagram_url_ar,
            twitter_url_ar,
            tiktok_url_ar
          `)
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

  const getSocialMediaUrl = (platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok') => {
    const baseUrl = contactInfo[`${platform}_url`];
    const localizedUrl = contactInfo[`${platform}_url_${currentLanguage}`];
    return localizedUrl || baseUrl;
  };

  const SocialMediaLink = ({ 
    platform, 
    url, 
    icon: Icon, 
    color 
  }: { 
    platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok';
    url?: string;
    icon: React.ElementType;
    color: string;
  }) => {
    if (!url) return null;
    
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-400 hover:text-blue-400 transition-colors transform hover:scale-110 duration-300"
        aria-label={`Visit our ${platform} page`}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </a>
    );
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
              <SocialMediaLink 
                platform="facebook" 
                url={getSocialMediaUrl('facebook')} 
                icon={Facebook} 
                color="#1877F2" 
              />
              <SocialMediaLink 
                platform="instagram" 
                url={getSocialMediaUrl('instagram')} 
                icon={Instagram} 
                color="#E4405F" 
              />
              <SocialMediaLink 
                platform="twitter" 
                url={getSocialMediaUrl('twitter')} 
                icon={Twitter} 
                color="#1DA1F2" 
              />
              <SocialMediaLink 
                platform="tiktok" 
                url={getSocialMediaUrl('tiktok')} 
                icon={Music} 
                color="#000000" 
              />
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
              &copy; {new Date().getFullYear()} Developed by Ben Tamansourt Mahdi
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
