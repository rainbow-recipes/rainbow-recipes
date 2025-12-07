// eslint-disable-next-line import/prefer-default-export
export function prettyCategory(c?: string) {
  switch (c) {
    case 'produce':
      return 'Produce';
    case 'meat_seafood':
      return 'Meat / Seafood';
    case 'dairy_eggs':
      return 'Dairy & Eggs';
    case 'frozen':
      return 'Frozen';
    case 'canned':
      return 'Canned';
    case 'dry':
      return 'Dry Goods';
    case 'condiments_spices':
      return 'Condiments & Spices';
    default:
      return 'Other';
  }
}
