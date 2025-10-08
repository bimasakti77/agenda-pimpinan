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

interface UndanganItem {
  id?: number;
  pegawai_id?: string; // Changed to string to match NIP
  nama: string;
  kategori: 'internal' | 'eksternal';
  pegawai_nama?: string;
  pegawai_jabatan?: string;
}

interface AgendaFormData {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  priority: string;
  nomor_surat: string;
  surat_undangan: string;
  undangan: UndanganItem[];
}

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

    // Undangan tidak lagi wajib saat membuat agenda
    // if (!formData.undangan || formData.undangan.length === 0) {
    //   (newErrors as any).undangan = "Minimal harus ada 1 undangan";
    // }

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
        date: formData.date, // Send as string to avoid timezone issues
        start_time: formatTime(formData.start_time),
        end_time: formatTime(formData.end_time),
        location: formData.location.trim(),
        priority: formData.priority,
        nomor_surat: formData.nomor_surat.trim(),
        surat_undangan: formData.surat_undangan.trim(),
        undangan: formData.undangan,
        // REMARK: Status default untuk backward compatibility dengan backend
        // Status acara akan dihitung dinamis di frontend berdasarkan waktu agenda
        // Default ini hanya untuk memastikan backend tidak error dan database schema tetap konsisten
        // Status yang ditampilkan di UI tetap menggunakan perhitungan real-time
        status: "scheduled" // Default untuk compatibility, akan di-override di frontend
      };

      const result = await apiService.post(API_ENDPOINTS.AGENDA.CREATE, agendaData);
      
      toast.success("Agenda berhasil ditambahkan!", {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });

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
                Input List Undangan
              </CardTitle>
              <p className="text-sm text-gray-600">
                Undangan dapat dikirim setelah agenda dibuat melalui tombol "Kirim Undangan"
              </p>
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
