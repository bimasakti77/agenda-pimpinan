"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BarChart3, Users, LogOut, Menu, X } from "lucide-react";

interface SidebarProps {
  user: {
    full_name: string;
    role: string;
  } | null;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ user, onLogout, currentView, onViewChange }: SidebarProps) {
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

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/logos/logokumham.png" 
                alt="Logo Kementerian Hukum" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold">Agenda Pimpinan</h1>
                <p className="text-sm text-gray-400">Kementerian Hukum RI</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <img 
                src="/assets/logos/logokumham.png" 
                alt="Logo Kementerian Hukum" 
                className="h-8 w-auto"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-gray-800"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-700">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">
                    {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
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
                  onClick={() => onViewChange(item.id)}
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
  );
}
