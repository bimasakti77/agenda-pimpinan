"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, UserX, UserCog, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";

interface UpdateAgendaStatusProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agenda: {
    id: number;
    title: string;
    attendees: string[];
    status: string;
  } | null;
  currentUser: {
    id: number;
    full_name: string;
    role: string;
  } | null;
}

interface StatusFormData {
  attendanceStatus: string;
  reason: string;
  representative: string;
}

export default function UpdateAgendaStatus({ 
  isOpen, 
  onClose, 
  onSuccess, 
  agenda, 
  currentUser 
}: UpdateAgendaStatusProps) {
  const [formData, setFormData] = useState<StatusFormData>({
    attendanceStatus: "",
    reason: "",
    representative: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<StatusFormData>>({});

  const handleInputChange = (field: keyof StatusFormData, value: string) => {
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
    const newErrors: Partial<StatusFormData> = {};

    if (!formData.attendanceStatus) {
      newErrors.attendanceStatus = "Status kehadiran harus dipilih";
    }

    if (formData.attendanceStatus === "not_attending" && !formData.reason.trim()) {
      newErrors.reason = "Alasan tidak menghadiri harus diisi";
    }

    if (formData.attendanceStatus === "represented" && !formData.representative.trim()) {
      newErrors.representative = "Nama perwakilan harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Mohon perbaiki error yang ada", {
        duration: 3000,
        style: {
          background: '#EF4444',
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

      // Prepare update data
      let updateData: any = {
        status: formData.attendanceStatus === "attending" ? "in_progress" : 
                formData.attendanceStatus === "not_attending" ? "cancelled" : 
                "scheduled"
      };

      // Add notes based on status
      let notes = "";
      if (formData.attendanceStatus === "not_attending") {
        notes = `Tidak menghadiri - Alasan: ${formData.reason}`;
      } else if (formData.attendanceStatus === "represented") {
        notes = `Diwakilkan oleh: ${formData.representative}`;
        // Update attendees list to include representative
        const updatedAttendees = [...(agenda?.attendees || [])];
        if (!updatedAttendees.includes(formData.representative)) {
          updatedAttendees.push(formData.representative);
        }
        updateData.attendees = updatedAttendees;
      } else {
        notes = "Menghadiri agenda";
      }

      updateData.notes = notes;

      console.log("Updating agenda with data:", updateData);

      const response = await fetch(`http://localhost:3000/api/agenda/${agenda?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.status === 401) {
        throw new Error("Sesi berakhir. Silakan login kembali.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        
        // Handle validation errors specifically
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map((err: any) => err.message).join(', ');
          throw new Error(`Validation error: ${validationErrors}`);
        }
        
        throw new Error(errorData.message || "Gagal mengupdate status agenda");
      }

      const result = await response.json();
      
      toast.success("Status agenda berhasil diupdate!", {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });

      // Reset form
      setFormData({
        attendanceStatus: "",
        reason: "",
        representative: ""
      });
      setErrors({});

      // Close modal and refresh data
      onClose();
      onSuccess();

    } catch (error: any) {
      console.error("Error updating agenda status:", error);
      toast.error(error.message || "Terjadi kesalahan saat mengupdate status agenda", {
        duration: 3000,
        style: {
          background: '#EF4444',
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
        attendanceStatus: "",
        reason: "",
        representative: ""
      });
      setErrors({});
      onClose();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "attending":
        return <UserCheck className="h-5 w-5 text-green-600" />;
      case "not_attending":
        return <UserX className="h-5 w-5 text-red-600" />;
      case "represented":
        return <UserCog className="h-5 w-5 text-blue-600" />;
      default:
        return <UserCheck className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "attending":
        return "Menghadiri";
      case "not_attending":
        return "Tidak Menghadiri";
      case "represented":
        return "Diwakilkan";
      default:
        return "Pilih Status";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Update Status Kehadiran
          </DialogTitle>
          <DialogDescription>
            Update status kehadiran untuk agenda: <strong>{agenda?.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Peserta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {currentUser?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{currentUser?.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{currentUser?.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="attendanceStatus" className="text-sm font-medium">
                  Pilih Status *
                </Label>
                <Select 
                  value={formData.attendanceStatus} 
                  onValueChange={(value) => handleInputChange("attendanceStatus", value)}
                >
                  <SelectTrigger className={errors.attendanceStatus ? "border-red-500" : ""}>
                    <SelectValue placeholder="Pilih status kehadiran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attending">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span>Menghadiri</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="not_attending">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-600" />
                        <span>Tidak Menghadiri</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="represented">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-blue-600" />
                        <span>Diwakilkan</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.attendanceStatus && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.attendanceStatus}
                  </p>
                )}
              </div>

              {/* Reason Field - Show when not attending */}
              {formData.attendanceStatus === "not_attending" && (
                <div>
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Alasan Tidak Menghadiri *
                  </Label>
                  <textarea
                    id="reason"
                    placeholder="Masukkan alasan tidak menghadiri"
                    value={formData.reason}
                    onChange={(e) => handleInputChange("reason", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.reason ? "border-red-500" : "border-gray-300"
                    }`}
                    rows={3}
                  />
                  {errors.reason && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.reason}
                    </p>
                  )}
                </div>
              )}

              {/* Representative Field - Show when represented */}
              {formData.attendanceStatus === "represented" && (
                <div>
                  <Label htmlFor="representative" className="text-sm font-medium">
                    Nama Perwakilan *
                  </Label>
                  <Input
                    id="representative"
                    type="text"
                    placeholder="Masukkan nama perwakilan"
                    value={formData.representative}
                    onChange={(e) => handleInputChange("representative", e.target.value)}
                    className={errors.representative ? "border-red-500" : ""}
                  />
                  {errors.representative && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.representative}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Nama perwakilan akan ditambahkan ke daftar peserta agenda
                  </p>
                </div>
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
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Status
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
