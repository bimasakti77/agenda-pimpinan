"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTokenManager } from "@/hooks/useTokenManager";
import { getStoredUser } from "@/lib/auth";

interface WithAuthProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function withAuth({ children, requiredRole }: WithAuthProps) {
  const { isAuthenticated, isLoading } = useTokenManager();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Check role if required
      if (requiredRole) {
        const user = getStoredUser();
        if (!user || user.role !== requiredRole) {
          router.push("/dashboard"); // Redirect to dashboard if role doesn't match
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memverifikasi autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
