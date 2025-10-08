"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, FileText, AlertCircle } from "lucide-react";
import { getErrorMessage, logError, isValidationError } from "@/utils/errorHandler";
import MultipleUndanganSelector from "./MultipleUndanganSelector";

interface EditAgendaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedData: any) => void;
  agenda: {
    id: number;
    title: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    priority: string;
    nomor_surat: string;
    surat_undangan: string;
    undangan: Array<{
  id: number;
      nama: string;
      kategori: string;
      nip?: string;
    }>;
  } | null;
}

interface UndanganItem {
  id?: number;
  pegawai_id?: string | null;
  nama: string;
  kategori: 'internal' | 'eksternal';
  nip?: string | null;
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

export default function EditAgendaForm({ isOpen, onClose, onSuccess, agenda }: EditAgendaFormProps) {
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

  // Initialize form data when agenda changes
  useEffect(() => {
    if (agenda) {
      // Convert agenda.undangan to the format expected by MultipleUndanganSelector
      const convertedUndangan: UndanganItem[] = (agenda.undangan || []).map(u => ({
        id: u.id, // ID from agenda_undangan table for existing records
        pegawai_id: u.kategori === 'internal' ? u.nip : null, // Only for new records
        nama: u.nama,
        kategori: u.kategori as 'internal' | 'eksternal',
        nip: u.nip || null,
        pegawai_nama: u.nama, // Use nama as pegawai_nama
        pegawai_jabatan: undefined // Not available in agenda.undangan
      }));

      setFormData({
        title: agenda.title || "",
        description: agenda.description || "",
        date: agenda.date || "",
        start_time: agenda.start_time || "",
        end_time: agenda.end_time || "",
        location: agenda.location || "",
        priority: agenda.priority || "medium",
        nomor_surat: agenda.nomor_surat || "",
        surat_undangan: agenda.surat_undangan || "",
        undangan: convertedUndangan
      });
    }
  }, [agenda]);

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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert time format from HH:MM:SS to HH:MM if needed
      const formatTime = (time: string) => {
        if (time.includes(':')) {
          const parts = time.split(':');
          return `${parts[0]}:${parts[1]}`; // Take only HH:MM
        }
        return time;
      };

      // Clean undangan data before sending to backend
      const cleanedUndangan = formData.undangan.map(u => {
        if (u.id) {
          // For existing undangan (with id), only send id and nama
          return {
            id: typeof u.id === 'string' ? parseInt(u.id) : u.id, // Ensure id is a number
            nama: u.nama,
            kategori: u.kategori
          };
        } else {
          // For new undangan (without id), send all required fields
          return {
            pegawai_id: u.pegawai_id,
            nama: u.nama,
            kategori: u.kategori,
            nip: u.nip || null
          };
        }
      });

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
        undangan: cleanedUndangan
      };

      onSuccess(agendaData);

    } catch (error: any) {
      logError(error, 'EditAgendaForm');
      
      const errorMessage = getErrorMessage(error);
      const isValidation = isValidationError(error);
      
      console.error('Error updating agenda:', errorMessage);
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
            Edit Agenda
          </DialogTitle>
          <DialogDescription>
            Edit informasi agenda yang sudah ada
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {isLoading ? "Menyimpan..." : "Update Agenda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}