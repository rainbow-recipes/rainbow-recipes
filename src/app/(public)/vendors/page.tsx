import { PrismaClient } from '@prisma/client';
import VendorList from '@/components/vendors/VendorList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  const isMerchant = (session?.user as any)?.isMerchant === true;
  const stores = await prisma.store.findMany();

  return (
    <div className="container py-4">
      <h2 className="mb-4">Vendors</h2>
      {(stores.length === 0) && (
        <p>Sorry, there are no vendors at the moment!</p>
      )}
      {(!isMerchant) && (
        <p>
          Interested in becoming a vendor? Fill out this
          {' '}
          <a href="/vendor-signup">form</a>
          {' '}
          to get started!
        </p>
      )}
      {(isMerchant) && (
        <p>
          New vendors, don&apos;t see your store here?
          Update your store information in your
          {' '}
          <a href="/my-store">My Store</a>
          {' '}
          page to get listed!
        </p>
      )}
      <VendorList stores={stores} />
    </div>
  );
}
