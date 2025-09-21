"use client";

import { ReactNode } from "react";
import { useTokenManager } from "@/hooks/useTokenManager";
import TokenCountdown from "@/components/TokenCountdown";

interface AppLayoutProps {
  children: ReactNode;
  showTokenCountdown?: boolean;
}

export default function AppLayout({ children, showTokenCountdown = false }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useTokenManager();

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
    return <>{children}</>; // Let the page handle redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showTokenCountdown && (
        <div className="fixed top-4 right-4 z-50">
          <TokenCountdown showCountdown={true} />
        </div>
      )}
      {children}
    </div>
  );
}
