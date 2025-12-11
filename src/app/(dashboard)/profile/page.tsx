import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
      role: true,
      isMerchant: true,
      merchantApproved: true,
      recipes: {
        select: {
          id: true,
          name: true,
          prepTime: true,
          cost: true,
        },
        orderBy: { id: 'desc' },
      },
      favorites: {
        select: {
          recipe: {
            select: {
              id: true,
              name: true,
              prepTime: true,
              cost: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      },
    },
  });

  if (!user) {
    redirect('/signin');
  }

  // If the user is a merchant, try to find their store (owner stored as their email)
  const store = user.isMerchant
    ? await prisma.store.findFirst({
      where: { owner: user.email },
      select: {
        id: true,
        name: true,
        location: true,
        website: true,
        hours: true,
        image: true,
      },
    })
    : null;

  const publishedRecipes = user.recipes;

  const favoriteRecipes = user.favorites
    .map((f) => f.recipe)
    .filter(Boolean) as { id: number; name: string; prepTime: number; cost: number }[];

  return (
    <ProfileClient
      user={user}
      publishedRecipes={publishedRecipes}
      favoriteRecipes={favoriteRecipes}
      store={store}
      canEdit
    />
  );
}
