'use client';

import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
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
  owner: string;
};

const EditStorePageForm = ({ store }: { store: Store }) => {
  const defaultHours = Array.from({ length: 7 }, (_, i) => (store.hours && store.hours[i]) || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditStoreForm>({
    resolver: yupResolver(EditStoreSchema),
    defaultValues: {
      id: store.id,
      name: store.name,
      website: store.website ?? null,
      location: store.location,
      hours: defaultHours,
      owner: store.owner,
    },
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const onSubmit = async (data: EditStoreForm) => {
    // transform to Store shape (website null handled already by resolver/transform)
    const payload: Store = {
      id: data.id,
      name: data.name,
      website: data.website as string | null,
      location: data.location,
      hours: data.hours,
      owner: data.owner,
    };

    await editStore(payload);
    swal('Success', 'Your store has been updated', 'success', { timer: 2000 });
  };

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center">
            <h2>Edit My Store</h2>
          </Col>
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <input type="hidden" {...register('id')} />
                <Form.Group>
                  <Form.Label>Store Name</Form.Label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  />
                  <div className="invalid-feedback">{errors.name?.message}</div>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Store Website</Form.Label>
                  <input type="text" {...register('website')} className={`form-control ${errors.website ? 'is-invalid' : ''}`} />
                  <div className="invalid-feedback">{(errors as any).website?.message}</div>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Location</Form.Label>
                  <input type="text" {...register('location')} className={`form-control ${errors.location ? 'is-invalid' : ''}`} />
                  <div className="invalid-feedback">{errors.location?.message}</div>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Hours (one input per day)</Form.Label>
                  <Row>
                    {days.map((day, idx) => (
                      <Col key={day} xs={12} sm={6} className="mb-2">
                        <Form.Label className="small">{day}</Form.Label>
                        <input
                          type="text"
                          {...register(`hours.${idx}` as const)}
                          className={`form-control ${errors.hours ? 'is-invalid' : ''}`}
                        />
                      </Col>
                    ))}
                  </Row>
                  <div className="invalid-feedback">{(errors as any).hours?.message}</div>
                </Form.Group>
                <input type="hidden" {...register('owner')} />
                <Form.Group className="form-group">
                  <Row className="pt-3">
                    <Col>
                      <Button type="submit" variant="primary">
                        Submit
                      </Button>
                    </Col>
                    <Col>
                      <Button type="button" onClick={() => reset()} variant="warning" className="float-right">
                        Reset
                      </Button>
                    </Col>
                  </Row>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditStorePageForm;
