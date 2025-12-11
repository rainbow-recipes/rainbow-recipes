'use client';

import { useEffect, useRef, useState } from 'react';
import { prettyCategory } from '@/lib/categoryUtils';
import { searchIngredients } from '@/lib/dbActions';

export type StoreItemNameFieldProps = {
  label?: string;
  nameRegister: any; // react-hook-form register('name') spread props
  nameValue: string;
  setValue: (field: string, value: any) => void;
  itemCategoryField?: string;
  emptyCategoryValue?: any;
  errorMessage?: string;
  suggestionsId?: string;
};

export default function StoreItemNameField({
  label = 'Name',
  nameRegister,
  nameValue,
  setValue,
  itemCategoryField = 'ItemCategory',
  emptyCategoryValue = '',
  errorMessage,
  suggestionsId = 'storeitem-suggestions',
}: StoreItemNameFieldProps) {
  const inputId = `${suggestionsId}-input`;
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id?: number; name: string; itemCategory?: string }>>([]);
  const [open, setOpen] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const normalize = (s?: string) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const displayName = nameValue ?? '';

  useEffect(() => () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const q = String(query || '').trim();
    if (!q || !nameFocused) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const take = 8;
        const data = await searchIngredients(q, take);
        const dedup: Array<{ id?: number; name: string; itemCategory?: string }> = [];
        const seen = new Set<number | string>();
        for (const d of data) {
          const key = d.id ?? String(d.name).toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            dedup.push({ id: d.id, name: d.name, itemCategory: d.itemCategory });
          }
          if (dedup.length >= take) break;
        }
        setSuggestions(dedup);
        setOpen(dedup.length > 0 && nameFocused);
      } catch (err) {
        setSuggestions([]);
        setOpen(false);
      }
    }, 220);
  }, [query, nameFocused]);

  return (
    <div style={{ position: 'relative' }} className="mb-3">
      <label className="form-label mb-1" htmlFor={inputId}>{label}</label>
      <input
        type="text"
        placeholder="Start typing to see suggestions..."
        {...nameRegister}
        value={displayName}
        id={inputId}
        onChange={(e) => {
          const v = e.target.value;
          setValue('name', v);
          setQuery(v);
          if (!String(v || '').trim()) {
            setValue(itemCategoryField, emptyCategoryValue as any);
          }
        }}
        onFocus={() => {
          setNameFocused(true);
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            // If the typed name exactly matches a suggestion, autofill category
            const qTrim = String(nameValue ?? '').trim();
            if (qTrim) {
              const norm = qTrim.replace(/\s+/g, ' ').toLowerCase();
              const matched = suggestions.find((s) => normalize(s.name) === norm);
              if (matched) {
                setValue('name', matched.name);
                if (matched.itemCategory) setValue(itemCategoryField, matched.itemCategory as any);
              } else {
                (async () => {
                  try {
                    const data = await searchIngredients(qTrim, 1);
                    const exact = (data || []).find((d: any) => normalize(d.name) === normalize(qTrim));
                    if (exact) {
                      setValue('name', exact.name);
                      if (exact.itemCategory) setValue(itemCategoryField, exact.itemCategory as any);
                    }
                  } catch (err) {
                    // ignore lookup errors
                  }
                })();
              }
            }
            setOpen(false);
            setSuggestions([]);
            try {
              (e.currentTarget as HTMLInputElement).blur();
            } catch (err) {
              // ignore
            }
          }
        }}
        onBlur={() => {
          setNameFocused(false);
          window.setTimeout(() => {
            setOpen(false);
            setSuggestions([]);
          }, 120);
        }}
        className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
        aria-autocomplete="list"
        aria-controls={suggestionsId}
      />
      <div className="invalid-feedback">{errorMessage}</div>

      {open && suggestions.length > 0 && (
        <ul
          id={suggestionsId}
          role="listbox"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 4,
            marginTop: 4,
            padding: 0,
            listStyle: 'none',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s) => (
            <li
              key={s.id ?? s.name}
              role="option"
              aria-selected={false}
              onMouseDown={(ev) => {
                ev.preventDefault();
                setValue('name', s.name);
                if (s.itemCategory) setValue(itemCategoryField, s.itemCategory as any);
                setOpen(false);
                setSuggestions([]);
              }}
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{s.name}</span>
              {s.itemCategory && (
                <small style={{ opacity: 0.8 }}>{prettyCategory(s.itemCategory)}</small>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

StoreItemNameField.defaultProps = {
  label: 'Name',
  itemCategoryField: 'ItemCategory',
  emptyCategoryValue: '',
  errorMessage: undefined,
  suggestionsId: 'storeitem-suggestions',
};
