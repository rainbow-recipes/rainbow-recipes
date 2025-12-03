import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminProtectedPage } from '@/lib/page-protection';
import { prisma } from '@/lib/prisma';
import EditRecipeForm from '@/components/EditRecipeForm';

interface Props {
  params: { id: string };
}

export default async function EditRecipePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  adminProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );

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
