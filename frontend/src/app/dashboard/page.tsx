"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";
import { getStoredUser, type User } from "@/lib/auth";
import { useTokenManager } from "@/hooks/useTokenManager";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import AgendaChart from "@/components/AgendaChart";
import ProfileDropdown from "@/components/ProfileDropdown";
import { BarChart3 } from "lucide-react";
import { apiService } from "@/services/apiService";
import { API_ENDPOINTS, buildEndpoint } from "@/services/apiEndpoints";

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

interface StatsData {
  totalAgendas: number;
  thisMonthAgendas: number;
  totalUsers: number;
  pendingAgendas: number;
}

interface ChartData {
  month: string;
  agendas: number;
  users: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");
  const [stats, setStats] = useState<StatsData>({
    totalAgendas: 0,
    thisMonthAgendas: 0,
    totalUsers: 0,
    pendingAgendas: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentAgendas, setRecentAgendas] = useState<Agenda[]>([]);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);

  const { isAuthenticated, isLoading: tokenLoading } = useTokenManager();

  useEffect(() => {
    const userData = getStoredUser();

    if (!userData) {
      window.location.href = "/login";
      return;
    }

    setUser(userData);
    setIsLoading(false);
    
    // Load all data with userData directly
    loadDashboardStatsWithUser(userData);
    loadChartData();
    loadRecentAgendas();
  }, []);

  const loadDashboardStatsWithUser = async (userData: User) => {
    try {
      const data = await apiService.get('/agenda/stats/dashboard');
      const statsData = data || {
        totalAgendas: 0,
        thisMonthAgendas: 0,
        totalUsers: 0,
        pendingAgendas: 0
      };
      setStats(statsData);
    } catch (err: any) {
      console.error("Error loading stats data:", err);
      setStats({
        totalAgendas: 0,
        thisMonthAgendas: 0,
        totalUsers: 0,
        pendingAgendas: 0
      });
    }
  };

  const loadDashboardStats = async () => {
    if (!user) return;
    return loadDashboardStatsWithUser(user);
  };

  const loadChartData = async () => {
    try {
      const data = await apiService.get('/agenda/stats/monthly');
      setChartData(data || []);
    } catch (err: any) {
      console.error("Error loading chart data:", err);
      setChartData([]);
    }
  };

  const loadRecentAgendas = async () => {
    const endpoint = buildEndpoint('/agenda', {
      limit: 5,
      sort: 'created_at',
      order: 'desc'
    });
    
    try {
      const result = await apiService.get(endpoint);
      
      // Handle different response structures
      if (result) {
        if (result.agenda && Array.isArray(result.agenda)) {
          // Response has agenda property (correct structure)
          setRecentAgendas(result.agenda);
        } else if (Array.isArray(result)) {
          // Response is directly an array
          setRecentAgendas(result);
        } else {
          // Fallback: try to find agenda in the response
          setRecentAgendas(result.agenda || []);
        }
      } else {
        setRecentAgendas([]);
      }
    } catch (err: any) {
      console.error("Error loading recent agendas:", err);
      setRecentAgendas([]);
    }
  };

  const memoizedChartData = useMemo(() => {
    if (!chartData || !Array.isArray(chartData)) {
      return [];
    }
    return chartData.map(data => ({
      month: data.month,
      agendas: data.agendas,
      users: data.users
    }));
  }, [chartData]);

  const handleAgendaClick = (agenda: Agenda) => {
    setSelectedAgenda(agenda);
    setShowAgendaModal(true);
  };

  const handleLogout = () => {
    toast.success("Logout berhasil! Sampai jumpa!", {
      duration: 1500,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
    setTimeout(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }, 1000);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);

    if (view === "users") {
      window.location.href = "/users";
    } else if (view === "calendar") {
      window.location.href = "/calendar";
    } else if (view === "dashboard") {
      // Stay in dashboard
      setCurrentView("dashboard");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateString).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        <div className="flex-1 ml-64 flex flex-col">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Dashboard Overview
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Ringkasan statistik dan grafik agenda
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {/* Profile Dropdown */}
                  {user && (
                    <ProfileDropdown
                      user={user as any}
                      onLogout={handleLogout}
                    />
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Memuat dashboard...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Stats Cards */}
                <StatsCards
                  totalAgendas={stats.totalAgendas}
                  thisMonthAgendas={stats.thisMonthAgendas}
                  totalUsers={stats.totalUsers}
                  pendingAgendas={stats.pendingAgendas}
                  userRole={user?.role}
                />

                {/* Charts */}
                <AgendaChart monthlyData={memoizedChartData} />

                {/* Recent Agendas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agenda Terbaru</CardTitle>
                    <CardDescription>5 agenda terbaru yang telah dibuat</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentAgendas && recentAgendas.length > 0 ? (
                      recentAgendas.map((agenda) => (
                        <div key={agenda.id} className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleAgendaClick(agenda)}>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{agenda.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(agenda.date)} • {agenda.created_by_name}</p>
                            <p className="text-xs text-gray-400 mt-1">{agenda.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agenda.status)}`}>
                              {agenda.status}
                            </span>
                            <Button variant="outline" size="sm" className="text-xs">
                              Lihat Detail
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">📋</div>
                        <p>Belum ada agenda terbaru</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Agenda Detail Modal */}
      <Dialog open={showAgendaModal} onOpenChange={setShowAgendaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedAgenda?.title}</DialogTitle>
            <DialogDescription>
              Detail lengkap agenda
            </DialogDescription>
          </DialogHeader>

          {selectedAgenda && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal</p>
                  <p className="text-gray-900">{formatDate(selectedAgenda.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Waktu</p>
                  <p className="text-gray-900">{selectedAgenda.start_time} - {selectedAgenda.end_time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Lokasi</p>
                  <p className="text-gray-900">{selectedAgenda.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`text-gray-900 ${getStatusColor(selectedAgenda.status)}`}>{selectedAgenda.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Prioritas</p>
                  <p className="text-gray-900">{selectedAgenda.priority}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Dibuat Oleh</p>
                  <p className="text-gray-900">{selectedAgenda.created_by_name}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Deskripsi</p>
                <p className="text-gray-900">{selectedAgenda.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Peserta</p>
                <p className="text-gray-900">{selectedAgenda.attendees.join(', ')}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowAgendaModal(false)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
    </div>
  );
}