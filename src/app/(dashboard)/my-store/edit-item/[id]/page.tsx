import { getServerSession } from 'next-auth/next';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import notFound from '@/app/not-found';
import EditStoreItemForm from '@/components/store-items/EditStoreItemForm';

export default async function EditItemPage({ params }: { params: Promise<{ id: string | string[] }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; role: string, isMerchant?: boolean };
    } | null,
  );

  const id = Number(Array.isArray(resolvedParams?.id) ? resolvedParams?.id[0] : resolvedParams?.id);
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

  // Convert Decimal price to number for client component
  const itemForClient = {
    ...item,
    price: typeof item.price === 'object' && item.price !== null && 'toNumber' in (item.price as any)
      ? (item.price as any).toNumber()
      : Number(item.price),
  };

  return (
    <main>
      <EditStoreItemForm item={itemForClient} />
    </main>
  );
}
