"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, MapPin, User, Users, AlertTriangle, CheckCircle, XCircle, Plus } from "lucide-react";
import { apiService } from "@/services/apiService";
import toast from "react-hot-toast";
import DelegationModal from "./DelegationModal";
import DelegationStatus from "./DelegationStatus";

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

interface MyInvitationsProps {
  onAddAgenda?: () => void;
}

export default function MyInvitations({ onAddAgenda }: MyInvitationsProps) {
  const [undangan, setUndangan] = useState<Undangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUndangan, setSelectedUndangan] = useState<Undangan | null>(null);
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'opened' | 'responded'>('all');

  useEffect(() => {
    loadMyInvitations();
  }, []);

  const loadMyInvitations = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/undangan/my-invitations?limit=50');
      setUndangan(response.data?.undangan || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Gagal memuat undangan');
    } finally {
      setLoading(false);
    }
  };

  const updateUndanganStatus = async (undanganId: number, status: 'opened' | 'responded') => {
    try {
      await apiService.patch(`/undangan/${undanganId}/status`, { status });
      toast.success(`Status berhasil diupdate ke ${status === 'opened' ? 'dibaca' : 'merespons'}`);
      loadMyInvitations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal mengupdate status');
    }
  };

  const handleDelegationSuccess = () => {
    loadMyInvitations();
  };

  const openDelegationModal = (undangan: Undangan) => {
    setSelectedUndangan(undangan);
    setIsDelegationModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'opened':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'responded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="secondary">Belum Dibaca</Badge>;
      case 'opened':
        return <Badge variant="default">Sudah Dibaca</Badge>;
      case 'responded':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sudah Merespons</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDelegationLevelBadge = (level: number) => {
    if (level === 0) return null;
    const colors = ['bg-blue-100 text-blue-800', 'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800'];
    return (
      <Badge className={colors[level - 1] || 'bg-gray-100 text-gray-800'}>
        Delegasi Level {level}
      </Badge>
    );
  };

  const filteredUndangan = undangan.filter(item => 
    statusFilter === 'all' || item.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Memuat undangan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter and Add Button */}
      <div className="flex justify-between items-center">
        {/* Add Agenda Button (if provided) */}
        {onAddAgenda && (
          <Button
            onClick={onAddAgenda}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Undangan
          </Button>
        )}
        
        {/* Status Filter */}
        <div className="flex gap-2">
          {(['all', 'new', 'opened', 'responded'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Semua' : 
               status === 'new' ? 'Belum Dibaca' :
               status === 'opened' ? 'Sudah Dibaca' : 'Sudah Merespons'}
            </Button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{undangan.length}</div>
                <div className="text-sm text-gray-600">Total Undangan</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold">
                  {undangan.filter(u => u.status === 'new').length}
                </div>
                <div className="text-sm text-gray-600">Belum Dibaca</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {undangan.filter(u => u.status === 'responded').length}
                </div>
                <div className="text-sm text-gray-600">Sudah Merespons</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {undangan.filter(u => u.delegation_level > 0).length}
                </div>
                <div className="text-sm text-gray-600">Dengan Delegasi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      {filteredUndangan.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada undangan</h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'Anda belum memiliki undangan' 
                : `Tidak ada undangan dengan status "${statusFilter}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUndangan.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.agenda_judul}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.agenda_tanggal).toLocaleDateString('id-ID')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {item.agenda_waktu_mulai} - {item.agenda_waktu_selesai}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {item.agenda_lokasi}
                      </div>
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getDelegationLevelBadge(item.delegation_level)}
                    {getStatusIcon(item.status)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Delegation Info */}
                {item.delegated_to_nama && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Undangan ini didelegasi ke: <strong>{item.delegated_to_nama}</strong>
                      {item.notes && <div className="text-sm mt-1">Catatan: {item.notes}</div>}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Delegation Status */}
                <DelegationStatus undanganId={item.id} showDetails={true} />
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {item.status === 'new' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateUndanganStatus(item.id, 'opened')}
                    >
                      Tandai Dibaca
                    </Button>
                  )}
                  
                  {item.status === 'opened' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateUndanganStatus(item.id, 'responded')}
                    >
                      Konfirmasi Hadir
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openDelegationModal(item)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    Delegasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delegation Modal */}
      <DelegationModal
        isOpen={isDelegationModalOpen}
        onClose={() => setIsDelegationModalOpen(false)}
        undangan={selectedUndangan}
        onDelegationSuccess={handleDelegationSuccess}
      />
    </div>
  );
}

