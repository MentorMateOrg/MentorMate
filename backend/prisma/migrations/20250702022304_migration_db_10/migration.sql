/*
  Warnings:

  - You are about to drop the column `position` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "position",
ADD COLUMN     "experiences" TEXT[];
