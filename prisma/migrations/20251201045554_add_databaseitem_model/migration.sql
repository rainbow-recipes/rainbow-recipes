-- CreateTable
CREATE TABLE "DatabaseItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "itemCategory" "ItemCategory" NOT NULL,

    CONSTRAINT "DatabaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseItem_name_key" ON "DatabaseItem"("name");
