import { Item } from '@prisma/client';

/* Renders a single row in the List Stuff table. See list/page.tsx. */
const VendorItem = ({ name, price, unit, availability, id }: Item) => (
  <tr>
    <td>{name}</td>
    <td>{String(price)}</td>
    <td>{unit}</td>
    <td>{availability ? 'in stock' : 'out of stock'}</td>
    <td>
      <a href={`/edit-item/${id}`}>Edit</a>
    </td>
  </tr>
);

export default VendorItem;
