"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchablePegawaiDropdown from "@/components/SearchablePegawaiDropdown";
import { UserCheck, UserX, UserCog, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";
import { apiService } from "@/services/apiService";
import { API_ENDPOINTS } from "@/services/apiEndpoints";
import { getErrorMessage, logError, isValidationError } from "@/utils/errorHandler";

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
    
    // Validate form and get errors directly
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

    // Set errors in state
    setErrors(newErrors);

    // Check if there are validation errors
    if (Object.keys(newErrors).length > 0) {
      // Get specific error messages from the newErrors object
      const errorMessages = [];
      if (newErrors.attendanceStatus) errorMessages.push(newErrors.attendanceStatus);
      if (newErrors.reason) errorMessages.push(newErrors.reason);
      if (newErrors.representative) errorMessages.push(newErrors.representative);
      
      const errorMessage = errorMessages.join(', ');
        
        
      toast.error(errorMessage, {
        duration: 4000,
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
        // REMARK: Status acara tidak perlu diupdate di database karena akan dihitung dinamis
        // berdasarkan waktu agenda (start_time, end_time) vs waktu server saat ini
        // Status acara: scheduled (belum mulai), in_progress (sedang berlangsung), completed (selesai)
        // Yang disimpan hanya attendance_status untuk tracking kehadiran user
        attendance_status: formData.attendanceStatus // Status kehadiran user (attending, not_attending, represented)
      };

      // Add notes based on attendance status (bukan status acara)
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

      if (!agenda?.id) {
        throw new Error("ID agenda tidak ditemukan");
      }

      const result = await apiService.put(API_ENDPOINTS.AGENDA.UPDATE(agenda.id!), updateData);
      
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
      logError(error, 'UpdateAgendaStatus');
      
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
                <label className="text-sm font-medium text-gray-700 mb-3 block">Status Kehadiran *</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="attending"
                      name="attendance"
                      value="attending"
                      checked={formData.attendanceStatus === 'attending'}
                      onChange={(e) => handleInputChange("attendanceStatus", e.target.value)}
                      className="text-green-600"
                    />
                    <label htmlFor="attending" className="text-sm font-medium text-green-700">
                      Menghadiri
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="not_attending"
                      name="attendance"
                      value="not_attending"
                      checked={formData.attendanceStatus === 'not_attending'}
                      onChange={(e) => handleInputChange("attendanceStatus", e.target.value)}
                      className="text-red-600"
                    />
                    <label htmlFor="not_attending" className="text-sm font-medium text-red-700">
                      Tidak Menghadiri
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="represented"
                      name="attendance"
                      value="represented"
                      checked={formData.attendanceStatus === 'represented'}
                      onChange={(e) => handleInputChange("attendanceStatus", e.target.value)}
                      className="text-blue-600"
                    />
                    <label htmlFor="represented" className="text-sm font-medium text-blue-700">
                      Diwakilkan
                    </label>
                  </div>
                </div>
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Pilih Perwakilan *
                  </label>
                  <SearchablePegawaiDropdown
                    value={formData.representative}
                    onChange={(value) => handleInputChange("representative", value)}
                    placeholder="Cari dan pilih pegawai yang akan mewakili"
                  />
                  {errors.representative && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.representative}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Pegawai yang dipilih akan ditambahkan ke daftar peserta agenda
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
