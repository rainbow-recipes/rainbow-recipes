'use client';

import { useSession } from 'next-auth/react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import swal from 'sweetalert';
import { redirect } from 'next/navigation';
import { addStoreItem } from '@/lib/dbActions';
import { AddStoreItemSchema } from '@/lib/validationSchemas';
import StoreItemNameField from './StoreItemNameField';

export default function AddStoreItemForm() {
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
    resolver: yupResolver(AddStoreItemSchema),
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

  // Delegate DatabaseItem creation/lookup to the server action.
  const onSubmit = async (data: {
    name: string;
    price: number;
    unit: string;
    availability: string;
    ItemCategory: string;
    owner: string;
  }) => {
    try {
      const payload = {
        name: data.name,
        price: data.price,
        unit: data.unit,
        availability: data.availability,
        owner: data.owner,
        itemCategory: data.ItemCategory,
      };

      await addStoreItem(payload);
    } catch (err: any) {
      // Ignore redirect errors (they're thrown by Next.js redirect() function)
      if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.includes('NEXT_REDIRECT')) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        swal('Success', 'Your item has been added', 'success', {
          timer: 2000,
        });
        return;
      }
      // eslint-disable-next-line no-console
      console.error('Error adding item:', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      swal('Error', 'Failed to add item', 'error');
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center">
            <h2 className="mb-3">Add Store Item</h2>
          </Col>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <StoreItemNameField
              nameRegister={register('name')}
              nameValue={watch('name') ?? ''}
              setValue={(field, value) => setValue(field as any, value)}
              itemCategoryField="ItemCategory"
              emptyCategoryValue=""
              errorMessage={errors.name?.message}
              suggestionsId="additem-suggestions"
            />
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
