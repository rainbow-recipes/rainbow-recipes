/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "DatabaseItem" ALTER COLUMN "itemCategory" SET DEFAULT 'other';

-- DropTable
DROP TABLE "Item";

-- CreateTable
CREATE TABLE "StoreItem" (
    "id" SERIAL NOT NULL,
    "databaseItemId" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "availability" BOOLEAN NOT NULL,
    "owner" TEXT NOT NULL,

    CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StoreItem" ADD CONSTRAINT "StoreItem_databaseItemId_fkey" FOREIGN KEY ("databaseItemId") REFERENCES "DatabaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
