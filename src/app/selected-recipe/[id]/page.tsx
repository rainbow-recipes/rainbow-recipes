// app/selected-recipe/[id]/page.tsx

import SelectedRecipe from '@/components/SelectedRecipe';

export default function SelectedRecipePage({ params }: { params: { id: string } }) {
  return <SelectedRecipe id={params.id} />;
}
