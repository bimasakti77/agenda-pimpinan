"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type User } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedPage } from "@/components/ProtectedPage";
import Sidebar from "@/components/Sidebar";
import ProfileDropdown from "@/components/ProfileDropdown";
import AddAgendaForm from "@/components/AddAgendaForm";
import EditAgendaForm from "@/components/EditAgendaForm";
import { FileText, Plus, Calendar, Clock, MapPin, Users, Eye, Edit, Trash2, Filter, Search, ChevronLeft, ChevronRight, TrendingUp, CheckCircle, Mail, UserCheck, AlertCircle, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiService } from "@/services/apiService";
import { buildEndpoint } from "@/services/apiEndpoints";
import toast from "react-hot-toast";
import SearchablePegawaiDropdown from "@/components/SearchablePegawaiDropdown";

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
  created_by: number; // User ID who created the agenda
  created_by_name: string;
  kirim_undangan?: number; // 0 = belum dikirim, 1 = sudah dikirim
  undangan: Array<{
    id: number;
    nama: string;
    kategori: string;
    nip?: string;
  }>;
  notes?: string;
  nomor_surat: string;
  surat_undangan: string;
  created_at: string;
  updated_at: string;
}

// User interface is now imported from @/lib/auth

export default function MyAgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [upcomingAgendas, setUpcomingAgendas] = useState<Agenda[]>([]);
  const [pastAgendas, setPastAgendas] = useState<Agenda[]>([]);
  // Removed local user state - now using AuthContext
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState("my-agenda");
  const [isAddAgendaOpen, setIsAddAgendaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    totalAgendas: 0,
    upcomingToday: 0,
    pendingInvitations: 0,
    completedThisWeek: 0,
    delegationPending: 0
  });
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<'all' | 'new' | 'opened' | 'responded'>('all');
  const [invitationSearchTerm, setInvitationSearchTerm] = useState('');
  const [isViewInvitationModalOpen, setIsViewInvitationModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [respondInvitation, setRespondInvitation] = useState<any>(null);
  const [respondFormData, setRespondFormData] = useState({
    attendanceStatus: '',
    reason: '',
    representative: ''
  });
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [isSendInvitationModalOpen, setIsSendInvitationModalOpen] = useState(false);
  const [agendaToSendInvitation, setAgendaToSendInvitation] = useState<Agenda | null>(null);

  const { user, logout } = useAuth();

  // Define all functions first
  const loadAgendas = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { limit: 100 };
      const endpoint = buildEndpoint('/agenda/my-agendas', params);
      const result = await apiService.get(endpoint);
      
      let allAgendas: Agenda[] = [];
      
      // Handle different response structures (same as calendar)
      if (result) {
        if (result.data && result.data.agendas && Array.isArray(result.data.agendas)) {
          // Response has data.agendas property (my-agendas structure)
          allAgendas = result.data.agendas;
        } else if (result.data && result.data.agenda && Array.isArray(result.data.agenda)) {
          // Response has data.agenda property (fallback structure)
          allAgendas = result.data.agenda;
        } else if (result.agendas && Array.isArray(result.agendas)) {
          // Response has agendas property (fallback structure)
          allAgendas = result.agendas;
        } else if (result.agenda && Array.isArray(result.agenda)) {
          // Response has agenda property (fallback structure)
          allAgendas = result.agenda;
        } else if (Array.isArray(result)) {
          // Response is directly an array
          allAgendas = result;
        } else {
          // Fallback: try to find agenda in the response
          allAgendas = result.data?.agendas || result.data?.agenda || result.agendas || result.agenda || [];
        }
      }
      
      setAgendas(allAgendas);
      
      // Separate agendas by date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const upcoming = allAgendas
        .filter(agenda => {
          const agendaDate = new Date(agenda.date);
          agendaDate.setHours(0, 0, 0, 0);
          return agendaDate >= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // ASC
      
      const past = allAgendas
        .filter(agenda => {
          const agendaDate = new Date(agenda.date);
          agendaDate.setHours(0, 0, 0, 0);
          return agendaDate < today;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // DESC
      
      setUpcomingAgendas(upcoming);
      setPastAgendas(past);
      
    } catch (err: any) {
      console.error("Error loading agendas:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat agenda.");
      setAgendas([]);
      setUpcomingAgendas([]);
      setPastAgendas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const response = await apiService.get('/undangan/my-invitations?limit=10');
      
      // Fix: API returns data directly, not in response.data
      const undanganData = response.undangan || response.data?.undangan || [];
      
      setInvitations(undanganData);
      
      // Update pending invitations count
      const pendingCount = undanganData.filter((inv: any) => inv.status === 'new').length;
      setDashboardStats(prev => ({
        ...prev,
        pendingInvitations: pendingCount
      }));
    } catch (error: any) {
      console.error('Error loading invitations:', error);
      toast.error('Gagal memuat undangan');
      setInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  // Initial load - hanya sekali saat user login
  useEffect(() => {
    if (user) {
      loadAgendas();
      loadInvitations();
    }
  }, [user]);

  const handleLogout = () => {
    toast.success("Logout berhasil! Sampai jumpa!", {
      duration: 1500,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
    setTimeout(() => {
      logout();
    }, 1000);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === "dashboard") {
      window.location.href = "/dashboard";
    } else if (view === "calendar") {
      window.location.href = "/calendar";
    } else if (view === "my-agenda") {
      // Already on my-agenda page, just update current view
      setCurrentView("my-agenda");
    } else if (view === "users") {
      window.location.href = "/users";
    }
  };

  const handleAddAgenda = () => {
    setIsAddAgendaOpen(true);
  };

  const handleAddAgendaSuccess = () => {
    setIsAddAgendaOpen(false);
    loadAgendas(); // Refresh data
    loadInvitations(); // Refresh invitations
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Terjadwal';
      case 'ongoing': return 'Berlangsung';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  // Filter agendas based on search term and status
  const getFilteredAgendas = (agendas: Agenda[]) => {
    return agendas.filter(agenda => {
      const matchesSearch = agenda.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agenda.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agenda.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || agenda.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredUpcomingAgendas = getFilteredAgendas(upcomingAgendas);
  const filteredPastAgendas = getFilteredAgendas(pastAgendas);

  // Calculate dashboard stats
  const calculateDashboardStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const upcomingToday = agendas.filter(agenda => {
      const agendaDate = new Date(agenda.date);
      agendaDate.setHours(0, 0, 0, 0);
      return agendaDate.getTime() === today.getTime();
    }).length;

    const completedThisWeek = agendas.filter(agenda => {
      const agendaDate = new Date(agenda.date);
      return agendaDate >= weekAgo && agendaDate < today && agenda.status === 'completed';
    }).length;

    setDashboardStats({
      totalAgendas: agendas.length,
      upcomingToday,
      pendingInvitations: 0, // Will be loaded from invitations API
      completedThisWeek,
      delegationPending: 0 // Will be loaded from delegation API
    });
  };

  // Update stats when agendas change
  useEffect(() => {
    if (agendas.length > 0) {
      calculateDashboardStats();
    }
  }, [agendas]);

  // Advanced Mini Calendar functions (adapted from CalendarView)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAgendasForDate = (date: Date) => {
    return agendas.filter(agenda => {
      const agendaDate = new Date(agenda.date);
      return agendaDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // You can add logic here to filter agendas by selected date
  };

  // Get agenda status (adapted from CalendarView)
  const getAgendaStatus = (agenda: Agenda) => {
    const now = new Date();
    const agendaDate = new Date(agenda.date);
    const startTime = new Date(`${agenda.date}T${agenda.start_time}`);
    const endTime = new Date(`${agenda.date}T${agenda.end_time}`);
    
    if (agenda.status === 'cancelled') return 'cancelled';
    if (agenda.status === 'completed') return 'completed';
    if (now >= startTime && now <= endTime) return 'ongoing';
    if (now < startTime) return 'scheduled';
    return 'completed';
  };

  // Get event style based on priority and status (adapted from CalendarView)
  const getEventStyle = (agenda: Agenda) => {
    const currentStatus = getAgendaStatus(agenda);
    let backgroundColor = "#3b82f6"; // default blue
    
    // Priority colors
    if (agenda.priority === "high") {
      backgroundColor = "#ef4444"; // red
    } else if (agenda.priority === "medium") {
      backgroundColor = "#f97316"; // orange
    } else if (agenda.priority === "low") {
      backgroundColor = "#22c55e"; // green
    }
    
    // Status modifications
    if (currentStatus === 'cancelled') {
      backgroundColor = "#6b7280"; // gray
    } else if (currentStatus === 'ongoing') {
      backgroundColor = "#8b5cf6"; // purple
    }
    
    return {
      backgroundColor,
      borderColor: backgroundColor,
      color: 'white',
      borderRadius: '4px',
      border: 'none',
      fontSize: '10px',
      padding: '1px 2px'
    };
  };

  // Format date helper (adapted from CalendarView)
  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle invitation actions
  // Handle view invitation modal
  const handleViewInvitation = async (invitation: any) => {
    setSelectedInvitation(invitation);
    setIsViewInvitationModalOpen(true);
    
    // Auto-mark as opened if status is new
    if (invitation.status === 'new') {
      try {
        await handleInvitationAction(invitation.id, 'open');
        // Update the invitation status in local state
        setInvitations(prev => 
          prev.map(inv => 
            inv.id === invitation.id 
              ? { ...inv, status: 'opened', opened_at: new Date().toISOString() }
              : inv
          )
        );
      } catch (error) {
        console.error('Error updating invitation status:', error);
        toast.error('Gagal memperbarui status undangan');
      }
    }
  };

  // Handle respond invitation modal
  const handleRespondInvitation = (invitation: any) => {
    setRespondInvitation(invitation);
    setRespondFormData({
      attendanceStatus: '',
      reason: '',
      representative: ''
    });
    setIsRespondModalOpen(true);
  };

  const handleInvitationAction = async (invitationId: number, action: 'open' | 'respond') => {
    try {
      const response = await apiService.patch(`/undangan/${invitationId}/status`, { 
        status: action === 'open' ? 'opened' : 'responded' 
      });
      
      if (action === 'respond') {
        toast.success('Undangan berhasil direspons');
        loadInvitations(); // Refresh invitations for respond action
      }
      
      return response;
    } catch (error) {
      console.error('Error updating invitation:', error);
      toast.error('Gagal mengupdate undangan');
      throw error;
    }
  };

  // Handle send invitations
  const handleSendInvitations = (agendaId: number) => {
    const agenda = [...upcomingAgendas, ...pastAgendas].find(a => a.id === agendaId);
    if (agenda) {
      setAgendaToSendInvitation(agenda);
      setIsSendInvitationModalOpen(true);
    }
  };

  const confirmSendInvitations = async () => {
    if (!agendaToSendInvitation) return;
    
    try {
      const response = await apiService.post(`/agenda/${agendaToSendInvitation.id}/send-invitations`);
      console.log('Response from send-invitations:', response);
      
      // Handle different response structures
      let invitationsSent = 0;
      if (response && response.data) {
        invitationsSent = response.data.invitations_sent || 0;
      } else if (response && response.invitations_sent) {
        invitationsSent = response.invitations_sent;
      }
      
      toast.success(`Berhasil mengirim ${invitationsSent} undangan`);
      
      // Close modal first
      setIsSendInvitationModalOpen(false);
      setAgendaToSendInvitation(null);
      
      // Then refresh agendas and invitations
      loadAgendas(); // Refresh agendas to update kirim_undangan status
      loadInvitations(); // Refresh invitations to show new undangan
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      toast.error('Gagal mengirim undangan');
    }
  };

  // Handle view agenda
  const handleViewAgenda = (agendaId: number) => {
    const agenda = [...upcomingAgendas, ...pastAgendas].find(a => a.id === agendaId);
    if (agenda) {
      setSelectedAgenda(agenda);
      setIsViewModalOpen(true);
    }
  };

  // Handle edit agenda
  const handleEditAgenda = (agendaId: number) => {
    const agenda = [...upcomingAgendas, ...pastAgendas].find(a => a.id === agendaId);
    if (agenda) {
      setEditingAgenda(agenda);
      setIsEditModalOpen(true);
    }
  };

  // Handle update agenda
  const handleUpdateAgenda = async (updatedData: any) => {
    if (!editingAgenda) return;
    
    try {
      await apiService.put(`/agenda/${editingAgenda.id}`, updatedData);
      toast.success('Agenda berhasil diupdate!');
      setIsEditModalOpen(false);
      setEditingAgenda(null);
      loadAgendas(); // Refresh agendas
      loadInvitations(); // Refresh invitations
    } catch (error: any) {
      console.error('Error updating agenda:', error);
      console.error('Error details:', error?.response?.data);
      toast.error('Gagal mengupdate agenda');
    }
  };

  // Handle delete agenda
  const handleDeleteAgenda = (agendaId: number) => {
    // TODO: Implement delete functionality
    console.log('Delete agenda:', agendaId);
  };

  // Check if user can edit/delete agenda
  const canEditDeleteAgenda = (agenda: Agenda) => {
    if (!user) return false;
    
    // 1. Authorization check: Admin/Superadmin can edit all, users can only edit their own
    const hasPermission = ['admin', 'superadmin'].includes(user.role) || agenda.created_by === user.id;
    if (!hasPermission) return false;
    
    // 2. Check if invitations haven't been sent yet (kirim_undangan = 0)
    if (agenda.kirim_undangan === 1) return false;
    
    // 3. Check time constraint: can edit if more than 1 hour before event
    const now = new Date();
    const agendaDate = new Date(agenda.date);
    const agendaTime = new Date(`${agenda.date}T${agenda.start_time}`);
    
    // If agenda is in the past, cannot edit
    if (agendaTime < now) return false;
    
    // Calculate time difference in hours
    const timeDiffHours = (agendaTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can edit if more than 1 hour before event
    return timeDiffHours > 1;
  };

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <div className="relative">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          </div>
        );
      case 'opened':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'responded':
        return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  const getInvitationStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Baru';
      case 'opened': return 'Dibaca';
      case 'responded': return 'Direspons';
      default: return status;
    }
  };

  // Filter invitations based on status and search term (memoized)
  const filteredInvitations = useMemo(() => {
    return invitations.filter(invitation => {
      const matchesStatus = invitationStatusFilter === 'all' || invitation.status === invitationStatusFilter;
      const matchesSearch = invitationSearchTerm === '' || 
        invitation.agenda_judul?.toLowerCase().includes(invitationSearchTerm.toLowerCase()) ||
        invitation.created_by_username?.toLowerCase().includes(invitationSearchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [invitations, invitationStatusFilter, invitationSearchTerm]);

  // Calculate invitation statistics (memoized)
  const invitationStats = useMemo(() => {
    const total = invitations.length;
    const newCount = invitations.filter(inv => inv.status === 'new').length;
    const respondedCount = invitations.filter(inv => inv.status === 'responded').length;
    const delegatedCount = invitations.filter(inv => inv.delegated_to_user_id || inv.delegated_to_pegawai_id).length;
    
    return { total, newCount, respondedCount, delegatedCount };
  }, [invitations]);

  const renderAgendaTable = (agendas: Agenda[], title: string, emptyMessage: string) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Judul</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Tanggal</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Waktu</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Lokasi</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Prioritas</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Peserta</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Undangan</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {agendas.map((agenda) => (
            <tr key={agenda.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="text-sm font-medium text-gray-900">
                  {agenda.title}
                </div>
                <div className="text-xs text-gray-500">
                  {agenda.nomor_surat}
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {formatDate(agenda.date)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {agenda.start_time} - {agenda.end_time}
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {agenda.location}
              </td>
              <td className="py-3 px-4">
                <Badge className={getPriorityColor(agenda.priority)}>
                  {agenda.priority.charAt(0).toUpperCase() + agenda.priority.slice(1)}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <Badge className={getStatusColor(agenda.status)}>
                  {getStatusLabel(agenda.status)}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {agenda.undangan?.length || 0} peserta
                </div>
              </td>
              <td className="py-3 px-4">
                {(agenda.kirim_undangan === undefined || agenda.kirim_undangan === 0) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendInvitations(agenda.id)}
                    className="h-8 px-3 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Kirim Undangan
                  </Button>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    Sudah Dikirim
                  </Badge>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewAgenda(agenda.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Lihat Detail"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEditDeleteAgenda(agenda) ? (
                    <>
                  <Button
                    size="sm"
                    variant="outline"
                        onClick={() => handleEditAgenda(agenda.id)}
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Edit Agenda"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                        onClick={() => handleDeleteAgenda(agenda.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Hapus Agenda"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="text-gray-400 cursor-not-allowed"
                        title={
                          agenda.kirim_undangan === 1 
                            ? "Tidak dapat diedit karena undangan sudah dikirim" 
                            : "Tidak dapat diedit karena kurang dari 1 jam sebelum acara atau bukan agenda Anda"
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="text-gray-400 cursor-not-allowed"
                        title={
                          agenda.kirim_undangan === 1 
                            ? "Tidak dapat dihapus karena undangan sudah dikirim" 
                            : "Tidak dapat dihapus karena kurang dari 1 jam sebelum acara atau bukan agenda Anda"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ProtectedPage title="Agenda dan Undangan">
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          currentView={currentView}
          onViewChange={handleViewChange}
          isMobileOpen={isMobileSidebarOpen}
          onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <div className="flex-1 lg:ml-64 flex flex-col">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Mobile Hamburger Menu */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="text-gray-600 hover:bg-gray-100 p-2 lg:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Agenda dan Undangan
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      Kelola agenda yang telah Anda buat
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {/* Profile Dropdown */}
                  <ProfileDropdown
                    user={user as any}
                    onLogout={handleLogout}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6">
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Card Besar Atas - Responsive height untuk Undangan Saya dan Mini Calendar */}
              <div className="h-[50vh] sm:h-[55vh] lg:h-[60vh]">
                <Card className="h-full">
                  <CardContent className="p-4 sm:p-6 h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
                     {/* Card Kiri - Undangan Saya */}
                     <Card className="h-full">
                       <CardHeader className="pb-3">
                         <div className="flex items-center justify-between">
                           <CardTitle className="text-lg flex items-center space-x-2">
                             <Mail className="h-5 w-5 text-blue-600" />
                             <span>Undangan Saya</span>
                           </CardTitle>
                           <Badge variant="secondary" className="text-xs">
                             {invitationStats.total} undangan
                           </Badge>
                         </div>
                         
                         {/* Filter dan Search */}
                         <div className="space-y-2 mt-3">
                           <div className="flex space-x-1">
                             {(['all', 'new', 'opened', 'responded'] as const).map((status) => {
                               const getCount = () => {
                                 switch (status) {
                                   case 'all': return invitationStats.total;
                                   case 'new': return invitationStats.newCount;
                                   case 'opened': return invitations.filter(inv => inv.status === 'opened').length;
                                   case 'responded': return invitationStats.respondedCount;
                                   default: return 0;
                                 }
                               };
                               
                               return (
                                 <Button
                                   key={status}
                                   variant={invitationStatusFilter === status ? "default" : "outline"}
                                   size="sm"
                                   onClick={() => setInvitationStatusFilter(status)}
                                   className={`text-xs px-2 py-1 h-6 ${
                                     invitationStatusFilter === status 
                                       ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' 
                                       : 'hover:bg-gray-100'
                                   }`}
                                 >
                                   {status === 'all' ? `Semua (${getCount()})` : 
                                    status === 'new' ? `Baru (${getCount()})` :
                                    status === 'opened' ? `Dibaca (${getCount()})` : `Direspons (${getCount()})`}
                                 </Button>
                               );
                             })}
                           </div>
                           <div className="relative">
                             <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                             <Input
                               placeholder="Cari undangan..."
                               value={invitationSearchTerm}
                               onChange={(e) => setInvitationSearchTerm(e.target.value)}
                               className="pl-7 h-7 text-xs"
                             />
                           </div>
                         </div>
                       </CardHeader>
                       <CardContent className="p-0 overflow-y-auto flex-1">
                         {invitationsLoading ? (
                           <div className="flex items-center justify-center py-8">
                             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                             <span className="ml-2 text-sm text-gray-600">Memuat undangan...</span>
                           </div>
                         ) : filteredInvitations.length === 0 ? (
                           <div className="text-center py-8 px-4">
                             <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                             <p className="text-sm text-gray-500">
                               {invitationSearchTerm || invitationStatusFilter !== 'all' 
                                 ? 'Tidak ada undangan yang sesuai dengan filter' 
                                 : 'Tidak ada undangan'}
                             </p>
                           </div>
                         ) : (
                           <div className="space-y-1">
                             {filteredInvitations.map((invitation) => (
                              <div
                                key={invitation.id}
                                className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                                  invitation.status === 'new' 
                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-l-4 border-l-blue-500 shadow-sm' 
                                    : ''
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  {/* Status Indicator */}
                                  <div className="flex-shrink-0 mt-1">
                                    {getInvitationStatusIcon(invitation.status)}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className={`text-sm font-medium truncate ${
                                        invitation.status === 'new' 
                                          ? 'text-blue-900 font-semibold' 
                                          : 'text-gray-900'
                                      }`}>
                                        {invitation.agenda_judul || 'Undangan Agenda'}
                                        {invitation.status === 'new' && (
                                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Baru
                                          </span>
                                        )}
                                      </h4>
                                      <span className="text-xs text-gray-500">
                                        {new Date(invitation.created_at).toLocaleDateString('id-ID')}
                                      </span>
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 mb-2">
                                      Dari: {invitation.created_by_username || 'Sistem'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            invitation.status === 'new' 
                                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                                              : invitation.status === 'opened'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-purple-100 text-purple-700 border-purple-200'
                                          }`}
                                        >
                                          {getInvitationStatusText(invitation.status)}
                                        </Badge>
                                        
                                        {(invitation.delegated_to_user_id || invitation.delegated_to_pegawai_id) && (
                                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                            Delegasi
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewInvitation(invitation);
                                          }}
                                          className="h-7 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-lg transition-all duration-200 border-0 rounded-md hover:scale-105 active:scale-95"
                                        >
                                          <Mail className="h-3 w-3 mr-1" />
                                          Baca Undangan
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* View All Button */}
                              <div className="p-3 border-t border-gray-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Scroll to bottom card to show all invitations
                                    const bottomCard = document.querySelector('.h-\\[40vh\\]');
                                    if (bottomCard) {
                                      bottomCard.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }}
                                  className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  Lihat Semua Undangan
                                </Button>
                              </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                      {/* Card Kanan - Advanced Mini Calendar */}
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-green-600" />
                              <span>Mini Calendar</span>
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = '/calendar'}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Lihat Full
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 overflow-y-auto flex-1">
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateMonth('prev')}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <h3 className="font-semibold text-lg">
                              {selectedDate.toLocaleDateString('id-ID', { 
                                month: 'long', 
                                year: 'numeric' 
                              })}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateMonth('next')}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Priority Legend (adapted from CalendarView) */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded"></div>
                              <span>Tinggi</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-orange-500 rounded"></div>
                              <span>Sedang</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded"></div>
                              <span>Rendah</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-purple-500 rounded"></div>
                              <span>Berlangsung</span>
                            </div>
                          </div>

                          {/* Calendar Grid */}
                          <div className="space-y-2">
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, index) => (
                                <div key={index} className="text-xs font-medium text-gray-500 p-1">
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Calendar Days with Advanced Event Rendering */}
                            <div className="grid grid-cols-7 gap-1">
                              {getDaysInMonth(selectedDate).map((day, index) => {
                                if (!day) {
                                  return <div key={index} className="h-10"></div>;
                                }

                                const isToday = day.toDateString() === new Date().toDateString();
                                const isSelected = day.toDateString() === selectedDate.toDateString();
                                const dayAgendas = getAgendasForDate(day);
                                const hasAgendas = dayAgendas.length > 0;

                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                      h-10 w-full text-xs rounded-md transition-colors relative
                                      ${isToday 
                                        ? 'bg-blue-600 text-white font-semibold' 
                                        : isSelected 
                                          ? 'bg-blue-100 text-blue-600 font-semibold'
                                          : hasAgendas
                                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                            : 'hover:bg-gray-100'
                                      }
                                    `}
                                  >
                                    <div className="flex flex-col items-center h-full justify-center">
                                      <span className="text-xs">{day.getDate()}</span>
                                      {hasAgendas && (
                                        <div className="flex space-x-0.5 mt-0.5">
                                          {dayAgendas.slice(0, 3).map((agenda, agendaIndex) => {
                                            const eventStyle = getEventStyle(agenda);
                                            return (
                                              <div
                                                key={agendaIndex}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                  backgroundColor: eventStyle.backgroundColor,
                                                  border: `1px solid ${eventStyle.borderColor}`
                                                }}
                                                title={`${agenda.title} (${agenda.priority})`}
                                              />
                                            );
                                          })}
                                          {dayAgendas.length > 3 && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${dayAgendas.length - 3} agenda lainnya`} />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Selected Date Agenda Preview */}
                          <div className="border-t pt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              {selectedDate.toDateString() === new Date().toDateString() 
                                ? `Agenda Hari Ini (${selectedDate.toLocaleDateString('id-ID')})`
                                : `Agenda ${selectedDate.toLocaleDateString('id-ID')}`
                              }
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {getAgendasForDate(selectedDate).length === 0 ? (
                                <p className="text-xs text-gray-500">Tidak ada agenda</p>
                              ) : (
                                getAgendasForDate(selectedDate).slice(0, 4).map((agenda) => {
                                  const eventStyle = getEventStyle(agenda);
                                  const status = getAgendaStatus(agenda);
                                  return (
                                    <div key={agenda.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                      <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: eventStyle.backgroundColor }}
                                      ></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                          {agenda.title}
                                        </p>
                                        <div className="flex items-center space-x-2">
                                          <p className="text-xs text-gray-500">
                                            {agenda.start_time} - {agenda.end_time}
                                          </p>
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs ${
                                              agenda.priority === 'high' 
                                                ? 'bg-red-100 text-red-700 border-red-200'
                                                : agenda.priority === 'medium'
                                                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                                                  : 'bg-green-100 text-green-700 border-green-200'
                                            }`}
                                          >
                                            {agenda.priority}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              {getAgendasForDate(selectedDate).length > 4 && (
                                <p className="text-xs text-gray-500 text-center">
                                  +{getAgendasForDate(selectedDate).length - 4} agenda lainnya
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card Besar Bawah - 40% tinggi dengan Tab dan Filters */}
              <div className="h-[45vh] sm:h-[40vh] lg:h-[40vh]">
                <Card className="h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Header dengan Tab Navigation */}
                    <div className="border-b border-gray-200 p-6 pb-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                          <Button
                            variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-4 py-2 ${
                              activeTab === 'upcoming' 
                                ? 'bg-blue-200 text-blue-800 shadow-sm hover:bg-blue-300' 
                                : 'hover:bg-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                activeTab === 'upcoming' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span>Agenda yang Akan Datang</span>
                              <Badge variant="secondary" className={`ml-2 ${
                                activeTab === 'upcoming' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {filteredUpcomingAgendas.length}
                              </Badge>
                            </div>
                          </Button>
                          <Button
                            variant={activeTab === 'past' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('past')}
                            className={`px-4 py-2 ${
                              activeTab === 'past' 
                                ? 'bg-blue-200 text-blue-800 shadow-sm hover:bg-blue-300' 
                                : 'hover:bg-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                activeTab === 'past' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span>Agenda yang Sudah Lampau</span>
                              <Badge variant="secondary" className={`ml-2 ${
                                activeTab === 'past' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {filteredPastAgendas.length}
                              </Badge>
                            </div>
                          </Button>
                        </div>
                        
                <Button
                  onClick={handleAddAgenda}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Agenda
                </Button>
              </div>

                      {/* Filters dan Search */}
                      <div className="flex items-center space-x-4 pb-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Cari agenda berdasarkan judul, deskripsi, atau lokasi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                  </div>
                        <div className="flex items-center space-x-2">
                          <Filter className="h-4 w-4 text-gray-500" />
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Status</SelectItem>
                              <SelectItem value="scheduled">Terjadwal</SelectItem>
                              <SelectItem value="ongoing">Berlangsung</SelectItem>
                              <SelectItem value="completed">Selesai</SelectItem>
                              <SelectItem value="cancelled">Dibatalkan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                  </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Memuat agenda...</span>
                    </div>
                      ) : (
                        <>
                          {activeTab === 'upcoming' && (
                            <>
                              {filteredUpcomingAgendas.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                      {searchTerm || statusFilter !== 'all' 
                                        ? 'Tidak ada agenda yang sesuai dengan filter' 
                                        : 'Tidak ada agenda yang akan datang'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                                      {searchTerm || statusFilter !== 'all'
                                        ? 'Coba ubah kata kunci pencarian atau filter status'
                                        : 'Semua agenda Anda sudah berlalu atau belum ada agenda yang dibuat.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                                renderAgendaTable(filteredUpcomingAgendas, "Agenda yang Akan Datang", "Tidak ada agenda yang akan datang")
                              )}
                            </>
                          )}

                          {activeTab === 'past' && (
                            <>
                              {filteredPastAgendas.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                      {searchTerm || statusFilter !== 'all' 
                                        ? 'Tidak ada agenda yang sesuai dengan filter' 
                                        : 'Tidak ada agenda yang sudah lampau'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                                      {searchTerm || statusFilter !== 'all'
                                        ? 'Coba ubah kata kunci pencarian atau filter status'
                                        : 'Belum ada agenda yang sudah berlalu.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                                renderAgendaTable(filteredPastAgendas, "Agenda yang Sudah Lampau", "Tidak ada agenda yang sudah lampau")
                  )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Add Agenda Form Modal */}
      <AddAgendaForm
        isOpen={isAddAgendaOpen}
        onClose={() => setIsAddAgendaOpen(false)}
        onSuccess={handleAddAgendaSuccess}
        user={user}
      />

      {/* View Agenda Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detail Agenda
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang agenda
            </DialogDescription>
          </DialogHeader>

          {selectedAgenda && (
            <div className="space-y-6">
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
                    <label className="text-sm font-medium text-gray-700">Judul Agenda</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedAgenda.title}</p>
    </div>
                  
                  {selectedAgenda.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Deskripsi</label>
                      <p className="text-gray-900">{selectedAgenda.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">Nomor Surat</label>
                    <p className="text-gray-900">{selectedAgenda.nomor_surat}</p>
                  </div>

                  {selectedAgenda.surat_undangan && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Surat Undangan</label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedAgenda.surat_undangan}</p>
                      </div>
                    </div>
                  )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tanggal</label>
                      <p className="text-gray-900">{formatDate(selectedAgenda.date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Waktu</label>
                      <p className="text-gray-900">{selectedAgenda.start_time} - {selectedAgenda.end_time}</p>
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
                    <label className="text-sm font-medium text-gray-700">Lokasi</label>
                    <p className="text-gray-900">{selectedAgenda.location}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Prioritas</label>
                      <div className="mt-1">
                        <Badge className={getPriorityColor(selectedAgenda.priority)}>
                          {getPriorityLabel(selectedAgenda.priority)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedAgenda.status)}>
                          {getStatusLabel(selectedAgenda.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              {selectedAgenda.undangan && selectedAgenda.undangan.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Peserta ({selectedAgenda.undangan.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedAgenda.undangan.map((participant, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium text-gray-900">{participant.nama}</p>
                            <p className="text-sm text-gray-600">
                              {participant.kategori === 'internal' ? 'Internal' : 'Eksternal'}
                              {participant.nip && ` • NIP: ${participant.nip}`}
                            </p>
                          </div>
                          <Badge variant="outline" className={
                            participant.kategori === 'internal' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-green-100 text-green-700 border-green-200'
                          }>
                            {participant.kategori}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invitation Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Status Undangan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {(selectedAgenda.kirim_undangan === undefined || selectedAgenda.kirim_undangan === 0) ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-700 font-medium">Belum Dikirim</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 font-medium">Sudah Dikirim</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Agenda Form Modal */}
      <EditAgendaForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAgenda(null);
        }}
        onSuccess={handleUpdateAgenda}
        agenda={editingAgenda}
      />

      {/* Send Invitation Confirmation Dialog */}
      <Dialog open={isSendInvitationModalOpen} onOpenChange={setIsSendInvitationModalOpen} key={agendaToSendInvitation?.id || 'send-invitation'}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Konfirmasi Kirim Undangan aaa
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Undangan akan dikirim, Pastikan daftar peserta sudah sesuai, agenda tidak dapat di edit kembali jika undangan sudah dikirim
            </DialogDescription>
          </DialogHeader>
          
          {agendaToSendInvitation ? (
            <div className="py-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm text-gray-900 mb-2">Detail Agenda:</h4>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Judul:</strong> {agendaToSendInvitation.title}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Tanggal:</strong> {new Date(agendaToSendInvitation.date).toLocaleDateString('id-ID')}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Waktu:</strong> {agendaToSendInvitation.start_time} - {agendaToSendInvitation.end_time}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Peserta:</strong> {agendaToSendInvitation.undangan?.length || 0} orang
                </p>
              </div>

              {/* List Peserta */}
              {agendaToSendInvitation.undangan && agendaToSendInvitation.undangan.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Daftar Peserta yang Akan Dikirim Undangan:
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {agendaToSendInvitation.undangan.map((peserta, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            peserta.kategori === 'internal' ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">
                            {peserta.nama}
                          </span>
                        </div>
                        <Badge 
                          variant={peserta.kategori === 'internal' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {peserta.kategori === 'internal' ? 'Internal' : 'Eksternal'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-gray-500">Loading agenda details...</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSendInvitationModalOpen(false);
                setAgendaToSendInvitation(null);
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmSendInvitations}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Kirim Undangan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invitation Detail Modal */}
      <Dialog open={isViewInvitationModalOpen} onOpenChange={setIsViewInvitationModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Detail Undangan
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvitation && (
            <div className="py-4 space-y-4">
              {/* Agenda Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Informasi Agenda</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Judul:</span>
                    <span className="font-medium">{selectedInvitation.agenda_judul}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-medium">{new Date(selectedInvitation.agenda_tanggal).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waktu:</span>
                    <span className="font-medium">{selectedInvitation.agenda_waktu_mulai} - {selectedInvitation.agenda_waktu_selesai}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lokasi:</span>
                    <span className="font-medium">{selectedInvitation.agenda_lokasi}</span>
                  </div>
                </div>
              </div>

              {/* Invitation Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Informasi Undangan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selectedInvitation.status === 'new' 
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : selectedInvitation.status === 'opened'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                      }`}
                    >
                      {getInvitationStatusText(selectedInvitation.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dari:</span>
                    <span className="font-medium">{selectedInvitation.created_by_username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Undangan:</span>
                    <span className="font-medium">{new Date(selectedInvitation.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  {selectedInvitation.opened_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dibaca pada:</span>
                      <span className="font-medium">{new Date(selectedInvitation.opened_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                  {selectedInvitation.responded_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Direspons pada:</span>
                      <span className="font-medium">{new Date(selectedInvitation.responded_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delegation Info */}
              {(selectedInvitation.delegated_to_user_id || selectedInvitation.delegated_to_pegawai_id) && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Informasi Delegasi</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Didelegasikan ke:</span>
                      <span className="font-medium">{selectedInvitation.delegated_to_nama}</span>
                    </div>
                    {selectedInvitation.notes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Catatan:</span>
                        <span className="font-medium">{selectedInvitation.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsViewInvitationModalOpen(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleRespondInvitation(selectedInvitation);
                setIsViewInvitationModalOpen(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Respon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Invitation Modal */}
      <Dialog open={isRespondModalOpen} onOpenChange={setIsRespondModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Konfirmasi Kehadiran
            </DialogTitle>
            <DialogDescription>
              Silakan konfirmasi kehadiran Anda untuk agenda berikut:
            </DialogDescription>
          </DialogHeader>
          
          {respondInvitation && (
            <div className="py-4">
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{respondInvitation.agenda_judul}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(respondInvitation.agenda_tanggal).toLocaleDateString('id-ID')} • 
                  {respondInvitation.agenda_waktu_mulai} - {respondInvitation.agenda_waktu_selesai}
                </p>
                <p className="text-sm text-gray-600">{respondInvitation.agenda_lokasi}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Status Kehadiran *</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="attending"
                        name="attendance"
                        value="attending"
                        checked={respondFormData.attendanceStatus === 'attending'}
                        onChange={(e) => setRespondFormData(prev => ({ ...prev, attendanceStatus: e.target.value }))}
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
                        checked={respondFormData.attendanceStatus === 'not_attending'}
                        onChange={(e) => setRespondFormData(prev => ({ ...prev, attendanceStatus: e.target.value }))}
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
                        checked={respondFormData.attendanceStatus === 'represented'}
                        onChange={(e) => setRespondFormData(prev => ({ ...prev, attendanceStatus: e.target.value }))}
                        className="text-blue-600"
                      />
                      <label htmlFor="represented" className="text-sm font-medium text-blue-700">
                        Diwakilkan
                      </label>
                    </div>
                  </div>
                </div>

                {/* Reason Field - Show when not attending */}
                {respondFormData.attendanceStatus === "not_attending" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Alasan Tidak Menghadiri *
                    </label>
                    <textarea
                      placeholder="Masukkan alasan tidak menghadiri"
                      value={respondFormData.reason}
                      onChange={(e) => setRespondFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {/* Representative Field - Show when represented */}
                {respondFormData.attendanceStatus === "represented" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Pilih Perwakilan *
                    </label>
                    <SearchablePegawaiDropdown
                      value={respondFormData.representative}
                      onValueChange={(value) => setRespondFormData(prev => ({ ...prev, representative: value }))}
                      placeholder="Cari dan pilih pegawai yang akan mewakili"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pegawai yang dipilih akan ditambahkan ke daftar peserta agenda
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsRespondModalOpen(false);
                setRespondFormData({
                  attendanceStatus: '',
                  reason: '',
                  representative: ''
                });
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Validation
                if (!respondFormData.attendanceStatus) {
                  toast.error('Silakan pilih status kehadiran');
                  return;
                }

                if (respondFormData.attendanceStatus === 'not_attending' && !respondFormData.reason.trim()) {
                  toast.error('Silakan isi alasan tidak menghadiri');
                  return;
                }

                if (respondFormData.attendanceStatus === 'represented' && !respondFormData.representative.trim()) {
                  toast.error('Silakan pilih perwakilan');
                  return;
                }

                handleInvitationAction(respondInvitation.id, 'respond');
                setIsRespondModalOpen(false);
                setRespondFormData({
                  attendanceStatus: '',
                  reason: '',
                  representative: ''
                });
                toast.success(`Kehadiran dikonfirmasi: ${respondFormData.attendanceStatus}`);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedPage>
  );
}
