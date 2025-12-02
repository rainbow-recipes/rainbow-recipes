'use client';

import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import swal from 'sweetalert';
import { yupResolver } from '@hookform/resolvers/yup';
import { Store } from '@prisma/client';
import { EditStoreSchema } from '@/lib/validationSchemas';
import { editStore } from '@/lib/dbActions';

// form type matching the validation schema (website string|null, hours string[])
type EditStoreForm = {
  id: string;
  name: string;
  website: string | null;
  location: string;
  hours: string[];
  hoursOpen?: string[];
  hoursClose?: string[];
  hoursStatus?: boolean[];
  image: string | null;
  owner: string;
};

const EditStorePageForm = ({ store }: { store: Store }) => {
  // Normalize existing store.hours into an array of length 7
  const rawHours = (store.hours ?? []).slice(0, 7);

  // parse time strings like '9:00 am' or '09:00' into 'HH:MM' 24-hour format for <input type="time">
  const parseTo24 = (t?: string) => {
    if (!t) return '';
    const s = t.trim().toLowerCase();
    if (!s) return '';
    if (s === 'closed') return '';
    // if already in HH:MM 24-hour format
    const hhmmMatch = s.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      const hh = parseInt(hhmmMatch[1], 10);
      const mm = hhmmMatch[2];
      if (hh >= 0 && hh < 24) return `${hh.toString().padStart(2, '0')}:${mm}`;
    }
    // match 12-hour with am/pm like '9:00 am' or '09:00pm' or '9 am'
    const ampmMatch = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (ampmMatch) {
      let hh = parseInt(ampmMatch[1], 10);
      const mm = ampmMatch[2] ?? '00';
      const period = ampmMatch[3];
      if (period === 'pm' && hh !== 12) hh += 12;
      if (period === 'am' && hh === 12) hh = 0;
      return `${hh.toString().padStart(2, '0')}:${mm}`;
    }
    // try to split when given as 'start-end' where parts might be 12h or 24h
    if (s.includes('-')) {
      const parts = s.split('-').map((p) => p.trim());
      if (parts[0]) return parseTo24(parts[0]);
    }
    return '';
  };

  const defaultHours = Array.from({ length: 7 }, (_, i) => rawHours[i] ?? '');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitted },
  } = useForm<EditStoreForm>({
    // validate on change so users see required errors immediately when left blank
    mode: 'onChange',
    resolver: yupResolver(EditStoreSchema),
    defaultValues: {
      id: store.id,
      name: store.name,
      website: store.website ?? null,
      location: store.location,
      hours: defaultHours,
      hoursOpen: defaultHours.map((h) => parseTo24(h)),
      hoursClose: defaultHours.map((h) => {
        // if original stored value had a dash, try to parse the second part
        if (typeof h === 'string' && h.includes('-')) {
          const parts = h.split('-').map((p) => p.trim());
          return parseTo24(parts[1]);
        }
        return '';
      }),
      hoursStatus: defaultHours.map((h) => !(typeof h === 'string' && h.toLowerCase() === 'closed')),
      image: store.image ?? null,
      owner: store.owner,
    },
  });

  // useWatch avoids unstable watch() dependency arrays for effects
  const rawHoursStatus = useWatch({ control, name: 'hoursStatus' }) as boolean[] | undefined;
  const rawHoursOpenWatch = useWatch({ control, name: 'hoursOpen' }) as string[] | undefined;
  const rawHoursCloseWatch = useWatch({ control, name: 'hoursClose' }) as string[] | undefined;

  const hoursStatus = useMemo(() => rawHoursStatus ?? [], [rawHoursStatus]);
  const hoursOpenWatch = useMemo(() => rawHoursOpenWatch ?? [], [rawHoursOpenWatch]);
  const hoursCloseWatch = useMemo(() => rawHoursCloseWatch ?? [], [rawHoursCloseWatch]);

  // helper: convert 'HH:MM' (24h) to 'h:MM am|pm'
  const formatTo12 = (time24?: string) => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length === 0) return time24;
    const hh = parseInt(parts[0], 10);
    const mm = parts[1] ?? '00';
    if (Number.isNaN(hh)) return time24;
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${mm} ${period}`;
  };

  // Keep `hours` in sync for validation: compose visible hours from the time inputs
  useEffect(() => {
    const composed = Array.from({ length: 7 }).map((_, i) => {
      const status = hoursStatus[i];
      if (status === false) return 'Closed';
      const o = hoursOpenWatch[i] ?? '';
      const c = hoursCloseWatch[i] ?? '';
      if (!o && !c) return '';
      const start = formatTo12(o);
      const end = formatTo12(c);
      return end ? `${start} - ${end}` : `${start}`;
    });

    // update the hidden/validated `hours` field so the resolver sees current values
    // do not validate on every change — only validate on submit to avoid showing
    // required warnings for hours before the user attempts to submit
    setValue('hours', composed, { shouldValidate: false, shouldDirty: true });
  }, [hoursStatus, hoursOpenWatch, hoursCloseWatch, setValue]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const onSubmit = async (data: EditStoreForm) => {
    // Compose hours from hoursOpen and hoursClose arrays
    const open = (data as any).hoursOpen ?? [];
    const close = (data as any).hoursClose ?? [];
    const statusArr = (data as any).hoursStatus ?? [];
    const composedHours = Array.from({ length: 7 }).map((_, i) => {
      if (statusArr[i] === false) return 'Closed';
      const o = open[i] ?? '';
      const c = close[i] ?? '';
      if (!o && !c) return '';
      const start = formatTo12(o);
      const end = formatTo12(c);
      return end ? `${start} - ${end}` : `${start}`;
    });

    // transform to Store shape (website null handled already by resolver/transform)
    const payload: Store = {
      id: data.id,
      name: data.name,
      website: data.website as string | null,
      location: data.location,
      hours: composedHours,
      image: data.image as string | null,
      owner: data.owner,
    };

    await editStore(payload);
    swal('Success', 'Your store has been updated', 'success', { timer: 2000 });
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h2 className="mb-3">Edit My Store</h2>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('id')} />
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">
                Store Name
                <span className="text-danger ms-1">*</span>
              </Form.Label>
              <input
                type="text"
                placeholder="Enter store name"
                {...register('name')}
                required
                aria-required="true"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              />
              <div className="invalid-feedback" role="alert" aria-live="polite">
                {errors.name?.message}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Store Website URL</Form.Label>
              <input
                type="text"
                placeholder="Enter store website"
                {...register('website')}
                className={`form-control ${errors.website ? 'is-invalid' : ''}`}
              />
              <div className="invalid-feedback">{(errors as any).website?.message}</div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Store Image URL</Form.Label>
              <input
                type="text"
                placeholder="Enter store image URL"
                {...register('image')}
                className={`form-control ${errors.image ? 'is-invalid' : ''}`}
              />
              <div className="invalid-feedback">{(errors as any).image?.message}</div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">
                Location
                <span className="text-danger ms-1">*</span>
              </Form.Label>
              <input
                type="text"
                placeholder="Enter location"
                {...register('location')}
                required
                aria-required="true"
                className={`form-control ${errors.location ? 'is-invalid' : ''}`}
              />
              <div className="invalid-feedback" role="alert" aria-live="polite">
                {errors.location?.message}
              </div>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="mb-1">Hours</Form.Label>
              {days.map((day, idx) => {
                const defaultOpen = !(
                  typeof defaultHours[idx] === 'string'
                  && defaultHours[idx].toLowerCase() === 'closed'
                );
                const status = hoursStatus[idx] ?? defaultOpen;
                return (
                  <Row key={day} className="mb-3">
                    <Col>
                      <Row className="g-2 d-flex flex-nowrap align-items-center">
                        <Col className="pe-2 d-flex align-items-center">
                          <Col xs={2} lg={8}>
                            <Form.Label className="mb-0 small me-2">{day}</Form.Label>
                          </Col>
                          <Col>
                            <div className="form-check mb-0">
                              <input
                                type="checkbox"
                                {...register(`hoursStatus.${idx}` as const)}
                                className="form-check-input"
                                id={`hoursStatus-${idx}`}
                                aria-label={`${day} open`}
                              />
                            </div>
                          </Col>
                        </Col>
                      </Row>
                    </Col>
                    <Col lg={5} xl={10}>
                      <Row className="g-2">
                        <Col>
                          <input
                            type="time"
                            step={300}
                            {...register(`hoursOpen.${idx}` as const)}
                            className={`form-control ${isSubmitted && (errors as any).hours ? 'is-invalid' : ''}`}
                            aria-label={`${day} opening time`}
                            disabled={!status}
                          />
                        </Col>
                        <Col xs="auto" className="d-flex align-items-center">to</Col>
                        <Col>
                          <input
                            type="time"
                            step={300}
                            {...register(`hoursClose.${idx}` as const)}
                            className={`form-control ${isSubmitted && (errors as any).hours ? 'is-invalid' : ''}`}
                            aria-label={`${day} closing time`}
                            disabled={!status}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                );
              })}
              <div className="invalid-feedback">{isSubmitted ? (errors as any).hours?.message : ''}</div>
            </Form.Group>
            <input type="hidden" {...register('owner')} />
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
};

export default EditStorePageForm;
