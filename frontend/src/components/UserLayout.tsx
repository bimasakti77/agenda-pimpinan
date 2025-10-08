"use client";

import { useState, useEffect } from "react";
import { type User } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
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
  const [currentView, setCurrentView] = useState("users");
  const { user, logout } = useAuth();

  const handleLogout = () => {
    toast.success("Logout berhasil! Sampai jumpa!", {
      duration: 1500,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
    
    setTimeout(() => {
      logout();
    }, 1000);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    
    // Handle navigation to different views
    if (view === "dashboard") {
      window.location.href = "/dashboard";
    } else if (view === "calendar") {
      window.location.href = "/calendar";
    } else if (view === "invitations") {
      window.location.href = "/invitations";
    } else if (view === "users") {
      // Only allow if user has superadmin role
      if (user.role === 'superadmin') {
        setCurrentView("users");
      } else {
        // This should not happen due to sidebar filtering, but as a safety measure
        toast.error("Anda tidak memiliki izin untuk mengakses halaman ini", {
          duration: 3000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
        // Redirect to dashboard
        window.location.href = "/dashboard";
      }
    }
  };

  if (!user) {
    return null;
  }

  // Role checking is now handled at sidebar level
  // This component assumes user already has proper role since they reached here

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
                <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: '#1f6fff' }}>
                  {title?.toLowerCase().includes('users') || title?.toLowerCase().includes('user') ? (
                    <Users className="h-6 w-6 text-white" />
                  ) : title?.toLowerCase().includes('new') || title?.toLowerCase().includes('tambah') ? (
                    <UserPlus className="h-6 w-6 text-white" />
                  ) : title?.toLowerCase().includes('edit') || title?.toLowerCase().includes('ubah') ? (
                    <Edit className="h-6 w-6 text-white" />
                  ) : title?.toLowerCase().includes('detail') || title?.toLowerCase().includes('lihat') ? (
                    <Eye className="h-6 w-6 text-white" />
                  ) : (
                    <Users className="h-6 w-6 text-white" />
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
