import { Col, Container, Image, Row } from 'react-bootstrap';
import { ChevronLeft } from 'react-bootstrap-icons';
import Link from 'next/link';
import notFound from '@/app/not-found';
import { prisma } from '@/lib/prisma';

export default async function RecipesPage({ params }: { params: { id: string | string[] } }) {
  const id = Number(String(Array.isArray(params?.id) ? params?.id[0] : params?.id));
  // console.log(id);
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: true, tags: true },
  });
  // console.log(recipe);
  if (!recipe) {
    return notFound();
  }

  const authorFirstName: String | null = recipe.authorId
    ? await prisma.user.findUnique({
      where: { id: recipe.authorId },
      select: { firstName: true },
    }).then(user => user?.firstName || null)
    : null;

  return (
    <Container className="my-4">
      <Link href="/recipes" className="d-inline-flex align-items-center mb-3 text-dark">
        <ChevronLeft />
        {' '}
        Back to Recipes
      </Link>
      <h1 className="text-center mb-2">{recipe.name}</h1>

      {authorFirstName ? (
        <div className="text-center mb-1">
          Author:
          {' '}
          {authorFirstName}
        </div>
      ) : null}

      <div className="text-center mb-3">
        Preparation Time:
        {' '}
        {recipe.prepTime}
        {' '}
        minutes
      </div>
      {(recipe.image) && (
        <Row className="g-3 justify-content-center mb-4">
          <Col xs={11} lg={3}>
            <Image src={recipe.image} alt={recipe.name} rounded className="w-100" />
          </Col>
        </Row>
      )}
      <Row className="g-3 justify-content-center">
        <Col className="bg-light rounded p-3 p-md-4" xs={11} lg={3}>
          <h5 className="mb-2">Ingredients</h5>
          <ul className="mb-3">
            {recipe.ingredients.map((ingredient, i) => (
              <li key={ingredient.id}>
                {recipe.ingredientQuantities?.[i]}
                {' '}
                <strong>{ingredient.name}</strong>
              </li>
            ))}
          </ul>
          {(recipe.tags.length > 0) && (
            <>
              <h5 className="mt-4 mb-2">Recipe Tags</h5>
              <div>
                {recipe.tags.map((tag) => (
                  <span key={tag.id} className="badge bg-white text-dark me-1 mb-1">{tag.name}</span>
                ))}
              </div>
            </>
          )}
        </Col>
        <Col className="p-3 p-md-4" xs={12} lg={9}>
          <h5 className="mb-2">Instructions</h5>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {recipe.description}
          </p>
        </Col>
      </Row>
    </Container>
  );
}
