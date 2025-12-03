import EditRecipeForm from '@/components/EditRecipeForm';

export default async function EditRecipePage() {
  return (
    <main>
      <EditRecipeForm allTags={[]} recipe={null} />
    </main>
  );
}
