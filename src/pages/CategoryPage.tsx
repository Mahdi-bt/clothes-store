import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import ProductGrid from '../components/products/ProductGrid';
import { ChevronLeft, Tag, SlidersHorizontal, X, Search } from 'lucide-react';
import { productService } from '../lib/services/productService';
import { categoryService } from '../lib/services/categoryService';
import { Product, Category } from '../types';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Reduced items per page for better visibility

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>('default');
  const [showInStock, setShowInStock] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unisex'>('all');
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [materialFilter, setMaterialFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (id) {
          const fetchedCategory = await categoryService.getCategoryById(id);
          setCategory(fetchedCategory);
          const fetchedProducts = await productService.getProductsByCategory(id);
          setProducts(fetchedProducts);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Helper to get localized product/category fields
  const getLocalizedProductName = (product: Product) => {
    const lang = i18n.language;
    return product[`name_${lang}`] || product.name_en;
  };
  const getLocalizedCategoryName = (category: Category) => {
    const lang = i18n.language;
    return category[`name_${lang}`] || category.name_en;
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

  // Apply filters
  const filteredProducts = products.filter(product => {
    const price = product.selling_price;
    const inStock = product.stock !== undefined && product.stock >= 0;
    const onSale = product.discount && product.discount > 0;
    const matchesSearch = getLocalizedProductName(product).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'all' || product.gender === genderFilter;
    const matchesMaterial = materialFilter.length === 0 || (product.material && materialFilter.includes(product.material));
    const matchesBrand = brandFilter.length === 0 || (product.brand && brandFilter.includes(product.brand));
    const matchesSize = sizeFilter.length === 0 || product.variants?.some(variant => sizeFilter.includes(variant.size));
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

    // If no filters are active, show all products
    if (!showInStock && !showOnSale && !searchQuery && genderFilter === 'all' && 
        materialFilter.length === 0 && brandFilter.length === 0 && sizeFilter.length === 0) {
      return true;
    }

    // Apply filters only if they are active
    const stockFilter = !showInStock || inStock;
    const saleFilter = !showOnSale || onSale;

    return matchesPrice && stockFilter && saleFilter && matchesSearch && 
           matchesGender && matchesMaterial && matchesBrand && matchesSize;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.selling_price - b.selling_price;
      case 'price-desc':
        return b.selling_price - a.selling_price;
      case 'name-asc':
        return getLocalizedProductName(a).localeCompare(getLocalizedProductName(b));
      case 'name-desc':
        return getLocalizedProductName(b).localeCompare(getLocalizedProductName(a));
      default:
        return 0;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at the start
      if (currentPage <= 2) {
        end = 4;
      }
      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setSortBy('default');
    setShowInStock(false);
    setShowOnSale(false);
    setSearchQuery('');
    setGenderFilter('all');
    setSizeFilter([]);
    setMaterialFilter([]);
    setBrandFilter([]);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg aspect-square"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!category) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Category Not Found</h2>
          <p className="mb-6">The category you are looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex text-sm flex-wrap gap-1">
            <li className="text-gray-400">
              <Link to="/" className="hover:text-ecommerce-purple font-medium transition-colors">Home</Link>
            </li>
            <li className="mx-2 text-gray-300">/</li>
            <li className="text-ecommerce-purple font-semibold">{getLocalizedCategoryName(category)}</li>
          </ol>
        </nav>

        {/* Category Header with Filters */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Tag className="w-6 h-6 text-ecommerce-purple" />
              <h1 className="text-3xl font-bold text-gray-900">{getLocalizedCategoryName(category)}</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
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
            </div>
          </div>
          {category.product_count !== undefined && (
            <p className="text-gray-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
            </p>
          )}
        </div>

        {/* Products Grid */}
        {currentProducts.length > 0 ? (
          <>
            <ProductGrid products={currentProducts.map(p => ({ ...p, name: getLocalizedProductName(p) }))} />
            
            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page as number)}
                        className="w-10 h-10"
                      >
                        {page}
                      </Button>
                    )
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">Try adjusting your filters to find what you're looking for.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CategoryPage; 