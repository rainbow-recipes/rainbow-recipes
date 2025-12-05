import { getServerSession } from 'next-auth/next';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Item } from '@prisma/client';
import notFound from '@/app/not-found';
import EditItemForm from '@/components/EditItemForm';

export default async function EditItemPage({ params }: { params: { id: string | string[] } }) {
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );
  const id = Number(Array.isArray(params?.id) ? params?.id[0] : params?.id);
  // console.log(id);
  const item: Item | null = await prisma.item.findUnique({
    where: { id },
  });
  // console.log(item);
  if (!item) {
    return notFound();
  }
  return (
    <main>
      <EditItemForm item={item} />
    </main>
  );
}
