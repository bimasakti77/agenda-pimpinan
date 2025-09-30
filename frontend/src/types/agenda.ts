/**
 * TypeScript types for Agenda data
 * Following modern web development standards
 */

export interface Agenda {
  id: number;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  notes?: string;
  attendance_status?: 'pending' | 'attended' | 'absent';
  nomor_surat?: string;
  surat_undangan?: string;
  // File upload fields
  file_undangan_name?: string;
  file_undangan_path?: string;
  file_undangan_size?: number;
  file_undangan_type?: string;
  // User references
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
  // Undangan data
  undangan?: UndanganItem[];
}

export interface UndanganItem {
  id?: number;
  pegawai_id?: string; // NIP from simpeg_Pegawai
  nama: string;
  kategori: 'internal' | 'eksternal';
  pegawai_nama?: string;
  pegawai_jabatan?: string;
  nip?: string; // NIP for internal employees
}

export interface AgendaFormData {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  nomor_surat: string;
  surat_undangan: string;
  file_undangan?: File | null;
  undangan: UndanganItem[];
}

export interface AgendaFilters {
  status?: string;
  priority?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  created_by?: number;
  search?: string;
}

export interface AgendaPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AgendaListResponse {
  agenda: Agenda[];
  pagination: AgendaPagination;
}

export interface AgendaStats {
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

export interface AgendaCalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: string;
  priority: string;
  category?: string;
  nomor_surat?: string;
  surat_undangan?: string;
  file_undangan_name?: string;
  file_undangan_path?: string;
  file_undangan_size?: number;
  file_undangan_type?: string;
  created_by_name?: string;
  undangan?: UndanganItem[];
}

export interface AgendaApiResponse {
  success: boolean;
  data: Agenda | Agenda[] | AgendaListResponse | AgendaStats;
  message?: string;
}

export interface AgendaCreateRequest {
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high';
  nomor_surat?: string;
  surat_undangan?: string;
  undangan?: UndanganItem[];
  status?: 'scheduled' | 'completed' | 'cancelled' | 'pending';
}

export interface AgendaUpdateRequest {
  title?: string;
  description?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  notes?: string;
  attendance_status?: 'pending' | 'attended' | 'absent';
  nomor_surat?: string;
  surat_undangan?: string;
  file_undangan_name?: string;
  file_undangan_path?: string;
  file_undangan_size?: number;
  file_undangan_type?: string;
  undangan?: UndanganItem[];
}

// Utility types
export type AgendaStatus = 'scheduled' | 'completed' | 'cancelled' | 'pending';
export type AgendaPriority = 'low' | 'medium' | 'high';
export type AttendanceStatus = 'pending' | 'attended' | 'absent';
export type UndanganKategori = 'internal' | 'eksternal';

export interface AgendaSortOptions {
  field: 'date' | 'title' | 'priority' | 'status' | 'created_at';
  order: 'asc' | 'desc';
}

export interface AgendaSearchParams {
  q?: string;
  status?: AgendaStatus;
  priority?: AgendaPriority;
  category?: string;
  date_from?: string;
  date_to?: string;
  created_by?: number;
  page?: number;
  limit?: number;
}

// File upload related types
export interface FileUploadResponse {
  success: boolean;
  data: {
    objectName: string;
    bucket: string;
    size: number;
    etag: string;
  };
  message?: string;
}

export interface FileDownloadResponse {
  success: boolean;
  data: Blob;
  message?: string;
}
