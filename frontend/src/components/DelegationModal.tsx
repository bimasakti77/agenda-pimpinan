"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { User, Users, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { apiService } from "@/services/apiService";
import toast from "react-hot-toast";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Undangan {
  id: number;
  agenda_id: number;
  user_id: number;
  status: 'new' | 'opened' | 'responded';
  delegation_level: number;
  original_user_id: number;
  delegated_to_user_id?: number;
  delegated_to_pegawai_id?: number;
  delegated_to_nama?: string;
  notes?: string;
  created_at: string;
  opened_at?: string;
  responded_at?: string;
  agenda_judul: string;
  agenda_tanggal: string;
  agenda_waktu_mulai: string;
  agenda_waktu_selesai: string;
  agenda_lokasi: string;
  created_by_username: string;
  delegated_to_username?: string;
}

interface DelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  undangan: Undangan | null;
  onDelegationSuccess: () => void;
}

export default function DelegationModal({ isOpen, onClose, undangan, onDelegationSuccess }: DelegationModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [delegationType, setDelegationType] = useState<'user' | 'pegawai'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [delegatedToNama, setDelegatedToNama] = useState('');
  const [notes, setNotes] = useState('');
  const [canDelegate, setCanDelegate] = useState(false);
  const [delegationInfo, setDelegationInfo] = useState<any>(null);

  // Load users and check delegation eligibility
  useEffect(() => {
    if (isOpen && undangan) {
      loadUsers();
      checkDelegationEligibility();
    }
  }, [isOpen, undangan]);

  const loadUsers = async () => {
    try {
      const response = await apiService.get('/users?limit=100');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Gagal memuat daftar user');
    }
  };

  const checkDelegationEligibility = async () => {
    if (!undangan) return;
    
    try {
      const response = await apiService.get(`/undangan/${undangan.id}/can-delegate`);
      setCanDelegate(response.canDelegate);
      setDelegationInfo(response);
    } catch (error) {
      console.error('Error checking delegation eligibility:', error);
      setCanDelegate(false);
    }
  };

  const handleDelegation = async () => {
    if (!undangan) return;

    // Validation
    if (delegationType === 'user' && !selectedUserId) {
      toast.error('Pilih user untuk delegasi');
      return;
    }
    
    if (!delegatedToNama.trim()) {
      toast.error('Nama delegasi harus diisi');
      return;
    }

    setLoading(true);
    try {
      const delegationData = {
        delegated_to_user_id: delegationType === 'user' ? parseInt(selectedUserId) : null,
        delegated_to_pegawai_id: delegationType === 'pegawai' ? null : null,
        delegated_to_nama: delegatedToNama.trim(),
        notes: notes.trim()
      };

      await apiService.post(`/undangan/${undangan.id}/delegate`, delegationData);
      
      toast.success('Delegasi berhasil dilakukan');
      onDelegationSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error delegating undangan:', error);
      toast.error(error.response?.data?.message || 'Gagal melakukan delegasi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDelegationType('user');
    setSelectedUserId('');
    setDelegatedToNama('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!undangan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Delegasi Undangan
          </DialogTitle>
          <DialogDescription>
            Delegasi undangan ke orang lain jika tidak bisa menghadiri
          </DialogDescription>
        </DialogHeader>

        {/* Undangan Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{undangan.agenda_judul}</CardTitle>
            <CardDescription>
              {new Date(undangan.agenda_tanggal).toLocaleDateString('id-ID')} • 
              {undangan.agenda_waktu_mulai} - {undangan.agenda_waktu_selesai} • 
              {undangan.agenda_lokasi}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Delegation Status */}
        {delegationInfo && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={delegationInfo.canDelegate ? "default" : "destructive"}>
                    Level Delegasi: {delegationInfo.delegationLevel || 0}/2
                  </Badge>
                </div>
                {!delegationInfo.canDelegate && (
                  <p className="text-sm text-red-600">
                    {delegationInfo.reason}
                  </p>
                )}
                {delegationInfo.canDelegate && (
                  <p className="text-sm text-green-600">
                    Anda dapat melakukan delegasi
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Delegation Form */}
        {canDelegate && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="delegation-type">Tipe Delegasi</Label>
              <Select value={delegationType} onValueChange={(value: 'user' | 'pegawai') => setDelegationType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe delegasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User Sistem</SelectItem>
                  <SelectItem value="pegawai">Pegawai Eksternal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {delegationType === 'user' && (
              <div>
                <Label htmlFor="user-select">Pilih User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih user untuk delegasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => user.id !== undangan.user_id) // Exclude current user
                      .map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {user.username} ({user.email})
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="delegated-nama">Nama Delegasi</Label>
              <Input
                id="delegated-nama"
                value={delegatedToNama}
                onChange={(e) => setDelegatedToNama(e.target.value)}
                placeholder="Masukkan nama orang yang akan mewakili"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan tentang delegasi ini..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          {canDelegate && (
            <Button 
              onClick={handleDelegation} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Memproses...' : 'Delegasi'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

