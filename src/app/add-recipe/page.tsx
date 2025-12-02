import { PrismaClient } from '@prisma/client';
import AddRecipeForm from '@/components/AddRecipeForm';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function AddRecipePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="container my-4">
      <AddRecipeForm allTags={tags} />
    </div>
  );
}
