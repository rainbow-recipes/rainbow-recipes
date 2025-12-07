'use client';

import { useSession } from 'next-auth/react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import swal from 'sweetalert';
import { redirect } from 'next/navigation';
import { StoreItem, DatabaseItem } from '@prisma/client';
import { editStoreItem } from '@/lib/dbActions';
import { EditStoreItemSchema } from '@/lib/validationSchemas';
import StoreItemNameField from './StoreItemNameField';

 type FormValues = {
   id?: number;
   name: string;
   price: number;
   unit: string;
   availability: string;
   ItemCategory: string;
   owner: string;
 };

 type EditStoreItemFormProps = {
   item: StoreItem & { databaseItem: DatabaseItem };
 };

export default function EditStoreItemForm({ item }: EditStoreItemFormProps) {
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
    resolver: yupResolver(EditStoreItemSchema),
    defaultValues: { ItemCategory: '' as any },
  });
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  useEffect(() => {
    reset({
      id: item.id,
      name: item.databaseItem.name,
      price: typeof item.price === 'object' && item.price !== null && 'toNumber' in (item.price as any)
        ? Number((item.price as any).toNumber())
        : Number(item.price as any),
      unit: item.unit,
      availability: item.availability ? 'in_stock' : 'out_of_stock',
      owner: currentUser,
      ItemCategory: item.databaseItem.itemCategory ?? '',
    } as any);
  }, [item, currentUser, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        unit: data.unit,
        availability: data.availability === 'in_stock',
        itemCategory: data.ItemCategory,
        owner: data.owner,
      } as any;

      await editStoreItem(payload);
      swal('Success', 'Your item has been updated', 'success', { timer: 2000 });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating item:', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      swal('Error', 'Failed to update item', 'error');
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center">
            <h2 className="mb-3">Edit Store Item</h2>
          </Col>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('id')} value={item.id} />

            <StoreItemNameField
              nameRegister={register('name')}
              nameValue={watch('name') ?? ''}
              setValue={(field, value) => setValue(field as any, value)}
              itemCategoryField="ItemCategory"
              emptyCategoryValue={null}
              errorMessage={errors.name?.message}
              suggestionsId="edititem-suggestions"
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

            <input type="hidden" {...register('owner')} value={currentUser} />

            <Form.Group className="form-group mt-4 text-end">
              <Button type="button" onClick={() => reset()} variant="secondary" className="float-right">
                Reset
              </Button>
              {' '}
              <Button type="submit" variant="success">
                Save
              </Button>
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
