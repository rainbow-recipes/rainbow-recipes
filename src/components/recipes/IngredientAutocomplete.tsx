'use client';

/* eslint-disable react/require-default-props */
import { useEffect, useRef, useState } from 'react';
import { CaretRight } from 'react-bootstrap-icons';
import { prettyCategory } from '@/lib/categoryUtils';
import { searchIngredients } from '@/lib/dbActions';

type ItemCategory =
  | 'produce'
  | 'meat_seafood'
  | 'dairy_eggs'
  | 'frozen'
  | 'canned'
  | 'dry'
  | 'condiments_spices'
  | 'other';

type IngredientChoice = { id?: number; name: string; itemCategory?: ItemCategory; detail?: string };

type Props = {
  value: IngredientChoice[];
  onChangeAction: (v: IngredientChoice[]) => void;
  placeholder?: string;
  detailErrors?: boolean[];
};

export default function IngredientAutocomplete({ value, onChangeAction, placeholder = '', detailErrors = [] }: Props) {
  function normalizeName(s: string) {
    return s.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<IngredientChoice[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [checkingExact, setCheckingExact] = useState(false);
  const [typedDetail, setTypedDetail] = useState<boolean[]>([]);
  useEffect(() => () => {
    if (debounceRef.current && typeof window !== 'undefined') window.clearTimeout(debounceRef.current);
  }, []);

  // keep a parallel array tracking whether the user has typed into each
  // detail input. We only show the invalid state after the user has typed
  // at least once into that input (so initial empty fields don't show).
  useEffect(() => {
    setTypedDetail((prev) => {
      if (prev.length === value.length) return prev;
      const next = Array.from({ length: value.length }, (_, i) => !!prev[i]);
      return next;
    });
  }, [value.length]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current && typeof window !== 'undefined') window.clearTimeout(debounceRef.current);
    debounceRef.current = typeof window !== 'undefined'
      ? window.setTimeout(async () => {
        try {
          // Primary search by full query
          const take = 8;
          const results: IngredientChoice[] = [];
          const pushResults = (arr: any[]) => {
            for (const d of arr) {
              results.push({ id: d.id, name: d.name, itemCategory: d.itemCategory });
            }
          };

          // use trimmed query for searches
          const fullData = await searchIngredients(q, take);
          pushResults(fullData);

          // If query has multiple words, also search by each token so single-word items ("chicken")
          // show up when user types "chicken breast". Limit token searches to short tokens and
          // to avoid too many requests.
          const tokens = q.split(/\s+/).map((t) => t.trim()).filter(Boolean);
          if (tokens.length > 1) {
            const tokenPromises = tokens
              .filter((t) => t.length >= 2)
              .slice(0, 4)
              .map((t) => searchIngredients(t, take));

            const tokenResults = await Promise.all(tokenPromises);
            for (const tr of tokenResults) pushResults(tr);
          }

          // dedupe by id or normalized name
          const seen = new Set<string | number>();
          const deduped: IngredientChoice[] = [];
          for (const r of results) {
            const key = r.id ?? normalizeName(r.name);
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(r);
            }
            if (deduped.length >= take) break;
          }

          if (deduped.length) {
            setSuggestions(deduped);
            setOpen(true);
          } else {
            setSuggestions([]);
            setOpen(false);
          }
        } catch (err) {
          setSuggestions([]);
          setOpen(false);
        }
      }, 250)
      : null;
  }, [query]);

  // Define `onDocClick` function
  const onDocClick = (event: MouseEvent) => {
    if (!containerRef.current) return;
    if (!containerRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', onDocClick);
      return () => {
        document.removeEventListener('mousedown', onDocClick);
      };
    }
    return undefined; // Explicitly return undefined if document is not available
  }, []);

  function addChoice(choice: IngredientChoice) {
    const cleaned = (choice.name || '').trim().replace(/\s+/g, ' ');
    const newChoice: IngredientChoice = {
      id: choice.id,
      name: cleaned,
      itemCategory: choice.itemCategory ?? 'other',
      detail: choice.detail ?? '',
    };
    onChangeAction([...value, newChoice]);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  }

  function removeAt(index: number) {
    const next = [...value];
    next.splice(index, 1);
    onChangeAction(next);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
        {value.map((v, i) => (
          <div
            key={`${v.id ?? 'new'}_${v.name}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <CaretRight />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input
                type="text"
                placeholder="Quantity"
                value={v.detail ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const next = [...value];
                  next[i] = { ...next[i], detail: val };
                  onChangeAction(next);
                  // mark as typed once the user has entered any characters
                  if (!typedDetail[i] && val.length > 0) {
                    const td = [...typedDetail];
                    td[i] = true;
                    setTypedDetail(td);
                  }
                }}
                style={{ width: 150 }}
                className={`form-control form-control-sm ${detailErrors[i] && typedDetail[i] ? 'is-invalid' : ''}`}
              />
              {/* validation visual only (red border) — no inline message shown */}
            </div>
            <div
              className="badge"
              style={{
                padding: '6px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                color: 'inherit',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <span style={{ marginRight: 8 }}>{v.name}</span>
              {/* if item is new (no id), allow selecting category in the badge */}
              {v.id ? (
                v.itemCategory && (
                  <small style={{ opacity: 0.8, marginLeft: 4 }}>{prettyCategory(v.itemCategory)}</small>
                )
              ) : (
                <select
                  className="form-select form-select-sm"
                  value={v.itemCategory ?? 'other'}
                  onChange={(e) => {
                    const next = [...value];
                    next[i] = { ...next[i], itemCategory: e.target.value as ItemCategory };
                    onChangeAction(next);
                  }}
                  aria-label={`Category for ${v.name}`}
                  style={{ height: 28, fontSize: '0.75rem', padding: '2px 6px', width: 'auto', minWidth: 80 }}
                >
                  <option value="produce">{prettyCategory('produce')}</option>
                  <option value="meat_seafood">{prettyCategory('meat_seafood')}</option>
                  <option value="dairy_eggs">{prettyCategory('dairy_eggs')}</option>
                  <option value="frozen">{prettyCategory('frozen')}</option>
                  <option value="canned">{prettyCategory('canned')}</option>
                  <option value="dry">{prettyCategory('dry')}</option>
                  <option value="condiments_spices">{prettyCategory('condiments_spices')}</option>
                  <option value="other">{prettyCategory('other')}</option>
                </select>
              )}

              <button
                type="button"
                className="btn-close mx-2"
                aria-label="Remove"
                onClick={() => removeAt(i)}
                style={{ marginLeft: 8 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const qTrim = query.trim();
              if (!qTrim) return;
              const norm = normalizeName(qTrim);
              // if the trimmed input matches a suggestion (case/space-insensitive), add that suggestion
              const matched = suggestions.find((s) => normalizeName(s.name) === norm);
              if (matched) {
                addChoice(matched);
                return;
              }

              // If suggestions haven't loaded yet (or no exact match in suggestions), try a quick server check
              (async () => {
                setCheckingExact(true);
                try {
                  const data = await searchIngredients(qTrim, 1);
                  const exact = data.find((d: any) => normalizeName(d.name) === norm);
                  if (exact) {
                    addChoice({ id: exact.id, name: exact.name, itemCategory: exact.itemCategory });
                    return;
                  }
                } catch (err) {
                  // ignore and fall back to creating new
                } finally {
                  setCheckingExact(false);
                }
                addChoice({ name: qTrim });
              })();
            }
          }}
        />
        {/* small inline spinner for the Enter-check lookup */}
        {checkingExact && (
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
            <div className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
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
              style={{ padding: '8px 10px', cursor: 'pointer' }}
              onMouseDown={(ev) => {
                ev.preventDefault();
                addChoice(s);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{s.name}</span>
                {s.itemCategory && (
                  <small style={{ opacity: 0.8, marginLeft: 8 }}>{prettyCategory(s.itemCategory)}</small>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
