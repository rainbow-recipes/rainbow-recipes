import type { Item } from '@prisma/client';

export default function MyStoreItem({ name, price, unit, availability, id }: Item) {
  return (
    <tr>
      <td>{name}</td>
      <td>{String(price)}</td>
      <td>{unit}</td>
      <td>{availability ? 'in stock' : 'out of stock'}</td>
      <td><a href={`/edit-item/${id}`}>Edit</a></td>
    </tr>
  );
}
