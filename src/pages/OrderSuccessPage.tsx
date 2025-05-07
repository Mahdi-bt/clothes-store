import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OrderSuccessPage = () => {
  const { t } = useTranslation();
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-6">
            <CheckCircle size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('orderSuccess.title')}</h1>
          
          <p className="text-gray-600 mb-6">
            {t('orderSuccess.message')}
          </p>
          
          <div className="space-y-4">
            <Link to="/">
              <Button className="w-full bg-ecommerce-purple hover:bg-ecommerce-deep-purple transition-colors">
                {t('orderSuccess.continueShopping')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderSuccessPage;
