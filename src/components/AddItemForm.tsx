'use client';

import { useSession } from 'next-auth/react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import swal from 'sweetalert';
import { redirect } from 'next/navigation';
import { addItem } from '@/lib/dbActions';
import { AddItemSchema } from '@/lib/validationSchemas';

export default function AddItemForm() {
  const { data: session, status } = useSession();
  const currentUser = session?.user?.email || '';
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(AddItemSchema),
    defaultValues: { ItemCategory: '' as any },
  });
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  // If currentUser arrives async, ensure the hidden `owner` field is populated
  useEffect(() => {
    if (currentUser) {
      setValue('owner', currentUser);
    }
  }, [currentUser, setValue]);

  // Autocomplete state for Name field
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id?: number; name: string; itemCategory?: string }>>([]);
  const [open, setOpen] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const normalize = (s?: string) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();

  // onSubmit moved inside component so we can run a quick exact-match lookup
  // against DatabaseItem entries before creating a new Item.
  const onSubmit = async (data: {
    name: string;
    price: number;
    unit: string;
    availability: string;
    ItemCategory: string;
    owner: string;
  }) => {
    let resolvedCategory = (data as any).ItemCategory;
    try {
      const q = String(data.name || '').trim();
      if (q) {
        const res = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}&take=8`);
        if (res.ok) {
          const items = await res.json();
          const target = normalize(q);
          const matched = (items || []).find((it: any) => normalize(it.name) === target);
          if (matched && matched.itemCategory) resolvedCategory = matched.itemCategory;
        }
      }
    } catch (err) {
      // ignore lookup errors; proceed with whatever category is present
    }

    const payload = {
      name: data.name,
      price: data.price,
      unit: data.unit,
      availability: data.availability,
      itemCategory: resolvedCategory,
      owner: data.owner,
    };

    await addItem(payload);
    swal('Success', 'Your item has been added', 'success', {
      timer: 2000,
    });
  };

  function prettyCategory(c?: string) {
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

  const capitalizeName = (s?: string) => {
    if (!s) return '';
    return String(s)
      .split(/\s+/)
      .map((w) => (w.length ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
      .join(' ');
  };

  useEffect(() => () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const q = String(query || '').trim();
    if (!q) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const take = 8;
        const res = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}&take=${take}`);
        if (!res.ok) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        const data = await res.json();
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
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center">
            <h2 className="mb-3">Add Store Item</h2>
          </Col>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group style={{ position: 'relative' }} className="mb-3">
              <Form.Label className="mb-1">Name</Form.Label>
              {/* visible input controlled via react-hook-form watch + setValue */}
              <input
                type="text"
                placeholder="Start typing to see suggestions..."
                {...register('name')}
                value={watch('name') ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue('name', v);
                  setQuery(v);
                  // If the name is cleared, reset the ItemCategory to the placeholder
                  if (!String(v || '').trim()) {
                    setValue('ItemCategory', null as any);
                  }
                }}
                onFocus={() => {
                  setNameFocused(true);
                  if (suggestions.length > 0) setOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Prevent the form from submitting on Enter inside this input.
                    e.preventDefault();

                    // If the typed name exactly matches a suggestion (case/space-insensitive),
                    // select that suggestion so the ItemCategory is autofilled.
                    const qTrim = String((watch('name') ?? '')).trim();
                    if (qTrim) {
                      const norm = qTrim.replace(/\s+/g, ' ').toLowerCase();
                      const matched = suggestions.find((s) => {
                        const n = String(s.name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
                        return n === norm;
                      });
                      if (matched) {
                        setValue('name', matched.name);
                        if (matched.itemCategory) setValue('ItemCategory', matched.itemCategory as any);
                      } else {
                        // No local suggestion matched yet (suggestions may not have loaded).
                        // Do a quick server check like IngredientAutocomplete does.
                        (async () => {
                          try {
                            const res = await fetch(`/api/ingredients?q=${encodeURIComponent(qTrim)}&take=1`);
                            if (res.ok) {
                              const data = await res.json();
                              const exact = (data || []).find((d: any) => normalize(d.name) === normalize(qTrim));
                              if (exact) {
                                setValue('name', exact.name);
                                if (exact.itemCategory) setValue('ItemCategory', exact.itemCategory as any);
                              }
                            }
                          } catch (err) {
                            // ignore
                          }
                        })();
                      }
                    }

                    // hide suggestions in all cases
                    setOpen(false);
                    setSuggestions([]);

                    // blur the input so the user exits the field
                    try {
                      (e.currentTarget as HTMLInputElement).blur();
                    } catch (err) {
                      // ignore if blur isn't available
                    }
                  }
                }}
                onBlur={() => {
                  setNameFocused(false);
                  // Delay closing slightly so mouse selection on suggestions (which uses
                  // onMouseDown) can run first. This prevents the dropdown from
                  // disappearing before a click selects an item.
                  window.setTimeout(() => {
                    setOpen(false);
                    setSuggestions([]);
                  }, 120);
                }}
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                aria-autocomplete="list"
                aria-controls="additem-suggestions"
              />
              <div className="invalid-feedback">{errors.name?.message}</div>

              {/* Suggestions dropdown (simple, no badges) */}
              {open && suggestions.length > 0 && (
                <ul
                  id="additem-suggestions"
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
                        // set form values: name + ItemCategory
                        setValue('name', s.name);
                        if (s.itemCategory) setValue('ItemCategory', s.itemCategory as any);
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
                      <span>{capitalizeName(s.name)}</span>
                      {s.itemCategory && (
                        <small style={{ opacity: 0.8 }}>{prettyCategory(s.itemCategory)}</small>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Item Category</Form.Label>
              <select
                {...register('ItemCategory')}
                className={`form-control ${errors.ItemCategory ? 'is-invalid' : ''}`}
              >
                <option value="">Select category</option>
                <option value="produce">Produce</option>
                <option value="meat_seafood">Meat / Seafood</option>
                <option value="dairy_eggs">Dairy & Eggs</option>
                <option value="frozen">Frozen</option>
                <option value="canned">Canned Goods</option>
                <option value="dry">Dry Goods</option>
                <option value="condiments_spices">Condiments & Spices</option>
                <option value="other">Other</option>
              </select>
              <div className="invalid-feedback">{errors.ItemCategory?.message}</div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Size</Form.Label>
              <input
                type="text"
                placeholder="e.g., 16 floz, 1 lb, 1 bunch"
                {...register('unit')}
                className={`form-control ${errors.unit ? 'is-invalid' : ''}`}
              />
              <div className="invalid-feedback">{errors.unit?.message}</div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Price</Form.Label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter price ($)"
                {...register('price')}
                className={`form-control ${errors.price ? 'is-invalid' : ''}`}
              />
              <div className="invalid-feedback">{errors.price?.message}</div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Availability</Form.Label>
              <select
                {...register('availability')}
                className={`form-control ${errors.availability ? 'is-invalid' : ''}`}
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <div className="invalid-feedback">{errors.availability?.message}</div>
            </Form.Group>
            <input type="hidden" {...register('owner')} defaultValue={currentUser} />
            <Form.Group className="form-group mt-4 text-end">
              <Button type="button" onClick={() => reset()} variant="secondary" className="float-right">
                Reset
              </Button>
              {' '}
              <Button type="submit" variant="success">
                Submit
              </Button>
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
