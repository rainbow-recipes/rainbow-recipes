import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ProfileClient from '@/components/profile/ProfileClient';

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      recipes: {
        orderBy: { id: 'desc' },
      },
      favorites: {
        include: { recipe: true },
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
    })
    : null;

  const plainUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image,
    role: user.role,
    isMerchant: user.isMerchant,
    merchantApproved: user.merchantApproved,
  };

  const publishedRecipes = user.recipes.map((r) => ({
    id: r.id,
    name: r.name,
    prepTime: r.prepTime,
    cost: r.cost,
  }));

  const favoriteRecipes = user.favorites
    .map((f) => (f.recipe
      ? {
        id: f.recipe.id,
        name: f.recipe.name,
        prepTime: f.recipe.prepTime,
        cost: f.recipe.cost,
      }
      : null))
    .filter(Boolean) as { id: number; name: string; prepTime: number; cost: number }[];

  const storeSummary = store
    ? {
      id: store.id,
      name: store.name,
      location: store.location,
      website: store.website,
      hours: store.hours,
      image: store.image,
    }
    : null;

  return (
    <ProfileClient
      user={plainUser}
      publishedRecipes={publishedRecipes}
      favoriteRecipes={favoriteRecipes}
      store={storeSummary}
      canEdit
    />
  );
}
