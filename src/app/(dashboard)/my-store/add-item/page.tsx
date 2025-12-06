import AddItemForm from '@/components/AddItemForm';
import { vendorProtectedPage } from '@/lib/page-protection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AddItemPage() {
  // Protect the page, only logged in vendors can access it.
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; role: string, isMerchant?: boolean };
    } | null,
  );

  return (
    <main>
      <AddItemForm />
    </main>
  );
}
