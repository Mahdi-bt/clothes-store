import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/layouts/MainLayout';
import ProductCard from '../components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { productService } from '../lib/services/productService';
import { Product } from '../types';
import ProductCarousel from '@/components/ui/ProductCarousel';
import BestSellersCarousel from '@/components/ui/BestSellersCarousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const ITEMS_PER_PAGE = 4; // Number of products to show per page

const Index = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unisex'>('all');
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [materialFilter, setMaterialFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showInStock, setShowInStock] = useState(true);
  const [showOnSale, setShowOnSale] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await productService.getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const getLocalizedField = (product: Product, field: 'name' | 'description') => {
    const lang = i18n.language;
    if (field === 'name') {
      return product[`name_${lang}` as keyof Product] as string || product.name_en;
    }
    if (field === 'description') {
      return product[`description_${lang}` as keyof Product] as string || product.description_en;
    }
    return '';
  };

  // Get unique values for filters
  const uniqueSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(product => {
      product.variants?.forEach(variant => {
        sizes.add(variant.size);
      });
    });
    return Array.from(sizes).sort();
  }, [products]);

  const uniqueMaterials = useMemo(() => {
    const materials = new Set<string>();
    products.forEach(product => {
      if (product.material) {
        materials.add(product.material);
      }
    });
    return Array.from(materials).sort();
  }, [products]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(product => {
      if (product.brand) {
        brands.add(product.brand);
      }
    });
    return Array.from(brands).sort();
  }, [products]);

  // Initialize price range when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.selling_price);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceRange([minPrice, maxPrice]);
    }
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = [...products]
      .filter(product => {
        const matchesSearch = getLocalizedField(product, 'name').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGender = genderFilter === 'all' || product.gender === genderFilter;
        const matchesMaterial = materialFilter.length === 0 || (product.material && materialFilter.includes(product.material));
        const matchesBrand = brandFilter.length === 0 || (product.brand && brandFilter.includes(product.brand));
        const matchesSize = sizeFilter.length === 0 || product.variants?.some(variant => sizeFilter.includes(variant.size));
        const matchesPrice = product.selling_price >= priceRange[0] && product.selling_price <= priceRange[1];

        return matchesSearch && matchesGender && matchesMaterial && matchesBrand && matchesSize && matchesPrice;
      })
      .sort((a, b) => {
        let valueA: string | number = '';
        let valueB: string | number = '';
        if (sortField === 'name') {
          valueA = getLocalizedField(a, 'name');
          valueB = getLocalizedField(b, 'name');
        } else if (sortField === 'price') {
          valueA = a.selling_price;
          valueB = b.selling_price;
        }
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return valueA.localeCompare(valueB) * (sortOrder === 'asc' ? 1 : -1);
        }
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return (valueA - valueB) * (sortOrder === 'asc' ? 1 : -1);
        }
        return 0;
      });
    return filtered;
  }, [products, getLocalizedField, searchQuery, genderFilter, materialFilter, brandFilter, sizeFilter, priceRange, sortField, sortOrder]);

  // Get carousel products (new arrivals)
  const carouselProducts = useMemo(() => {
    return products
      .filter(p => p.images && p.images.length > 0)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [products]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(1)}
          className="h-8 w-8 p-0"
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots1" className="px-2">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="h-8 w-8 p-0"
        >
          {i}
        </Button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="px-2">...</span>);
      }
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          className="h-8 w-8 p-0"
        >
          {totalPages}
        </Button>
      );
    }

    // Next button
    pages.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );

    return pages;
  };
  
  // Reset filters
  const resetFilters = () => {
    if (products.length > 0) {
      const prices = products.map(p => p.selling_price);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceRange([minPrice, maxPrice]);
    } else {
      setPriceRange([0, 1000]);
    }
    setSortField('name');
    setSortOrder('asc');
    setSearchQuery('');
    setGenderFilter('all');
    setSizeFilter([]);
    setMaterialFilter([]);
    setBrandFilter([]);
    setShowInStock(true);
    setShowOnSale(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      {/* New Arrivals Carousel */}
      <ProductCarousel
        title={t('home.newArrivals')}
        subtitle={t('home.newArrivalsSubtitle')}
        products={carouselProducts.map(product => ({ 
          ...product, 
          name: getLocalizedField(product, 'name'), 
          description: getLocalizedField(product, 'description') 
        }))}
        loading={loading}
      />
      
      {/* Best Sellers Carousel */}
      <BestSellersCarousel products={products} loading={loading} />
      
      {/* Featured Products */}
      <section className="py-16 bg-gray-50 products-section">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <h2 className="text-3xl font-bold text-center md:text-left">
              {t('home.featuredProducts')}
            </h2>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>

              <Select
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortField(field);
                  setSortOrder(order);
                }}
                defaultValue="name-asc"
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('common.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">{t('home.sortOptions.nameAsc')}</SelectItem>
                  <SelectItem value="name-desc">{t('home.sortOptions.nameDesc')}</SelectItem>
                  <SelectItem value="price-asc">{t('home.sortOptions.priceAsc')}</SelectItem>
                  <SelectItem value="price-desc">{t('home.sortOptions.priceDesc')}</SelectItem>
                </SelectContent>
              </Select>

              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 hover:bg-ecommerce-purple hover:text-white transition-colors">
                    <SlidersHorizontal className="w-4 h-4" />
                    {t('common.filters')}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white">
                  <SheetHeader className="border-b pb-4">
                    <SheetTitle className="text-2xl font-bold text-ecommerce-purple">{t('common.filters')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-8">
                    {/* Price Range */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('common.priceRange')}</h3>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          min={0}
                          max={1000}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 px-3 py-1.5 rounded-full font-medium">TND{priceRange[0]}</span>
                            <span className="text-gray-400">-</span>
                            <span className="bg-gray-100 px-3 py-1.5 rounded-full font-medium">TND{priceRange[1]}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('common.gender')}</h3>
                      <RadioGroup value={genderFilter} onValueChange={(value) => setGenderFilter(value as 'all' | 'male' | 'female' | 'unisex')} className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <RadioGroupItem value="all" id="gender-all" className="text-ecommerce-purple" />
                          <Label htmlFor="gender-all" className="cursor-pointer font-medium">{t('common.all')}</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <RadioGroupItem value="male" id="gender-male" className="text-ecommerce-purple" />
                          <Label htmlFor="gender-male" className="cursor-pointer font-medium">{t('common.male')}</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <RadioGroupItem value="female" id="gender-female" className="text-ecommerce-purple" />
                          <Label htmlFor="gender-female" className="cursor-pointer font-medium">{t('common.female')}</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <RadioGroupItem value="unisex" id="gender-unisex" className="text-ecommerce-purple" />
                          <Label htmlFor="gender-unisex" className="cursor-pointer font-medium">{t('common.unisex')}</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Size */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('common.size')}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {uniqueSizes.map((size) => (
                          <div key={size} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <Checkbox
                              id={`size-${size}`}
                              checked={sizeFilter.includes(size)}
                              onCheckedChange={(checked) => {
                                setSizeFilter(prev => 
                                  checked 
                                    ? [...prev, size]
                                    : prev.filter(s => s !== size)
                                );
                              }}
                              className="text-ecommerce-purple"
                            />
                            <Label htmlFor={`size-${size}`} className="cursor-pointer text-sm font-medium">{size}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Material */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('common.material')}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {uniqueMaterials.map((material) => (
                          <div key={material} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <Checkbox
                              id={`material-${material}`}
                              checked={materialFilter.includes(material)}
                              onCheckedChange={(checked) => {
                                setMaterialFilter(prev => 
                                  checked 
                                    ? [...prev, material]
                                    : prev.filter(m => m !== material)
                                );
                              }}
                              className="text-ecommerce-purple"
                            />
                            <Label htmlFor={`material-${material}`} className="cursor-pointer text-sm font-medium">{material}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Brand */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('common.brand')}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {uniqueBrands.map((brand) => (
                          <div key={brand} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <Checkbox
                              id={`brand-${brand}`}
                              checked={brandFilter.includes(brand)}
                              onCheckedChange={(checked) => {
                                setBrandFilter(prev => 
                                  checked 
                                    ? [...prev, brand]
                                    : prev.filter(b => b !== brand)
                                );
                              }}
                              className="text-ecommerce-purple"
                            />
                            <Label htmlFor={`brand-${brand}`} className="cursor-pointer text-sm font-medium">{brand}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('common.availability')}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <Checkbox
                            id="in-stock"
                            checked={showInStock}
                            onCheckedChange={(checked) => setShowInStock(checked as boolean)}
                            className="text-ecommerce-purple"
                          />
                          <Label htmlFor="in-stock" className="cursor-pointer font-medium">{t('common.inStock')}</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <Checkbox
                            id="on-sale"
                            checked={showOnSale}
                            onCheckedChange={(checked) => setShowOnSale(checked as boolean)}
                            className="text-ecommerce-purple"
                          />
                          <Label htmlFor="on-sale" className="cursor-pointer font-medium">{t('common.onSale')}</Label>
                        </div>
                      </div>
                    </div>

                    {/* Reset Filters */}
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200 font-medium"
                      onClick={resetFilters}
                    >
                      <X className="w-4 h-4" />
                      {t('common.resetFilters')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={resetFilters}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('common.resetFilters')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="animate-fade-in">
                <ProductCard product={{ ...product, name: getLocalizedField(product, 'name'), description: getLocalizedField(product, 'description') }} />
              </div>
            ))}
          </div>

          {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">{t('home.noProductsFound')}</p>
            </div>
          )}

          {/* Pagination */}
          {filteredAndSortedProducts.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {renderPagination()}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
