/* eslint-disable react/jsx-one-expression-per-line */

'use client';

import { useEffect, useState } from 'react';
import { Container, Image } from 'react-bootstrap';
import type { Recipe, Tag } from '@prisma/client';

export default function SelectedRecipe({ id }: { id: string }) {
  const [recipe, setRecipe] = useState<(Recipe & { tags?: Tag[]; author?: { firstName?: string } }) | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/recipes/${id}`);
      const data = (await res.json()) as
        | (Recipe & { tags?: Tag[]; author?: { firstName?: string }; ingredients?: string[] })
        | null;
      setRecipe(data);
    }
    load();
  }, [id]);

  if (!recipe) return <p>Loading...</p>;

  // appliances and ingredients intentionally removed — only instructions are shown

  const authorFirstName = (
    ((recipe as any).author && (recipe as any).author.firstName)
    || (recipe as any).user?.firstName
    || null
  );

  const imageStyle = { maxWidth: '100%', maxHeight: '500px', objectFit: 'cover' } as const;
  const placeholderStyle = { width: '100%', maxWidth: 600, height: 300 } as const;

  return (
    <Container className="my-4">
      <h1 className="text-center mb-2">{recipe.name}</h1>

      {authorFirstName ? (
        <div className="text-center mb-1">Author: {authorFirstName}</div>
      ) : null}

      <div className="text-center mb-3">Preparation Time: {recipe.prepTime} minutes</div>

      <div className="d-flex justify-content-center mb-4">
        {recipe.image ? (
          <Image src={recipe.image} alt={recipe.name} style={imageStyle} rounded />
        ) : (
          <div className="bg-light d-flex align-items-center justify-content-center" style={placeholderStyle}>
            <span>No image</span>
          </div>
        )}
      </div>

      <div className="d-flex justify-content-center">
        <div className="row w-100 mx-auto g-4" style={{ maxWidth: 900 }}>
          <div className="col-12 d-flex">
            <div className="bg-light rounded p-3 w-100 h-100 text-center">
              <h4 className="mb-2">Instructions</h4>
              {recipe.description ? (
                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '1.125rem',
                    lineHeight: 1.7,
                  }}
                >
                  {recipe.description}
                </p>
              ) : (
                <div className="text-muted small">(no instructions provided)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
