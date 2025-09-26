'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormTemplate } from '@/components/FormTemplate';
import UserLayout from '@/components/UserLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SearchablePegawaiDropdown from '@/components/SearchablePegawaiDropdown';

export default function NewUserPage() {
  const router = useRouter();
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>('');

  // Check if User Information is complete (must select from dropdown)
  const isUserInfoComplete = (formData: any) => {
    return selectedPegawaiId && selectedPegawaiId.trim() !== '';
  };

  return (
    <UserLayout title="Add New User" description="Tambah pengguna baru ke sistem">
      <FormTemplate
        title="Add New User"
        endpoint="/users"
        method="POST"
        onSuccess={() => router.push('/users')}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'User Management', href: '/users' },
          { label: 'Add User' }
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
                <Label htmlFor="pegawai">Pilih Pegawai *</Label>
                <SearchablePegawaiDropdown
                  value={selectedPegawaiId || ""}
                  onValueChange={(value) => setSelectedPegawaiId(value || "")}
                  onPegawaiSelect={(pegawai) => {
                    if (pegawai) {
                      setFormData({
                        ...formData,
                        nip: pegawai.NIP,
                        full_name: pegawai.Nama,
                        position: pegawai.Jabatan || '',
                        department: pegawai.SatkerID || ''
                      });
                    }
                  }}
                  placeholder="Pilih pegawai untuk auto-fill data"
                  searchPlaceholder="Cari nama atau NIP pegawai..."
                  maxResults={20}
                  minSearchLength={2}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Pilih pegawai untuk mengisi otomatis NIP, nama, jabatan, dan unit kerja
                </p>
              </div>

              {/* Display selected pegawai information */}
              {selectedPegawaiId && formData.full_name && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Data Pegawai Terpilih:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-700">Nama:</span>
                      <span className="ml-2 text-green-600">{formData.full_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">NIP:</span>
                      <span className="ml-2 text-green-600">{formData.nip}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Jabatan:</span>
                      <span className="ml-2 text-green-600">{formData.position || 'Tidak ada jabatan'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Unit Kerja:</span>
                      <span className="ml-2 text-green-600">{formData.department || 'Tidak ada unit kerja'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className={!isUserInfoComplete(formData) ? 'opacity-50 pointer-events-none bg-gray-50' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className={!isUserInfoComplete(formData) ? 'text-gray-400' : 'text-gray-900'}>
                  Account Information
                </span>
                {!isUserInfoComplete(formData) && (
                  <span className="text-sm text-gray-500 font-normal">
                    Pilih pegawai terlebih dahulu
                  </span>
                )}
                {isUserInfoComplete(formData) && (
                  <span className="text-sm text-green-600 font-normal">
                    ✓ Siap diisi
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {isUserInfoComplete(formData) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        <strong>Siap!</strong> Data pegawai telah dipilih. Silakan lengkapi informasi akun di bawah ini.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Enter username"
                    className={errors.username ? 'border-red-500' : ''}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password (min 6 characters)"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>


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
            </CardContent>
          </Card>
        </div>
      )}
    </FormTemplate>
    </UserLayout>
  );
}
