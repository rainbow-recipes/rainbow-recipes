import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vendorProtectedPage } from '@/lib/page-protection';
import { prisma } from '@/lib/prisma';
import EditStorePageForm from '@/components/vendors/EditStorePageForm';
import { Store } from '@prisma/client';
import notFound from '@/app/not-found';

export default async function EditStorePage({ params }: { params: Promise<{ id: string | string[] }> }) {
  const resolvedParams = await params;
  // Protect the page, only logged in vendors can access it.
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; role: string, isMerchant?: boolean };
    } | null,
  );

  const id = String(Array.isArray(resolvedParams?.id) ? resolvedParams?.id[0] : resolvedParams?.id);
  const store: Store | null = await prisma.store.findUnique({
    where: { id },
  });
  if (!store) {
    return notFound();
  }

  const userEmail = (session?.user as any)?.email;
  // Only allow the owner of the store to edit it.
  if (!userEmail || store.owner !== userEmail) {
    return notFound();
  }

  return (
    <main>
      <EditStorePageForm store={store} />
    </main>
  );
}
