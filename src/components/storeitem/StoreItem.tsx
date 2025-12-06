'use client';

import swal from 'sweetalert';
import type { Item } from '@prisma/client';
import { deleteItem } from '@/lib/dbActions';

export default function StoreItem({
  name, price, unit, availability, id, isMyStore = false,
}: Item & { isMyStore: boolean }) {
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
      <td>{capitalizeName(name)}</td>
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
                  text: `Are you sure you want to delete ${name}?`,
                  icon: 'warning',
                  buttons: ['Cancel', 'Delete'],
                  dangerMode: true,
                }).then((v) => resolve(Boolean(v)));
              });
              if (!ok) return;
              try {
                await deleteItem(id as number);
              } catch (err) {
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
