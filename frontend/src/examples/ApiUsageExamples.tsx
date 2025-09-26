/**
 * API Usage Examples
 * This file demonstrates how to use the centralized API service
 * 
 * Note: This is an example file and should not be used in production
 */

import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { API_ENDPOINTS } from '@/services/apiEndpoints';
import { useApi, useAgendaApi, useUserApi, useApiPost } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

// Example 1: Using API Service Directly
export function DirectApiServiceExample() {
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAgendas = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(API_ENDPOINTS.AGENDA.LIST);
      setAgendas(data);
    } catch (error) {
      toast.error('Failed to fetch agendas');
    } finally {
      setLoading(false);
    }
  };

  const createAgenda = async () => {
    try {
      const newAgenda = await apiService.post(API_ENDPOINTS.AGENDA.CREATE, {
        title: 'New Meeting',
        description: 'Example meeting',
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        location: 'Conference Room',
        priority: 'medium',
        attendees: ['John Doe', 'Jane Smith']
      });
      
      toast.success('Agenda created successfully');
      fetchAgendas(); // Refresh the list
    } catch (error) {
      toast.error('Failed to create agenda');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Direct API Service Example</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchAgendas} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Agendas'}
        </Button>
        <Button onClick={createAgenda} className="ml-2">
          Create Sample Agenda
        </Button>
        <div className="mt-4">
          <h3>Agendas ({agendas.length})</h3>
          {agendas.map((agenda: any) => (
            <div key={agenda.id} className="p-2 border rounded mb-2">
              <strong>{agenda.title}</strong> - {agenda.date}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Example 2: Using useApi Hook
export function UseApiHookExample() {
  const { data: agendas, loading, error, refetch } = useApi(
    API_ENDPOINTS.AGENDA.LIST,
    { status: 'pending' } // Query parameters
  );

  if (loading) return <div>Loading agendas...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>UseApi Hook Example</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={refetch}>Refresh</Button>
        <div className="mt-4">
          <h3>Pending Agendas ({agendas?.length || 0})</h3>
          {agendas?.map((agenda: any) => (
            <div key={agenda.id} className="p-2 border rounded mb-2">
              <strong>{agenda.title}</strong> - {agenda.date}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Example 3: Using Specialized Hooks
export function SpecializedHooksExample() {
  const { createAgenda, updateAgenda, deleteAgenda } = useAgendaApi();
  const { getUsers } = useUserApi();
  const [users, setUsers] = useState([]);

  const handleCreateAgenda = async () => {
    const result = await createAgenda({
      title: 'Team Meeting',
      description: 'Weekly team sync',
      date: '2024-01-20',
      start_time: '14:00:00',
      end_time: '15:00:00',
      location: 'Meeting Room A',
      priority: 'high',
      attendees: ['Team Lead', 'Developer']
    });

    if (result) {
      toast.success('Agenda created successfully');
    }
  };

  const handleUpdateAgenda = async (id: number) => {
    const result = await updateAgenda(id, {
      title: 'Updated Team Meeting',
      priority: 'medium'
    });

    if (result) {
      toast.success('Agenda updated successfully');
    }
  };

  const handleDeleteAgenda = async (id: number) => {
    const result = await deleteAgenda(id);
    
    if (result) {
      toast.success('Agenda deleted successfully');
    }
  };

  const fetchUsers = async () => {
    try {
      const userData = await getUsers();
      setUsers(userData);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specialized Hooks Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3>Agenda Operations</h3>
            <Button onClick={handleCreateAgenda}>Create Agenda</Button>
            <Button onClick={() => handleUpdateAgenda(1)} className="ml-2">
              Update Agenda #1
            </Button>
            <Button onClick={() => handleDeleteAgenda(1)} className="ml-2">
              Delete Agenda #1
            </Button>
          </div>
          
          <div>
            <h3>User Operations</h3>
            <Button onClick={fetchUsers}>Fetch Users</Button>
            <div className="mt-2">
              Users: {users.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Example 4: Using POST Hook
export function PostHookExample() {
  const { execute: createUser, loading } = useApiPost(API_ENDPOINTS.USERS.CREATE);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await createUser(formData);
    if (result) {
      toast.success('User created successfully');
      setFormData({ full_name: '', email: '', role: 'user' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>POST Hook Example</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Full Name:</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label>Role:</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Example 5: Advanced Usage with Custom Configuration
export function AdvancedUsageExample() {
  const [result, setResult] = useState(null);

  const fetchWithCustomConfig = async () => {
    try {
      // Custom timeout and retry configuration
      const data = await apiService.get(
        API_ENDPOINTS.AGENDA.LIST,
        { limit: 5 },
        {
          timeout: 10000, // 10 seconds timeout
          retries: 1,     // Only 1 retry
          headers: {
            'Custom-Header': 'example-value'
          }
        }
      );
      
      setResult(data);
      toast.success('Data fetched with custom config');
    } catch (error) {
      toast.error('Failed to fetch data');
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const result = await apiService.uploadFile(
        API_ENDPOINTS.UPLOAD.DOCUMENT,
        file,
        (progress) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Upload progress: ${progress}%`);
          }
        }
        }
      );
      
      toast.success('File uploaded successfully');
      return result;
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const downloadFile = async () => {
    try {
      await apiService.downloadFile(
        API_ENDPOINTS.REPORTS.EXPORT_AGENDA,
        'agenda-report.xlsx'
      );
      
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Usage Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Button onClick={fetchWithCustomConfig}>
              Fetch with Custom Config
            </Button>
            {result && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
          
          <div>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
              className="mb-2"
            />
            <Button onClick={downloadFile} className="ml-2">
              Download Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Example Component
export default function ApiUsageExamples() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">API Service Usage Examples</h1>
      
      <DirectApiServiceExample />
      <UseApiHookExample />
      <SpecializedHooksExample />
      <PostHookExample />
      <AdvancedUsageExample />
    </div>
  );
}
