import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminProtectedPage } from '@/lib/page-protection';
import AdminPageClient from '@/components/admin/AdminPageClient';

const prisma = new PrismaClient();

export default async function AdminPage() {
  // Protect the page, only logged in admins can access it.
  const session = await getServerSession(authOptions);
  adminProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' },
  });

  const plainUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    isMerchant: u.isMerchant,
    merchantApproved: u.merchantApproved,
  }));

  const databaseItems = await prisma.databaseItem.findMany({
    orderBy: { name: 'asc' },
  });

  const plainItems = databaseItems.map((item) => ({
    id: item.id,
    name: item.name,
    itemCategory: item.itemCategory,
    approved: item.approved,
  }));

  return (
    <div className="container my-4">
      <h2 className="mb-3">Admin Dashboard</h2>
      <AdminPageClient initialUsers={plainUsers} initialItems={plainItems} />
    </div>
  );
}
