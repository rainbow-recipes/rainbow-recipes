import { getServerSession } from 'next-auth';
import notFound from '@/app/not-found';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import { prisma } from '@/lib/prisma';
import EditRecipeForm from '@/components/recipes/EditRecipeForm';

interface Props {
  params: { id: string };
}

export default async function EditRecipePage({ params }: Props) {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
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
      include: { tags: true, author: true, ingredients: true },
    }),
    prisma.tag.findMany(),
  ]);

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  // Only allow the recipe author or an admin to edit.
  const owner = (session && session.user && session.user.email) || '';
  const currentUser = await prisma.user.findUnique({
    where: {
      email: owner,
    },
  });
  const userId = currentUser?.id;
  const role = currentUser?.role;
  if (!userId || (recipe.authorId !== userId && role !== Role.ADMIN)) {
    return notFound();
  }

  return <EditRecipeForm allTags={allTags} recipe={recipe} />;
}
