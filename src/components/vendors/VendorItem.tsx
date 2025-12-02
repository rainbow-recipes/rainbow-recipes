import type { Item } from '@prisma/client';

export default function VendorItem({ name, price, unit, availability }: Item) {
  return (
    <tr>
      <td>{name}</td>
      <td>{String(price)}</td>
      <td>{unit}</td>
      <td>{availability ? 'in stock' : 'out of stock'}</td>
    </tr>
  );
}
