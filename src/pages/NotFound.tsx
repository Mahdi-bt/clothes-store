import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('errors.notFound')}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('errors.notFoundMessage')}
        </p>
        <Link to="/">
          <Button className="bg-ecommerce-purple hover:bg-ecommerce-deep-purple">
            {t('common.continueShopping')}
          </Button>
        </Link>
      </div>
    </MainLayout>
  );
};

export default NotFound;
