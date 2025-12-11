import { Col, Container, Image, Row } from 'react-bootstrap';
import { ChevronLeft, Basket2, Star, StarFill } from 'react-bootstrap-icons';
import Link from 'next/link';
import notFound from '@/app/not-found';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IngredientAvailabilityList } from '@/components/recipes/IngredientAvailabilityList';
import RecipeReviewsList from '@/components/recipes/reviews/RecipeReviewsList';

export default async function RecipesPage({ params }: { params: { id: string | string[] } }) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const id = Number(String(Array.isArray(params?.id) ? params?.id[0] : params?.id));

  const [recipe, currentUser] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { storeItems: true },
        },
        tags: true,
        reviews: {
          orderBy: { id: 'desc' },
          include: {
            recipe: false,
          },
        },
      },
    }),
    userEmail
      ? prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, role: true },
      })
      : null,
  ]);

  if (!recipe) {
    return notFound();
  }

  // Fetch author, stores, and review owners in parallel
  const [author, stores, reviewOwners] = await Promise.all([
    recipe.authorId
      ? prisma.user.findUnique({
        where: { id: recipe.authorId },
        select: { id: true, firstName: true, lastName: true, name: true },
      })
      : null,
    prisma.store.findMany({
      where: {
        owner: {
          in: Array.from(new Set(
            recipe.ingredients.flatMap((ing) => ing.storeItems?.map((s) => s.owner).filter(Boolean) || []),
          )) as string[],
        },
      },
      select: { id: true, name: true, owner: true },
    }),
    prisma.user.findMany({
      where: {
        email: {
          in: Array.from(new Set(recipe.reviews.map((r) => r.owner))),
        },
      },
      select: { id: true, email: true, firstName: true, lastName: true, name: true },
    }),
  ]);

  const storeByOwner = new Map(stores.map((s) => [s.owner, { id: s.id, name: s.name }]));
  const ownerMap = new Map(reviewOwners.map((u) => [u.email, u]));

  const ingredientAvailability = recipe.ingredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    entries: (ing.storeItems || []).map((s) => {
      const price = typeof s.price === 'object' && s.price !== null && 'toNumber' in (s.price as any)
        ? (s.price as any).toNumber()
        : Number(s.price as any);
      return {
        id: s.id,
        store: storeByOwner.get(s.owner)?.name || 'Local store',
        storeId: storeByOwner.get(s.owner)?.id,
        availability: s.availability,
        price,
        unit: s.unit,
      };
    }),
  }));

  const reviewsWithUserInfo = recipe.reviews.map((review) => {
    const user = ownerMap.get(review.owner);
    return {
      ...review,
      ownerUserId: user?.id,
      ownerFirstName: user?.firstName,
      ownerLastName: user?.lastName,
      ownerName: user?.name,
    };
  });

  const averageRating = reviewsWithUserInfo.length > 0
    ? (reviewsWithUserInfo.reduce((sum, r) => sum + r.rating, 0) / reviewsWithUserInfo.length)
    : null;

  return (
    <Container className="my-4">
      <Link href="/recipes" className="d-inline-flex align-items-center mb-3 text-dark">
        <ChevronLeft />
        {' '}
        Back to Recipes
      </Link>
      <h1 className="text-center mb-2">{recipe.name}</h1>

      {author ? (
        <div className="text-center mb-1">
          <Link href={`/profile/${author.id}`} className="text-decoration-none text-muted">
            {author.firstName && author.lastName
              ? `${author.firstName} ${author.lastName}`
              : author.firstName || author.name || 'Anonymous User'}
          </Link>
        </div>
      ) : null}

      <div className="text-center mb-3">
        Preparation Time:
        {' '}
        {recipe.prepTime}
        {' '}
        minutes
      </div>
      {averageRating !== null && (
        <div className="text-center mb-3">
          <div className="text-warning" style={{ fontSize: '1.5rem', letterSpacing: '0.1em' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>{i < Math.round(averageRating) ? <StarFill /> : <Star />}</span>
            ))}
          </div>
          <div className="text-muted small">
            {averageRating.toFixed(1)}
            /5 (
            {reviewsWithUserInfo.length}
            {' '}
            {reviewsWithUserInfo.length === 1 ? 'review' : 'reviews'}
            )
          </div>
        </div>
      )}
      {(recipe.image) && (
        <Row className="g-3 justify-content-center mb-4">
          <Col xs={11} lg={3}>
            <Image src={recipe.image} alt={recipe.name} rounded className="w-100" />
          </Col>
        </Row>
      )}
      <Row className="justify-content-center">
        <Col className="bg-light rounded p-3 p-md-4" xs={11} lg={4}>
          <Row>
            {(recipe.tags.length > 0) && (
              <>
                <h5 className="mb-2">Recipe Tags</h5>
                <div>
                  {recipe.tags.map((tag) => (
                    <span key={tag.id} className="badge bg-white text-dark me-1 mb-1">{tag.name}</span>
                  ))}
                </div>
              </>
            )}
            <h5 className="mt-3 mb-2">Ingredients</h5>
            <ul className="mb-1">
              {recipe.ingredients.map((ingredient, i) => (
                <li key={ingredient.id} className="ms-4">
                  {recipe.ingredientQuantities?.[i]}
                  {' '}
                  <strong>{ingredient.name}</strong>
                  {' '}
                  {ingredient.storeItems?.some((s) => s.availability) && (
                    <span className="badge bg-success ms-1">available locally</span>
                  )}
                </li>
              ))}
            </ul>
          </Row>
          <Row>
            <div className="d-flex align-items-center gap-2 mt-3 mb-2">
              <h5 className="mb-0">Get the Ingredients</h5>
              <Basket2 size={22} />
            </div>
            <IngredientAvailabilityList items={ingredientAvailability} />
          </Row>
        </Col>
        <Col className="p-3 p-md-4 ms-lg-3" xs={12} lg={7}>
          <h5 className="mb-2">Instructions</h5>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {recipe.description}
          </p>
          <hr className="my-4" />
          <RecipeReviewsList
            reviews={reviewsWithUserInfo}
            recipeId={id}
            isLoggedIn={!!session?.user}
            currentUserEmail={userEmail}
            userRole={currentUser?.role}
            recipeAuthorId={recipe.authorId}
            currentUserId={currentUser?.id}
          />
        </Col>
      </Row>
    </Container>
  );
}
