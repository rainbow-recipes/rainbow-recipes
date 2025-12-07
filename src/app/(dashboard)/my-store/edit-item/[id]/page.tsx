import { getServerSession } from 'next-auth/next';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import notFound from '@/app/not-found';
import EditStoreItemForm from '@/components/EditStoreItemForm';

export default async function EditItemPage({ params }: { params: { id: string | string[] } }) {
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; role: string, isMerchant?: boolean };
    } | null,
  );

  const id = Number(Array.isArray(params?.id) ? params?.id[0] : params?.id);
  const item = await prisma.storeItem.findUnique({
    where: { id },
    include: { databaseItem: true },
  });
  if (!item) {
    return notFound();
  }

  const userEmail = (session?.user as any)?.email;
  if (!userEmail || item.owner !== userEmail) {
    return notFound();
  }

  return (
    <main>
      <EditStoreItemForm item={item} />
    </main>
  );
}
