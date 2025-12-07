/*
  Warnings:

  - You are about to drop the column `reviewed` on the `DatabaseItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DatabaseItem" DROP COLUMN "reviewed",
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false;
