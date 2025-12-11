import { prisma } from '@/lib/prisma';
import AddRecipeForm from '@/components/recipes/AddRecipeForm';
import { getServerSession } from 'next-auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';

export default async function AddRecipePage() {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });

  return (
    <AddRecipeForm allTags={tags} />
  );
}
