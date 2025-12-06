import { getServerSession } from 'next-auth';
import notFound from '@/app/not-found';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import { prisma } from '@/lib/prisma';
import EditRecipeForm from '@/components/EditRecipeForm';

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
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  // Admins can edit regardless of author; otherwise must match authorId.
  if (role === Role.ADMIN) {
    // allowed
  } else if (!userId || recipe.authorId !== userId) {
    return notFound();
  }

  // Render client-side form with fetched data
  return <EditRecipeForm allTags={allTags} recipe={recipe} />;
}
