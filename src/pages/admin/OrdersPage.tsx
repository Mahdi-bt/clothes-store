import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Search, Trash2, Eye, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import OrderReceipt from '../../components/ui/OrderReceipt';

interface OrderItem {
  id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  price_at_time: number;
  discount: number;
  product_variant: {
    size: string;
    color: string;
    sku: string;
    product: {
      name_en: string;
      name_fr: string;
      name_ar: string;
      images: string[];
    };
  };
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  alternate_phone: string | null;
  address: string;
  governorate?: string;
  delegation?: string;
  zip_code?: string;
  email: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'completed';
  created_at: string;
  order_items: OrderItem[];
  delivery_fee: number;
}

const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'status' | 'total' | 'customer' | 'phone' | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'desc'
  });
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const { i18n, t } = useTranslation();
  const [receiptLanguage, setReceiptLanguage] = useState(i18n.language);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_fee,
          order_items(
            *,
            product_variant:product_variants(
              *,
              product:products(
                id,
                name_en,
                name_fr,
                name_ar,
                images
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const transformedData = await Promise.all((data || []).map(async order => {
        const transformedOrder = {
          ...order,
          delivery_fee: order.delivery_fee,
          order_items: await Promise.all(order.order_items.map(async item => {
            const productVariant = item.product_variant;
            const product = productVariant?.product;
            let fallbackImage = (product?.images && product.images[0]) || null;
            if (fallbackImage && !/^https?:\/\//.test(fallbackImage)) {
              const { data: fallbackImageData } = await supabase
                .storage
                .from('products')
                .getPublicUrl(fallbackImage);
              fallbackImage = fallbackImageData?.publicUrl || null;
            }
            return {
              ...item,
              product: {
                ...product,
                images: fallbackImage ? [fallbackImage] : (product?.images || [])
              }
            };
          }))
        };
        return transformedOrder;
      })) as Order[];
      setOrders(transformedData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter orders based on search query and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const handleViewOrder = (order: Order) => {
    setViewOrder(order);
    setIsViewDialogOpen(true);
  };

  const handlePrintReceipt = (order: Order) => {
    setViewOrder(order);
    setIsReceiptDialogOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      
      // Optimistic update
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      );
      setOrders(updatedOrders);

      if (viewOrder?.id === orderId) {
        setViewOrder({ ...viewOrder, status: newStatus });
      }

      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // If marking as completed, decrease product variant quantities
      if (newStatus === 'completed') {
        // Update each product variant's quantity
        for (const item of order.order_items) {
          // First get current stock
          const { data: variantData, error: fetchError } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', item.product_variant_id)
            .single();

          if (fetchError) {
            console.error('Error fetching product variant:', fetchError);
            throw new Error('Failed to fetch product stock');
          }

          const currentStock = variantData.stock;
          if (currentStock < item.quantity) {
            throw new Error('Insufficient stock for one or more products');
          }

          // Update stock
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({ 
              stock: currentStock - item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_variant_id);

          if (updateError) {
            console.error('Error updating product variant stock:', updateError);
            throw new Error('Failed to update product stock');
          }
        }
      }
      
      // If cancelling order, increase product variant quantities
      if (newStatus === 'cancelled') {
        // Update each product variant's quantity
        for (const item of order.order_items) {
          // First get current stock
          const { data: variantData, error: fetchError } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', item.product_variant_id)
            .single();

          if (fetchError) {
            console.error('Error fetching product variant:', fetchError);
            throw new Error('Failed to fetch product stock');
          }

          const currentStock = variantData.stock;

          // Update stock by adding back the quantity
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({ 
              stock: currentStock + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_variant_id);

          if (updateError) {
            console.error('Error updating product variant stock:', updateError);
            throw new Error('Failed to update product stock');
          }
        }
      }

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        // Revert optimistic update on error
        setOrders(orders);
        if (viewOrder?.id === orderId) {
          setViewOrder(viewOrder);
        }
        throw error;
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSort = (key: 'date' | 'status' | 'total' | 'customer' | 'phone') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;

    if (sortConfig.key === 'date') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (sortConfig.key === 'status') {
      const statusOrder = {
        'pending': 0,
        'processing': 1,
        'delivered': 2,
        'completed': 3,
        'cancelled': 4
      };
      const statusA = statusOrder[a.status] || 0;
      const statusB = statusOrder[b.status] || 0;
      return sortConfig.direction === 'asc' ? statusA - statusB : statusB - statusA;
    }

    if (sortConfig.key === 'total') {
      return sortConfig.direction === 'asc' 
        ? a.total_amount - b.total_amount 
        : b.total_amount - a.total_amount;
    }

    if (sortConfig.key === 'customer') {
      return sortConfig.direction === 'asc'
        ? a.customer_name.localeCompare(b.customer_name)
        : b.customer_name.localeCompare(a.customer_name);
    }

    if (sortConfig.key === 'phone') {
      return sortConfig.direction === 'asc'
        ? a.phone.localeCompare(b.phone)
        : b.phone.localeCompare(a.phone);
    }

    return 0;
  });
  
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id);
      
      // Remove the deleted order from the state
      setOrders(orders.filter(order => order.id !== orderToDelete.id));
      
      // Close the view dialog if it's open for the deleted order
      if (viewOrder?.id === orderToDelete.id) {
        setIsViewDialogOpen(false);
      }
      
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('admin.orders.title')}</h1>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder={t('admin.orders.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
            className="border rounded-md px-3 py-2 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="bg-white rounded-md shadow">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('customer')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{t('admin.orders.table.customer')}</span>
                        {sortConfig.key === 'customer' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{t('admin.orders.viewDialog.phone')}</span>
                        {sortConfig.key === 'phone' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{t('admin.orders.table.date')}</span>
                        {sortConfig.key === 'date' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{t('admin.orders.table.total')}</span>
                        {sortConfig.key === 'total' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{t('admin.orders.table.status')}</span>
                        {sortConfig.key === 'status' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">{t('admin.orders.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell className="font-mono">{order.phone}</TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>TND{(order.total_amount + (order.delivery_fee || 0)).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePrintReceipt(order)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(order)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">{t('admin.orders.noOrders')}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.orders.deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.orders.deleteDialog.confirm')}
            </DialogDescription>
          </DialogHeader>
          
          {orderToDelete && (
            <div className="py-4">
              <div className="space-y-2">
                <p><span className="font-medium">Order ID:</span> {orderToDelete.id}</p>
                <p><span className="font-medium">Customer:</span> {orderToDelete.customer_name}</p>
                <p><span className="font-medium">Total Amount:</span> TND{orderToDelete.total_amount.toFixed(2)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {t('admin.orders.deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('admin.orders.deleteDialog.deleting')}
                </div>
              ) : (
                t('admin.orders.deleteDialog.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">{t('admin.orders.viewDialog.title')}</DialogTitle>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-6 sm:space-y-8">
              {/* Status Banner */}
              <div className={`p-3 sm:p-4 rounded-lg ${
                viewOrder.status === 'completed' ? 'bg-green-50 border border-green-200' :
                viewOrder.status === 'processing' ? 'bg-blue-50 border border-blue-200' :
                viewOrder.status === 'cancelled' ? 'bg-red-50 border border-red-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      viewOrder.status === 'completed' ? 'bg-green-500' :
                      viewOrder.status === 'processing' ? 'bg-blue-500' :
                      viewOrder.status === 'cancelled' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="font-medium">
                      {t(`admin.orders.status.${viewOrder.status}`)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(viewOrder.created_at).toLocaleString(i18n.language, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                {/* Customer Information */}
                <div className="bg-white rounded-lg border p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t('admin.orders.viewDialog.customerInfo')}
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('admin.orders.viewDialog.name')}</p>
                      <p className="font-medium break-words">{viewOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('admin.orders.viewDialog.phone')}</p>
                      <p className="font-medium break-words">{viewOrder.phone}</p>
                      {viewOrder.alternate_phone && (
                        <p className="text-sm text-gray-600 mt-1 break-words">{viewOrder.alternate_phone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('admin.orders.viewDialog.address')}</p>
                      <p className="font-medium break-words">{viewOrder.address}</p>
                      {(viewOrder.governorate || viewOrder.delegation) && (
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          {[viewOrder.governorate, viewOrder.delegation].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {viewOrder.zip_code && (
                        <p className="text-sm text-gray-600 break-words">{viewOrder.zip_code}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-white rounded-lg border p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {t('admin.orders.viewDialog.orderInfo')}
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('admin.orders.viewDialog.orderId')}</p>
                      <p className="font-medium break-all">{viewOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('admin.orders.viewDialog.totalAmount')}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>{t('admin.orders.viewDialog.receipt.subtotal')}</span>
                          <span>TND{viewOrder.total_amount.toFixed(2)}</span>
                        </div>
                        {viewOrder.delivery_fee !== undefined && viewOrder.delivery_fee !== null && (
                          <div className="flex justify-between">
                            <span>{t('admin.orders.viewDialog.receipt.delivery')}</span>
                            <span>TND{viewOrder.delivery_fee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg mt-2">
                          <span>{t('admin.orders.viewDialog.receipt.total')}</span>
                          <span className="text-primary">TND{(viewOrder.total_amount + (viewOrder.delivery_fee || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 sm:p-6 border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {t('admin.orders.viewDialog.orderItems')}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[30%] sm:w-[40%]">{t('admin.orders.viewDialog.product')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('admin.orders.viewDialog.variant')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('admin.orders.viewDialog.sku')}</TableHead>
                        <TableHead className="text-right">{t('admin.orders.viewDialog.price')}</TableHead>
                        <TableHead className="text-right">{t('admin.orders.viewDialog.quantity')}</TableHead>
                        <TableHead className="text-right">{t('admin.orders.viewDialog.total')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewOrder.order_items.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="space-y-1">
                              <div>
                                {i18n.language === 'ar' 
                                  ? item.product_variant.product.name_ar 
                                  : i18n.language === 'fr' 
                                    ? item.product_variant.product.name_fr 
                                    : item.product_variant.product.name_en}
                              </div>
                              <div className="sm:hidden text-sm text-gray-500">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {item.product_variant.size} - {item.product_variant.color}
                                </span>
                                <span className="block mt-1 font-mono text-xs">
                                  {item.product_variant.sku}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.product_variant.size} - {item.product_variant.color}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="font-mono text-sm text-gray-600">
                              {item.product_variant.sku}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">TND{item.price_at_time.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">TND{(item.price_at_time * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Actions */}
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => handleUpdateStatus(viewOrder.id, 'processing')}
                  disabled={viewOrder.status === 'processing' || updatingStatus === viewOrder.id}
                  className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  {updatingStatus === viewOrder.id ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('admin.orders.viewDialog.updating')}
                    </div>
                  ) : (
                    t('admin.orders.actions.markProcessing')
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleUpdateStatus(viewOrder.id, 'completed')}
                  disabled={viewOrder.status === 'completed' || updatingStatus === viewOrder.id}
                  className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  {updatingStatus === viewOrder.id ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('admin.orders.viewDialog.updating')}
                    </div>
                  ) : (
                    t('admin.orders.actions.markCompleted')
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleUpdateStatus(viewOrder.id, 'cancelled')}
                  disabled={viewOrder.status === 'cancelled' || updatingStatus === viewOrder.id}
                  className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  {updatingStatus === viewOrder.id ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('admin.orders.viewDialog.updating')}
                    </div>
                  ) : (
                    t('admin.orders.actions.cancelOrder')
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('admin.orders.viewDialog.receipt.title')}</DialogTitle>
          </DialogHeader>

          {/* Language Selection */}
          <div className="flex justify-end mb-4">
            <select
              value={receiptLanguage}
              onChange={(e) => setReceiptLanguage(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Order Receipt */}
          {viewOrder && (
            <OrderReceipt
              order={viewOrder}
              items={viewOrder.order_items}
              language={receiptLanguage}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default OrdersPage;
