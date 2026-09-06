-- The API contract defines categoryId as a number. Preserve existing category
-- and ticket rows while replacing the original UUID/text key with an integer.
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_categoryId_fkey";

ALTER TABLE "Category" ADD COLUMN "newId" SERIAL;
ALTER TABLE "Ticket" ADD COLUMN "newCategoryId" INTEGER;

UPDATE "Ticket" AS ticket
SET "newCategoryId" = category."newId"
FROM "Category" AS category
WHERE ticket."categoryId" = category."id";

ALTER TABLE "Ticket" ALTER COLUMN "newCategoryId" SET NOT NULL;
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey";
ALTER TABLE "Category" DROP COLUMN "id";
ALTER TABLE "Category" RENAME COLUMN "newId" TO "id";
ALTER TABLE "Category" ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");

ALTER TABLE "Ticket" DROP COLUMN "categoryId";
ALTER TABLE "Ticket" RENAME COLUMN "newCategoryId" TO "categoryId";
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
