import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vendorProtectedPage } from '@/lib/page-protection';
import { prisma } from '@/lib/prisma';
import EditStorePageForm from '@/components/EditStorePageForm';
import { Store } from '@prisma/client';
import notFound from '../../not-found';

export default async function EditStorePage({ params }: { params: { id: string | string[] } }) {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
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

  return (
    <main>
      <EditStorePageForm store={store} />
    </main>
  );
}
