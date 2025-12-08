-- CreateTable
CREATE TABLE "RecipeReview" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "RecipeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorReview" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "VendorReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecipeReview" ADD CONSTRAINT "RecipeReview_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReview" ADD CONSTRAINT "VendorReview_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
