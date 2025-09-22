"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredToken } from "@/lib/auth";
import toast from "react-hot-toast";

interface Agenda {
  id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  priority: string;
  created_by_name: string;
  attendees: string[];
  notes?: string;
}

interface EditAgendaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agenda: Agenda | null;
}

export default function EditAgendaForm({ isOpen, onClose, onSuccess, agenda }: EditAgendaFormProps) {
  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when agenda changes
  useEffect(() => {
    if (agenda) {
      setFormData({
        date: agenda.date,
        start_time: agenda.start_time || "",
        end_time: agenda.end_time || "",
        location: agenda.location || "",
        description: agenda.description || ""
      });
    }
  }, [agenda]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.date.trim()) {
      toast.error("Tanggal harus diisi");
      return false;
    }
    
    if (!formData.start_time.trim()) {
      toast.error("Waktu mulai harus diisi");
      return false;
    }
    
    if (!formData.end_time.trim()) {
      toast.error("Waktu selesai harus diisi");
      return false;
    }

    // Validate time logic
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);
      
      if (startTime >= endTime) {
        toast.error("Waktu selesai harus lebih dari waktu mulai");
        return false;
      }
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error("Tanggal tidak boleh di masa lalu");
      return false;
    }

    return true;
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    
    // Handle different time formats
    if (time.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      // Format: HH:MM:SS -> convert to HH:MM
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    } else if (time.match(/^\d{1,2}:\d{2}$/)) {
      // Format: HH:MM -> ensure proper padding
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    return time;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agenda) {
      toast.error("Data agenda tidak ditemukan");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = getStoredToken();
      if (!token) {
        toast.error("Token tidak ditemukan");
        return;
      }

      const updateData: any = {
        date: formData.date,
        start_time: formatTime(formData.start_time),
        end_time: formatTime(formData.end_time)
      };

      // Only include location and description if they have values
      if (formData.location.trim()) {
        updateData.location = formData.location.trim();
      }
      
      if (formData.description.trim()) {
        updateData.description = formData.description.trim();
      }

      console.log("Updating agenda:", agenda.id, updateData);
      console.log("Form data before processing:", formData);
      console.log("Formatted times:", {
        start_time: formatTime(formData.start_time),
        end_time: formatTime(formData.end_time)
      });

      const response = await fetch(`http://localhost:3000/api/agenda/${agenda.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.status === 401) {
        toast.error("Sesi berakhir. Silakan login kembali.");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        
        // Handle validation errors specifically
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.message).join(', ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        
        throw new Error(errorData.message || "Gagal mengupdate agenda");
      }

      const result = await response.json();
      console.log("Update result:", result);

      toast.success("Agenda berhasil diupdate");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating agenda:", error);
      toast.error(error.message || "Terjadi kesalahan saat mengupdate agenda");
    } finally {
      setIsLoading(false);
    }
  };

  if (!agenda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Agenda</DialogTitle>
          <DialogDescription>
            Update informasi agenda: {agenda.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div>
                <Label htmlFor="date">Tanggal *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Waktu Mulai *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange("start_time", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Waktu Selesai *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange("end_time", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Masukkan lokasi agenda"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Masukkan deskripsi agenda"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Menyimpan..." : "Update Agenda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
