'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiService } from '@/services/apiService';
import { PegawaiListItem } from '@/types/pegawai';
import { Search, X, Plus, User, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UndanganItem {
  id?: number;
  pegawai_id?: string | null; // NIP from simpeg_Pegawai table, null for external
  nama: string;
  kategori: 'internal' | 'eksternal';
  nip?: string | null; // NIP from simpeg_Pegawai (same as pegawai_id for internal)
  pegawai_nama?: string;
  pegawai_jabatan?: string;
}

interface MultipleUndanganSelectorProps {
  value: UndanganItem[];
  onChange: (undangan: UndanganItem[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxResults?: number;
  minSearchLength?: number;
  debounceMs?: number;
}

const MultipleUndanganSelector: React.FC<MultipleUndanganSelectorProps> = ({
  value = [],
  onChange,
  placeholder = "Pilih Undangan",
  className = "",
  disabled = false,
  maxResults = 20,
  minSearchLength = 2,
  debounceMs = 300
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PegawaiListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiListItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [kategori, setKategori] = useState<'internal' | 'eksternal'>('internal');
  const [externalNama, setExternalNama] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((term: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      if (term.length >= minSearchLength) {
        await performSearch(term);
      } else if (term.length === 0) {
        setResults([]);
        setError(null);
      }
    }, debounceMs);
  }, [minSearchLength, debounceMs]);

  // Perform search API call
  const performSearch = async (term: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await apiService.get<PegawaiListItem[]>(
        `/pegawai/search?q=${encodeURIComponent(term)}&limit=${maxResults}`
      );
      setResults(searchResults);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Gagal mencari pegawai');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  // Handle pegawai selection
  const handlePegawaiSelect = (pegawai: PegawaiListItem) => {
    setSelectedPegawai(pegawai);
    setSearchTerm(pegawai.Nama);
    setResults([]);
    setHighlightedIndex(-1);
  };

  // Add undangan to list
  const addUndangan = () => {
    if (kategori === 'internal') {
      if (!selectedPegawai) {
        toast.error('Pilih pegawai terlebih dahulu');
        return;
      }

      // Check for duplicates
      const isDuplicate = value.some(item => 
        item.kategori === 'internal' && item.pegawai_id === selectedPegawai.NIP
      );

      if (isDuplicate) {
        toast.error('Pegawai sudah ditambahkan sebagai undangan');
        return;
      }

              const newUndangan: UndanganItem = {
                pegawai_id: selectedPegawai.NIP,
                nama: selectedPegawai.Nama,
                kategori: 'internal',
                nip: selectedPegawai.NIP, // Same as pegawai_id for internal
                pegawai_nama: selectedPegawai.Nama,
                pegawai_jabatan: selectedPegawai.Jabatan
              };

      onChange([...value, newUndangan]);
      setSelectedPegawai(null);
      setSearchTerm('');
    } else {
      if (!externalNama.trim()) {
        toast.error('Masukkan nama undangan eksternal');
        return;
      }

      // Check for duplicates
      const isDuplicate = value.some(item => 
        item.kategori === 'eksternal' && item.nama.toLowerCase() === externalNama.toLowerCase()
      );

      if (isDuplicate) {
        toast.error('Nama undangan eksternal sudah ditambahkan');
        return;
      }

      const newUndangan: UndanganItem = {
        nama: externalNama.trim(),
        kategori: 'eksternal',
        pegawai_id: null // Set to null for external (backend expects string or null)
      };

      onChange([...value, newUndangan]);
      setExternalNama('');
    }
  };

  // Remove undangan from list
  const removeUndangan = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handlePegawaiSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setResults([]);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setResults([]);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when kategori changes
  useEffect(() => {
    setSelectedPegawai(null);
    setSearchTerm('');
    setExternalNama('');
    setResults([]);
  }, [kategori]);


  return (
    <div className={`space-y-4 ${className}`}>
      {/* Undangan List */}
      {value.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Undangan ({value.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {value.map((undangan, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{undangan.nama}</p>
                      {undangan.kategori === 'internal' && undangan.pegawai_jabatan && (
                        <p className="text-sm text-gray-500">{undangan.pegawai_jabatan}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={undangan.kategori === 'internal' ? 'default' : 'secondary'}>
                      {undangan.kategori === 'internal' ? 'Internal' : 'Eksternal'}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUndangan(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Undangan Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tambah Undangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Kategori Selection */}
          <div>
            <Label className="text-sm font-medium">Kategori</Label>
            <RadioGroup
              value={kategori}
              onValueChange={(value) => setKategori(value as 'internal' | 'eksternal')}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="internal" id="internal" />
                <Label htmlFor="internal">Internal (Pegawai)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="eksternal" id="eksternal" />
                <Label htmlFor="eksternal">Eksternal</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Internal Selection */}
          {kategori === 'internal' && (
            <div className="space-y-2">
              <Label htmlFor="search-pegawai">Cari Pegawai</Label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    ref={inputRef}
                    id="search-pegawai"
                    type="text"
                    placeholder="Cari nama atau NIP pegawai..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                    className="pl-10"
                  />
                  {loading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Dropdown Results */}
                {isOpen && (results.length > 0 || error) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {error && (
                      <div className="p-3 text-sm text-red-600">{error}</div>
                    )}
                    {results.map((pegawai, index) => (
                      <div
                        key={pegawai.NIP}
                        className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                          index === highlightedIndex ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => handlePegawaiSelect(pegawai)}
                      >
                        <div className="font-medium">{pegawai.Nama}</div>
                        <div className="text-sm text-gray-500">
                          NIP: {pegawai.NIP} | {pegawai.Jabatan}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* External Input */}
          {kategori === 'eksternal' && (
            <div className="space-y-2">
              <Label htmlFor="external-nama">Nama Undangan</Label>
              <Input
                id="external-nama"
                type="text"
                placeholder="Masukkan nama undangan eksternal"
                value={externalNama}
                onChange={(e) => setExternalNama(e.target.value)}
                disabled={disabled}
              />
            </div>
          )}

          {/* Add Button */}
          <Button
            type="button"
            onClick={addUndangan}
            disabled={disabled || (kategori === 'internal' && !selectedPegawai) || (kategori === 'eksternal' && !externalNama.trim())}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Undangan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultipleUndanganSelector;
