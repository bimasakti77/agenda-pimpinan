import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ProtectedPageProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: Breadcrumb[];
  requiredRole?: string;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({ 
  children, 
  title, 
  breadcrumbs,
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Akses Ditolak</h2>
          <p className="text-red-600">
            Anda tidak memiliki izin untuk mengakses halaman ini. 
            Diperlukan role: <strong>{requiredRole}</strong>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {children}
    </>
  );
};
