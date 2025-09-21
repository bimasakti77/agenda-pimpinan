"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";
import { getStoredUser, getStoredToken, type User } from "@/lib/auth";
import { useTokenManager } from "@/hooks/useTokenManager";
import CalendarView from "@/components/CalendarView";
import UserFilter from "@/components/UserFilter";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import AgendaChart from "@/components/AgendaChart";

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
}


export default function DashboardPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [showUserFilter, setShowUserFilter] = useState(true); // Default show filter
  const [hasSelectedUser, setHasSelectedUser] = useState(false); // Track if user has made selection
  const [isTransitioning, setIsTransitioning] = useState(false); // For smooth transitions
  const [currentView, setCurrentView] = useState("dashboard"); // For sidebar navigation
  const [stats, setStats] = useState({
    totalAgendas: 0,
    thisMonthAgendas: 0,
    totalUsers: 0,
    pendingAgendas: 0
  });
  const [chartData, setChartData] = useState([]);
  
  // Memoize chart data to prevent unnecessary re-renders
  const memoizedChartData = useMemo(() => {
    return chartData || [];
  }, [chartData]);
  const [recentAgendas, setRecentAgendas] = useState<Agenda[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  // Use token manager hook
  const { isAuthenticated, isLoading: tokenLoading } = useTokenManager();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();

    if (!token || !user) {
      window.location.href = "/login";
      return;
    }

    // Token checking is now handled by useTokenManager hook

    setUser(user);
    
    // Load chart data and dashboard stats for dashboard view
    loadChartData();
    loadDashboardStats();
    loadRecentAgendas();
    
    // Only auto-load agendas if user is not superadmin (Menteri)
    if (user.role !== 'superadmin') {
      loadAgendas();
      setHasSelectedUser(true);
      setShowUserFilter(false); // Hide filter for non-superadmin
    } else {
      setIsLoading(false); // Stop loading for superadmin until they select a user
      setShowUserFilter(true); // Show filter for superadmin
      setHasSelectedUser(false); // Superadmin must select a user first
    }
  }, []);



  const loadAgendas = async (userId?: number | null): Promise<void> => {
    try {
      const token = getStoredToken();
      if (!token) {
        window.location.href = "/login";
        return;
      }

      // Build URL with user filter - superadmin must select a user
      let url = "http://localhost:3000/api/agenda?limit=100";
      if (user?.role === 'superadmin') {
        // Superadmin must select a specific user
        if (userId === undefined || userId === null) {
          throw new Error("Superadmin must select a user to view agendas");
        }
        url += `&created_by=${userId}`;
      } else if (userId !== undefined && userId !== null) {
        // Other roles can optionally filter by user
        url += `&created_by=${userId}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (response.ok) {
        const agendaData = data.data?.agenda || [];
        setAgendas(agendaData);
        setError(""); // Clear any previous errors
        
        // Calculate statistics
        calculateStats(agendaData);
      } else {
        const errorMessage = data.message || "Gagal memuat data agenda";
        setError(errorMessage);
        // API Error handled silently
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat memuat agenda";
      setError(errorMessage);
      // Fetch error handled
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (agendaData: Agenda[]) => {
    const currentMonth = new Date().getMonth(); // 0-based (September = 8)
    const currentYear = new Date().getFullYear();
    
    const thisMonthAgendas = agendaData.filter(agenda => {
      const agendaDate = new Date(agenda.date);
      return agendaDate.getMonth() === currentMonth && agendaDate.getFullYear() === currentYear;
    }).length;

    const pendingAgendas = agendaData.filter(agenda => agenda.status === 'pending').length;

    setStats({
      totalAgendas: agendaData.length,
      thisMonthAgendas,
      totalUsers: 4, // Hardcoded for now, can be fetched from API
      pendingAgendas
    });
  };

  const loadChartData = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        // No token for chart data
        return;
      }

      const response = await fetch("http://localhost:3000/api/agenda/stats/monthly", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Chart data loaded
        setChartData(data.data || []);
      } else {
        // Failed to load chart data
      }
    } catch (error) {
      // Error loading chart data
    }
  };

  const loadDashboardStats = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        // No token for dashboard stats
        return;
      }

      const response = await fetch("http://localhost:3000/api/agenda/stats/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {
          totalAgendas: 0,
          thisMonthAgendas: 0,
          totalUsers: 0,
          pendingAgendas: 0
        });
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const loadRecentAgendas = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        return;
      }

      const response = await fetch("http://localhost:3000/api/agenda?limit=5&sort=created_at&order=desc", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Recent agendas loaded
        setRecentAgendas(data.data?.agenda || []);
      } else {
        // Failed to load recent agendas
      }
    } catch (error) {
      // Error loading recent agendas
    }
  };

  const handleUserSelect = async (userId: number | null, userName: string) => {
    // Start transition
    setIsTransitioning(true);
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setHasSelectedUser(true);
    setIsLoading(true);
    
    // Load agendas and dashboard stats
    await loadAgendas(userId);
    await loadDashboardStats();
    
    // End transition
    setIsTransitioning(false);
  };

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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }, 1000);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    
    // Handle navigation to different views
    if (view === "users") {
      window.location.href = "/users";
    } else if (view === "calendar") {
      // Stay in dashboard but show calendar view
      setViewMode("calendar");
    } else if (view === "dashboard") {
      // Stay in dashboard but show list view
      setViewMode("list");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // If it's just a date string (YYYY-MM-DD), format it directly
      if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) {
          return "Tanggal tidak valid";
        }
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
      
      // If it's a full datetime string, parse it
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Tanggal tidak valid";
      }
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      // Error formatting date
      return "Tanggal tidak valid";
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // If it's just a time string (HH:MM:SS), format it directly
      if (timeString && timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
      }
      
      // If it's a full datetime string, parse it
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return "Waktu tidak valid";
      }
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      // Error formatting time
      return "Waktu tidak valid";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    // Debug info removed
    switch (currentView) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <StatsCards 
              totalAgendas={stats.totalAgendas}
              thisMonthAgendas={stats.thisMonthAgendas}
              totalUsers={stats.totalUsers}
              pendingAgendas={stats.pendingAgendas}
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
                {recentAgendas.length > 0 ? (
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
        );
      
      case "calendar":
        return (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* User Filter - Only show for superadmin */}
            {user?.role === 'superadmin' && showUserFilter && (
              <UserFilter 
                onUserSelect={handleUserSelect}
                selectedUserId={selectedUserId}
              />
            )}

            {/* Show message for superadmin who hasn't selected a user yet */}
            {user?.role === 'superadmin' && !hasSelectedUser && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-500">
                    <div className="text-6xl mb-4">👑</div>
                    <h3 className="text-xl font-semibold mb-2">Selamat Datang, Menteri!</h3>
                    <p className="text-lg mb-4">Silakan pilih user di bawah untuk melihat agenda mereka</p>
                    <p className="text-sm text-gray-400">
                      Pilih salah satu user untuk melihat agenda yang telah dibuat
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading Overlay */}
            {isTransitioning && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700">Memuat agenda...</span>
                </div>
              </div>
            )}

            {/* Show calendar only if user has made selection or is not superadmin */}
            {hasSelectedUser && (
              <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                <CalendarView 
                  agendas={agendas} 
                  isLoading={isLoading} 
                  selectedUserName={selectedUserName}
                />
              </div>
            )}
          </div>
        );
      
      case "users":
        return (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Kelola pengguna sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Fitur user management akan segera tersedia.</p>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      
      {/* Sidebar */}
      <Sidebar 
        user={user}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {currentView === "dashboard" ? "Dashboard Overview" : 
                   currentView === "calendar" ? "Kalender Agenda" : 
                   currentView === "users" ? "User Management" : "Dashboard"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {currentView === "dashboard" ? "Ringkasan statistik dan grafik agenda" :
                   currentView === "calendar" ? "Lihat dan kelola agenda dalam kalender" :
                   currentView === "users" ? "Kelola pengguna sistem" : "Selamat datang di sistem agenda pimpinan"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src="/assets/logos/logokumham.png" 
                  alt="Logo Kementerian Hukum" 
                  className="h-10 w-auto"
                />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Kementerian Hukum</p>
                  <p className="text-xs text-gray-500">Republik Indonesia</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {isLoading && currentView === "dashboard" ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat dashboard...</p>
              </div>
            </div>
          ) : (
            renderMainContent()
          )}
        </main>
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
                  <label className="text-sm font-medium text-gray-500">Tanggal</label>
                  <p className="text-sm">{formatDate(selectedAgenda.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Waktu</label>
                  <p className="text-sm">
                    {formatTime(selectedAgenda.start_time)} - {formatTime(selectedAgenda.end_time)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Lokasi</label>
                <p className="text-sm">{selectedAgenda.location}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Deskripsi</label>
                <p className="text-sm text-gray-700">{selectedAgenda.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedAgenda.status)}`}>
                      {selectedAgenda.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prioritas</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedAgenda.priority)}`}>
                      {selectedAgenda.priority}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Dibuat oleh</label>
                <p className="text-sm">{selectedAgenda.created_by_name}</p>
              </div>
              
              {selectedAgenda.attendees && selectedAgenda.attendees.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Peserta</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedAgenda.attendees.map((attendee, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowAgendaModal(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
