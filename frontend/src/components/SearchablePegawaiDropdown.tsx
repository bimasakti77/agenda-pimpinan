'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/apiService';
import { PegawaiListItem, PegawaiDropdownProps } from '@/types/pegawai';
import { Search, X, ChevronDown, User, Loader2 } from 'lucide-react';

interface SearchablePegawaiDropdownProps extends Omit<PegawaiDropdownProps, 'showStatus'> {
  placeholder?: string;
  searchPlaceholder?: string;
  maxResults?: number;
  minSearchLength?: number;
  debounceMs?: number;
}

const SearchablePegawaiDropdown = React.memo(function SearchablePegawaiDropdown({
  value,
  onValueChange,
  onPegawaiSelect,
  placeholder = "Pilih Pegawai",
  searchPlaceholder = "Cari nama atau NIP pegawai...",
  className = "",
  disabled = false,
  filterActive = true,
  maxResults = 20,
  minSearchLength = 2,
  debounceMs = 300
}: SearchablePegawaiDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PegawaiListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiListItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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
    } catch (err) {
      console.error('Error searching pegawai:', err);
      setError(err instanceof Error ? err.message : 'Gagal mencari data pegawai');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightedIndex(-1);
    debouncedSearch(term);
  };

  // Handle pegawai selection
  const handlePegawaiSelect = (pegawai: PegawaiListItem) => {
    setSelectedPegawai(pegawai);
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    onValueChange(pegawai.NIP);
    if (onPegawaiSelect) {
      onPegawaiSelect(pegawai);
    }
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedPegawai(null);
    setSearchTerm('');
    setResults([]);
    setError(null);
    onValueChange('');
    if (onPegawaiSelect) {
      onPegawaiSelect(null);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        inputRef.current?.focus();
      }
      return;
    }

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
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load selected pegawai data when value changes
  useEffect(() => {
    if (value && !selectedPegawai) {
      // Try to find in current results first
      const found = results.find(p => p.NIP === value);
      if (found) {
        setSelectedPegawai(found);
      }
    }
  }, [value, selectedPegawai, results]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input/Display */}
      <div
        className={`
          flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}
          transition-colors duration-200
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedPegawai ? (
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {selectedPegawai.Nama}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {selectedPegawai.NIP} • {selectedPegawai.Jabatan || 'Tidak ada jabatan'}
              </div>
            </div>
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <span className="text-gray-500 flex-1 text-left">
            {placeholder}
          </span>
        )}
        
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4"
                autoFocus
              />
            </div>
            {searchTerm.length > 0 && searchTerm.length < minSearchLength && (
              <p className="text-xs text-gray-500 mt-1">
                Ketik minimal {minSearchLength} karakter untuk mencari
              </p>
            )}
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Mencari...</span>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50">
                {error}
              </div>
            )}

            {!loading && !error && results.length === 0 && searchTerm.length >= minSearchLength && (
              <div className="p-3 text-sm text-gray-500 text-center">
                Tidak ada pegawai yang ditemukan untuk "{searchTerm}"
              </div>
            )}

            {!loading && !error && searchTerm.length === 0 && (
              <div className="p-3 text-sm text-gray-500 text-center">
                Ketik nama atau NIP pegawai untuk mencari
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div role="listbox">
                {results.map((pegawai, index) => (
                  <div
                    key={pegawai.NIP}
                    className={`
                      flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors
                      ${index === highlightedIndex 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50'
                      }
                    `}
                    onClick={() => handlePegawaiSelect(pegawai)}
                    role="option"
                    aria-selected={index === highlightedIndex}
                  >
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {pegawai.Nama}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {pegawai.NIP} • {pegawai.Jabatan || 'Tidak ada jabatan'}
                      </div>
                    </div>
                    {filterActive && pegawai.StatusPegawai === 'PNS' && (
                      <Badge variant="secondary" className="text-xs">
                        Aktif
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && results.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Menampilkan {results.length} dari hasil pencarian
              {results.length === maxResults && ` (maksimal ${maxResults})`}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default SearchablePegawaiDropdown;
