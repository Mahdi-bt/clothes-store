import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { Order, OrderItem } from '../../types';

interface OrderReceiptProps {
  order: Order;
  items: OrderItem[];
  language: string;
}

const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, items, language }) => {
  const { t, i18n } = useTranslation();
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const formatDate = (date: string) => {
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'TND'
    }).format(price);
  };

  const getLocalizedProductName = (item: OrderItem) => {
    switch (language) {
      case 'ar':
        return item.product_variant.product.name_ar;
      case 'fr':
        return item.product_variant.product.name_fr;
      default:
        return item.product_variant.product.name_en;
    }
  };

  return (
    <div className="relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <button
        onClick={handlePrint}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors print:hidden z-10"
      >
        <Printer className="w-4 h-4" />
        {t('admin.orders.viewDialog.printReceipt')}
      </button>

      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-full sm:max-w-2xl mx-auto print:shadow-none print:p-0 w-[95vw] min-h-[60vh] overflow-y-auto print:shadow-none">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 print:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{t('admin.orders.viewDialog.receipt.title')}</h1>
          <p className="text-gray-600 text-xs sm:text-base">
            {t('admin.orders.viewDialog.receipt.orderNumber')} {order.id}
          </p>
          <p className="text-gray-600 text-xs sm:text-base">{formatDate(order.created_at)}</p>
        </div>

        {/* Customer Info */}
        <div className="mb-6 sm:mb-8 print:mb-4">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('admin.orders.viewDialog.receipt.customer')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <p className="text-gray-600 break-words">{order.customer_name}</p>
              <p className="text-gray-600 break-words">{order.customer_phone}</p>
              {order.customer_alt_phone && (
                <p className="text-gray-600 break-words">{order.customer_alt_phone}</p>
              )}
            </div>
            <div>
              <p className="text-gray-600 break-words">{order.customer_address}</p>
              <p className="text-gray-600 break-words">
                {order.customer_governorate}, {order.customer_delegation}
              </p>
              {order.customer_zip_code && (
                <p className="text-gray-600 break-words">{order.customer_zip_code}</p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6 sm:mb-8 print:mb-4">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('admin.orders.viewDialog.receipt.items')}</h2>
          <div className="border-t border-b border-gray-200">
            {items.map((item) => (
              <div key={item.id} className="py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {getLocalizedProductName(item)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t('admin.orders.viewDialog.size')}: {item.product_variant.size} - {t('admin.orders.viewDialog.color')}: {item.product_variant.color}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 font-mono">
                    {/* SKU is not present in product_variant, so we skip it */}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-xs sm:text-base">{formatPrice(item.price_at_time)}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{t('admin.orders.viewDialog.quantity')}: {item.quantity}</p>
                  <p className="text-xs sm:text-sm font-medium">{formatPrice(item.price_at_time * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 pt-3 sm:pt-4">
          <div className="flex justify-between mb-1 sm:mb-2 text-xs sm:text-base">
            <span>{t('admin.orders.viewDialog.receipt.subtotal')}</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
          {order.delivery_fee !== undefined && order.delivery_fee !== null && (
            <div className="flex justify-between mb-1 sm:mb-2 text-xs sm:text-base">
              <span>{t('admin.orders.viewDialog.receipt.delivery')}</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base sm:text-lg mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-200">
            <span>{t('admin.orders.viewDialog.receipt.total')}</span>
            <span>{formatPrice(order.delivery_fee !== undefined && order.delivery_fee !== null ? order.total_amount + order.delivery_fee : order.total_amount)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center print:mt-4">
          <p className="text-gray-600 text-xs sm:text-base">{t('admin.orders.viewDialog.receipt.thankYou')}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            .print\\:shadow-none,
            .print\\:shadow-none * {
              visibility: visible !important;
            }
            .print\\:shadow-none {
              position: static !important;
              margin: 0 !important;
              padding: 0 !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              background: white !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default OrderReceipt;