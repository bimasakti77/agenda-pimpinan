"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, FileText, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiService } from "@/services/apiService";
import { API_ENDPOINTS } from "@/services/apiEndpoints";
import { getErrorMessage, logError, isValidationError } from "@/utils/errorHandler";
import MultipleUndanganSelector from "./MultipleUndanganSelector";
import { UndanganItem, AgendaFormData } from "@/types/agenda";

interface AddAgendaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: number;
    full_name: string;
    role: string;
  } | null;
}

// Types are now imported from @/types/agenda

export default function AddAgendaForm({ isOpen, onClose, onSuccess, user }: AddAgendaFormProps) {
  const [formData, setFormData] = useState<AgendaFormData>({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    priority: "medium",
    nomor_surat: "",
    surat_undangan: "",
    file_undangan: null,
    undangan: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<AgendaFormData>>({});

  const handleInputChange = (field: keyof AgendaFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format file tidak didukung. Gunakan PDF');
        return;
      }
      
      // Validate file size (10MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast.error('Ukuran file terlalu besar. Maksimal 2MB.');
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, file_undangan: file }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AgendaFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Judul agenda harus diisi";
    }

    if (!formData.date) {
      newErrors.date = "Tanggal harus diisi";
    }

    if (!formData.start_time) {
      newErrors.start_time = "Waktu mulai harus diisi";
    }

    if (!formData.end_time) {
      newErrors.end_time = "Waktu selesai harus diisi";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Lokasi harus diisi";
    }

    if (!formData.nomor_surat.trim()) {
      newErrors.nomor_surat = "Nomor surat harus diisi";
    }

    if (!formData.surat_undangan.trim()) {
      newErrors.surat_undangan = "Surat undangan harus diisi";
    }

    if (!formData.undangan || formData.undangan.length === 0) {
      (newErrors as any).undangan = "Minimal harus ada 1 undangan";
    }

    // Validate time logic
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);
      
      if (endTime <= startTime) {
        newErrors.end_time = "Waktu selesai harus setelah waktu mulai";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form and get errors directly
    const newErrors: Partial<AgendaFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Judul agenda harus diisi";
    }

    if (!formData.date) {
      newErrors.date = "Tanggal harus diisi";
    }

    if (!formData.start_time) {
      newErrors.start_time = "Waktu mulai harus diisi";
    }

    if (!formData.end_time) {
      newErrors.end_time = "Waktu selesai harus diisi";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Lokasi harus diisi";
    }

    if (!formData.nomor_surat.trim()) {
      newErrors.nomor_surat = "Nomor surat harus diisi";
    }

    if (!formData.surat_undangan.trim()) {
      newErrors.surat_undangan = "Surat undangan harus diisi";
    }

    // Validate time logic
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);
      
      if (endTime <= startTime) {
        newErrors.end_time = "Waktu selesai harus setelah waktu mulai";
      }
    }

    // Set errors in state
    setErrors(newErrors);

    // Check if there are validation errors
    if (Object.keys(newErrors).length > 0) {
      // Get specific error messages from the newErrors object
      const errorMessages = [];
      if (newErrors.title) errorMessages.push(newErrors.title);
      if (newErrors.date) errorMessages.push(newErrors.date);
      if (newErrors.start_time) errorMessages.push(newErrors.start_time);
      if (newErrors.end_time) errorMessages.push(newErrors.end_time);
      if (newErrors.location) errorMessages.push(newErrors.location);
      if (newErrors.nomor_surat) errorMessages.push(newErrors.nomor_surat);
      if (newErrors.surat_undangan) errorMessages.push(newErrors.surat_undangan);
      
      const errorMessage = errorMessages.join(', ');
      
      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: '#F59E0B', // Orange for validation errors
          color: '#fff',
        },
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Token tidak ditemukan");
      }

      // Convert time format from HH:MM:SS to HH:MM if needed
      const formatTime = (time: string) => {
        if (time.includes(':')) {
          const parts = time.split(':');
          return `${parts[0]}:${parts[1]}`; // Take only HH:MM
        }
        return time;
      };

      const agendaData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        start_time: formatTime(formData.start_time),
        end_time: formatTime(formData.end_time),
        location: formData.location.trim(),
        priority: formData.priority,
        nomor_surat: formData.nomor_surat.trim(),
        surat_undangan: formData.surat_undangan.trim(),
        undangan: formData.undangan,
        status: "scheduled"
      };

      // ✅ SINGLE REQUEST: Create agenda with file in one go
      const formDataToSend = new FormData();
      
      // Add JSON data as 'data' field
      formDataToSend.append('data', JSON.stringify(agendaData));
      
      // Add file if exists
      if (formData.file_undangan) {
        formDataToSend.append('file', formData.file_undangan);
      }

      // ⚠️ IMPORTANT: Don't set Content-Type manually for FormData!
      // Browser will auto-set it with the correct boundary
      const result = await apiService.post(
        API_ENDPOINTS.AGENDA.CREATE, 
        formDataToSend
      );
      
      toast.success(
        formData.file_undangan 
          ? "Agenda dan file berhasil ditambahkan!" 
          : "Agenda berhasil ditambahkan!",
        {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        }
      );

      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        start_time: "",
        end_time: "",
        location: "",
        priority: "medium",
        nomor_surat: "",
        surat_undangan: "",
        file_undangan: null,
        undangan: []
      });
      setErrors({});

      // Close modal and refresh data
      onClose();
      onSuccess();

    } catch (error: any) {
      logError(error, 'AddAgendaForm');
      
      const errorMessage = getErrorMessage(error);
      const isValidation = isValidationError(error);
      
      toast.error(errorMessage, {
        duration: isValidation ? 4000 : 3000,
        style: {
          background: isValidation ? '#F59E0B' : '#EF4444', // Orange for validation, red for other errors
          color: '#fff',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: "",
        description: "",
        date: "",
        start_time: "",
        end_time: "",
        location: "",
        priority: "medium",
        nomor_surat: "",
        surat_undangan: "",
        file_undangan: null,
        undangan: []
      });
      setErrors({});
      onClose();
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tambah Agenda Baru
          </DialogTitle>
          <DialogDescription>
            Isi form di bawah untuk menambahkan agenda baru
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Judul Agenda *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Masukkan judul agenda"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Deskripsi
                </Label>
                <textarea
                  id="description"
                  placeholder="Masukkan deskripsi agenda (opsional)"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="nomor_surat" className="text-sm font-medium">
                  Nomor Surat *
                </Label>
                <Input
                  id="nomor_surat"
                  type="text"
                  placeholder="Masukkan nomor surat (contoh: 001/KUMHAM/2024)"
                  value={formData.nomor_surat}
                  onChange={(e) => handleInputChange("nomor_surat", e.target.value)}
                  className={errors.nomor_surat ? "border-red-500" : ""}
                />
                {errors.nomor_surat && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nomor_surat}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="surat_undangan" className="text-sm font-medium">
                  Surat Undangan *
                </Label>
                <textarea
                  id="surat_undangan"
                  placeholder="Masukkan isi surat undangan"
                  value={formData.surat_undangan}
                  onChange={(e) => handleInputChange("surat_undangan", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.surat_undangan ? "border-red-500" : "border-gray-300"}`}
                  rows={4}
                />
                {errors.surat_undangan && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.surat_undangan}
                  </p>
                )}
              </div>

              {/* File Upload Section */}
              <div>
                <Label htmlFor="file_undangan" className="text-sm font-medium">
                  Upload File Surat Undangan
                </Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file_undangan"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileText className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF (Max. 10MB)
                        </p>
                      </div>
                      <input
                        id="file_undangan"
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  
                  {/* File Preview */}
                  {formData.file_undangan && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            {formData.file_undangan.name}
                          </span>
                          <span className="text-xs text-blue-600">
                            ({(formData.file_undangan.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, file_undangan: null }))}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tanggal dan Waktu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date" className="text-sm font-medium">
                  Tanggal *
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={errors.date ? "border-red-500" : ""}
                />
                {errors.date && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.date}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time" className="text-sm font-medium">
                    Waktu Mulai *
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange("start_time", e.target.value)}
                    className={errors.start_time ? "border-red-500" : ""}
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.start_time}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end_time" className="text-sm font-medium">
                    Waktu Selesai *
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange("end_time", e.target.value)}
                    className={errors.end_time ? "border-red-500" : ""}
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.end_time}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location and Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasi dan Prioritas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  Lokasi *
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Masukkan lokasi agenda"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className={errors.location ? "border-red-500" : ""}
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.location}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium">
                  Prioritas
                </Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Undangan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Undangan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultipleUndanganSelector
                value={formData.undangan}
                onChange={(undangan) => setFormData(prev => ({ ...prev, undangan }))}
                disabled={isLoading}
              />
              {(errors as any).undangan && (
                <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {(errors as any).undangan}
                </p>
              )}
            </CardContent>
          </Card>


          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              {isLoading ? "Menyimpan..." : "Simpan Agenda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
