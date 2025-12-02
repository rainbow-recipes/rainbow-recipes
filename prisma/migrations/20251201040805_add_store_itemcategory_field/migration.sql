-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('produce', 'meat_seafood', 'dairy_eggs', 'frozen', 'canned', 'dry', 'condiments_spices', 'other');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "itemCategory" "ItemCategory" NOT NULL DEFAULT 'other';
