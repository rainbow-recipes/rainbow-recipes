/*
  Warnings:

  - The primary key for the `_RecipeTags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_RecipeTags` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "_RecipeTags" DROP CONSTRAINT "_RecipeTags_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_RecipeTags_AB_unique" ON "_RecipeTags"("A", "B");
