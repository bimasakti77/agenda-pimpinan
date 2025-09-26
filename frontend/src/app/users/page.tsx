'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/apiService';
import UserLayout from '@/components/UserLayout';
import RoleGuard from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ResetPasswordModal } from '@/components/ResetPasswordModal';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  position?: string;
  department?: string;
  nip?: string;
  role: 'user' | 'admin' | 'superadmin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function UsersPage() {
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    is_active: 'all',
    page: 1,
    limit: 10
  });

  // Reset password modal state
  const [resetPasswordModal, setResetPasswordModal] = useState({
    isOpen: false,
    userId: 0,
    username: ''
  });

  // Debounce search to prevent too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Build query string for API
  const queryParams = useMemo(() => {
    // Only add non-empty values
    const finalParams = new URLSearchParams();
    if (debouncedSearch) finalParams.append('search', debouncedSearch);
    if (filters.role && filters.role !== 'all') finalParams.append('role', filters.role);
    if (filters.is_active && filters.is_active !== 'all') finalParams.append('is_active', filters.is_active);
    finalParams.append('page', filters.page.toString());
    finalParams.append('limit', filters.limit.toString());
    
    return finalParams.toString();
  }, [debouncedSearch, filters.role, filters.is_active, filters.page, filters.limit]);

  // Create stable endpoint
  const endpoint = useMemo(() => `/users?${queryParams}`, [queryParams]);
  
  const { data, loading, error, refetch } = useApi<UsersResponse>(
    endpoint
  );




  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiService.put(`/users/${userId}/toggle-status`, {});
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = (userId: number, username: string) => {
    setResetPasswordModal({
      isOpen: true,
      userId,
      username
    });
  };

  const handleCloseResetPasswordModal = () => {
    setResetPasswordModal({
      isOpen: false,
      userId: 0,
      username: ''
    });
  };

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
      <RoleGuard requiredRoles={['superadmin']}>
        <UserLayout title="User Management" description="Kelola pengguna sistem">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </UserLayout>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard requiredRoles={['superadmin']}>
        <UserLayout title="User Management" description="Kelola pengguna sistem">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Users</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              Try Again
            </Button>
          </div>
        </UserLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRoles={['superadmin']}>
      <UserLayout title="User Management" description="Kelola pengguna sistem">
        <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
            <p className="text-gray-600">View and manage all system users</p>
          </div>
          <Link href="/users/new">
            <Button className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Add User
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select value={filters.is_active} onValueChange={(value) => handleFilterChange('is_active', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Per Page
                </label>
                <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Users ({data?.pagination.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.users && data.users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            {user.nip && (
                              <div className="text-xs text-blue-600 font-medium">
                                NIP: {user.nip}
                              </div>
                            )}
                            {user.position && (
                              <div className="text-xs text-gray-400">
                                {user.position} • {user.department}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusBadgeColor(user.is_active)}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/users/${user.id}`}>
                              <Button size="sm" variant="outline">
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/users/${user.id}/edit`}>
                              <Button size="sm" variant="outline">
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(user.id, user.username)}
                            >
                              <KeyIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                              className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            >
                              {user.is_active ? (
                                <XMarkIcon className="w-4 h-4" />
                              ) : (
                                <CheckIcon className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page === 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page === data.pagination.pages}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Reset Password Modal */}
        <ResetPasswordModal
          isOpen={resetPasswordModal.isOpen}
          onClose={handleCloseResetPasswordModal}
          userId={resetPasswordModal.userId}
          username={resetPasswordModal.username}
          onSuccess={() => {
            // Optionally refresh data or show success message
          }}
        />
      </UserLayout>
    </RoleGuard>
    );
  }
