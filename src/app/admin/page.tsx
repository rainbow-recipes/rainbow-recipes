import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminProtectedPage } from '@/lib/page-protection';
import AdminPageClient from '@/components/admin/AdminPageClient';

export default async function AdminPage() {
  // Protect the page, only logged in admins can access it.
  const session = await getServerSession(authOptions);
  adminProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  const [users, databaseItems, tags] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isMerchant: true,
        merchantApproved: true,
      },
      orderBy: { email: 'asc' },
    }),
    prisma.databaseItem.findMany({
      select: {
        id: true,
        name: true,
        itemCategory: true,
        approved: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        _count: { select: { recipes: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const plainTags = tags.map((tag) => ({
    ...tag,
    // eslint-disable-next-line no-underscore-dangle
    recipeCount: tag._count.recipes,
  }));

  return (
    <div className="container my-4">
      <h2 className="mb-3">Admin Dashboard</h2>
      <AdminPageClient initialUsers={users} initialItems={databaseItems} initialTags={plainTags} />
    </div>
  );
}
