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
  name: Yup.string().required(),
  website: Yup.string().url().nullable().defined(),
  location: Yup.string().required(),
  hours: Yup.array().of(Yup.string().required()).required(),
  image: Yup.string().url().nullable().defined(),
  owner: Yup.string().required(),
});
