import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { vendorProtectedPage } from '@/lib/page-protection';
import { prisma } from '@/lib/prisma';
import EditStorePageForm from '@/components/EditStorePageForm';

export default async function EditStorePage() {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );

  return (
    <main>
      <EditStorePageForm stuff={stuff} />
    </main>
  );
}
