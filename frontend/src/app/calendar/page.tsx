"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type User } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedPage } from "@/components/ProtectedPage";
import CalendarView from "@/components/CalendarView";
import UserFilter from "@/components/UserFilter";
import Sidebar from "@/components/Sidebar";
import ProfileDropdown from "@/components/ProfileDropdown";
import AddAgendaForm from "@/components/AddAgendaForm";
import { Calendar, Plus, Menu } from "lucide-react";
import { apiService } from "@/services/apiService";
import { buildEndpoint } from "@/services/apiEndpoints";

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
  nomor_surat: string;
  surat_undangan: string;
}

export default function CalendarPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [showUserFilter, setShowUserFilter] = useState(true);
  const [hasSelectedUser, setHasSelectedUser] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentView, setCurrentView] = useState("calendar");
  const [isAddAgendaOpen, setIsAddAgendaOpen] = useState(false);

  const { user, logout } = useAuth();

  // Define all functions first
  const loadAgendas = useCallback(async (userId: number | null = null) => {
    setIsLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { limit: 100 };
      
      if (userId) {
        params.created_by = userId;
      } else if (user?.role !== 'superadmin') {
        params.created_by = user?.id;
      }

      const endpoint = buildEndpoint('/agenda', params);
      const result = await apiService.get(endpoint);
      
      // Handle different response structures
      if (result) {
        if (result.data && result.data.agenda && Array.isArray(result.data.agenda)) {
          // Response has data.agenda property (correct structure)
          setAgendas(result.data.agenda);
        } else if (result.agenda && Array.isArray(result.agenda)) {
          // Response has agenda property (fallback structure)
          setAgendas(result.agenda);
        } else if (Array.isArray(result)) {
          // Response is directly an array
          setAgendas(result);
        } else {
          // Fallback: try to find agenda in the response
          setAgendas(result.data?.agenda || result.agenda || []);
        }
      } else {
        setAgendas([]);
      }
    } catch (err: any) {
      console.error("Error loading agendas:", err);
      setError(err.message || "Terjadi kesalahan saat memuat agenda.");
      setAgendas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load - hanya sekali saat user login
  useEffect(() => {
    if (user) {
      if (user.role !== 'superadmin') {
        loadAgendas();
        setHasSelectedUser(true);
        setShowUserFilter(false);
      } else {
        setIsLoading(false);
        setShowUserFilter(true);
        setHasSelectedUser(false);
      }
    }
  }, [user, loadAgendas]);

  const handleUserSelect = async (userId: number | null, userName: string) => {
    setIsTransitioning(true);

    await new Promise(resolve => setTimeout(resolve, 200));

    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setHasSelectedUser(true);
    setIsLoading(true);

    await loadAgendas(userId);

    setIsTransitioning(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);

    if (view === "dashboard") {
      window.location.href = "/dashboard";
    } else if (view === "calendar") {
      // Already on calendar page, do nothing
    } else if (view === "invitations") {
      window.location.href = "/invitations";
    } else if (view === "my-agenda") {
      window.location.href = "/my-agenda";
    } else if (view === "users") {
      window.location.href = "/users";
    }
  };

  const handleAddAgenda = () => {
    setIsAddAgendaOpen(true);
  };

  const handleAddAgendaSuccess = () => {
    // Refresh the agendas list
    if (user?.role === 'superadmin') {
      loadAgendas(selectedUserId);
    } else {
      loadAgendas();
    }
  };

  return (
    <ProtectedPage title="Kalender Agenda">
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
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Kalender Agenda
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      Lihat dan kelola agenda dalam kalender
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
          <main className="flex-1 p-4 sm:p-6">
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
                    agendas={agendas || []}
                    isLoading={isLoading}
                    selectedUserName={selectedUserName}
                    userRole={user?.role}
                    onAddAgenda={handleAddAgenda}
                    currentUser={user}
                    onAgendaUpdate={handleAddAgendaSuccess}
                  />
                </div>
              )}
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
    </div>
    </ProtectedPage>
  );
}
