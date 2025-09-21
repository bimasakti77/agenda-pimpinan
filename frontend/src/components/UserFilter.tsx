"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getStoredToken } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  position: string;
  department: string;
}

interface UserFilterProps {
  onUserSelect: (userId: number | null, userName: string) => void;
  selectedUserId: number | null;
}

export default function UserFilter({ onUserSelect, selectedUserId }: UserFilterProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const token = getStoredToken();
      
      if (!token) {
        setError("Token tidak ditemukan");
        return;
      }

      const response = await fetch("http://localhost:3000/api/users?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Filter hanya user dengan role 'user'
        const allUsers = data.data?.users || [];
        const filteredUsers = allUsers.filter((user: User) => user.role === 'user');
        setUsers(filteredUsers);
        setError("");
      } else {
        setError(data.message || "Gagal memuat data user");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat memuat data user");
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = async (userId: number) => {
    if (isSelecting) return; // Prevent multiple clicks
    
    setIsSelecting(true);
    try {
      const selectedUser = users.find(u => u.id === userId);
      await onUserSelect(userId, selectedUser?.full_name || '');
    } finally {
      // Add small delay to prevent rapid clicking
      setTimeout(() => setIsSelecting(false), 1000);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filter Data Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Memuat data user...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filter Data Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">❌ {error}</div>
            <Button onClick={loadUsers} variant="outline">
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Data Agenda</CardTitle>
        <p className="text-sm text-gray-600">
          Pilih user untuk melihat agenda mereka
          {isSelecting && <span className="ml-2 text-blue-600">⏳ Memuat...</span>}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* User Dropdown */}
          <Select 
            value={selectedUserId?.toString() || ""} 
            onValueChange={(value) => handleUserSelect(parseInt(value))}
            disabled={isSelecting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih user untuk melihat agenda mereka" />
            </SelectTrigger>
            <SelectContent>
              {/* Search Input */}
              <div className="p-2 border-b">
                <Input
                  placeholder="Cari user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
              </div>
              
              {/* User List */}
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-2">
                        {user.role === 'superadmin' && <span className="text-lg">👑</span>}
                        {user.role === 'admin' && <span className="text-lg">⚡</span>}
                        {user.role === 'user' && <span className="text-lg">👤</span>}
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-xs text-gray-500">
                          @{user.username} • {user.position}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500 text-center">
                  Tidak ada user yang ditemukan
                </div>
              )}
            </SelectContent>
          </Select>
          
          {isSelecting && (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Memuat agenda...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
