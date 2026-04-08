'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface Suggestion {
  primary: string;
  secondary: string;
  full: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Street name, house number, apartment',
  className = '',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
      setActiveIdx(-1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 350);
  };

  const select = (suggestion: Suggestion) => {
    onChange(suggestion.full);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        select(suggestions[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-dim pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          className="w-full pl-12 pr-10 py-4 bg-white border border-border rounded-2xl focus:ring-2 focus:ring-brand outline-none text-base transition-shadow"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1.5 bg-white border border-border-dim rounded-2xl shadow-float overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.full}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={() => select(s)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                i === activeIdx ? 'bg-brand-muted' : 'hover:bg-canvas'
              } ${i > 0 ? 'border-t border-border-dim' : ''}`}
            >
              <MapPin
                className={`w-4 h-4 mt-0.5 shrink-0 ${i === activeIdx ? 'text-brand' : 'text-ink-dim'}`}
                strokeWidth={1.8}
              />
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${i === activeIdx ? 'text-brand' : 'text-ink'}`}>
                  {s.primary}
                </p>
                <p className="text-xs text-ink-dim truncate mt-0.5">{s.secondary}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
