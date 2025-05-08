import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Package, Tag, ClipboardList, LogOut, User, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppLogo } from '@/hooks/useAppLogo';
import LanguageSwitcher from '../LanguageSwitcher';
import { cn } from '@/lib/utils';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { t, i18n } = useTranslation();
  const { logoData } = useAppLogo();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const isRTL = i18n.language === 'ar';
  
  const navItems = [
    { name: t('admin.dashboard.title'), icon: <LayoutGrid size={20} />, path: '/admin' },
    { name: t('admin.products.title'), icon: <Package size={20} />, path: '/admin/products' },
    { name: t('admin.categories.title'), icon: <Tag size={20} />, path: '/admin/categories' },
    { name: t('admin.orders.title'), icon: <ClipboardList size={20} />, path: '/admin/orders' },
    { name: t('admin.settings.title'), icon: <Settings size={20} />, path: '/admin/settings' },
  ];
  
  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : '';
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, []);
  
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="px-4 py-6 border-b flex flex-col items-center">
        {logoData.url ? (
          <img 
            src={logoData.url} 
            alt={`${t('common.appName')} Logo`}
            className="transition-transform hover:scale-105"
            style={{ 
              height: `${logoData.height}px`,
              width: `${logoData.width}px`
            }}
          />
        ) : (
          <Link to="/admin" className="text-xl font-bold text-ecommerce-purple hover:text-ecommerce-light-purple transition-colors">
            {t('common.appName')}
          </Link>
        )}
      </div>
      
      {user && (
        <div className="px-4 py-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="bg-ecommerce-purple rounded-full p-2.5 shadow-sm">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500">{t('admin.role')}</p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-grow px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-gray-50 active:scale-95',
                  isActive(item.path)
                    ? 'bg-ecommerce-light-purple text-ecommerce-purple font-medium shadow-sm'
                    : 'text-gray-600 hover:text-ecommerce-purple'
                )}
                onClick={() => {
                  if (isMobile) {
                    setIsMobileMenuOpen(false);
                    document.body.style.overflow = '';
                  }
                }}
              >
                <span className={cn(
                  'mr-3 transition-colors',
                  isActive(item.path) ? 'text-ecommerce-purple' : 'text-gray-400'
                )}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="px-4 py-4 border-t space-y-4 bg-gray-50">
        <LanguageSwitcher />
        <Button
          variant="outline"
          className="w-full flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          onClick={logout}
        >
          <LogOut size={18} className="mr-2" />
          {t('admin.logout')}
        </Button>
      </div>
    </div>
  );
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        className={cn(
          "fixed top-4 z-50 md:hidden bg-white rounded-lg p-2 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors",
          isRTL ? "right-4" : "left-4"
        )}
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'h-full',
        isMobile ? 'fixed inset-y-0 z-40 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out' : 'w-full',
        isRTL ? 'right-0' : 'left-0',
        isMobile && isMobileMenuOpen 
          ? 'translate-x-0' 
          : isMobile && isRTL 
            ? 'translate-x-full' 
            : isMobile 
              ? '-translate-x-full' 
              : 'translate-x-0'
      )}>
        <SidebarContent />
      </div>
    </>
  );
};

export default AdminSidebar;
