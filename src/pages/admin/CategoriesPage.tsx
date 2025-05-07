import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { categoryService } from '@/lib/services/categoryService';
import type { Category } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameFr, setNewCategoryNameFr] = useState('');
  const [newCategoryNameAr, setNewCategoryNameAr] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const { i18n, t } = useTranslation();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error('Failed to load categories: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t('admin.categories.addDialog.nameEn') + ' ' + t('common.required'));
      return;
    }
    
    try {
      await categoryService.create({
        name_en: newCategoryName.trim(),
        name_fr: newCategoryNameFr.trim(),
        name_ar: newCategoryNameAr.trim()
      });
      toast.success(t('admin.categories.addDialog.add') + ' ' + t('common.success'));
      setNewCategoryName('');
      setNewCategoryNameFr('');
      setNewCategoryNameAr('');
      setIsAddDialogOpen(false);
      loadCategories();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      toast.error(t('admin.categories.addDialog.add') + ' ' + t('common.failed') + ': ' + errorMessage);
    }
  };
  
  const handleEditCategory = async () => {
    if (!editCategory || !editCategory.name_en.trim()) {
      toast.error(t('admin.categories.addDialog.nameEn') + ' ' + t('common.required'));
      return;
    }
    
    try {
      await categoryService.update(editCategory.id, {
        name_en: editCategory.name_en.trim(),
        name_fr: editCategory.name_fr || '',
        name_ar: editCategory.name_ar || ''
      });
      toast.success(t('admin.categories.editDialog.save') + ' ' + t('common.success'));
      setIsEditDialogOpen(false);
      loadCategories();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      toast.error(t('admin.categories.editDialog.save') + ' ' + t('common.failed') + ': ' + errorMessage);
    }
  };
  
  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    
    try {
      await categoryService.delete(deleteCategory.id);
      toast.success(t('admin.categories.deleteDialog.delete') + ' ' + t('common.success'));
      setIsDeleteDialogOpen(false);
      loadCategories();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      toast.error(t('admin.categories.deleteDialog.delete') + ' ' + t('common.failed') + ': ' + errorMessage);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ecommerce-purple"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin.categories.title')}</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('admin.categories.addNew')}
          </Button>
        </div>
        
        <div className="bg-white rounded-md shadow">
          {categories.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.categories.table.name')}</TableHead>
                    <TableHead>{t('admin.categories.table.productCount')}</TableHead>
                    <TableHead className="text-right">{t('admin.categories.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category[`name_${i18n.language}`] || category.name_en}</TableCell>
                      <TableCell>{category.product_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditCategory(category);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setDeleteCategory(category);
                              setIsDeleteDialogOpen(true);
                            }}
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
              <p className="text-gray-500">{t('admin.categories.noCategories')}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.categories.addDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name_en">{t('admin.categories.addDialog.nameEn')}</Label>
              <Input 
                id="name_en"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('admin.categories.addDialog.nameEn')}
                required
              />
            </div>
            <div>
              <Label htmlFor="name_fr">{t('admin.categories.addDialog.nameFr')}</Label>
              <Input 
                id="name_fr"
                value={newCategoryNameFr}
                onChange={(e) => setNewCategoryNameFr(e.target.value)}
                placeholder={t('admin.categories.addDialog.nameFr')}
              />
            </div>
            <div>
              <Label htmlFor="name_ar">{t('admin.categories.addDialog.nameAr')}</Label>
              <Input 
                id="name_ar"
                value={newCategoryNameAr}
                onChange={(e) => setNewCategoryNameAr(e.target.value)}
                placeholder={t('admin.categories.addDialog.nameAr')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('admin.categories.addDialog.cancel')}
            </Button>
            <Button onClick={handleAddCategory}>{t('admin.categories.addDialog.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.categories.editDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name_en">{t('admin.categories.addDialog.nameEn')}</Label>
              <Input 
                id="edit-name_en"
                value={editCategory?.name_en || ''}
                onChange={(e) => setEditCategory(prev => prev ? { ...prev, name_en: e.target.value } : null)}
                placeholder={t('admin.categories.addDialog.nameEn')}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-name_fr">{t('admin.categories.addDialog.nameFr')}</Label>
              <Input 
                id="edit-name_fr"
                value={editCategory?.name_fr || ''}
                onChange={(e) => setEditCategory(prev => prev ? { ...prev, name_fr: e.target.value } : null)}
                placeholder={t('admin.categories.addDialog.nameFr')}
              />
            </div>
            <div>
              <Label htmlFor="edit-name_ar">{t('admin.categories.addDialog.nameAr')}</Label>
              <Input 
                id="edit-name_ar"
                value={editCategory?.name_ar || ''}
                onChange={(e) => setEditCategory(prev => prev ? { ...prev, name_ar: e.target.value } : null)}
                placeholder={t('admin.categories.addDialog.nameAr')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('admin.categories.addDialog.cancel')}
            </Button>
            <Button onClick={handleEditCategory}>{t('admin.categories.editDialog.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.categories.deleteDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{t('admin.categories.deleteDialog.confirm')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('admin.categories.deleteDialog.warning')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('admin.categories.addDialog.cancel')}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCategory}
            >
              {t('admin.categories.deleteDialog.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CategoriesPage;
