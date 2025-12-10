import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function LuckyPage() {
  // Fetch all recipe IDs
  const recipes = await prisma.recipe.findMany({
    select: { id: true },
  });

  // If there are no recipes, redirect to recipes page
  if (recipes.length === 0) {
    redirect('/recipes');
  }

  // Pick a random recipe
  const randomIndex = Math.floor(Math.random() * recipes.length);
  const randomRecipeId = recipes[randomIndex].id;

  // Redirect to the random recipe page
  redirect(`/recipes/${randomRecipeId}`);
}
