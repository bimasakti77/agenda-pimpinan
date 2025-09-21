'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FormTemplate } from '@/components/FormTemplate';
import UserLayout from '@/components/UserLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewUserPage() {
  const router = useRouter();

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
