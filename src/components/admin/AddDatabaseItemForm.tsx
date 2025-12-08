'use client';

import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import swal from 'sweetalert';
import { addDatabaseItem, getDatabaseItems } from '@/lib/dbActions';
import { AddDatabaseItemSchema } from '@/lib/validationSchemas';

export default function AddDatabaseItemForm() {
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchNames = async () => {
      const items = await getDatabaseItems();
      setExistingNames(items.map((item) => item.name.toLowerCase()));
    };
    fetchNames();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(AddDatabaseItemSchema),
  });

  const nameValue = useWatch({
    control,
    name: 'name',
  });

  useEffect(() => {
    if (nameValue && existingNames.includes(nameValue.toLowerCase())) {
      setDuplicateWarning(`An item named "${nameValue}" already exists.`);
    } else {
      setDuplicateWarning(null);
    }
  }, [nameValue, existingNames]);

  const onSubmit = async (data: { name: string; ItemCategory: string; approved: boolean }) => {
    await addDatabaseItem(data);
    swal('Success', 'Your item has been added', 'success', {
      timer: 2000,
    });
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center">
            <h2 className="mb-3">Add Database Item</h2>
          </Col>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Name</Form.Label>
              <input
                type="text"
                {...register('name')}
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              />
              {duplicateWarning && <div className="text-warning mt-2">{duplicateWarning}</div>}
              <div className="invalid-feedback">{errors.name?.message}</div>
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
              <Form.Label className="mb-1">Approved</Form.Label>
              <select
                {...register('approved')}
                className={`form-control ${errors.approved ? 'is-invalid' : ''}`}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <div className="invalid-feedback">{errors.approved?.message}</div>
            </Form.Group>
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
