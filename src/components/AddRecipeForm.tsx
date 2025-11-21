/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-continue */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import type { Tag } from '@prisma/client';

interface AddRecipeFormProps {
  allTags: Tag[];
}

type RecipeFormValues = {
  name: string;
  cost: string;
  prepTime: string;
  description: string;
  imageFile: FileList;
} & {
  [key: `tag_${number}`]: boolean;
};

export default function AddRecipeForm({ allTags }: AddRecipeFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RecipeFormValues>();
  const [error, setError] = useState<string | null>(null);

  const dietTags = allTags.filter((t) => t.category === 'Diet');
  const applianceTags = allTags.filter((t) => t.category === 'Appliance');

  const onSubmit = async (data: RecipeFormValues) => {
    setError(null);

    try {
      const { name, cost, prepTime, description, imageFile, ...tagFlags } = data;

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
          description,
          image: imageData,
          tagIds: selectedTagIds,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      // Go back to recipes list
      router.push('/recipes');
    } catch (err) {
      console.error(err);
      setError('Failed to add recipe. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <label className="form-label">Food name</label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. Creamy Tomato Pasta"
          {...register('name', { required: true })}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Cost ($)</label>
        <input
          type="number"
          step="0.01"
          className="form-control"
          placeholder="e.g. 12.50"
          {...register('cost')}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Prep time (minutes)</label>
        <input
          type="number"
          className="form-control"
          placeholder="e.g. 30"
          {...register('prepTime')}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Description / how it was prepped</label>
        <textarea
          className="form-control"
          rows={4}
          placeholder="Step-by-step description of how you prepared this dish..."
          {...register('description')}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Image</label>
        <input
          type="file"
          accept="image/*"
          className="form-control"
          {...register('imageFile')}
        />
      </div>

      <div className="mb-3">
        <strong>Dietary tags</strong>
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
      </div>

      <div className="mb-3">
        <strong>Appliance tags</strong>
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
      </div>

      <button type="submit" className="btn btn-success" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add recipe'}
      </button>
      {' '}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => router.push('/recipes')}
      >
        Cancel
      </button>
    </form>
  );
}
