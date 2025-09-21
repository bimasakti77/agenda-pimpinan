import React from 'react';
import Link from 'next/link';
import { useTokenManager } from '@/hooks/useTokenManager';
import AppLayout from './AppLayout';
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
  const { isAuthenticated, isLoading, user } = useTokenManager();
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Akses Ditolak</h2>
            <p className="text-red-600">
              Anda tidak memiliki izin untuk mengakses halaman ini. 
              Diperlukan role: <strong>{requiredRole}</strong>
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mt-2" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {crumb.href ? (
                      <Link 
                        href={crumb.href} 
                        className="hover:text-gray-700 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <ArrowRightIcon className="w-4 h-4 mx-2 text-gray-400" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
        {children}
      </div>
    </AppLayout>
  );
};
