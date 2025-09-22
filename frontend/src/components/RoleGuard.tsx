"use client";

import { ReactNode } from "react";
import { getStoredUser } from "@/lib/auth";
import toast from "react-hot-toast";

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles: string[];
  fallbackComponent?: ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({ 
  children, 
  requiredRoles, 
  fallbackComponent,
  redirectTo = "/dashboard" 
}: RoleGuardProps) {
  const user = getStoredUser();

  // If no user data, redirect to login
  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // Check if user has required role
  if (!requiredRoles.includes(user.role)) {
    // Show error toast
    toast.error("Anda tidak memiliki izin untuk mengakses halaman ini", {
      duration: 3000,
      style: {
        background: '#EF4444',
        color: '#fff',
      },
    });

    // Show fallback component or redirect
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    // Redirect after a short delay to show the toast
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 1000);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Akses Ditolak</h2>
          <p className="text-red-600">
            Anda tidak memiliki izin untuk mengakses halaman ini. 
            Diperlukan role: <strong>{requiredRoles.join(", ")}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">Mengalihkan ke halaman utama...</p>
        </div>
      </div>
    );
  }

  // User has required role, render children
  return <>{children}</>;
}
