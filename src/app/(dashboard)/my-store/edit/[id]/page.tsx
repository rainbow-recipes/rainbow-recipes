import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vendorProtectedPage } from '@/lib/page-protection';
import { prisma } from '@/lib/prisma';
import EditStorePageForm from '@/components/vendors/EditStorePageForm';
import { Store } from '@prisma/client';
import notFound from '@/app/not-found';

export default async function EditStorePage({ params }: { params: { id: string | string[] } }) {
  // Protect the page, only logged in vendors can access it.
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; role: string, isMerchant?: boolean };
    } | null,
  );

  const id = String(Array.isArray(params?.id) ? params?.id[0] : params?.id);
  // console.log(id);
  const store: Store | null = await prisma.store.findUnique({
    where: { id },
  });
  // console.log(store);
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
