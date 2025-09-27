import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProtectedPage } from './ProtectedPage';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

interface FormTemplateProps {
  title: string;
  endpoint: string;
  method?: 'POST' | 'PUT';
  initialData?: any;
  children: (formData: any, setFormData: any, errors: any) => React.ReactNode;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  requiredRole?: string;
}

export const FormTemplate: React.FC<FormTemplateProps> = ({
  title,
  endpoint,
  method = 'POST',
  initialData = {},
  children,
  onSuccess,
  onCancel,
  breadcrumbs,
  requiredRole
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      let result;
      
      // Filter out fields that shouldn't be sent in PUT requests
      let dataToSend = { ...formData };
      if (method === 'PUT') {
        // Remove fields that shouldn't be updated
        delete dataToSend.id;
        delete dataToSend.username;
        delete dataToSend.email;
        delete dataToSend.nip;
        delete dataToSend.position;
        delete dataToSend.department;
        delete dataToSend.created_at;
        delete dataToSend.updated_at;
      }
      
      // Form data prepared for submission
      
      if (method === 'PUT') {
        result = await apiService.put(endpoint, dataToSend);
      } else {
        result = await apiService.post(endpoint, dataToSend);
      }

      toast.success('Data berhasil disimpan!');
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        // Default behavior: go back
        router.back();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal menyimpan data';
      
      // Handle validation errors with field-specific errors
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        // Also show the main error message in toast
        if (err.response.data.message) {
          toast.error(err.response.data.message);
        }
      } else if (err.response?.data?.message) {
        // Show backend error message in toast
        toast.error(err.response.data.message);
      } else {
        // Show error message in toast for other errors
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <ProtectedPage 
      title={title} 
      breadcrumbs={breadcrumbs}
      requiredRole={requiredRole}
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {children(formData, setFormData, errors)}
          
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedPage>
  );
};
