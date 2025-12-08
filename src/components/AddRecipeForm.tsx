/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-continue */

'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import type { Tag, ItemCategory } from '@prisma/client';
import { Form, Button, Container } from 'react-bootstrap';
import IngredientAutocomplete from './IngredientAutocomplete';

interface AddRecipeFormProps {
  allTags: Tag[];
}

type IngredientChoice = { id?: number; name: string; itemCategory?: ItemCategory; detail?: string };

type RecipeFormValues = {
  name: string;
  cost: string;
  prepTime: string;
  ingredients: IngredientChoice[];
  description: string;
  imageFile: FileList;
} & {
  [key: `tag_${number}`]: boolean;
};

export default function AddRecipeForm({ allTags }: AddRecipeFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<RecipeFormValues>({ mode: 'onChange', defaultValues: { ingredients: [] } });
  const [error, setError] = useState<string | null>(null);

  const dietTags = allTags.filter((t) => t.category === 'Diet');
  const applianceTags = allTags.filter((t) => t.category === 'Appliance');

  const onSubmit = async (data: RecipeFormValues) => {
    setError(null);

    try {
      const { name, cost, prepTime, ingredients, description, imageFile, ...tagFlags } = data;

      // validate that every ingredient has a non-empty detail
      if ((ingredients || []).some((ing) => !((ing as any).detail && (ing as any).detail.trim()))) {
        setError('Please provide quantity/notes for every ingredient.');
        return;
      }

      // validate that no ingredient quantity starts with a negative number
      for (const ing of ingredients || []) {
        const detail = ((ing as any).detail || '').trim();
        const match = detail.match(/^(-?\d+\.?\d*)/);
        if (match && parseFloat(match[1]) < 0) {
          setError('Ingredient quantities cannot be negative.');
          return;
        }
      }

      // Build ingredient quantities array aligned with ingredients array
      const ingredientQuantities = (ingredients || []).map((ing) => {
        const d = (ing as IngredientChoice).detail;
        return d ? d.trim() : '';
      });

      const costNum = cost ? Number(cost) : 0;
      const prepNum = prepTime ? Number(prepTime) : 0;

      // Image -> base64 data URL
      let imageData: string | null = null;
      if (imageFile && imageFile.length > 0) {
        const file = imageFile[0];
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
      }

      // Collect selected tag IDs
      const selectedTagIds: number[] = [];
      for (const key of Object.keys(tagFlags)) {
        if (!key.startsWith('tag_')) continue;
        if (tagFlags[key as `tag_${number}`]) {
          const idString = key.split('_')[1];
          const id = Number(idString);
          if (!Number.isNaN(id)) selectedTagIds.push(id);
        }
      }

      // Call API to create recipe
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          cost: costNum,
          prepTime: prepNum,
          description: description || '',
          image: imageData,
          tagIds: selectedTagIds,
          ingredients: ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            itemCategory: (ing as any).itemCategory,
          })),
          ingredientQuantities,
        }),
      });

      if (!res.ok) {
        // try to parse server error message to show user-friendly feedback
        let payload: any = null;
        try {
          payload = await res.json();
        } catch (e) {
          // ignore
        }
        const msg = payload?.error || payload?.message || `Server error: ${res.status}`;
        throw new Error(msg);
      }

      // Go back to recipes list
      router.push('/recipes');
    } catch (err) {
      console.error(err);
      setError('Failed to add recipe. Please try again.');
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-3">Add new recipe</h2>
      <Form onSubmit={handleSubmit(onSubmit)}>
        {error && <div className="alert alert-danger">{error}</div>}

        <Form.Group className="mb-3">
          <Form.Label>
            Recipe name
            <span className="text-danger ms-1">*</span>
          </Form.Label>
          <input
            type="text"
            placeholder="e.g. Creamy Tomato Pasta"
            {...register('name', { required: 'Recipe name is required' })}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-required="true"
            required
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          />
          <div className="invalid-feedback" role="alert" aria-live="polite">
            {(errors.name as any)?.message}
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            Cost ($)
            <span className="text-danger ms-1">*</span>
          </Form.Label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 12.50"
            {...register('cost', {
              required: 'Cost is required',
              min: { value: 0, message: 'Cost must be a positive number' },
            })}
            aria-invalid={errors.cost ? 'true' : 'false'}
            aria-required="true"
            required
            className={`form-control ${errors.cost ? 'is-invalid' : ''}`}
          />
          <div className="invalid-feedback" role="alert" aria-live="polite">
            {(errors.cost as any)?.message}
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            Prep time (minutes)
            <span className="text-danger ms-1">*</span>
          </Form.Label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 30"
            {...register('prepTime', {
              required: 'Prep time is required',
              min: { value: 0, message: 'Prep time must be a positive number' },
            })}
            aria-invalid={errors.prepTime ? 'true' : 'false'}
            aria-required="true"
            required
            className={`form-control ${errors.prepTime ? 'is-invalid' : ''}`}
          />
          <div className="invalid-feedback" role="alert" aria-live="polite">
            {(errors.prepTime as any)?.message}
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            Ingredients
            <span className="text-danger ms-1">*</span>
          </Form.Label>
          <Controller
            name="ingredients"
            control={control}
            rules={{ validate: (v) => (Array.isArray(v) && v.length > 0) || 'Please add at least one ingredient' }}
            render={({ field }) => {
              const detailErrors = (field.value || []).map((ing: IngredientChoice) => {
                const d = (ing as any).detail;
                return !(d && d.trim());
              });
              return (
                <div>
                  <IngredientAutocomplete
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Type an ingredient and press Enter or pick a suggestion"
                    detailErrors={detailErrors}
                  />
                  <div
                    className="invalid-feedback"
                    role="alert"
                    style={{ display: errors.ingredients ? 'block' : 'none' }}
                    aria-live="polite"
                  >
                    {(errors.ingredients as any)?.message}
                  </div>
                </div>
              );
            }}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            Description / Instructions
            <span className="text-danger ms-1">*</span>
          </Form.Label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Step-by-step instructions of how you prepared this dish..."
            {...register('description', { required: 'Description / Instructions are required' })}
            aria-required="true"
            required
          />
          {errors.description && <div className="text-danger mt-1">{(errors.description as any).message}</div>}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="form-label">Image</Form.Label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            {...register('imageFile')}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label><strong>Dietary tags</strong></Form.Label>
          <div>
            {dietTags.map((tag) => (
              <div key={tag.id} className="form-check form-check-inline">
                <input
                  type="checkbox"
                  id={`diet-tag-${tag.id}`}
                  className="form-check-input"
                  {...register(`tag_${tag.id}`)}
                />
                <label htmlFor={`diet-tag-${tag.id}`} className="form-check-label">
                  {tag.name}
                </label>
              </div>
            ))}
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label><strong>Appliance tags</strong></Form.Label>
          <div>
            {applianceTags.map((tag) => (
              <div key={tag.id} className="form-check form-check-inline">
                <input
                  type="checkbox"
                  id={`appl-tag-${tag.id}`}
                  className="form-check-input"
                  {...register(`tag_${tag.id}`)}
                />
                <label htmlFor={`appl-tag-${tag.id}`} className="form-check-label">
                  {tag.name}
                </label>
              </div>
            ))}
          </div>
        </Form.Group>

        <Button type="submit" className="btn btn-success" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add recipe'}
        </Button>
        {' '}
        <Button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push('/recipes')}
        >
          Cancel
        </Button>
      </Form>
    </Container>
  );
}
