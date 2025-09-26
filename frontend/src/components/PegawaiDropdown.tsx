'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/services/apiService';
import { PegawaiListItem, PegawaiDropdownProps } from '@/types/pegawai';

const PegawaiDropdown = React.memo(function PegawaiDropdown({
  value,
  onValueChange,
  onPegawaiSelect,
  placeholder = "Pilih Pegawai",
  className = "",
  disabled = false,
  showStatus = false,
  filterActive = true
}: PegawaiDropdownProps) {
  const [data, setData] = useState<PegawaiListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.get<PegawaiListItem[]>('/pegawai');
        
        setData(result);
      } catch (err) {
        console.error('Error fetching pegawai:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "no-data") {
      return;
    }
    
    onValueChange(selectedValue);
    
    if (onPegawaiSelect && data) {
      const selectedPegawai = data.find(p => p.NIP === selectedValue);
      onPegawaiSelect(selectedPegawai || null);
    }
  };

  const pegawaiOptions = React.useMemo(() => {
    if (!data) return [];
    
    const pegawaiList = filterActive 
      ? data.filter(p => p.StatusPegawai === 'PNS')
      : data;
    
    return pegawaiList.map((pegawai) => (
      <SelectItem key={pegawai.NIP} value={pegawai.NIP}>
        <div className="flex flex-col">
          <span className="font-medium">{pegawai.Nama}</span>
          <span className="text-sm text-gray-500">
            {pegawai.NIP} • {pegawai.Jabatan || 'Tidak ada jabatan'}
          </span>
          {showStatus && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              pegawai.StatusPegawai === 'PNS' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {pegawai.StatusPegawai === 'PNS' ? 'Aktif' : 'Tidak Aktif'}
            </span>
          )}
        </div>
      </SelectItem>
    ));
  }, [data, filterActive, showStatus]);

  // Component optimized

  if (loading) {
    return (
      <div className="space-y-2">
        <Select value="" disabled>
          <SelectTrigger className={className}>
            <SelectValue placeholder="Memuat data pegawai..." />
          </SelectTrigger>
        </Select>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Select value="" disabled>
          <SelectTrigger className={`${className} border-red-300`}>
            <SelectValue placeholder="Gagal memuat data pegawai" />
          </SelectTrigger>
        </Select>
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select 
        value={value || ""} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {pegawaiOptions.length > 0 ? pegawaiOptions : (
            <SelectItem value="no-data" disabled>
              <div className="text-center text-gray-500 py-2">
                {data?.length === 0 ? 'Tidak ada data pegawai' : 'Memuat data...'}
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
});

export default PegawaiDropdown;
