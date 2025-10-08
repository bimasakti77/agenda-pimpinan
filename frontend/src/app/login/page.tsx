"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast, { Toaster } from "react-hot-toast";
import { apiConfig } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { apiFetch } = await import('@/lib/apiUtils');
      const response = await apiFetch('/auth/login', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login berhasil! Selamat datang!", {
          duration: 2000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        // Validate data before storing
        if (data.data && data.data.accessToken && data.data.refreshToken && data.data.user) {
          // Use AuthContext login function
          login(
            {
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            },
            data.data.user
          );
          
          // Delay redirect untuk menampilkan notifikasi
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        } else {
          toast.error("Data login tidak valid", {
            duration: 3000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          });
        }
      } else {
        // Handle specific error messages
        let errorMessage = data.message || "Login gagal. Periksa username dan password!";
        
        if (data.message === 'Account is deactivated') {
          errorMessage = "Akun non aktif hubungi administrator";
        }
        
        toast.error(errorMessage, {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat login. Periksa koneksi internet!", {
        duration: 3000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
        <div 
          className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url(/assets/images/backdrop.jpg)',
            backgroundColor: '#000633' // Fallback color
          }}
        >
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
          <Card className="w-full max-w-sm sm:max-w-md border-2 border-gray-200 animate-pulse" style={{ 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)',
            animation: 'shadowGlow 2s ease-in-out infinite alternate'
          }}>
        <CardHeader className="space-y-1">
          <div className="flex justify-center items-center gap-6 mb-4">
            <img 
              src="/assets/logos/logokumham.png" 
              alt="Logo Kementerian Hukum" 
              className="h-16 w-auto"
            />
            <div className="h-12 w-px bg-gray-300"></div>
            <img 
              src="/assets/images/pusdatin-logo.png" 
              alt="Logo Pusdatin" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Agenda Pimpinan</CardTitle>
          <CardDescription className="text-center">
            Masuk ke sistem Agenda Pimpinan<br />
            <span className="text-sm text-gray-500">Kementerian Hukum RI</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Masukkan username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Masukkan password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-600">
            <p className="text-center">Demo credentials:</p>
            <p className="text-center font-mono text-xs">
              superadmin / superadmin123
            </p>
            <p className="text-center font-mono text-xs">
              admin / admin123
            </p>
            <p className="text-center font-mono text-xs">
              user1 / user123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
