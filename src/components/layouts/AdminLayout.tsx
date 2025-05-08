import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../admin/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ecommerce-purple"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block w-64 flex-shrink-0">
        <AdminSidebar />
      </div>
      <div className="md:hidden">
        <AdminSidebar />
      </div>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
    </div>
  );
};

export default AdminLayout;
