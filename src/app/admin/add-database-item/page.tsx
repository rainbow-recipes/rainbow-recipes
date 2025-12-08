import AddDatabaseItemForm from '@/components/admin/AddDatabaseItemForm';
import { adminProtectedPage } from '@/lib/page-protection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AddItemPage() {
  // Protect the page, only logged in admins can access it.
  const session = await getServerSession(authOptions);
  adminProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  return (
    <main>
      <AddDatabaseItemForm />
    </main>
  );
}
