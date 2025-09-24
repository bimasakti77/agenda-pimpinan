'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import UserLayout from '@/components/UserLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PencilIcon, 
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { ResetPasswordModal } from '@/components/ResetPasswordModal';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  position?: string;
  department?: string;
  role: 'user' | 'admin' | 'superadmin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: user, loading, error } = useApi<User>(`/users/${userId}`);

  // Reset password modal state
  const [resetPasswordModal, setResetPasswordModal] = useState({
    isOpen: false,
    userId: 0,
    username: ''
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <UserLayout title="User Details" description="Detail informasi pengguna">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    );
  }

  if (error || !user) {
    return (
      <UserLayout title="User Not Found" description="Pengguna tidak ditemukan">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">User Not Found</h2>
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <Link href="/users">
            <Button variant="outline">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout 
      title={`User Details: ${user.full_name}`}
      description="Detail informasi pengguna"
    >
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
            <p className="text-gray-600">@{user.username}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/users/${user.id}/edit`}>
              <Button variant="outline" className="flex items-center gap-2">
                <PencilIcon className="w-4 h-4" />
                Edit User
              </Button>
            </Link>
            <Link href="/users">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Users
              </Button>
            </Link>
          </div>
        </div>

        {/* User Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <p className="text-sm text-gray-900">{user.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <p className="text-sm text-gray-900">@{user.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </div>
                {user.position && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <p className="text-sm text-gray-900">{user.position}</p>
                  </div>
                )}
                {user.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <p className="text-sm text-gray-900">{user.department}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <Badge className={getStatusBadgeColor(user.is_active)}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {!user.is_active && (
                  <p className="text-xs text-red-600 mt-1">
                    User will see: "Akun non aktif hubungi administrator"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link href={`/users/${user.id}/edit`} className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit User
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setResetPasswordModal({
                        isOpen: true,
                        userId: user.id,
                        username: user.username
                      });
                    }}
                  >
                    <KeyIcon className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(user.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordModal.isOpen}
        onClose={() => setResetPasswordModal({
          isOpen: false,
          userId: 0,
          username: ''
        })}
        userId={resetPasswordModal.userId}
        username={resetPasswordModal.username}
        onSuccess={() => {
          // Optionally refresh data or show success message
        }}
      />
    </UserLayout>
  );
}
