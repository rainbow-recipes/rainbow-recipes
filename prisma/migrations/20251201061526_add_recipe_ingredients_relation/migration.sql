-- CreateTable
CREATE TABLE "_RecipeIngredients" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RecipeIngredients_AB_unique" ON "_RecipeIngredients"("A", "B");

-- CreateIndex
CREATE INDEX "_RecipeIngredients_B_index" ON "_RecipeIngredients"("B");

-- AddForeignKey
ALTER TABLE "_RecipeIngredients" ADD CONSTRAINT "_RecipeIngredients_A_fkey" FOREIGN KEY ("A") REFERENCES "DatabaseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecipeIngredients" ADD CONSTRAINT "_RecipeIngredients_B_fkey" FOREIGN KEY ("B") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
