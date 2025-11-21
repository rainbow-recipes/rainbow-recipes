-- AlterTable
ALTER TABLE "User" ADD COLUMN     "storeName" TEXT;

-- AlterTable
ALTER TABLE "_RecipeTags" ADD CONSTRAINT "_RecipeTags_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RecipeTags_AB_unique";

-- CreateTable
CREATE TABLE "Store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "location" TEXT NOT NULL,
    "hours" TEXT[],
    "owner" TEXT NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "availability" BOOLEAN NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);
