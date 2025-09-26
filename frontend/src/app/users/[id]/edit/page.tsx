'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { FormTemplate } from '@/components/FormTemplate';
import UserLayout from '@/components/UserLayout';
import { useApi } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import PegawaiDropdown from '@/components/PegawaiDropdown';

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
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>('');

  const { data: user, loading, error } = useApi<User>(`/users/${userId}`);

  if (loading) {
    return (
      <UserLayout title="Edit User" description="Edit informasi pengguna">
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
          <button 
            onClick={() => router.push('/users')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Users
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Edit User" description="Edit informasi pengguna">
    <FormTemplate
      title={`Edit User: ${user.full_name}`}
      endpoint={`/users/${userId}`}
      method="PUT"
      initialData={user}
      onSuccess={() => router.push('/users')}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'User Management', href: '/users' },
        { label: user.full_name, href: `/users/${userId}` },
        { label: 'Edit' }
      ]}
      requiredRole="superadmin"
    >
      {(formData, setFormData, errors) => (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pegawai">Pilih Pegawai</Label>
                <PegawaiDropdown
                  value={selectedPegawaiId || ""}
                  onValueChange={(value) => {
                    setSelectedPegawaiId(value || "");
                    // Reset form data when changing pegawai
                    if (!value) {
                      setFormData({
                        ...formData,
                        nip: '',
                        full_name: formData.full_name, // Keep existing name
                        position: formData.position, // Keep existing position
                        department: formData.department // Keep existing department
                      });
                    }
                  }}
                  onPegawaiSelect={(pegawai) => {
                    if (pegawai) {
                      setFormData({
                        ...formData,
                        nip: pegawai.NIP,
                        full_name: pegawai.Nama,
                        position: pegawai.Jabatan || formData.position,
                        department: pegawai.SatkerID || formData.department
                      });
                    }
                  }}
                  placeholder="Pilih pegawai untuk update data"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Pilih pegawai untuk mengupdate NIP, nama, jabatan, dan unit kerja
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    disabled
                    placeholder="Username cannot be changed"
                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Username cannot be modified after creation</p>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    disabled
                    placeholder="Email cannot be changed"
                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be modified after creation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({...formData, nip: e.target.value})}
                    placeholder="Enter NIP (optional)"
                    className={errors.nip ? 'border-red-500' : ''}
                  />
                  {errors.nip && (
                    <p className="text-sm text-red-500 mt-1">{errors.nip}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Enter full name"
                    className={errors.full_name ? 'border-red-500' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="Enter position"
                    className={errors.position ? 'border-red-500' : ''}
                  />
                  {errors.position && (
                    <p className="text-sm text-red-500 mt-1">{errors.position}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="Enter department"
                    className={errors.department ? 'border-red-500' : ''}
                  />
                  {errors.department && (
                    <p className="text-sm text-red-500 mt-1">{errors.department}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={formData.role || 'user'} 
                    onValueChange={(value) => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-500 mt-1">{errors.role}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active || false}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Active Account</Label>
                </div>
              </div>

              {!formData.is_active && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Account Inactive
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This user will not be able to login. They will see the message: "Akun non aktif hubungi administrator"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </FormTemplate>
    </UserLayout>
  );
}
