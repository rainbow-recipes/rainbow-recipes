'use client';

/* eslint-disable react/require-default-props */
import { useEffect, useRef, useState } from 'react';

type ItemCategory =
  | 'produce'
  | 'meat_seafood'
  | 'dairy_eggs'
  | 'frozen'
  | 'canned'
  | 'dry'
  | 'condiments_spices'
  | 'other';

type IngredientChoice = { id?: number; name: string; itemCategory?: ItemCategory };

type Props = {
  value: IngredientChoice[];
  onChange: (v: IngredientChoice[]) => void;
  placeholder?: string;
};

export default function IngredientAutocomplete({ value, onChange, placeholder = '' }: Props) {
  function normalizeName(s: string) {
    return s.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function prettyCategory(c?: ItemCategory) {
    switch (c) {
      case 'produce':
        return 'Produce';
      case 'meat_seafood':
        return 'Meat / Seafood';
      case 'dairy_eggs':
        return 'Dairy & Eggs';
      case 'frozen':
        return 'Frozen';
      case 'canned':
        return 'Canned';
      case 'dry':
        return 'Dry Goods';
      case 'condiments_spices':
        return 'Condiments & Spices';
      default:
        return 'Other';
    }
  }

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<IngredientChoice[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [checkingExact, setCheckingExact] = useState(false);
  useEffect(() => () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        // Primary search by full query
        const take = 8;
        const results: IngredientChoice[] = [];
        const pushResults = (arr: any[]) => {
          for (const d of arr) {
            results.push({ id: d.id, name: d.name, itemCategory: d.itemCategory });
          }
        };

        // use trimmed query for fetches so leading/trailing spaces don't affect results
        const fullRes = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}&take=${take}`);
        if (fullRes.ok) {
          const data = await fullRes.json();
          pushResults(data);
        }

        // If query has multiple words, also search by each token so single-word items ("chicken")
        // show up when user types "chicken breast". Limit token searches to short tokens and
        // to avoid too many requests.
        const tokens = q.split(/\s+/).map((t) => t.trim()).filter(Boolean);
        if (tokens.length > 1) {
          const tokenPromises = tokens
            .filter((t) => t.length >= 2)
            .slice(0, 4)
            .map((t) => fetch(`/api/ingredients?q=${encodeURIComponent(t)}&take=${take}`)
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => []));

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
    }, 250);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function addChoice(choice: IngredientChoice) {
    const cleaned = (choice.name || '').trim().replace(/\s+/g, ' ');
    const norm = normalizeName(cleaned);

    // prevent duplicate by id
    if (choice.id && value.some((v) => v.id && v.id === choice.id)) return;
    // prevent duplicate by normalized name (case/whitespace-insensitive)
    if (value.some((v) => normalizeName(v.name) === norm)) return;

    const newChoice: IngredientChoice = {
      id: choice.id,
      name: cleaned,
      // default new free-text items to 'other'; existing items carry their itemCategory
      itemCategory: choice.itemCategory ?? 'other',
    };
    onChange([...value, newChoice]);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  }

  function removeAt(index: number) {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {value.map((v, i) => (
          <div
            key={`${v.id ?? 'new'}_${v.name}`}
            className="badge bg-success text-white"
            style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
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
                  onChange(next);
                }}
                aria-label={`Category for ${v.name}`}
                style={{ height: 28, fontSize: '0.75rem', padding: '2px 6px' }}
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
              className="btn-close btn-close-white mx-2"
              aria-label="Remove"
              onClick={() => removeAt(i)}
            />
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
                  const res = await fetch(`/api/ingredients?q=${encodeURIComponent(qTrim)}&take=1`);
                  if (res.ok) {
                    const data = await res.json();
                    const exact = data.find((d: any) => normalizeName(d.name) === norm);
                    if (exact) {
                      addChoice({ id: exact.id, name: exact.name, itemCategory: exact.itemCategory });
                      return;
                    }
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
