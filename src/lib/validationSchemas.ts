import { ItemCategory } from '@prisma/client';
import * as Yup from 'yup';

export const AddStuffSchema = Yup.object({
  name: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  condition: Yup.string().oneOf(['excellent', 'good', 'fair', 'poor']).required(),
  owner: Yup.string().required(),
});

export const EditStuffSchema = Yup.object({
  id: Yup.number().required(),
  name: Yup.string().required(),
  quantity: Yup.number().positive().required(),
  condition: Yup.string().oneOf(['excellent', 'good', 'fair', 'poor']).required(),
  owner: Yup.string().required(),
});

export const EditStoreSchema = Yup.object({
  id: Yup.string().required(),
  name: Yup.string().required('Store name is required'),
  website: Yup.string().url().nullable().defined(),
  location: Yup.string().required('Location is required'),
  hours: Yup.array().of(Yup.string().required()).required(),
  image: Yup.string().url().nullable().defined(),
  owner: Yup.string().required(),
});

export const AddItemSchema = Yup.object({
  name: Yup.string().required('Item name is required'),
  price: Yup.number().typeError('Price is required').positive().required('Price is required'),
  unit: Yup.string().required('Size is required'),
  availability: Yup.string().required(),
  ItemCategory: Yup.string()
    .oneOf(Object.values(ItemCategory), 'Item Category is required')
    .required('Item Category is required'),
  owner: Yup.string().required(),
});

export const EditItemSchema = Yup.object({
  id: Yup.number().required(),
  name: Yup.string().required('Item name is required'),
  price: Yup.number().typeError('Price is required').positive().required('Price is required'),
  unit: Yup.string().required('Size is required'),
  availability: Yup.string().required(),
  ItemCategory: Yup.string()
    .oneOf(Object.values(ItemCategory), 'Item Category is required')
    .required('Item Category is required'),
  owner: Yup.string().required(),
});
