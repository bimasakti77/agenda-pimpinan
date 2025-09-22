"use client";

import { useState, useMemo } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../app/calendar.css";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserCheck } from "lucide-react";
import UpdateAgendaStatus from "./UpdateAgendaStatus";

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

  const handleStatusUpdateSuccess = () => {
    setIsStatusUpdateOpen(false);
    if (onAgendaUpdate) {
      onAgendaUpdate();
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
    let backgroundColor = "#3174ad"; // default blue
    
    // Priority colors
    if (agenda.priority === "high") {
      backgroundColor = "#dc2626"; // red
    } else if (agenda.priority === "medium") {
      backgroundColor = "#ea580c"; // orange
    } else if (agenda.priority === "low") {
      backgroundColor = "#16a34a"; // green
    }

    // Status opacity
    let opacity = 1;
    if (agenda.status === "completed") {
      opacity = 0.6;
    } else if (agenda.status === "cancelled") {
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Detail agenda untuk {selectedEvent && formatDate(selectedEvent.date)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Umum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700">Tanggal</label>
                      <p className="text-gray-900">{formatDate(selectedEvent.date)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Waktu</label>
                      <p className="text-gray-900">
                        {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Lokasi</label>
                      <p className="text-gray-900">{selectedEvent.location || "Tidak ditentukan"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Dibuat oleh</label>
                      <p className="text-gray-900">{selectedEvent.created_by_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedEvent.status)}`}>
                      Status: {selectedEvent.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedEvent.priority)}`}>
                      Prioritas: {selectedEvent.priority}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {selectedEvent.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deskripsi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </CardContent>
                </Card>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Peserta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.attendees.map((attendee, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
                        >
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Update Status Button - Only show for regular users */}
              {userRole === 'user' && currentUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleStatusUpdate}
                      className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white"
                    >
                      <UserCheck className="h-4 w-4" />
                      Update Status Kehadiran
                    </Button>
                  </CardContent>
                </Card>
              )}
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
    </div>
  );
}
