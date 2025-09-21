"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown 
} from "lucide-react";
import toast from "react-hot-toast";
import { User as UserType } from "@/lib/auth";

interface User extends UserType {
  position?: string;
  is_active?: boolean;
}

interface ProfileDropdownProps {
  user: User;
  onLogout: () => void;
}

export default function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    toast.success("Logout berhasil! Sampai jumpa!", {
      duration: 1500,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
    
    setTimeout(() => {
      onLogout();
    }, 1000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return '👑';
      case 'admin':
        return '⚡';
      case 'user':
        return '👤';
      default:
        return '👤';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="/assets/logos/logokumham.png" alt={user.full_name} />
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              <img 
                src="/assets/logos/logokumham.png" 
                alt="Logo Kementerian" 
                className="h-full w-full object-contain"
              />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
            <div className="text-xs text-gray-500">{getRoleLabel(user.role)}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {/* Profile Header */}
            <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-white">
                  <AvatarImage src="/assets/logos/logokumham.png" alt={user.full_name} />
                  <AvatarFallback className="bg-white text-blue-500 text-lg font-bold">
                    <img 
                      src="/assets/logos/logokumham.png" 
                      alt="Logo Kementerian" 
                      className="h-full w-full object-contain"
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{user.full_name}</h3>
                  <p className="text-blue-100 text-sm">@{user.username}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-lg mr-1">{getRoleIcon(user.role)}</span>
                    <span className="text-sm text-blue-100">{getRoleLabel(user.role)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Settings className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Posisi</p>
                  <p className="text-sm text-gray-600">{user.position}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className="text-sm text-gray-600">
                    {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer with Logout Button */}
            <div className="border-t bg-gray-50 p-4">
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
