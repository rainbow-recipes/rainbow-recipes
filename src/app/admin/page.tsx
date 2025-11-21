import { PrismaClient, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user || user.role !== Role.ADMIN) {
    redirect('/recipes');
  }

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

  return (
    <div className="container my-4">
      <h2 className="mb-3">Admin Dashboard</h2>
      <AdminPanel initialUsers={plainUsers} />
    </div>
  );
}
