'use client';

import swal from 'sweetalert';
import type { StoreItem, DatabaseItem } from '@prisma/client';
import { deleteStoreItem } from '@/lib/dbActions';

export default function StoreItemRow({
  price, unit, availability, id, isMyStore = false, databaseItem,
}: StoreItem & { isMyStore: boolean; databaseItem: DatabaseItem }) {
  const num = typeof price === 'number' ? price : Number(price as any);
  const priceDisplay = Number.isFinite(num) ? `$${num.toFixed(2)}` : '';
  const capitalizeName = (s?: string) => {
    if (!s) return '';
    return String(s)
      .split(/\s+/)
      .map((w) => (w.length ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
      .join(' ');
  };

  return (
    <tr>
      <td>{capitalizeName(databaseItem.name)}</td>
      <td>{priceDisplay}</td>
      <td>{unit}</td>
      <td>{availability ? 'in stock' : 'out of stock'}</td>
      {isMyStore ? (
        <td>
          <a
            href={`/my-store/edit-item/${id}`}
            className="btn btn-sm btn-outline-primary ms-2"
          >
            Edit
          </a>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={async () => {
              const ok = await new Promise<boolean>((resolve) => {
                // use sweetalert for consistent styling
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                swal({
                  title: 'Delete item?',
                  text: `Are you sure you want to delete ${databaseItem.name}?`,
                  icon: 'warning',
                  buttons: ['Cancel', 'Delete'],
                  dangerMode: true,
                }).then((v) => resolve(Boolean(v)));
              });
              if (!ok) return;
              try {
                await deleteStoreItem(id as number);
              } catch (err: any) {
                // Ignore redirect errors (they're thrown by Next.js redirect() function)
                // The redirect() function throws an error which is expected behavior
                if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.includes('NEXT_REDIRECT')) {
                  // Show success message for successful deletion
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  swal('Success', 'Item deleted successfully', 'success', { timer: 2000 });
                  return;
                }
                // show error if delete fails
                // eslint-disable-next-line no-console
                console.error('Delete failed', err);
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                swal('Error', 'Failed to delete item', 'error');
              }
            }}
          >
            Delete
          </button>
        </td>
      ) : null}
    </tr>
  );
}
