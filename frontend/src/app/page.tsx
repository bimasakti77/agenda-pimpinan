"use client";

import { useEffect } from "react";
import { getStoredToken, getStoredUser } from "@/lib/auth";

export default function HomePage() {
  useEffect(() => {
    // Check if user is already logged in
    const token = getStoredToken();
    const user = getStoredUser();
    
    if (token && user) {
      // User is logged in, redirect to dashboard
      window.location.href = "/dashboard";
    } else {
      // User is not logged in, redirect to login
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Mengarahkan ke halaman yang sesuai...</p>
      </div>
    </div>
  );
}