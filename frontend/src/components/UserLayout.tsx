"use client";

import { useState, useEffect } from "react";
import { getStoredUser, getStoredToken, type User } from "@/lib/auth";
import { useTokenManager } from "@/hooks/useTokenManager";
import Sidebar from "./Sidebar";
import ProfileDropdown from "./ProfileDropdown";
import toast, { Toaster } from "react-hot-toast";
import { Users, UserPlus, Edit, Eye } from "lucide-react";

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function UserLayout({ children, title = "User Management", description = "Kelola pengguna sistem" }: UserLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState("users");
  const { isAuthenticated, isLoading: tokenLoading } = useTokenManager();

  useEffect(() => {
    const token = getStoredToken();
    const userData = getStoredUser();

    if (!token || !userData) {
      window.location.href = "/login";
      return;
    }

    setUser(userData);
  }, []);

  const handleLogout = () => {
    toast.success("Logout berhasil! Sampai jumpa!", {
      duration: 1500,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
    
    setTimeout(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }, 1000);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    
    // Handle navigation to different views
    if (view === "dashboard") {
      window.location.href = "/dashboard";
    } else if (view === "calendar") {
      window.location.href = "/calendar";
    } else if (view === "users") {
      // Stay in users page
      setCurrentView("users");
    }
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memverifikasi autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if user has superadmin role
  if (user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Akses Ditolak</h2>
          <p className="text-red-600">
            Anda tidak memiliki izin untuk mengakses halaman ini. 
            Diperlukan role: <strong>superadmin</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      
      {/* Sidebar */}
      <Sidebar 
        user={user}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  {title?.toLowerCase().includes('users') || title?.toLowerCase().includes('user') ? (
                    <Users className="h-6 w-6 text-blue-600" />
                  ) : title?.toLowerCase().includes('new') || title?.toLowerCase().includes('tambah') ? (
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  ) : title?.toLowerCase().includes('edit') || title?.toLowerCase().includes('ubah') ? (
                    <Edit className="h-6 w-6 text-blue-600" />
                  ) : title?.toLowerCase().includes('detail') || title?.toLowerCase().includes('lihat') ? (
                    <Eye className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Users className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {title}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {description}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {/* Profile Dropdown */}
                <ProfileDropdown 
                  user={user}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
