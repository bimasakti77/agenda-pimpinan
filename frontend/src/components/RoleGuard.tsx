"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const userData = getStoredUser();
    setUser(userData);
    setIsLoading(false);
  }, []);

  // Show loading while checking authentication
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user data, redirect to login
  if (!user) {
    router.push("/login");
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
      router.push(redirectTo);
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
