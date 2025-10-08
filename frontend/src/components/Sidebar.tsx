"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, BarChart3, Users, LogOut, Menu, X, Mail, FileText } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface SidebarProps {
  user: {
    full_name: string;
    role: string;
  } | null;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export default function Sidebar({ user, onLogout, currentView, onViewChange, isMobileOpen = false, onMobileToggle }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview & Statistics",
      roles: ["user", "admin", "superadmin"]
    },
    {
      id: "my-agenda",
      label: "Agenda dan Undangan",
      icon: FileText,
      description: "Agenda dan Undangan",
      roles: ["user", "admin", "superadmin"]
    },
    {
      id: "calendar",
      label: "Kalender",
      icon: Calendar,
      description: "View Agenda Calendar",
      roles: ["user", "admin", "superadmin"]
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      description: "Manage Users",
      roles: ["superadmin"] // Only superadmin can access
    }
  ].filter(item => !user || item.roles.includes(user.role));

  // Enhanced click handler with role checking
  const handleMenuClick = (itemId: string) => {
    // Get the menu item to check its required roles
    const menuItem = menuItems.find(item => item.id === itemId);
    
    if (!menuItem) {
      console.error(`Menu item with id "${itemId}" not found`);
      return;
    }

    // Check if user has required role for this menu item
    if (user && !menuItem.roles.includes(user.role)) {
      toast.error("Anda tidak memiliki izin untuk mengakses halaman ini", {
        duration: 3000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
      return;
    }

    // If role check passes, proceed with navigation
    onViewChange(itemId);
  };

  return (
    <>
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
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => onMobileToggle?.()}
        />
      )}
      
      <div className={`bg-gray-900 text-white transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } min-h-screen flex flex-col fixed left-0 top-0 z-40 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center justify-center w-full space-x-4">
              {/* Logo - Kiri */}
              <img 
                src="/assets/logos/logokumham.png" 
                alt="Logo Kementerian Hukum" 
                className="h-8 w-auto"
              />
              
              {/* Garis Pemisah Berpendar */}
              <div 
                className="h-12 w-px bg-white opacity-30"
                style={{
                  boxShadow: '0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3), 0 0 15px rgba(255, 255, 255, 0.2)'
                }}
              ></div>
              
              {/* Agenda Pimpinan - Kanan */}
              <div className="text-center">
                <h1 
                  className="text-xl font-bold text-white tracking-wide drop-shadow-lg cursor-pointer hover:text-blue-300 transition-colors duration-200" 
                  style={{textShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)'}}
                  onClick={() => window.location.href = '/'}
                  title="Klik untuk kembali ke Dashboard"
                >
                  Agenda Pimpinan
                </h1>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex flex-col items-center justify-center w-full space-y-2">
              <div className="text-center">
                <h1 
                  className="text-lg font-bold text-white drop-shadow-lg cursor-pointer hover:text-blue-300 transition-colors duration-200" 
                  style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.5), 0 0 16px rgba(255, 255, 255, 0.3), 0 0 24px rgba(255, 255, 255, 0.2)'}}
                  onClick={() => window.location.href = '/'}
                  title="Klik untuk kembali ke Dashboard"
                >
                  AP
                </h1>
              </div>
              <img 
                src="/assets/logos/logokumham.png" 
                alt="Logo Kementerian Hukum" 
                className="h-4 w-auto"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMobileToggle?.()}
              className="text-white hover:bg-gray-700 p-2 lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Desktop collapse button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white hover:bg-gray-800 p-2 hidden lg:block"
            >
              {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-700">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src="/assets/logos/logokumham.png" alt="Logo Kementerian" />
                  <AvatarFallback className="bg-white">
                    <img 
                      src="/assets/logos/logokumham.png" 
                      alt="Logo Kementerian" 
                      className="h-full w-full object-contain"
                    />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{user.full_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={currentView === item.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left h-auto p-3 ${
                    currentView === item.id 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </div>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:bg-red-900/20 hover:text-red-300 h-auto p-3"
          onClick={onLogout}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && (
            <div>
              <div className="font-medium">Logout</div>
              <div className="text-xs text-gray-400">Sign out from system</div>
            </div>
          )}
        </Button>
      </div>
      </div>
    </>
  );
}
