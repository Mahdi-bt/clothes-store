import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageIcon, TagIcon, ShoppingBagIcon, CreditCardIcon, DatabaseIcon, CalendarIcon } from 'lucide-react';
import { productService } from '../../lib/services/productService';
import { categoryService } from '../../lib/services/categoryService';
import { orderService } from '../../lib/services/orderService';
import { databaseService } from '../../lib/services/databaseService';
import { Product, Category } from '../../types';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  TooltipProps
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  price_at_time: number;
  discount: number;
  product_variant: {
    size: string;
    color: string;
    product: Product;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'completed';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  order_items: OrderItem[];
}

interface BestSeller {
  product_variant: {
    size: string;
    color: string;
    product: Product;
  };
  total_sold: number;
  total_revenue: number;
}

interface DatabaseUsage {
  stats: {
    totalSize: number;
    indexSize: number;
    activeConnections: number;
    tableCount: number;
  };
  limits: {
    maxStorage: number;
    maxIndexSize: number;
    maxConnections: number;
    maxTables: number;
  };
  usagePercentages: {
    storage: number;
    indexSize: number;
    connections: number;
    tables: number;
  };
}

interface ChartData {
  name: string;
  variant: string;
  sales: number;
  revenue: number;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const COLORS = {
  dataSize: '#3B82F6',    // Blue
  indexSize: '#10B981',   // Green
  cacheHit: '#F59E0B',    // Amber
  connections: '#8B5CF6',  // Purple
  tables: '#EC4899',      // Pink
  sales: '#8884d8',       // Purple
  revenue: '#82ca9d',     // Green
  profit: '#ffc658'       // Yellow
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const AdminDashboardPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [dbUsage, setDbUsage] = useState<DatabaseUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const { i18n, t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [chartView, setChartView] = useState<'bar' | 'line' | 'area'>('bar');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          fetchedProducts,
          fetchedCategories,
          fetchedOrders,
          fetchedRevenue,
          fetchedPendingOrders,
          fetchedBestSellers,
          fetchedDbUsage
        ] = await Promise.all([
          productService.getProducts(),
          categoryService.getCategories(),
          orderService.getOrders(),
          orderService.getTotalRevenue(),
          orderService.getPendingOrders(),
          orderService.getBestSellingProducts(5),
          databaseService.getDatabaseUsage()
        ]);

        setProducts(fetchedProducts);
        setCategories(fetchedCategories);
        setOrders(fetchedOrders);
        setTotalRevenue(fetchedRevenue);
        setPendingOrders(fetchedPendingOrders);
        setBestSellers(fetchedBestSellers);
        setDbUsage(fetchedDbUsage);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total stock across all product variants
  const totalStock = products.reduce((sum, product) => {
    return sum + (product.variants?.reduce((variantSum, variant) => 
      variantSum + (variant.stock || 0), 0) || 0);
  }, 0);

  const stats = [
    {
      title: t('admin.dashboard.stats.totalProducts'),
      value: products.length,
      icon: <PackageIcon className="h-6 w-6 text-ecommerce-purple" />,
      change: `${totalStock} ${t('admin.dashboard.stats.itemsInStock')}`,
    },
    {
      title: t('admin.dashboard.stats.totalCategories'),
      value: categories.length,
      icon: <TagIcon className="h-6 w-6 text-ecommerce-purple" />,
      change: `${categories.length} ${t('admin.dashboard.stats.activeCategories')}`,
    },
    {
      title: t('admin.dashboard.stats.pendingOrders'),
      value: pendingOrders.length,
      icon: <ShoppingBagIcon className="h-6 w-6 text-ecommerce-purple" />,
      change: `${pendingOrders.length} ${t('admin.dashboard.stats.ordersToProcess')}`,
    },
    {
      title: t('admin.dashboard.stats.totalRevenue'),
      value: `TND${totalRevenue.toFixed(2)}`,
      icon: <CreditCardIcon className="h-6 w-6 text-ecommerce-purple" />,
      change: `${((totalRevenue / (totalRevenue * 0.88)) * 100 - 100).toFixed(1)}% ${t('admin.dashboard.stats.profitMargin')}`,
    },
  ];
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Prepare data for the chart
  const chartData = bestSellers.map(item => ({
    name: item.product_variant.product[`name_${i18n.language}`] || item.product_variant.product.name_en,
    variant: `${item.product_variant.size} - ${item.product_variant.color}`,
    sales: item.total_sold,
    revenue: item.total_revenue
  }));

  // Custom tooltip component for better styling
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">
                {entry.name}: {entry.name === 'revenue' ? `TND${entry.value.toFixed(2)}` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>
          <p className="text-gray-500">{t('admin.dashboard.welcome')}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.recentOrders.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('admin.dashboard.recentOrders.noOrders')}</p>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center p-4 border rounded-md">
                      <div>
                        <h3 className="font-medium">{order.customer_name}</h3>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t(`admin.dashboard.recentOrders.status.${order.status}`)}
                        </span>
                      </div>
                      <div className="font-bold">TND{order.total_amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Best Sellers Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>{t('admin.dashboard.bestSellers.title')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={chartView}
                    onValueChange={(value: 'bar' | 'line' | 'area') => setChartView(value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Chart Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={timeRange}
                    onValueChange={(value: 'day' | 'week' | 'month' | 'year') => setTimeRange(value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bestSellers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('admin.dashboard.bestSellers.noData')}</p>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartView === 'bar' ? (
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="sales" 
                          name={t('admin.dashboard.bestSellers.unitsSold')}
                          fill={COLORS.sales}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="revenue" 
                          name={t('admin.dashboard.bestSellers.revenue')}
                          fill={COLORS.revenue}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    ) : chartView === 'line' ? (
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone"
                          dataKey="sales" 
                          name={t('admin.dashboard.bestSellers.unitsSold')}
                          stroke={COLORS.sales}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue" 
                          name={t('admin.dashboard.bestSellers.revenue')}
                          stroke={COLORS.revenue}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    ) : (
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone"
                          dataKey="sales" 
                          name={t('admin.dashboard.bestSellers.unitsSold')}
                          fill={COLORS.sales}
                          stroke={COLORS.sales}
                          fillOpacity={0.3}
                        />
                        <Area 
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue" 
                          name={t('admin.dashboard.bestSellers.revenue')}
                          fill={COLORS.revenue}
                          stroke={COLORS.revenue}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Database Usage Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5 text-ecommerce-purple" />
                {t('admin.database.title')}
              </CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range: DateRange | undefined) => {
                      if (range) {
                        setDateRange({
                          from: range.from || new Date(),
                          to: range.to || new Date()
                        });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {!dbUsage ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">{t('admin.database.storage.title')}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('admin.database.storage.used')}: {formatBytes(dbUsage.stats.totalSize)}</span>
                        <span className="text-gray-600">{t('admin.database.storage.limit')}: {formatBytes(dbUsage.limits.maxStorage)}</span>
                      </div>
                      <Progress 
                        value={dbUsage.usagePercentages.storage} 
                        className="h-2"
                        indicatorClassName={dbUsage.usagePercentages.storage > 90 ? 'bg-red-500' : 'bg-blue-500'}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">{t('admin.database.index.title')}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('admin.database.index.used')}: {formatBytes(dbUsage.stats.indexSize)}</span>
                        <span className="text-gray-600">{t('admin.database.index.limit')}: {formatBytes(dbUsage.limits.maxIndexSize)}</span>
                      </div>
                      <Progress 
                        value={dbUsage.usagePercentages.indexSize} 
                        className="h-2"
                        indicatorClassName={dbUsage.usagePercentages.indexSize > 90 ? 'bg-red-500' : 'bg-green-500'}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">{t('admin.database.connections.title')}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('admin.database.connections.active')}: {dbUsage.stats.activeConnections}</span>
                        <span className="text-gray-600">{t('admin.database.connections.limit')}: {dbUsage.limits.maxConnections}</span>
                      </div>
                      <Progress 
                        value={dbUsage.usagePercentages.connections} 
                        className="h-2"
                        indicatorClassName={dbUsage.usagePercentages.connections > 90 ? 'bg-red-500' : 'bg-purple-500'}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">{t('admin.database.tables.title')}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('admin.database.tables.used')}: {dbUsage.stats.tableCount}</span>
                        <span className="text-gray-600">{t('admin.database.tables.limit')}: {dbUsage.limits.maxTables}</span>
                      </div>
                      <Progress 
                        value={dbUsage.usagePercentages.tables} 
                        className="h-2"
                        indicatorClassName={dbUsage.usagePercentages.tables > 90 ? 'bg-red-500' : 'bg-pink-500'}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: t('admin.database.storage.title'),
                            value: dbUsage.usagePercentages.storage,
                            color: COLORS.dataSize
                          },
                          {
                            name: t('admin.database.index.title'),
                            value: dbUsage.usagePercentages.indexSize,
                            color: COLORS.indexSize
                          },
                          {
                            name: t('admin.database.connections.title'),
                            value: dbUsage.usagePercentages.connections,
                            color: COLORS.connections
                          },
                          {
                            name: t('admin.database.tables.title'),
                            value: dbUsage.usagePercentages.tables,
                            color: COLORS.tables
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dbUsage.usagePercentages && Object.entries(dbUsage.usagePercentages).map(([key, value]) => (
                          <Cell key={key} fill={COLORS[key as keyof typeof COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                                <p className="font-medium text-gray-900">{data.name}</p>
                                <p className="text-sm text-gray-600">{data.value.toFixed(1)}% {t('admin.database.storage.used')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{
                          paddingLeft: '20px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
