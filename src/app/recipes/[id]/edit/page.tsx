import EditRecipeForm from '@/components/EditRecipeForm';
import { prisma } from '@/lib/prisma';

interface Props {
  params: { id: string };
}

export default async function EditRecipePage({ params }: Props) {
  const recipeId = Number(params.id);
  if (Number.isNaN(recipeId)) {
    return <div>Invalid recipe id</div>;
  }

  // Fetch recipe and all tags on the server
  const [recipe, allTags] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { tags: true, author: true },
    }),
    prisma.tag.findMany(),
  ]);

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  // Render client-side form with fetched data
  return <EditRecipeForm allTags={allTags} recipe={recipe} />;
}
