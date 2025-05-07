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
import { Search, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
}

const OrdersPage = () => {
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
    key: 'date' | 'status' | 'total' | 'customer' | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'desc'
  });
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const { i18n, t } = useTranslation();
  
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

  const handleSort = (key: 'date' | 'status' | 'total' | 'customer') => {
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
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>TND{order.total_amount.toFixed(2)}</TableCell>
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('admin.orders.viewDialog.title')} #{viewOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {viewOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-gray-800">{t('admin.orders.viewDialog.customerInfo')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{viewOrder.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-medium">{viewOrder.phone}</span>
                    </div>
                    {viewOrder.alternate_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Alt. Phone:</span>
                        <span className="font-medium">{viewOrder.alternate_phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address:</span>
                      <span className="font-medium text-right max-w-[200px]">{viewOrder.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Governorate:</span>
                      <span className="font-medium">{viewOrder.governorate || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delegation:</span>
                      <span className="font-medium">{viewOrder.delegation || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Zip Code:</span>
                      <span className="font-medium">{viewOrder.zip_code || '-'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-gray-800">{t('admin.orders.viewDialog.orderInfo')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order ID:</span>
                      <span className="font-medium">{viewOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{new Date(viewOrder.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span>{getStatusBadge(viewOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="font-medium">TND{viewOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">{t('admin.orders.viewDialog.items')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.orders.viewDialog.product')}</TableHead>
                        <TableHead>{t('admin.orders.viewDialog.variant')}</TableHead>
                        <TableHead className="text-right">{t('admin.orders.viewDialog.price')}</TableHead>
                        <TableHead className="text-right">{t('admin.orders.viewDialog.quantity')}</TableHead>
                        <TableHead className="text-right">{t('admin.orders.viewDialog.total')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewOrder.order_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                <img 
                                  src={
                                    item.product_variant.product.images && item.product_variant.product.images[0]
                                      ? item.product_variant.product.images[0]
                                      : '/placeholder.svg'
                                  }
                                  alt={item.product_variant.product[`name_${i18n.language}`] || item.product_variant.product.name_en}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{
                                  (() => {
                                    const p = item.product_variant.product;
                                    if (!p || typeof p !== 'object') return 'Unknown Product';
                                    const lang = i18n.language;
                                    if (typeof p[`name_${lang}`] === 'string' && p[`name_${lang}`]) return p[`name_${lang}`];
                                    if ('name_en' in p && typeof p.name_en === 'string' && p.name_en) return p.name_en;
                                    if ('name_fr' in p && typeof p.name_fr === 'string' && p.name_fr) return p.name_fr;
                                    if ('name_ar' in p && typeof p.name_ar === 'string' && p.name_ar) return p.name_ar;
                                    return 'Unknown Product';
                                  })()
                                }</p>
                                {item.discount > 0 && (
                                  <p className="text-sm text-gray-500">
                                    {item.discount}% off
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="text-gray-500">Size:</span>{' '}
                                <span className="font-medium">{item.product_variant.size}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-gray-500">Color:</span>{' '}
                                <span className="font-medium">{item.product_variant.color}</span>
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="space-y-1">
                              {item.discount > 0 && (
                                <p className="text-sm text-gray-500 line-through">
                                  TND{item.price.toFixed(2)}
                                </p>
                              )}
                              <p className="font-medium">
                                TND{item.price_at_time.toFixed(2)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">{item.quantity}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">
                              TND{(item.price_at_time * item.quantity).toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleUpdateStatus(viewOrder.id, 'processing')}
                    disabled={viewOrder.status === 'processing' || updatingStatus === viewOrder.id}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    {updatingStatus === viewOrder.id ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                        {t('admin.orders.viewDialog.updating')}
                      </div>
                    ) : (
                      'Mark as Processing'
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleUpdateStatus(viewOrder.id, 'completed')}
                    disabled={viewOrder.status === 'completed' || updatingStatus === viewOrder.id}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    {updatingStatus === viewOrder.id ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                        {t('admin.orders.viewDialog.updating')}
                      </div>
                    ) : (
                      'Mark as Completed'
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleUpdateStatus(viewOrder.id, 'cancelled')}
                    disabled={viewOrder.status === 'cancelled' || updatingStatus === viewOrder.id}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  >
                    {updatingStatus === viewOrder.id ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                        {t('admin.orders.viewDialog.updating')}
                      </div>
                    ) : (
                      'Cancel Order'
                    )}
                  </Button>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">{t('admin.orders.viewDialog.totalAmount')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    TND{viewOrder.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default OrdersPage;
