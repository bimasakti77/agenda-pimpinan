"use client";

import { useState, useMemo } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../app/calendar.css";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserCheck, Trash2, Edit } from "lucide-react";
import UpdateAgendaStatus from "./UpdateAgendaStatus";
import EditAgendaForm from "./EditAgendaForm";
import toast from "react-hot-toast";
import { apiService } from "@/services/apiService";
import { API_ENDPOINTS } from "@/services/apiEndpoints";

// Setup moment localizer
const localizer = momentLocalizer(moment);

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
  attendance_status?: string;
  nomor_surat: string;
  surat_undangan: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Agenda;
}

interface CalendarViewProps {
  agendas: Agenda[];
  isLoading: boolean;
  selectedUserName?: string;
  userRole?: string;
  onAddAgenda?: () => void;
  currentUser?: {
    id: number;
    full_name: string;
    role: string;
  } | null;
  onAgendaUpdate?: () => void;
}

export default function CalendarView({ agendas, isLoading, selectedUserName, userRole, onAddAgenda, currentUser, onAgendaUpdate }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Agenda | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditAgendaOpen, setIsEditAgendaOpen] = useState(false);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());


  // Convert agendas to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    // Filter agendas based on current view and date
    let filteredAgendas = agendas;
    
    if (currentView === Views.DAY) {
      // For day view, only show agendas for the selected date
      const selectedDate = moment(currentDate).format('YYYY-MM-DD');
      filteredAgendas = agendas.filter(agenda => {
        // Extract date part from agenda.date (handle both YYYY-MM-DD and datetime formats)
        let agendaDateStr;
        if (agenda.date.includes('T')) {
          agendaDateStr = agenda.date.split('T')[0];
        } else {
          agendaDateStr = agenda.date;
        }
        const matches = agendaDateStr === selectedDate;
        return matches;
      });
    } else if (currentView === Views.WEEK) {
      // For week view, show agendas for the current week
      const weekStart = moment(currentDate).startOf('week');
      const weekEnd = moment(currentDate).endOf('week');
      filteredAgendas = agendas.filter(agenda => {
        const agendaDate = moment(agenda.date);
        const isInWeek = agendaDate.isBetween(weekStart, weekEnd, null, '[]');
        return isInWeek;
      });
    }
    // For month view, show all agendas (no filtering needed)
    
    return filteredAgendas.map(agenda => {
      // Parse date and time properly
      let startDate, endDate;
      
      try {
        // Handle different date formats from API
        let baseDate;
        
        if (agenda.date) {
          // If date is already a full datetime string, extract just the date part
          if (agenda.date.includes('T')) {
            // Extract just the date part (YYYY-MM-DD) without timezone conversion
            const dateStr = agenda.date.split('T')[0];
            // Create date in local timezone to avoid timezone conversion
            const [year, month, day] = dateStr.split('-').map(Number);
            baseDate = new Date(year, month - 1, day);
          } else {
            // If date is just YYYY-MM-DD format
            const [year, month, day] = agenda.date.split('-').map(Number);
            baseDate = new Date(year, month - 1, day);
          }
        } else {
          baseDate = new Date();
        }
        
        // Get time strings (HH:MM:SS format)
        const startTime = agenda.start_time || '09:00:00';
        const endTime = agenda.end_time || '10:00:00';
        
        // Extract date part and combine with time (avoid timezone conversion)
        const year = baseDate.getFullYear();
        const month = String(baseDate.getMonth() + 1).padStart(2, '0');
        const day = baseDate.getDate(); // Keep as number
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        // Create dates in local timezone
        const [startHour, startMin, startSec] = startTime.split(':').map(Number);
        const [endHour, endMin, endSec] = endTime.split(':').map(Number);
        
        startDate = new Date(year, baseDate.getMonth(), day, startHour, startMin, startSec || 0);
        endDate = new Date(year, baseDate.getMonth(), day, endHour, endMin, endSec || 0);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          startDate = new Date();
          endDate = new Date(Date.now() + 60 * 60 * 1000);
        }
      } catch (error) {
        startDate = new Date();
        endDate = new Date(Date.now() + 60 * 60 * 1000);
      }
      
      return {
        id: agenda.id,
        title: agenda.title,
        start: startDate,
        end: endDate,
        resource: agenda
      };
    });
  }, [agendas, currentView, currentDate]);

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event.resource);
    setIsModalOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = () => {
    setIsStatusUpdateOpen(true);
  };

  const handleStatusUpdateSuccess = async () => {
    setIsStatusUpdateOpen(false);
    
    // Refresh the selected event data if modal is still open
    if (selectedEvent && isModalOpen) {
      try {
        const result = await apiService.get(API_ENDPOINTS.AGENDA.GET_BY_ID(selectedEvent.id));
        
        if (result.success && result.data) {
          setSelectedEvent(result.data);
        } else if (result) {
          setSelectedEvent(result);
        }
      } catch (error) {
        console.error("Error refreshing selected event after status update:", error);
      }
    }
    
    if (onAgendaUpdate) {
      onAgendaUpdate();
    }
  };

  // Handle edit agenda
  const handleEditAgenda = () => {
    if (!selectedEvent) return;
    setIsEditAgendaOpen(true);
  };

  const handleEditAgendaSuccess = async () => {
    setIsEditAgendaOpen(false);
    
    // Refresh the selected event data if modal is still open
    if (selectedEvent && isModalOpen) {
      try {
        const result = await apiService.get(API_ENDPOINTS.AGENDA.GET_BY_ID(selectedEvent.id));
        
        if (result.success && result.data) {
          setSelectedEvent(result.data);
        } else if (result) {
          setSelectedEvent(result);
        }
      } catch (error) {
        console.error("Error refreshing selected event after edit:", error);
      }
    }
    
    if (onAgendaUpdate) {
      onAgendaUpdate();
    }
  };

  // Check if agenda can be deleted (date is today or future, and not started yet)
  const canDeleteAgenda = (agenda: Agenda) => {
    if (!agenda.date) return false;
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const agendaDate = new Date(agenda.date);
    agendaDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Check if agenda date is today or future
    if (agendaDate < today) return false;
    
    // If agenda is today, check if it has already started
    if (agendaDate.getTime() === today.getTime()) {
      if (!agenda.start_time) return true; // No start time, allow deletion
      
      const startDateTime = new Date(`${agenda.date}T${agenda.start_time}`);
      return now < startDateTime; // Can delete only if not started yet
    }
    
    // Future dates can always be deleted
    return true;
  };

  // Handle delete agenda
  const handleDeleteAgenda = () => {
    if (!selectedEvent) return;
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteAgenda = async () => {
    if (!selectedEvent) return;
    setIsDeleteConfirmOpen(false);

    try {
      await apiService.delete(API_ENDPOINTS.AGENDA.GET_BY_ID(selectedEvent.id));

      toast.success("Agenda berhasil dihapus!", {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });

      // Close modal and refresh data
      setIsModalOpen(false);
      if (onAgendaUpdate) {
        onAgendaUpdate();
      }

    } catch (error: any) {
      console.error("Error deleting agenda:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus agenda", {
        duration: 3000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };

  // Handle date selection (for future: add new agenda)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // TODO: Implement add new agenda functionality
  };

  // Handle view change
  const handleViewChange = (view: any) => {
    setCurrentView(view);
  };

  // Handle date change (navigation)
  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  // Get event style based on priority and status
  const eventStyleGetter = (event: CalendarEvent) => {
    const agenda = event.resource;
    const currentStatus = getAgendaStatus(agenda); // Use real-time status
    let backgroundColor = "#3174ad"; // default blue
    
    // Priority colors
    if (agenda.priority === "high") {
      backgroundColor = "#dc2626"; // red
    } else if (agenda.priority === "medium") {
      backgroundColor = "#ea580c"; // orange
    } else if (agenda.priority === "low") {
      backgroundColor = "#16a34a"; // green
    }

    // Status opacity based on real-time status
    let opacity = 1;
    if (currentStatus === "completed") {
      opacity = 0.6;
    } else if (currentStatus === "cancelled") {
      opacity = 0.4;
    }

    return {
      style: {
        backgroundColor,
        opacity,
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "12px",
        padding: "2px 4px"
      }
    };
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        return "Tanggal tidak valid";
      }
      
      let date;
      
      // If it's a full datetime string (contains 'T'), extract just the date part
      if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0];
        date = new Date(datePart + 'T00:00:00');
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If it's just a date string (YYYY-MM-DD)
        date = new Date(dateString + 'T00:00:00');
      } else {
        // Try to parse as full datetime
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return "Tanggal tidak valid";
      }
      
      return moment(date).format("DD MMM YYYY");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Tanggal tidak valid";
    }
  };

  const formatTime = (timeString: string) => {
    try {
      if (!timeString) {
        return "Waktu tidak valid";
      }
      
      // If it's just a time string (HH:MM:SS), format it directly
      if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
      }
      
      // If it's a full datetime string, extract time part
      if (timeString.includes('T')) {
        const timePart = timeString.split('T')[1];
        if (timePart) {
          const [hours, minutes] = timePart.split(':');
          return `${hours}:${minutes}`;
        }
      }
      
      // Try to parse as full datetime
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return "Waktu tidak valid";
      }
      return moment(date).format("HH:mm");
    } catch (error) {
      console.error("Error formatting time:", timeString, error);
      return "Waktu tidak valid";
    }
  };

  // Calculate agenda status based on current time vs agenda time
  const getAgendaStatus = (agenda: Agenda) => {
    try {
      const now = new Date();
      const agendaDate = new Date(agenda.date);
      
      // Skip if no time information
      if (!agenda.start_time || !agenda.end_time) {
        return agenda.status; // Fallback to database status
      }
      
      // Create datetime objects for start and end times
      const startDateTime = new Date(`${agenda.date}T${agenda.start_time}`);
      const endDateTime = new Date(`${agenda.date}T${agenda.end_time}`);
      
      // Check if agenda is today
      const isToday = agendaDate.toDateString() === now.toDateString();
      
      if (isToday) {
        if (now < startDateTime) {
          return 'scheduled'; // Before start time
        } else if (now >= startDateTime && now <= endDateTime) {
          return 'in_progress'; // During agenda time
        } else if (now > endDateTime) {
          return 'completed'; // After end time
        }
      } else if (agendaDate < now) {
        // Past date
        return 'completed';
      } else {
        // Future date
        return 'scheduled';
      }
      
      return agenda.status; // Fallback
    } catch (error) {
      console.error("Error calculating agenda status:", error);
      return agenda.status; // Fallback to database status
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
      case "cancelled":
        return "bg-red-100 text-red-800";
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat kalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Kalender Agenda{selectedUserName ? ` - ${selectedUserName}` : ''}
          </h2>
          <p className="text-gray-600">
            Klik pada agenda untuk melihat detail • 
            Mode: {currentView === Views.MONTH ? "Bulan" : currentView === Views.WEEK ? "Minggu" : "Hari"}
          </p>
        </div>
      </div>

      {/* Legend and Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Prioritas Tinggi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Prioritas Sedang</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Prioritas Rendah</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Default</span>
          </div>
        </div>
        
        {/* Add Agenda Button - Only show for regular users */}
        {userRole === 'user' && onAddAgenda && (
          <Button 
            onClick={onAddAgenda}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          >
            <Plus className="h-4 w-4" />
            Tambah Agenda
          </Button>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          showMultiDayTimes
          step={30}
          timeslots={2}
          min={new Date(2025, 0, 1, 0, 0, 0)}
          max={new Date(2025, 0, 1, 23, 30, 0)}
          messages={{
            next: "Selanjutnya",
            previous: "Sebelumnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda",
            date: "Tanggal",
            time: "Waktu",
            event: "Acara",
            noEventsInRange: "Tidak ada agenda dalam rentang waktu ini",
            showMore: (total: number) => `+${total} lagi`
          }}
        />
      </div>

      {/* Event Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Detail agenda untuk {selectedEvent && formatDate(selectedEvent.date)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* Status Kehadiran Card - Main card with all information */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-base sm:text-lg text-blue-800 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    Status Kehadiran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Acara */}
                  <div>
                    <label className="font-medium text-gray-700 text-sm mb-2 block">Status Acara:</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${getStatusColor(getAgendaStatus(selectedEvent))}`}>
                        {getAgendaStatus(selectedEvent) === 'scheduled' ? 'Terjadwal' : 
                         getAgendaStatus(selectedEvent) === 'in_progress' ? 'Sedang Berlangsung' :
                         getAgendaStatus(selectedEvent) === 'completed' ? 'Selesai' : 'Dibatalkan'}
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${getPriorityColor(selectedEvent.priority)}`}>
                        Prioritas: {selectedEvent.priority}
                      </span>
                    </div>
                  </div>

                  {/* Status Kehadiran - Always shown */}
                  <div>
                    <label className="font-medium text-gray-700 text-sm mb-2 block">Status Kehadiran:</label>
                    <div className="flex items-center gap-3">
                      {selectedEvent.attendance_status ? (
                        <span className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border ${
                          selectedEvent.attendance_status === 'attending' ? 'bg-green-100 text-green-800 border-green-200' :
                          selectedEvent.attendance_status === 'not_attending' ? 'bg-red-100 text-red-800 border-red-200' :
                          selectedEvent.attendance_status === 'represented' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {selectedEvent.attendance_status === 'attending' ? 'Menghadiri' :
                           selectedEvent.attendance_status === 'not_attending' ? 'Tidak Menghadiri' :
                           selectedEvent.attendance_status === 'represented' ? 'Diwakilkan' : 'Sudah Diupdate'}
                        </span>
                      ) : (
                        <span className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Belum Diupdate
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informasi Umum - Responsive Grid layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700 text-sm">Tanggal</label>
                      <p className="text-gray-900 text-sm">{formatDate(selectedEvent.date)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 text-sm">Waktu</label>
                      <p className="text-gray-900 text-sm">
                        {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 text-sm">Lokasi</label>
                      <p className="text-gray-900 text-sm">{selectedEvent.location || "Tidak ditentukan"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 text-sm">Dibuat oleh</label>
                      <p className="text-gray-900 text-sm">{selectedEvent.created_by_name}</p>
                    </div>
                  </div>

                  {/* Informasi Surat */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 text-sm mb-3 flex items-center gap-2">
                      📄 Informasi Surat
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="font-medium text-gray-700 text-sm">Nomor Surat</label>
                        <p className="text-gray-900 text-sm font-mono bg-white px-2 py-1 rounded border">
                          {selectedEvent.nomor_surat || "Tidak ada nomor surat"}
                        </p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 text-sm">Isi Surat Undangan</label>
                        <div className="bg-white border rounded-lg p-3 max-h-32 overflow-y-auto">
                          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedEvent.surat_undangan || "Tidak ada isi surat undangan"}
                          </p>
                        </div>
                      </div>
                      {/* Deskripsi */}
                      {selectedEvent.description && (
                        <div>
                          <label className="font-medium text-gray-700 text-sm">Deskripsi</label>
                          <div className="bg-white border rounded-lg p-3">
                            <p className="text-gray-800 text-sm leading-relaxed">{selectedEvent.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Catatan Detail Kehadiran */}
                  {selectedEvent.notes && (
                    <div>
                      <label className="font-medium text-gray-700 text-sm">Catatan Detail:</label>
                      <p className="text-gray-900 text-sm mt-1">{selectedEvent.notes}</p>
                    </div>
                  )}
                  
                  {/* Daftar Peserta - Mini Table */}
                  {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                    <div>
                      <label className="font-medium text-gray-700 text-sm mb-3 block">Daftar Peserta:</label>
                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div className="max-h-32 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">No</th>
                                <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">Nama Peserta</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedEvent.attendees.map((attendee, index) => (
                                <tr 
                                  key={index} 
                                  className={`border-b border-gray-200 last:border-b-0 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }`}
                                >
                                  <td className="py-2 px-3 text-gray-500 text-xs font-mono">
                                    {index + 1}
                                  </td>
                                  <td className="py-2 px-3 text-gray-800 font-medium">
                                    {attendee}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-gray-100 px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
                          Total: {selectedEvent.attendees.length} peserta
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Action Buttons - Responsive layout */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Tutup
                </Button>
                {userRole === 'user' && currentUser && (
                  <Button 
                    onClick={handleStatusUpdate}
                    className="w-full sm:w-auto flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white"
                  >
                    <UserCheck className="h-4 w-4" />
                    Update Status
                  </Button>
                )}
                
                {/* Edit Button - Only show if agenda can be edited */}
                {selectedEvent && canDeleteAgenda(selectedEvent) && (
                  <Button 
                    onClick={handleEditAgenda}
                    className="w-full sm:w-auto flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Agenda
                  </Button>
                )}
                
                {/* Delete Button - Only show if agenda date is today or future */}
                {selectedEvent && canDeleteAgenda(selectedEvent) && (
                  <Button 
                    onClick={handleDeleteAgenda}
                    variant="destructive"
                    className="w-full sm:w-auto flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus Agenda
                  </Button>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <UpdateAgendaStatus
        isOpen={isStatusUpdateOpen}
        onClose={() => setIsStatusUpdateOpen(false)}
        onSuccess={handleStatusUpdateSuccess}
        agenda={selectedEvent}
        currentUser={currentUser || null}
      />

      {/* Edit Agenda Modal */}
      <EditAgendaForm
        isOpen={isEditAgendaOpen}
        onClose={() => setIsEditAgendaOpen(false)}
        onSuccess={handleEditAgendaSuccess}
        agenda={selectedEvent}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus agenda "{selectedEvent?.title}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Tindakan ini tidak dapat dibatalkan. Agenda akan dihapus secara permanen.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={confirmDeleteAgenda}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ya, Hapus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
