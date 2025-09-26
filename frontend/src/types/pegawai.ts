/**
 * TypeScript types for Pegawai (Employee) data
 * Following modern web development standards
 */

export interface Pegawai {
  NIP: string;
  NIK?: string;
  Nama: string;
  GelarDepan?: string;
  GelarBelakang?: string;
  EmailDinas?: string;
  Telepon?: string;
  TempatLahir?: string;
  TglLahir?: string;
  JenisKelamin?: 'L' | 'P';
  Agama?: string;
  StatusKawin?: string;
  Foto?: string;
  PendidikanTerakhir?: string;
  SatkerID?: string;
  KodeJabatan?: string;
  Jabatan?: string;
  TipePegawai?: string;
  StatusPegawai?: '1' | '0'; // 1 = Active, 0 = Inactive
  Pangkat?: string;
  RowNumber?: number;
}

export interface PegawaiListItem {
  NIP: string;
  Nama: string;
  Jabatan?: string;
  SatkerID?: string;
  Pangkat?: string;
  StatusPegawai?: string;
}

export interface PegawaiApiResponse {
  success: boolean;
  data: PegawaiListItem[];
  message?: string;
}

export interface PegawaiSearchParams {
  q?: string;
  status?: '1' | '0' | 'all';
  limit?: number;
  offset?: number;
}

export interface PegawaiDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onPegawaiSelect?: (pegawai: PegawaiListItem | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showStatus?: boolean;
  filterActive?: boolean;
}

export interface PegawaiFormData {
  NIP: string;
  Nama: string;
  Jabatan?: string;
  SatkerID?: string;
  Pangkat?: string;
  EmailDinas?: string;
  Telepon?: string;
}

// Utility types
export type PegawaiStatus = 'active' | 'inactive' | 'all';
export type PegawaiSortField = 'Nama' | 'NIP' | 'Jabatan' | 'SatkerID';
export type PegawaiSortOrder = 'asc' | 'desc';

export interface PegawaiSortOptions {
  field: PegawaiSortField;
  order: PegawaiSortOrder;
}

export interface PegawaiFilters {
  search?: string;
  status?: PegawaiStatus;
  satker?: string;
  jabatan?: string;
}
